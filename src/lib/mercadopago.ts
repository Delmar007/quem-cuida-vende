import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || ''

export function getMercadoPagoClient() {
  if (!mpAccessToken) {
    return null
  }
  return new MercadoPagoConfig({
    accessToken: mpAccessToken,
    options: {
      timeout: 8000,
    },
  })
}

export interface CreatePlanPreferenceParams {
  storeId: string
  storeName: string
  planId: 'bronze_plus' | 'prata' | 'ouro' | 'auto_50' | 'auto_100'
  planName: string
  price: number
  payerEmail?: string
}

export async function createPlanPaymentPreference(params: CreatePlanPreferenceParams): Promise<{
  success: boolean
  initPoint?: string
  sandboxInitPoint?: string
  preferenceId?: string
  error?: string
}> {
  const client = getMercadoPagoClient()
  if (!client) {
    return {
      success: false,
      error: 'Mercado Pago não configurado. Verifique MERCADO_PAGO_ACCESS_TOKEN nas variáveis de ambiente.',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kittanda.com.br'

  try {
    const preference = new Preference(client)
    const response = await preference.create({
      body: {
        items: [
          {
            id: `plan-${params.planId}`,
            title: `Assinatura Mensal • Plano ${params.planName} • Kittanda Outlet`,
            description: `Mensalidade do Plano ${params.planName} para a loja ${params.storeName}`,
            quantity: 1,
            unit_price: params.price,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: params.payerEmail || undefined,
        },
        metadata: {
          store_id: params.storeId,
          plan_id: params.planId,
          plan_name: params.planName,
        },
        back_urls: {
          success: `${siteUrl}/painel/loja?topico=11&status=pago`,
          failure: `${siteUrl}/painel/loja?topico=11&status=falha`,
          pending: `${siteUrl}/painel/loja?topico=11&status=pendente`,
        },
        auto_return: 'approved',
        notification_url: `${siteUrl}/api/subscriptions/webhook`,
        statement_descriptor: 'KITTANDA',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })

    return {
      success: true,
      initPoint: response.init_point || undefined,
      sandboxInitPoint: response.sandbox_init_point || undefined,
      preferenceId: response.id || undefined,
    }
  } catch (err: any) {
    console.error('Erro ao gerar preferência do Mercado Pago:', err)
    return {
      success: false,
      error: err?.message || 'Falha ao gerar link de pagamento no Mercado Pago.',
    }
  }
}

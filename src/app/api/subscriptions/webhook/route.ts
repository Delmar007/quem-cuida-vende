import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { executeReactivation } from '@/lib/subscriptions'

/**
 * Webhook idempotente para recebimento de confirmações de pagamento
 * de provedores (Asaas, Mercado Pago, Stripe, etc.) ou acionamento direto do sistema.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Extrair identificadores compatíveis com múltiplos gateways ou formato interno padrão
    const eventId =
      payload.event_id ||
      payload.id ||
      payload.eventId ||
      payload.payment?.id ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const provider = payload.provider || payload.paymentProvider || 'webhook_gateway'
    const eventType = payload.event_type || payload.event || payload.type || 'payment.confirmed'

    // Status do pagamento (aceita 'paid', 'approved', 'CONFIRMED', 'RECEIVED', 'succeeded')
    const rawStatus = (payload.status || payload.payment?.status || payload.data?.status || 'paid').toLowerCase()
    const isPaid =
      rawStatus === 'paid' ||
      rawStatus === 'approved' ||
      rawStatus === 'confirmed' ||
      rawStatus === 'received' ||
      rawStatus === 'succeeded' ||
      eventType === 'PAYMENT_CONFIRMED' ||
      eventType === 'PAYMENT_RECEIVED' ||
      eventType === 'invoice.payment_succeeded'

    const storeId = payload.store_id || payload.storeId || payload.metadata?.store_id || payload.payment?.metadata?.store_id
    const invoiceId = payload.invoice_id || payload.invoiceId || payload.metadata?.invoice_id
    const amountCents = payload.amount_cents || payload.amountCents || (payload.value ? Math.round(payload.value * 100) : undefined)

    if (!storeId) {
      return NextResponse.json(
        { error: 'Parâmetro store_id é obrigatório para conciliação.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 1. Verificação de IDEMPOTÊNCIA: Checar se o evento já foi processado
    const { data: existingEvent } = await adminClient
      .from('processed_webhook_events')
      .select('id, processed_at')
      .eq('event_id', eventId)
      .maybeSingle()

    if (existingEvent) {
      return NextResponse.json({
        success: true,
        status: 'already_processed',
        event_id: eventId,
        message: 'Evento já processado anteriormente. Nenhuma alteração duplicada realizada.',
        processed_at: existingEvent.processed_at,
      })
    }

    // 2. Se for confirmação de pagamento, reativar benefícios e produtos suspensos
    if (isPaid) {
      const result = await executeReactivation(adminClient, storeId, {
        actorType: 'webhook',
        paymentProvider: provider,
        invoiceId,
        paymentAmountCents: amountCents,
      })

      // 3. Registrar evento processado na tabela de idempotência
      await adminClient.from('processed_webhook_events').insert({
        event_id: eventId,
        provider,
        event_type: eventType,
        payload,
        processed_at: new Date().toISOString(),
      })

      return NextResponse.json({
        status: 'processed',
        event_id: eventId,
        store_id: storeId,
        ...result,
      })
    }

    // Se for outro status (ex: falha ou pendente), apenas registrar o evento
    await adminClient.from('processed_webhook_events').insert({
      event_id: eventId,
      provider,
      event_type: eventType,
      payload,
      processed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      status: 'ignored_unpaid',
      event_id: eventId,
      store_id: storeId,
      current_status: rawStatus,
    })
  } catch (error: any) {
    console.error('Erro ao processar webhook de pagamento:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro interno no processamento do webhook.',
      },
      { status: 500 }
    )
  }
}

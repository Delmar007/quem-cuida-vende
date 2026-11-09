import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runBillingReconciliation } from '@/lib/subscriptions'

/**
 * Endpoint de CRON diário para reconciliação automática de faturas,
 * ativação de tolerância de 10 dias e rebaixamento automático para Bronze.
 * 
 * Protegido por CRON_SECRET via header Authorization ou query parameter.
 */
export async function GET(request: NextRequest) {
  return handleCron(request)
}

export async function POST(request: NextRequest) {
  return handleCron(request)
}

async function handleCron(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET

  // Validação de segurança em produção
  if (process.env.NODE_ENV === 'production' && expectedSecret) {
    const bearer = authHeader?.replace('Bearer ', '')
    if (bearer !== expectedSecret && querySecret !== expectedSecret) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
  }

  try {
    const adminClient = createAdminClient()

    // Permite simular data de referência para testes automatizados (ex: ?date=2026-10-21)
    const dateParam = searchParams.get('date')
    const referenceDate = dateParam ? new Date(dateParam) : new Date()

    const result = await runBillingReconciliation(adminClient, referenceDate)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      referenceDate: referenceDate.toISOString(),
      ...result,
    })
  } catch (error: any) {
    console.error('Erro na execução do CRON de assinaturas:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Falha ao executar rotina de reconciliação.',
      },
      { status: 500 }
    )
  }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  executeDowngradeToBronze,
  executeReactivation,
  logSubscriptionAudit,
} from '@/lib/subscriptions'

/**
 * Ação administrativa para intervenção manual em assinaturas de lojas.
 * Exige justificativa obrigatória e grava log completo de auditoria.
 */
export async function manualSubscriptionInterventionAction(params: {
  storeId: string
  action: 'reactivate' | 'downgrade' | 'extend_grace'
  justification: string
  extensionDays?: number
}) {
  if (!params.storeId) {
    return { success: false, error: 'Identificador da loja não informado.' }
  }

  if (!params.justification || params.justification.trim().length < 5) {
    return { success: false, error: 'A justificativa é obrigatória para qualquer intervenção administrativa (mínimo 5 caracteres).' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se houver usuário autenticado, checar role
  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    // Permite se for admin/master_admin ou ambiente dev
    const isAdmin = roleData?.role === 'admin' || roleData?.role === 'master_admin'
    if (process.env.NODE_ENV === 'production' && !isAdmin) {
      return { success: false, error: 'Apenas administradores podem realizar intervenções manuais.' }
    }
  }

  const adminClient = createAdminClient()

  try {
    if (params.action === 'reactivate') {
      const result = await executeReactivation(adminClient, params.storeId, {
        actorType: 'admin_user',
        actorId: user?.id || null,
      })

      await logSubscriptionAudit(adminClient, {
        storeId: params.storeId,
        actorType: 'admin_user',
        actorId: user?.id || null,
        action: 'manual_intervention',
        details: `Reativação manual autorizada por administrador. Justificativa: ${params.justification.trim()}`,
      })

      revalidatePath('/admin/assinaturas')
      revalidatePath(`/loja/${params.storeId}`)
      return { success: true, message: 'Loja reativada com sucesso.', result }
    }

    if (params.action === 'downgrade') {
      const result = await executeDowngradeToBronze(
        adminClient,
        params.storeId,
        `manual_admin_intervention: ${params.justification.trim()}`,
        'admin_user',
        user?.id || null
      )

      await logSubscriptionAudit(adminClient, {
        storeId: params.storeId,
        actorType: 'admin_user',
        actorId: user?.id || null,
        action: 'manual_intervention',
        details: `Rebaixamento manual para Bronze executado por administrador. Justificativa: ${params.justification.trim()}`,
      })

      revalidatePath('/admin/assinaturas')
      revalidatePath(`/loja/${params.storeId}`)
      return { success: true, message: 'Loja rebaixada para o plano Bronze.', result }
    }

    if (params.action === 'extend_grace') {
      const days = params.extensionDays || 5
      const newGraceEnd = new Date()
      newGraceEnd.setDate(newGraceEnd.getDate() + days)

      const { error: extendErr } = await adminClient
        .from('stores')
        .update({
          subscription_status: 'past_due',
          grace_period_end: newGraceEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.storeId)

      if (extendErr) {
        throw new Error(extendErr.message)
      }

      await logSubscriptionAudit(adminClient, {
        storeId: params.storeId,
        actorType: 'admin_user',
        actorId: user?.id || null,
        action: 'manual_intervention',
        details: `Período de tolerância prorrogado manualmente por ${days} dias (até ${newGraceEnd.toLocaleDateString('pt-BR')}). Justificativa: ${params.justification.trim()}`,
      })

      revalidatePath('/admin/assinaturas')
      revalidatePath(`/loja/${params.storeId}`)
      return { success: true, message: `Tolerância prorrogada por ${days} dias com sucesso.` }
    }

    return { success: false, error: 'Ação desconhecida.' }
  } catch (err: any) {
    console.error('Erro na intervenção manual de assinatura:', err)
    return { success: false, error: err.message || 'Falha ao processar intervenção.' }
  }
}

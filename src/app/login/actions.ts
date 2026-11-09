'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { fastSupabaseFetch } from '@/lib/supabase/fast-fetch'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL } from '@/lib/supabase/config'
import { clearLocalSessionUser, getLocalSessionUser, setLocalSessionUser } from '@/lib/local-auth'
import { getLocalStoresByOwner } from '@/lib/stores-storage'

/**
 * Verifica o status do servidor Supabase e se o provedor OAuth (facebook / google) está habilitado.
 */
async function checkSupabaseOAuthStatus(provider: 'facebook' | 'google'): Promise<{
  online: boolean
  enabled: boolean
}> {
  const supabaseUrl = SUPABASE_URL
  const supabaseKey = SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return { online: false, enabled: false }
  }

  try {
    const res = await fastSupabaseFetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseKey,
      },
    })
    if (res.status === 401 && res.statusText === 'Offline Mode') {
      return { online: false, enabled: false }
    }
    if (!res.ok) {
      return { online: true, enabled: false }
    }
    const settings = await res.json()
    return {
      online: true,
      enabled: Boolean(settings?.external?.[provider]),
    }
  } catch {
    return { online: false, enabled: false }
  }
}

export async function getSessionUserAction() {
  let user: any = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      user = data.user
    }
  } catch {
    // Ignorar falha de rede do Supabase
  }

  if (!user) {
    user = await getLocalSessionUser()
  }

  if (user && user.id) {
    let hasContractedStoreCookie = false
    try {
      const cookieStore = await cookies()
      hasContractedStoreCookie =
        cookieStore.get(`kittanda_has_store_${user.id}`)?.value === 'true'
    } catch {
      // ignore
    }

    let hasStore = Boolean(user.user_metadata?.has_store === true || hasContractedStoreCookie)

    if (!hasStore) {
      try {
        const supabase = await createClient()
        const { data: userStores } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
        if (userStores && userStores.length > 0) {
          hasStore = true
        }
      } catch {
        // ignore
      }
    }

    if (!hasStore) {
      const localOwned = getLocalStoresByOwner(user.id)
      if (localOwned.length > 0) {
        hasStore = true
      }
    }

    return {
      ...user,
      hasStore,
    }
  }

  return null
}

/**
 * Autenticação OAuth Real (Google / Facebook) via Supabase
 */
export async function authWithSocialAction(provider: 'facebook' | 'google'): Promise<{
  success: boolean
  oauthUrl?: string
  error?: string
}> {
  const origin = (await headers()).get('origin') || SITE_URL
  const status = await checkSupabaseOAuthStatus(provider)

  if (!status.online) {
    return {
      success: false,
      error:
        'O servidor de autenticação do Supabase (vooczwqifbbwtspzcdpz.supabase.co) está pausado ou inacessível no momento. Acesse o painel do Supabase e clique em "Restore project" para reativar o login com Google e Facebook.',
    }
  }

  if (!status.enabled) {
    const providerLabel = provider === 'facebook' ? 'Facebook' : 'Google'
    return {
      success: false,
      error: `O login com ${providerLabel} ainda não está ativado no painel do Supabase (Authentication → Providers → ${providerLabel}). Ative o provedor com o App ID e Secret para usar o login real do ${providerLabel}.`,
    }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
        ...(provider === 'google'
          ? {
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            }
          : {}),
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data?.url) {
      return { success: true, oauthUrl: data.url }
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao iniciar autenticação OAuth.' }
  }

  return { success: false, error: 'Não foi possível gerar a URL de autenticação.' }
}

export async function loginWithEmailAction(payload: {
  email: string
  password: string
}): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  const email = (payload.email || '').trim()
  const password = payload.password || ''

  if (!email || !password) {
    return { success: false, error: 'Preencha seu e-mail e senha.' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message?.includes('offline') || error.status === 401) {
        return {
          success: false,
          error:
            'O servidor do Supabase (vooczwqifbbwtspzcdpz.supabase.co) está pausado/offline. Reative o projeto no painel do Supabase para fazer login.',
        }
      }
      return { success: false, error: error.message }
    }

    if (data?.user) {
      const user = data.user
      let hasStore = Boolean(user.user_metadata?.has_store)
      if (!hasStore) {
        try {
          const cookieStore = await cookies()
          if (cookieStore.get(`kittanda_has_store_${user.id}`)?.value === 'true') {
            hasStore = true
          }
        } catch {
          // ignore
        }
      }
      if (!hasStore) {
        try {
          const { data: userStores } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)
          if (userStores && userStores.length > 0) hasStore = true
        } catch {
          // ignore
        }
      }
      if (!hasStore && getLocalStoresByOwner(user.id).length > 0) {
        hasStore = true
      }

      revalidatePath('/', 'layout')
      return { success: true, user: { ...user, hasStore } }
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao conectar ao servidor de autenticação.' }
  }

  return { success: false, error: 'Não foi possível autenticar.' }
}

export async function signupWithEmailAction(payload: {
  email: string
  password: string
  phone?: string
}): Promise<{
  success: boolean
  user?: any
  error?: string
}> {
  const email = (payload.email || '').trim()
  const password = payload.password || ''
  const phone = (payload.phone || '').trim()

  if (!email || !password) {
    return { success: false, error: 'Preencha seu e-mail e senha.' }
  }

  try {
    const supabase = await createClient()
    // Encerrar qualquer sessão anterior antes de cadastrar o novo e-mail
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    await clearLocalSessionUser()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone: phone || undefined,
          has_store: false,
        },
      },
    })

    if (error) {
      if (error.message?.includes('offline') || error.status === 401) {
        return {
          success: false,
          error:
            'O servidor do Supabase (vooczwqifbbwtspzcdpz.supabase.co) está pausado/offline. Reative o projeto no painel do Supabase para criar uma conta.',
        }
      }
      return { success: false, error: error.message }
    }

    if (data?.user) {
      try {
        const cookieStore = await cookies()
        cookieStore.delete('kittanda_has_store')
        cookieStore.delete(`kittanda_has_store_${data.user.id}`)
      } catch {
        // ignore
      }

      // Garantir que a sessão do novo usuário fique ativa imediatamente
      await setLocalSessionUser({
        id: data.user.id,
        email: data.user.email || email,
        user_metadata: {
          ...(data.user.user_metadata || {}),
          phone: phone || undefined,
          has_store: false,
        },
      })

      revalidatePath('/', 'layout')
      return { success: true, user: { ...data.user, hasStore: false } }
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao criar conta.' }
  }

  return { success: false, error: 'Não foi possível criar a conta.' }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Ignorar se Supabase estiver offline
  }
  await clearLocalSessionUser()
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function login(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim()
  const password = (formData.get('password') as string) || ''
  const res = await loginWithEmailAction({ email, password })
  if (!res.success && res.error) {
    redirect(`/login?message=${encodeURIComponent(res.error)}`)
  }
  redirect('/')
}

export async function signup(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim()
  const password = (formData.get('password') as string) || ''
  const phone = ((formData.get('phone') as string) || '').trim()
  const res = await signupWithEmailAction({ email, password, phone })
  if (!res.success && res.error) {
    redirect(`/login?message=${encodeURIComponent(res.error)}`)
  }
  redirect('/')
}

export async function signInWithGoogle() {
  const res = await authWithSocialAction('google')
  if (res.oauthUrl) {
    redirect(res.oauthUrl)
  }
  redirect(`/login?message=${encodeURIComponent(res.error || 'Erro ao conectar com Google')}`)
}

export async function signInWithFacebook() {
  const res = await authWithSocialAction('facebook')
  if (res.oauthUrl) {
    redirect(res.oauthUrl)
  }
  redirect(`/login?message=${encodeURIComponent(res.error || 'Erro ao conectar com Facebook')}`)
}

export async function signOut() {
  await logoutAction()
  redirect('/')
}

import { cookies } from 'next/headers'

export interface LocalSessionUser {
  id: string
  email: string
  provider: 'facebook' | 'google' | 'email' | 'demo'
  user_metadata: {
    full_name: string
    name: string
    phone?: string
    birth_date?: string
    avatar_url?: string | null
  }
}

export const LOCAL_SESSION_COOKIE = 'kittanda_session'

export function getSavedLocalUsers(): LocalSessionUser[] {
  return []
}

export function saveLocalUser(user: LocalSessionUser): LocalSessionUser {
  return user
}

export async function setLocalSessionUser(_user: LocalSessionUser) {
  // Desativado por segurança: toda autenticação usa sessão real do Supabase Auth
}

export async function clearLocalSessionUser() {
  try {
    const cookieStore = await cookies()
    if (cookieStore.get(LOCAL_SESSION_COOKIE)) {
      cookieStore.delete(LOCAL_SESSION_COOKIE)
    }
  } catch {
    // ignore
  }
}

export async function getLocalSessionUser(): Promise<LocalSessionUser | null> {
  return null
}

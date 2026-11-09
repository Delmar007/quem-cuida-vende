import { cookies } from 'next/headers'

export interface LocalSessionUser {
  id: string
  email: string
  provider?: 'facebook' | 'google' | 'email' | 'demo'
  user_metadata: {
    full_name?: string
    name?: string
    phone?: string
    birth_date?: string
    avatar_url?: string | null
    has_store?: boolean
    [key: string]: any
  }
}

export const LOCAL_SESSION_COOKIE = 'kittanda_session'

export function getSavedLocalUsers(): LocalSessionUser[] {
  return []
}

export function saveLocalUser(user: LocalSessionUser): LocalSessionUser {
  return user
}

export async function setLocalSessionUser(user: LocalSessionUser) {
  try {
    const cookieStore = await cookies()
    cookieStore.set(LOCAL_SESSION_COOKIE, encodeURIComponent(JSON.stringify(user)), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    })
  } catch {
    // ignore
  }
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
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(LOCAL_SESSION_COOKIE)?.value
    if (raw) {
      return JSON.parse(decodeURIComponent(raw)) as LocalSessionUser
    }
  } catch {
    // ignore
  }
  return null
}

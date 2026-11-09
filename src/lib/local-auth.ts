import fs from 'fs'
import path from 'path'
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

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
export const LOCAL_SESSION_COOKIE = 'kittanda_session'

// Owner ID vinculado à loja local (Club Car Cash) para garantir acesso imediato ao Painel da Loja
const DEFAULT_MERCHANT_OWNER_ID = '94a0c021-74e4-46c7-9411-90e9908303bf'

function ensureUsersFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8')
    }
  } catch (err) {
    console.warn('Erro ao inicializar users.json:', err)
  }
}

export function getSavedLocalUsers(): LocalSessionUser[] {
  ensureUsersFile()
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8')
    return JSON.parse(raw || '[]')
  } catch {
    return []
  }
}

export function saveLocalUser(user: LocalSessionUser): LocalSessionUser {
  ensureUsersFile()
  try {
    const list = getSavedLocalUsers()
    const idx = list.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase())
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user, user_metadata: { ...list[idx].user_metadata, ...user.user_metadata } }
    } else {
      list.unshift(user)
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Erro ao salvar usuário local:', err)
  }
  return user
}

export async function setLocalSessionUser(user: LocalSessionUser) {
  saveLocalUser(user)
  const cookieStore = await cookies()
  cookieStore.set(LOCAL_SESSION_COOKIE, encodeURIComponent(JSON.stringify(user)), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    sameSite: 'lax',
  })
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
    const rawCookie = cookieStore.get(LOCAL_SESSION_COOKIE)?.value
    if (!rawCookie) return null
    const parsed = JSON.parse(decodeURIComponent(rawCookie)) as LocalSessionUser
    if (!parsed || !parsed.id) return null

    // Mesclar com dados atualizados de users.json se existirem
    const saved = getSavedLocalUsers().find((u) => u.id === parsed.id)
    return saved || parsed
  } catch {
    return null
  }
}

export function buildDefaultLocalUser(
  provider: 'facebook' | 'google' | 'email' | 'demo',
  customEmail?: string,
  customName?: string,
  customPhone?: string
): LocalSessionUser {
  const existingUsers = getSavedLocalUsers()
  const existing = existingUsers.find(
    (u) => (customEmail && u.email.toLowerCase() === customEmail.toLowerCase()) || u.id === DEFAULT_MERCHANT_OWNER_ID
  )

  const defaultName =
    customName ||
    existing?.user_metadata?.full_name ||
    (provider === 'facebook'
      ? 'Conta Facebook Kittanda'
      : provider === 'google'
        ? 'Conta Google Kittanda'
        : customEmail
          ? customEmail.split('@')[0]
          : 'Lojista Kittanda')

  const defaultEmail =
    customEmail ||
    existing?.email ||
    (provider === 'facebook'
      ? 'facebook@kittanda.com.br'
      : provider === 'google'
        ? 'google@kittanda.com.br'
        : 'lojista@kittanda.com.br')

  return {
    id: existing?.id || DEFAULT_MERCHANT_OWNER_ID,
    email: defaultEmail,
    provider,
    user_metadata: {
      full_name: defaultName,
      name: defaultName,
      phone: customPhone || existing?.user_metadata?.phone || '(67) 99999-9999',
      birth_date: existing?.user_metadata?.birth_date || '1990-01-01',
      avatar_url: existing?.user_metadata?.avatar_url || null,
    },
  }
}

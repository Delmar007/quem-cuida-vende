// Circuit breaker rápido para chamadas ao Supabase quando o servidor remoto estiver offline/pausado.
// IMPORTANTE: Retorna um Response HTTP 401 sintético em vez de dar throw Error, pois o @supabase/auth-js
// faz 10 retentativas com backoff exponencial (25.7 segundos!) quando o fetch lança exceção de rede.
let offlineUntil = 0
const TIMEOUT_MS = 1500
const COOLDOWN_MS = 10000 // 10 segundos de cache offline para reconectar rápido assim que o projeto Supabase for despausado

export function isSupabaseCurrentlyOffline(): boolean {
  return Date.now() < offlineUntil
}

function createOfflineResponse(): Response {
  return new Response(
    JSON.stringify({
      message: 'Supabase temporariamente offline (modo local ativo)',
      error: 'offline',
      data: null,
    }),
    {
      status: 401,
      statusText: 'Offline Mode',
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

export const fastSupabaseFetch: typeof fetch = async (input, init) => {
  const now = Date.now()
  if (now < offlineUntil) {
    return createOfflineResponse()
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    })
    return res
  } catch {
    offlineUntil = Date.now() + COOLDOWN_MS
    return createOfflineResponse()
  } finally {
    clearTimeout(timer)
  }
}

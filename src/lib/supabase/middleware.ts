import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { fastSupabaseFetch, isSupabaseCurrentlyOffline } from './fast-fetch'

const LOCAL_SESSION_COOKIE = 'kittanda_session'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Se o usuário já possui sessão local ativa, liberar imediatamente em 0ms
  const hasLocalSession = Boolean(request.cookies.get(LOCAL_SESSION_COOKIE)?.value)
  if (hasLocalSession || isSupabaseCurrentlyOffline()) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        fetch: fastSupabaseFetch,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Ignorar falha
  }

  if (isSupabaseCurrentlyOffline()) {
    return supabaseResponse
  }

  // Proteger rotas autenticadas quando Supabase estiver online e não houver sessão local
  const isProtectedPath = 
    request.nextUrl.pathname.startsWith('/painel') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/perfil')

  if (isProtectedPath && !user && !hasLocalSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

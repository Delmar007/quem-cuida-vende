import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { fastSupabaseFetch, isSupabaseCurrentlyOffline } from './fast-fetch'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (isSupabaseCurrentlyOffline()) {
    return supabaseResponse
  }

  const supabaseUrl = SUPABASE_URL
  const supabaseKey = SUPABASE_ANON_KEY

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

  // Proteger rotas autenticadas quando Supabase estiver online
  const isProtectedPath =
    request.nextUrl.pathname.startsWith('/painel') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/perfil')

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

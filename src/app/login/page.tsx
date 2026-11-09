'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  authWithSocialAction,
  loginWithEmailAction,
  signupWithEmailAction,
} from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSocial = async (provider: 'facebook' | 'google') => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await authWithSocialAction(provider)
      if (res.oauthUrl) {
        window.location.href = res.oauthUrl
        return
      }
      if (res.success) {
        window.location.href = '/'
      } else {
        setErrorMessage(res.error || 'Erro ao autenticar.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao autenticar.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (mode: 'login' | 'signup') => {
    if (!email || !password) {
      setErrorMessage('Preencha seu e-mail e senha.')
      return
    }
    setLoading(true)
    setErrorMessage(null)
    try {
      const res =
        mode === 'login'
          ? await loginWithEmailAction({ email, password })
          : await signupWithEmailAction({ email, password })
      if (res.success) {
        window.location.href = '/'
      } else {
        setErrorMessage(res.error || 'Erro ao entrar.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-full min-h-[60vh] py-10">
      <div className="w-full max-w-sm border border-gray-200 p-8 bg-white shadow-xs">
        <div className="flex justify-center mb-6">
          <img
            src="/logo-kittanda-laranja.png"
            alt="Kittanda Outlet"
            className="w-[210px] h-auto object-contain select-none"
          />
        </div>
        <h2 className="text-base font-bold text-center mb-6 text-neutral-900">Inicie sessão</h2>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[2px]">
            {errorMessage}
          </div>
        )}

        {/* Botão de Login do Facebook */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSocial('facebook')}
          className="mb-2.5 w-full flex items-center justify-center gap-3 bg-[#2D5A9E] hover:bg-[#24487E] disabled:opacity-60 text-white py-2.5 px-4 text-xs font-semibold tracking-wide transition-colors cursor-pointer rounded-[2px]"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>{loading ? 'Conectando...' : 'Entre com Facebook'}</span>
        </button>

        {/* Botão de Login do Google */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSocial('google')}
          className="mb-6 w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-2.5 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 transition-colors shadow-xs cursor-pointer rounded-[2px]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{loading ? 'Conectando...' : 'Entrar com o Google'}</span>
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-400 uppercase tracking-wider">ou com e-mail</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleEmailAuth('login')
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 p-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 p-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleEmailAuth('signup')}
              className="bg-white border border-black text-black py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors cursor-pointer"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

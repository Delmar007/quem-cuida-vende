'use client'

import React, { useState } from 'react'
import {
  authWithSocialAction,
  loginWithEmailAction,
  signupWithEmailAction,
} from '@/app/login/actions'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  onLoginSuccess?: (user: any) => void
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Estados controlados dos formulários
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')

  // Sincronizar quando a prop externa mudar
  React.useEffect(() => {
    setMode(initialMode)
    setErrorMessage(null)
  }, [initialMode, isOpen])

  if (!isOpen) return null

  const handleSocialAuth = async (provider: 'facebook' | 'google') => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await authWithSocialAction(provider)
      if (res.oauthUrl) {
        window.location.href = res.oauthUrl
        return
      }
      setErrorMessage(res.error || 'Não foi possível autenticar.')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao conectar.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await loginWithEmailAction({
        email: loginEmail,
        password: loginPassword,
      })
      if (res.success && res.user) {
        onLoginSuccess?.(res.user)
        onClose()
      } else {
        setErrorMessage(res.error || 'E-mail ou senha inválidos.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao iniciar sessão.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await signupWithEmailAction({
        email: regEmail,
        password: regPassword,
        phone: regPhone,
      })
      if (res.success && res.user) {
        onLoginSuccess?.(res.user)
        onClose()
      } else {
        setErrorMessage(res.error || 'Não foi possível concluir o cadastro.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 transition-all animate-in fade-in duration-200">
      {/* Container Principal do Modal com barra de rolagem estilizada se necessário */}
      <div className="relative w-full max-w-[780px] max-h-[92vh] overflow-y-auto bg-white rounded-[2px] shadow-2xl p-6 md:p-10">
        
        {/* Topo do Modal: Botão de Voltar ("Inicie sessão") quando estiver no Registro + Botão de Fechar */}
        <div className="flex items-center justify-between mb-4">
          {mode === 'register' ? (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
            >
              <span>&lsaquo;</span> Inicie sessão
            </button>
          ) : (
            <div />
          )}

          <button 
            onClick={onClose}
            type="button"
            aria-label="Fechar"
            className="text-gray-400 hover:text-black transition-colors p-1 cursor-pointer"
          >
            <svg className="w-5 h-5 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Logo centralizada do Kittanda Outlet */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img
            src="/logo-kittanda-laranja.png"
            alt="Kittanda Outlet"
            className="w-[220px] md:w-[260px] h-auto object-contain select-none"
          />
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs text-center rounded-[2px]">
            {errorMessage}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODO 1: TELA DE REGISTRO / CRIE UMA CONTA                */}
        {/* ======================================================== */}
        {mode === 'register' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
            {/* Coluna da Esquerda: Imagem Conceitual Estilo Editorial */}
            <div className="w-full aspect-[4/5] rounded-[2px] overflow-hidden bg-gray-100 shadow-inner">
              <img 
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=80" 
                alt="Amigos celebrando compras no outlet" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Coluna da Direita: Formulário Completo de Cadastro */}
            <div className="flex flex-col">
              {/* Botões Sociais */}
              <div className="flex flex-col gap-2">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialAuth('facebook')}
                  className="w-full flex items-center justify-center gap-3 bg-[#2D5A9E] hover:bg-[#24487E] disabled:opacity-60 text-white py-2.5 px-4 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>{loading ? 'Conectando...' : 'Registre-se com Facebook'}</span>
                </button>

                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialAuth('google')}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-60 text-gray-700 py-2.5 px-4 text-xs font-semibold tracking-wide transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{loading ? 'Conectando...' : 'Registre-se com Google'}</span>
                </button>
              </div>

              {/* Divisor "o" */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400 font-light">o</span>
                </div>
              </div>

              {/* Formulário com os campos idênticos */}
              <form onSubmit={handleEmailSignup} className="flex flex-col gap-3">
                {/* E-mail */}
                <div>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="E-mail"
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 placeholder:italic focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Senha com ícone de olho */}
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    required 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 placeholder:italic focus:outline-none focus:border-black transition-colors pr-9"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4 stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      )}
                    </svg>
                  </button>
                </div>

                {/* Celular */}
                <div>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Celular"
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 placeholder:italic focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Sexo (opcional) */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-xs text-gray-700 font-medium">Sexo (opcional):</span>
                  <div className="flex items-center gap-6 text-xs text-gray-600">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="gender" value="feminino" className="accent-black" />
                      <span>Feminino</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="gender" value="masculino" className="accent-black" />
                      <span>Masculino</span>
                    </label>
                  </div>
                </div>

                {/* Um amigo me convidou (opcional) */}
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-xs text-gray-700 font-medium">Um amigo me convidou <span className="text-gray-400 font-normal">(opcional)</span>:</span>
                  <input 
                    type="text" 
                    name="referral_code"
                    placeholder="Escreva o código do seu amigo"
                    className="w-full border border-gray-300 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 placeholder:italic focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Termos e Condições */}
                <div className="flex items-start gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    required 
                    defaultChecked
                    className="mt-0.5 accent-black" 
                  />
                  <label htmlFor="terms" className="text-[11px] text-gray-500 leading-tight">
                    Li e aceito as Condições gerais e Política de privacidade da Kittanda.
                  </label>
                </div>

                {/* Botão Concluir Cadastro */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="mt-2 w-full bg-black text-white py-2.5 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-60 transition-colors tracking-wide cursor-pointer"
                >
                  {loading ? 'Criando conta...' : 'Concluir Cadastro'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MODO 2: TELA DE LOGIN / INICIE SESSÃO                    */
          /* ======================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-200 -translate-x-1/2" />

            {/* Inicie sessão */}
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-center text-gray-900 mb-6">
                Inicie sessão
              </h3>

              <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="E-mail"
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 placeholder:italic focus:outline-none focus:border-black transition-colors"
                />

                <input 
                  type="password" 
                  name="password" 
                  required 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 placeholder:italic focus:outline-none focus:border-black transition-colors"
                />

                <div className="text-right">
                  <a href="#" className="text-xs text-gray-500 hover:text-black hover:underline transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="mt-2 w-full bg-black text-white py-2.5 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-60 transition-colors tracking-wide cursor-pointer"
                >
                  {loading ? 'Entrando...' : 'Entre'}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400 font-light">o</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialAuth('facebook')}
                  className="w-full flex items-center justify-center gap-3 bg-[#2D5A9E] hover:bg-[#24487E] disabled:opacity-60 text-white py-2.5 px-4 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>{loading ? 'Conectando...' : 'Entre com Facebook'}</span>
                </button>

                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialAuth('google')}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-60 text-gray-700 py-2.5 px-4 text-xs font-semibold tracking-wide transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{loading ? 'Conectando...' : 'Entre com Google'}</span>
                </button>
              </div>
            </div>

            {/* Registre-se na Kittanda */}
            <div className="flex flex-col justify-start">
              <h3 className="text-base font-bold text-center text-gray-900 mb-3">
                Registre-se na Kittanda
              </h3>
              
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                E encontre suas marcas favoritas com até 70% off.
              </p>

              <button 
                type="button"
                onClick={() => setMode('register')}
                className="w-full border border-black text-black py-2.5 text-sm font-semibold hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                Registre-se grátis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

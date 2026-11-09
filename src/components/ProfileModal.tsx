'use client'

import React, { useState, useEffect } from 'react'
import { ProfileData, saveProfile } from '@/app/actions/profile'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: ProfileData | null
  onProfileUpdated: () => void
  onOpenStoreModal: () => void
}

export default function ProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onOpenStoreModal,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Sincronizar dados quando o modal abre ou perfil muda
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setPhone(profile.phone || '')
      setBirthDate(profile.birth_date || '')
      // Se já tiver todos os dados preenchidos, inicia em modo visualização (botão "Editar")
      // Se faltar algum dado, inicia em modo de edição (botão "Salvar")
      setIsEditing(!profile.is_complete)
    }
    setFeedback(null)
  }, [profile, isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const res = await saveProfile({
        displayName,
        phone,
        birthDate,
      })

      if (res.success) {
        setFeedback({ type: 'success', message: 'Dados salvos com sucesso!' })
        setIsEditing(false) // Troca para modo visualização com botão "Editar"
        onProfileUpdated()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao salvar perfil.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro inesperado.' })
    } finally {
      setLoading(false)
    }
  }

  const isFormComplete = Boolean(displayName.trim() && phone.trim() && birthDate.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[520px] bg-white rounded-[2px] shadow-2xl p-6 md:p-8">
        
        {/* Topo do modal: Título e Botão Fechar */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs uppercase">
              {displayName ? displayName.charAt(0) : 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 leading-tight">
                Meu Cadastro
              </h2>
              <p className="text-[11px] text-gray-500">
                {profile?.email || 'Mantenha seus dados sempre atualizados'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-black transition-colors p-1 cursor-pointer"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mensagem de Feedback */}
        {feedback && (
          <div className={`p-3 mb-4 text-xs rounded-sm flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <span>{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)} className="font-bold text-xs ml-2 cursor-pointer">&times;</button>
          </div>
        )}

        {/* Formulário de Perfil */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          
          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1 uppercase tracking-wider">
              Nome Completo
            </label>
            <input
              type="text"
              required
              disabled={!isEditing}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className={`w-full border px-3 py-2 text-sm text-neutral-900 transition-colors ${
                !isEditing 
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed' 
                  : 'bg-white border-gray-300 focus:border-black focus:outline-none'
              }`}
            />
          </div>

          {/* WhatsApp / Celular */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1 uppercase tracking-wider">
              WhatsApp / Celular
            </label>
            <input
              type="tel"
              required
              disabled={!isEditing}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 90000-0000"
              className={`w-full border px-3 py-2 text-sm text-neutral-900 transition-colors ${
                !isEditing 
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed' 
                  : 'bg-white border-gray-300 focus:border-black focus:outline-none'
              }`}
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1 uppercase tracking-wider">
              Data de Nascimento
            </label>
            <input
              type="date"
              required
              disabled={!isEditing}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={`w-full border px-3 py-2 text-sm text-neutral-900 transition-colors ${
                !isEditing 
                  ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed' 
                  : 'bg-white border-gray-300 focus:border-black focus:outline-none'
              }`}
            />
          </div>

          {/* Botão de Ação: Salvar ou Editar */}
          <div className="pt-2">
            {isEditing ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full border border-black text-black py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Editar
              </button>
            )}
          </div>
        </form>

        {/* ======================================================== */}
        {/* BOTÃO "ABRIR MINHA LOJA" (SURGE APÓS COMPLETAR O CADASTRO) */}
        {/* ======================================================== */}
        {(isFormComplete || profile?.is_complete) && !isEditing && (
          <div className="mt-6 pt-5 border-t border-gray-200 flex flex-col items-center text-center animate-in fade-in duration-300">
            <span className="text-[10.5px] uppercase font-bold tracking-wider text-[#FB6600] mb-1">
              &bull; Deseja vender no outlet? &bull;
            </span>
            <p className="text-xs text-neutral-600 mb-3">
              Seu cadastro está completo! Agora você já pode criar sua vitrine oficial e cadastrar seus produtos.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenStoreModal()
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#FB6600] hover:bg-[#e05b00] text-white py-3 px-4 text-xs font-bold uppercase tracking-widest shadow-md transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Abrir Minha Loja</span>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import {
  getStoreInvitesAction,
  createStoreInviteAction,
  StoreInvite,
} from '@/app/actions/merchant-tools'

interface MerchantInvitesTabProps {
  storeId: string
  storeName: string
}

export default function MerchantInvitesTab({
  storeId,
  storeName,
}: MerchantInvitesTabProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [invites, setInvites] = useState<StoreInvite[]>([])
  const [maxInvites, setMaxInvites] = useState(10)
  const [remainingInvites, setRemainingInvites] = useState(10)
  const [loading, setLoading] = useState(true)

  // Form states
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadInvites = async () => {
    setLoading(true)
    try {
      const res = await getStoreInvitesAction(storeId)
      if (res.success) {
        setInviteCode(res.inviteCode)
        setInviteUrl(res.inviteUrl)
        setInvites(res.invites)
        setMaxInvites(res.maxInvites)
        setRemainingInvites(res.remainingInvites)
      }
    } catch (err) {
      console.error('Erro ao carregar convites:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (storeId) {
      loadInvites()
    }
  }, [storeId])

  const handleCopyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShareWhatsApp = (customGuestPhone?: string, customGuestName?: string) => {
    const text = encodeURIComponent(
      `Olá${customGuestName ? ` ${customGuestName}` : ''}! Sou da loja *${storeName}* e estou te enviando um convite VIP e exclusivo para fazer parte da *Kittanda Outlet*. Acesse pelo meu link de lojista convidado com o código *${inviteCode}*: ${inviteUrl}`
    )
    const phoneParam = customGuestPhone ? customGuestPhone.replace(/\D/g, '') : ''
    const waUrl = phoneParam
      ? `https://wa.me/55${phoneParam}?text=${text}`
      : `https://wa.me/?text=${text}`
    window.open(waUrl, '_blank')
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName.trim()) {
      setFeedback({ type: 'error', message: 'Informe o nome do lojista convidado.' })
      return
    }

    setCreating(true)
    setFeedback(null)

    try {
      const res = await createStoreInviteAction(storeId, guestName, guestPhone)
      if (res.success && res.invite) {
        setInvites((prev) => [res.invite!, ...prev])
        setRemainingInvites((prev) => Math.max(0, prev - 1))
        setFeedback({
          type: 'success',
          message: `Convite gerado para ${guestName}! Você já pode compartilhar no WhatsApp.`,
        })
        handleShareWhatsApp(guestPhone, guestName)
        setGuestName('')
        setGuestPhone('')
      } else {
        setFeedback({ type: 'error', message: res.error || 'Falha ao gerar convite.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro inesperado ao criar convite.' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 08 */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-black uppercase text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
            Tópico 08
          </span>
          <span className="text-xs font-bold text-neutral-500">• Rede de Confiança</span>
        </div>
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Sistema de Convites Exclusivos entre Lojistas
        </h2>
        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
          <strong>Não é porque é barato que não tem valor.</strong> A Kittanda Outlet opera com curadoria e
          valorização mútua: novos lojistas só entram indicados por lojistas membros de confiança.
        </p>
      </div>

      {/* Cartão de Destaque do Código VIP & Link */}
      <div className="bg-neutral-900 text-white p-6 rounded-[2px] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] bg-orange-950/60 px-2.5 py-1 rounded">
              Seu Código VIP de Embaixador
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-white">
                {inviteCode || 'CARREGANDO...'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-md">
              Compartilhe seu código com lojistas parceiros selecionados a dedo para expandir a rede mantendo a
              alta qualidade do nosso polo outlet.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              <span>{copied ? '✓ Link Copiado!' : '📋 Copiar Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleShareWhatsApp()}
              className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>💬 Convidar no WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Cota de Convites */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-300 gap-2">
          <span>
            Você tem <strong>{remainingInvites}</strong> convites restantes disponíveis (de um total de {maxInvites}).
          </span>
          <span className="text-[11px] text-neutral-400">
            {invites.filter((i) => i.status === 'active').length} lojas parceiras já ativas
          </span>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-3 text-xs rounded-[2px] flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold text-sm cursor-pointer">&times;</button>
        </div>
      )}

      {/* Formulário para Indicar Lojista Específico */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-1">
          Enviar Convite Direto para um Parceiro
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Gere um convite nominal para um colega lojista com disparo automático via WhatsApp.
        </p>

        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
              Nome da Loja / Responsável *
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ex: Boutique Elegance"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
              WhatsApp do Lojista
            </label>
            <input
              type="text"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="(67) 99999-9999"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || remainingInvites <= 0}
              className="w-full py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50 transition-colors"
            >
              {creating ? 'Gerando...' : 'Gerar e Enviar Convite'}
            </button>
          </div>
        </form>
      </div>

      {/* Histórico de Convites */}
      <div className="bg-white border border-neutral-200 rounded-[2px] overflow-hidden shadow-sm">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Lojas e Parceiros Convidados ({invites.length})
          </h3>
          <span className="text-[11px] text-neutral-500">
            Status de ativação em tempo real
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            Carregando convites...
          </div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            Você ainda não enviou nenhum convite. Convide seu primeiro lojista parceiro!
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">
                      {inv.guestName || 'Convite Aberto'}
                    </span>
                    {inv.guestPhone && (
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {inv.guestPhone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                    <span>Código: <strong className="font-mono text-neutral-700">{inv.code}</strong></span>
                    <span>•</span>
                    <span>Criado em {new Date(inv.createdAt).toLocaleDateString('pt-BR')}</span>
                    {inv.invitedStoreName && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">Loja: {inv.invitedStoreName}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded ${
                      inv.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.status === 'active' ? '🟢 Loja Ativa' : '🟡 Convite Pendente'}
                  </span>

                  {inv.status !== 'active' && (
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(inv.guestPhone, inv.guestName)}
                      className="text-xs font-bold text-[#FB6600] hover:underline cursor-pointer"
                    >
                      Reenviar WhatsApp →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

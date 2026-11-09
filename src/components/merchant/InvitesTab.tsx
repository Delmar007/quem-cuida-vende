'use client'

import React, { useState } from 'react'
import { StoreAdminData } from '@/app/actions/store-admin'

interface InvitesTabProps {
  store: StoreAdminData | null
}

export default function InvitesTab({ store }: InvitesTabProps) {
  const [copied, setCopied] = useState(false)
  const [guestStoreName, setGuestStoreName] = useState('')
  const [guestMerchantName, setGuestMerchantName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestCategory, setGuestCategory] = useState('moda')
  const [feedback, setFeedback] = useState<string | null>(null)

  // Link e código exclusivo de convite
  const storeSlug = store?.slug || 'minha-loja'
  const inviteCode = `CONVITE-${(store?.name || 'LOJA').replace(/\s+/g, '').slice(0, 5).toUpperCase()}-${Math.floor(1000 + (store?.id ? store.id.charCodeAt(0) * 17 : 4821))}`
  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/convite/${inviteCode}` 
    : `https://kittanda.com.br/convite/${inviteCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSendWhatsAppInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestStoreName.trim() || !guestPhone.trim()) {
      setFeedback('Preencha o nome da loja e o WhatsApp para enviar o convite.')
      return
    }

    const message = encodeURIComponent(
      `Olá ${guestMerchantName || 'amigo(a)'}! Tudo bem?\n\n` +
      `Aqui é da loja *${store?.name || 'Kittanda Lojista'}*. Estou te enviando um convite VIP e exclusivo para abrir sua loja e divulgar seus produtos na *Kittanda Outlet*!\n\n` +
      `A entrada na plataforma é restrita a lojas convidadas por quem já está dentro. Acesse pelo meu link de indicação para garantir sua vaga:\n` +
      `${inviteUrl}\n\n` +
      `Código de Convite: *${inviteCode}*\n\n` +
      `Vamos crescer juntos no comércio regional!`
    )

    const rawNumber = guestPhone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/55${rawNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
    setFeedback(`Convite gerado para ${guestStoreName}! Conversa no WhatsApp aberta.`)
    setGuestStoreName('')
    setGuestMerchantName('')
    setGuestPhone('')
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 1 */}
      <div className="bg-white border border-neutral-200 p-6 rounded-[2px] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
                Tópico 1 • Rede Exclusiva
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Apenas Lojas Convidadas
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Fazer Convites & Expandir a Rede
            </h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              Na Kittanda Outlet, prezamos pela valorização e confiança. Novos estabelecimentos só entram por indicação direta de lojistas parceiros. Você tem o poder de selecionar e convidar as melhores lojas da sua região.
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-black text-[#FB6600]">5</span>
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">
              Convites VIP Disponíveis
            </span>
          </div>
        </div>

        {/* Link Exclusivo da Loja */}
        <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-[2px] mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            Seu Link Exclusivo de Indicação
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-white border border-neutral-300 px-3 py-2 text-xs font-mono text-neutral-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="bg-black hover:bg-neutral-800 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap"
            >
              {copied ? '✓ Copiado!' : 'Copiar Link'}
            </button>
          </div>
          <span className="text-[10.5px] text-neutral-400 mt-1 block">
            Código do convite: <strong>{inviteCode}</strong> (atrelado ao seu cadastro de lojista)
          </span>
        </div>

        {/* Formulário: Convidar Diretamente no WhatsApp */}
        <div className="border border-neutral-200 p-5 rounded-[2px] bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-2">
            <span>💬</span> Convidar Outro Lojista pelo WhatsApp
          </h3>

          {feedback && (
            <div className="p-3 mb-4 text-xs rounded bg-green-50 text-green-800 border border-green-200">
              {feedback}
            </div>
          )}

          <form onSubmit={handleSendWhatsAppInvite} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                Nome da Loja Convidada *
              </label>
              <input
                type="text"
                required
                value={guestStoreName}
                onChange={(e) => setGuestStoreName(e.target.value)}
                placeholder="Ex: Boutique Elegance"
                className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                Nome do Lojista Responsável
              </label>
              <input
                type="text"
                value={guestMerchantName}
                onChange={(e) => setGuestMerchantName(e.target.value)}
                placeholder="Ex: Roberto Lima"
                className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                WhatsApp com DDD *
              </label>
              <input
                type="tel"
                required
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="(67) 99876-5432"
                className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                Segmento / Categoria
              </label>
              <select
                value={guestCategory}
                onChange={(e) => setGuestCategory(e.target.value)}
                className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none bg-white"
              >
                <option value="moda">Moda</option>
                <option value="pet">Pet</option>
                <option value="casa">Casa</option>
                <option value="beleza">Beleza</option>
                <option value="agro">Agro</option>
                <option value="carro">Carro</option>
                <option value="eletro">Eletro</option>
                <option value="escritorio">Escritório</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebc59] text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <span>Enviar Convite VIP pelo WhatsApp</span>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.074-2.127-.47-1.424-.54-2.348-1.99-2.42-2.086-.071-.096-.582-.774-.582-1.476 0-.701.369-1.047.5-1.191.131-.144.288-.18.384-.18.096 0 .192.001.276.005.089.004.208-.033.325.249.12.288.408.996.444 1.069.036.073.06.157.012.253s-.072.156-.144.24c-.072.084-.152.187-.217.251-.073.072-.149.15-.064.296.084.145.376.62.808 1.004.557.494 1.026.647 1.171.72.144.072.23.06.315-.037.085-.096.362-.421.458-.565.097-.145.193-.12.325-.072s.841.396.985.469c.144.072.24.108.276.168.036.06.036.35-.108.755z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Histórico de Indicações */}
        <div className="mt-6 border-t border-neutral-100 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-3">
            Lojas Convidadas por Você
          </h4>
          <div className="border border-neutral-200 overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-neutral-100 p-2.5 font-bold uppercase text-[10px] text-neutral-600">
              <span>Loja Convidada</span>
              <span>Categoria</span>
              <span className="text-right">Status do Convite</span>
            </div>
            <div className="p-4 text-center text-neutral-500 bg-white">
              Nenhuma loja convidada ainda. Envie seu primeiro convite acima para começar a formar a sua rede parceira!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

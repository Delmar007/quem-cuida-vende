'use client'

import React, { useState } from 'react'
import { StoreAdminData } from '@/app/actions/store-admin'

interface BirthdaysTabProps {
  store: StoreAdminData | null
}

export default function BirthdaysTab({ store }: BirthdaysTabProps) {
  const [couponCode, setCouponCode] = useState('NIVER15')
  const [discountPercent, setDiscountPercent] = useState('15% OFF')
  const [feedback, setFeedback] = useState<string | null>(null)

  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' })
  const formattedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)

  const birthdayFollowers = [
    {
      id: 'f-1',
      name: 'Mariana Silva de Souza',
      birthday: '18 de Outubro',
      phone: '67991234567',
      status: 'pending',
    },
    {
      id: 'f-2',
      name: 'Lucas Ferreira Mendes',
      birthday: '21 de Outubro',
      phone: '67992345678',
      status: 'sent',
    },
    {
      id: 'f-3',
      name: 'Camila Albuquerque Rocha',
      birthday: '26 de Outubro',
      phone: '67993456789',
      status: 'pending',
    },
    {
      id: 'f-4',
      name: 'Thiago Oliveira Martins',
      birthday: '29 de Outubro',
      phone: '67994567890',
      status: 'pending',
    },
  ]

  const handleSendWhatsAppGreeting = (follower: typeof birthdayFollowers[0]) => {
    const message = encodeURIComponent(
      `Olá ${follower.name.split(' ')[0]}! Tudo bem?\n\n` +
      `Aqui é da loja *${store?.name || 'Kittanda Outlet'}*! Ficamos sabendo que seu aniversário está chegando (${follower.birthday}) e não poderíamos deixar essa data passar em branco! 🎉🎂\n\n` +
      `Preparamos um presente especial para você comemorar: *${discountPercent}* em qualquer peça da nossa loja com o cupom *${couponCode}* válido durante todo o seu mês de aniversário!\n\n` +
      `Venha conferir nossas peças exclusivas na Kittanda Outlet!`
    )

    const rawPhone = follower.phone.replace(/\D/g, '')
    const url = `https://wa.me/55${rawPhone}?text=${message}`
    window.open(url, '_blank')
    setFeedback(`Mensagem de aniversário aberta no WhatsApp para ${follower.name}!`)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 5 */}
      <div className="bg-white border border-neutral-200 p-6 rounded-[2px] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
                Tópico 5 • Fidelização de Clientes
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Mês de {formattedMonth}
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Aniversariantes Seguidores da Loja
            </h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
              Surpreenda os seguidores que fazem aniversário neste mês com uma mensagem carinhosa e um cupom exclusivo no WhatsApp. Clientes homenageados compram com muito mais entusiasmo.
            </p>
          </div>

          <div className="text-right shrink-0 bg-amber-50 border border-amber-200 p-3 rounded-[2px]">
            <span className="text-2xl font-black text-amber-900">{birthdayFollowers.length}</span>
            <span className="text-[10px] text-amber-800 uppercase font-bold block">
              Aniversariantes em {formattedMonth}
            </span>
          </div>
        </div>

        {feedback && (
          <div className="p-3 mb-4 text-xs rounded bg-green-50 text-green-800 border border-green-200">
            {feedback}
          </div>
        )}

        {/* Configuração do Presente de Aniversário */}
        <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-[2px] mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-3 flex items-center gap-2">
            <span>🎁</span> Cupom Especial para os Aniversariantes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                Código do Cupom
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold font-mono focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                Benefício / Desconto
              </label>
              <input
                type="text"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Lista de Seguidores Aniversariantes */}
        <div className="border border-neutral-200 overflow-hidden">
          <div className="bg-neutral-100 p-3 text-[10.5px] font-bold uppercase text-neutral-700 grid grid-cols-12 gap-2">
            <span className="col-span-5 sm:col-span-4">Seguidor(a)</span>
            <span className="col-span-3 sm:col-span-3">Data de Aniversário</span>
            <span className="hidden sm:block sm:col-span-2">WhatsApp</span>
            <span className="col-span-4 sm:col-span-3 text-right">Ação</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {birthdayFollowers.map((f) => (
              <div key={f.id} className="p-3.5 grid grid-cols-12 gap-2 items-center hover:bg-neutral-50">
                <div className="col-span-5 sm:col-span-4">
                  <span className="text-xs font-bold text-neutral-900 block truncate">
                    {f.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">
                    Seguidora assídua
                  </span>
                </div>

                <div className="col-span-3 sm:col-span-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full">
                    <span>🎂</span>
                    <span>{f.birthday}</span>
                  </span>
                </div>

                <div className="hidden sm:block sm:col-span-2 text-xs text-neutral-600 font-mono">
                  {f.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                </div>

                <div className="col-span-4 sm:col-span-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppGreeting(f)}
                    className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebc59] text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-sm inline-flex items-center justify-center gap-1"
                  >
                    <span>WhatsApp</span>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.074-2.127-.47-1.424-.54-2.348-1.99-2.42-2.086-.071-.096-.582-.774-.582-1.476 0-.701.369-1.047.5-1.191.131-.144.288-.18.384-.18.096 0 .192.001.276.005.089.004.208-.033.325.249.12.288.408.996.444 1.069.036.073.06.157.012.253s-.072.156-.144.24c-.072.084-.152.187-.217.251-.073.072-.149.15-.064.296.084.145.376.62.808 1.004.557.494 1.026.647 1.171.72.144.072.23.06.315-.037.085-.096.362-.421.458-.565.097-.145.193-.12.325-.072s.841.396.985.469c.144.072.24.108.276.168.036.06.036.35-.108.755z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

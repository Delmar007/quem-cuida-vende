'use client'

import React, { useState, useEffect } from 'react'
import {
  getStorePromoTimerAction,
  saveStorePromoTimerAction,
} from '@/app/actions/promo-timer'
import PromoThermometerBar from '@/components/PromoThermometerBar'

interface MerchantPromoTimerTabProps {
  storeId: string
  storeName: string
  onTimerUpdated?: (timer: {
    title: string
    startDate: string
    endDate: string
    isActive: boolean
  }) => void
}

function toLocalDatetimeInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export default function MerchantPromoTimerTab({
  storeId,
  storeName,
  onTimerUpdated,
}: MerchantPromoTimerTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('Outlet')
  const [startDate, setStartDate] = useState(() => toLocalDatetimeInput(new Date().toISOString()))
  const [endDate, setEndDate] = useState(() =>
    toLocalDatetimeInput(new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString())
  )
  const [isActive, setIsActive] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  useEffect(() => {
    let mounted = true
    if (!storeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    getStorePromoTimerAction(storeId)
      .then((res) => {
        if (!mounted) return
        if (res.success && res.timer) {
          setTitle(res.timer.title || 'Outlet')
          setStartDate(toLocalDatetimeInput(res.timer.startDate))
          setEndDate(toLocalDatetimeInput(res.timer.endDate))
          setIsActive(Boolean(res.timer.isActive))
        } else {
          // Padrão sugerido: Campanha Outlet de 3 dias
          const nowIso = new Date().toISOString()
          const threeDaysIso = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
          setTitle('Outlet')
          setStartDate(toLocalDatetimeInput(nowIso))
          setEndDate(toLocalDatetimeInput(threeDaysIso))
          setIsActive(true)
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [storeId])

  const applyPresetDays = (days: number) => {
    const start = new Date()
    const end = new Date(start.getTime() + days * 24 * 3600 * 1000)
    setStartDate(toLocalDatetimeInput(start.toISOString()))
    setEndDate(toLocalDatetimeInput(end.toISOString()))
    setIsActive(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      const startIso = new Date(startDate).toISOString()
      const endIso = new Date(endDate).toISOString()

      const res = await saveStorePromoTimerAction({
        storeId,
        storeName,
        title,
        startDate: startIso,
        endDate: endIso,
        isActive,
      })

      if (res.success && res.timer) {
        setFeedback({
          type: 'success',
          message:
            'Cronômetro de Promoção salvo! O termômetro temporal já está ativo abaixo do banner e na página de produtos.',
        })
        if (onTimerUpdated) {
          onTimerUpdated({
            title: res.timer.title,
            startDate: res.timer.startDate,
            endDate: res.timer.endDate,
            isActive: res.timer.isActive,
          })
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Erro ao salvar cronômetro de promoção.',
        })
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro ao salvar cronômetro de promoção.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-[2px] shadow-sm animate-in fade-in duration-200">
      <div className="border-b border-neutral-100 pb-4 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
            Tópico 13 • Termômetro Temporal de Campanha
          </span>
          <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
            Cronômetro de Promoção
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Crie uma campanha com data de início e data de fim. Abaixo do banner e nos produtos aparecerá o termômetro temporal que diminui a cada hora até finalizar.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer bg-neutral-100 px-3 py-1.5 rounded-[2px] border border-neutral-200">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-[#FB6600] w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            {isActive ? 'Campanha Ativa' : 'Campanha Pausada'}
          </span>
        </label>
      </div>

      {feedback && (
        <div
          className={`p-3.5 mb-6 text-xs rounded-[2px] border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold ml-3 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-500">
          Carregando configurações do cronômetro...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Prévia em Tempo Real do Termômetro Temporal */}
          <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-[2px] space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
              Prévia Ao Vivo (Como aparece abaixo do Banner e nos Produtos):
            </span>
            <PromoThermometerBar
              title={title || 'Outlet'}
              startDate={startDate ? new Date(startDate).toISOString() : undefined}
              endDate={endDate ? new Date(endDate).toISOString() : undefined}
              isActive={true}
              variant="banner"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Nome da Campanha / Promoção *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Outlet, Liquidação, Queima de Estoque..."
                className="w-full border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Outlet', 'Lançamento', 'Últimas Unidades', 'Vitrine', 'Liquidação'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTitle(sug)}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-[2px] border cursor-pointer transition-colors ${
                      title.toLowerCase() === sug.toLowerCase()
                        ? 'bg-[#FB6600] text-white border-[#FB6600]'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Data e Hora de Início *
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Data e Hora de Fim *
              </label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: '+ 24 Horas', days: 1 },
                  { label: '+ 3 Dias', days: 3 },
                  { label: '+ 5 Dias', days: 5 },
                  { label: '+ 7 Dias', days: 7 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => applyPresetDays(preset.days)}
                    className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-[2px] border bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-widest rounded-[2px] shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Salvando Cronômetro...' : 'Salvar Cronômetro de Promoção'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

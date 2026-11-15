'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AdminBannerConfig,
  BannerDirection,
  DEFAULT_ADMIN_BANNER_CONFIG,
  normalizeBannerConfig,
} from '@/lib/admin-banners-types'
import { getStorePublicPath } from '@/lib/store-slug'

export interface HomeBannerGoldStore {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  large_banner_url?: string | null
  small_banner_url?: string | null
  created_at?: string
}

interface HomeBannerProps {
  goldStores?: HomeBannerGoldStore[]
  initialConfig?: AdminBannerConfig
}

interface ResolvedSlide {
  id: string
  kind: 'gold' | 'site' | 'fallback'
  tituloPre: string
  tituloPrincipal: string
  desconto?: string
  subtexto: string
  imagem: string
  href: string
}

const FALLBACK_SLIDES: ResolvedSlide[] = [
  {
    id: 'fallback-1',
    kind: 'fallback',
    tituloPre: 'Especial',
    tituloPrincipal: 'Kids',
    desconto: '80',
    subtexto: 'e condições exclusivas de frete grátis',
    imagem:
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80',
    href: '/?tipo=produtos',
  },
  {
    id: 'fallback-2',
    kind: 'fallback',
    tituloPre: 'Coleção',
    tituloPrincipal: 'Primavera',
    desconto: '70',
    subtexto: 'ofertas imperdíveis com parcelamento sem juros',
    imagem:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
    href: '/?tipo=produtos',
  },
  {
    id: 'fallback-3',
    kind: 'fallback',
    tituloPre: 'Liquidação',
    tituloPrincipal: 'Premium',
    desconto: '60',
    subtexto: 'últimas peças de grandes marcas com frete especial',
    imagem:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    href: '/?tipo=produtos',
  },
]

const DIRECTION_KEYFRAME: Record<BannerDirection, string> = {
  'top-to-bottom': 'bannerSlideDown 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  'bottom-to-top': 'bannerSlideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  'left-to-right': 'bannerSlideRight 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  'right-to-left': 'bannerSlideLeft 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
}

export default function HomeBanner({
  goldStores = [],
  initialConfig,
}: HomeBannerProps) {
  const [config, setConfig] = useState<AdminBannerConfig>(() =>
    normalizeBannerConfig(initialConfig || DEFAULT_ADMIN_BANNER_CONFIG)
  )
  const [currentSlide, setCurrentSlide] = useState(0)
  const [randomSeed, setRandomSeed] = useState<number[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kittanda_admin_banners_config')
      if (raw) {
        const parsed = normalizeBannerConfig(JSON.parse(raw))
        if (
          !initialConfig?.updatedAt ||
          (parsed.updatedAt && parsed.updatedAt > initialConfig.updatedAt)
        ) {
          setConfig(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [initialConfig])

  // Gera permutação randômica no cliente quando modo = 'random'
  useEffect(() => {
    if (config.goldOrderMode === 'random' && goldStores.length > 0) {
      const indices = goldStores.map((_, idx) => idx)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
      }
      setRandomSeed(indices)
    } else {
      setRandomSeed([])
    }
  }, [config.goldOrderMode, goldStores])

  const slides = useMemo<ResolvedSlide[]>(() => {
    const orderedGold = [...goldStores]
    if (config.goldOrderMode === 'random' && randomSeed.length === orderedGold.length) {
      const shuffled = randomSeed.map((i) => orderedGold[i]).filter(Boolean)
      orderedGold.splice(0, orderedGold.length, ...shuffled)
    } else {
      orderedGold.sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime()
        const tb = new Date(b.created_at || 0).getTime()
        return ta - tb
      })
    }

    const goldSlides: ResolvedSlide[] = orderedGold.map((store) => ({
      id: `gold-${store.id}`,
      kind: 'gold',
      tituloPre: 'Loja Ouro',
      tituloPrincipal: store.name,
      subtexto: store.description || 'Clique para acessar a vitrine completa desta loja',
      imagem:
        store.large_banner_url ||
        store.small_banner_url ||
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      href: getStorePublicPath(store),
    }))

    const activeSiteBanners = config.siteBanners.filter((b) => b.isActive)
    const every5 = activeSiteBanners.filter((b) => b.frequency === 5)
    const every10 = activeSiteBanners.filter((b) => b.frequency === 10)

    if (goldSlides.length === 0 && activeSiteBanners.length === 0) {
      return FALLBACK_SLIDES
    }

    if (goldSlides.length === 0) {
      return activeSiteBanners.map((b) => ({
        id: b.id,
        kind: 'site',
        tituloPre: 'Destaque',
        tituloPrincipal: b.title,
        subtexto: b.subtitle || 'Clique para conferir',
        imagem: b.imageUrl,
        href: b.targetUrl || '/',
      }))
    }

    // Intercala banners do site a cada 5 e/ou a cada 10 banners Ouro
    const combined: ResolvedSlide[] = []
    let idx5 = 0
    let idx10 = 0
    let insertedAny5 = false
    let insertedAny10 = false

    goldSlides.forEach((gSlide, idx) => {
      combined.push(gSlide)
      const goldCount = idx + 1
      if (every5.length > 0 && goldCount % 5 === 0) {
        const sb = every5[idx5 % every5.length]
        idx5++
        insertedAny5 = true
        combined.push({
          id: `${sb.id}-5-${goldCount}`,
          kind: 'site',
          tituloPre: 'Destaque',
          tituloPrincipal: sb.title,
          subtexto: sb.subtitle || 'Clique para conferir',
          imagem: sb.imageUrl,
          href: sb.targetUrl || '/',
        })
      }
      if (every10.length > 0 && goldCount % 10 === 0) {
        const sb = every10[idx10 % every10.length]
        idx10++
        insertedAny10 = true
        combined.push({
          id: `${sb.id}-10-${goldCount}`,
          kind: 'site',
          tituloPre: 'Destaque',
          tituloPrincipal: sb.title,
          subtexto: sb.subtitle || 'Clique para conferir',
          imagem: sb.imageUrl,
          href: sb.targetUrl || '/',
        })
      }
    })

    // Se houver menos de 5/10 banners Ouro cadastrados, ainda inclui os banners do site ao final do ciclo
    if (every5.length > 0 && !insertedAny5) {
      every5.forEach((sb) => {
        combined.push({
          id: `${sb.id}-tail5`,
          kind: 'site',
          tituloPre: 'Destaque',
          tituloPrincipal: sb.title,
          subtexto: sb.subtitle || 'Clique para conferir',
          imagem: sb.imageUrl,
          href: sb.targetUrl || '/',
        })
      })
    }
    if (every10.length > 0 && !insertedAny10) {
      every10.forEach((sb) => {
        combined.push({
          id: `${sb.id}-tail10`,
          kind: 'site',
          tituloPre: 'Destaque',
          tituloPrincipal: sb.title,
          subtexto: sb.subtitle || 'Clique para conferir',
          imagem: sb.imageUrl,
          href: sb.targetUrl || '/',
        })
      })
    }

    return combined
  }, [goldStores, config.goldOrderMode, config.siteBanners, randomSeed])

  // Garante índice válido se a lista mudar
  const safeIndex = slides.length > 0 ? currentSlide % slides.length : 0
  const active = slides[safeIndex]

  // Temporizador automático de 5 a 15 segundos
  useEffect(() => {
    if (slides.length <= 1) return
    const ms = Math.min(15, Math.max(5, config.intervalSeconds)) * 1000
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, ms)
    return () => clearInterval(timer)
  }, [slides.length, config.intervalSeconds])

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="relative w-full max-w-[940px] aspect-[940/370] overflow-hidden bg-neutral-100 border border-gray-200 shadow-sm mb-6 md:mb-10 group select-none mx-auto">
      <style jsx>{`
        @keyframes bannerSlideDown {
          from { opacity: 0.35; transform: translateY(-28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bannerSlideUp {
          from { opacity: 0.35; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bannerSlideRight {
          from { opacity: 0.35; transform: translateX(-32px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bannerSlideLeft {
          from { opacity: 0.35; transform: translateX(32px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Link
        key={active.id}
        href={active.href}
        style={{ animation: DIRECTION_KEYFRAME[config.direction] }}
        className="block w-full h-full relative"
      >
        {/* Imagem de Fundo de Alta Definição */}
        <img
          src={active.imagem}
          alt={`${active.tituloPre} ${active.tituloPrincipal}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
        />

        {/* Camada clara gradiente para garantir legibilidade dos textos e do selo */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent w-3/5 md:w-3/5 pointer-events-none" />

        {/* Conteúdo Tipográfico Editorial */}
        <div className="absolute inset-y-0 left-3 sm:left-8 md:left-14 flex flex-col justify-center max-w-[60%] sm:max-w-[360px] md:max-w-[460px] z-10">
          <div className="flex flex-col leading-none">
            <span className="text-sm sm:text-2xl md:text-3xl font-serif italic font-normal tracking-wide text-neutral-800">
              {active.tituloPre}
            </span>
            <span className="text-2xl sm:text-5xl md:text-6xl font-serif font-extrabold tracking-tight text-neutral-950 mt-0.5 leading-[0.95] line-clamp-2">
              {active.tituloPrincipal}
            </span>
          </div>

          {active.desconto ? (
            <div className="mt-1.5 sm:mt-3 md:mt-5 inline-flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-[2px] border border-gray-200/80 px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-4 md:py-2 rounded-full shadow-sm w-fit">
              <span className="text-[10px] sm:text-xs md:text-sm italic font-serif text-neutral-600">
                Até
              </span>
              <span className="text-base sm:text-2xl md:text-3xl font-heading font-extrabold text-neutral-950 tracking-tight leading-none tabular-nums">
                {active.desconto}%
              </span>
              <span className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider text-neutral-900 border-l border-gray-300 pl-1.5 sm:pl-2">
                OFF
              </span>
            </div>
          ) : (
            <span className="mt-2 sm:mt-3 inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FB6600] bg-white/90 px-3 py-1 rounded-full w-fit shadow-2xs border border-gray-200/80">
              {active.kind === 'gold' ? 'Acessar Página da Loja' : 'Conferir Destaque'} &rsaquo;
            </span>
          )}

          <p className="hidden sm:block text-xs md:text-[13px] text-neutral-700 font-medium leading-relaxed mt-2 md:mt-3 ml-0.5 sm:ml-1 line-clamp-1">
            {active.subtexto}
          </p>
        </div>
      </Link>

      {/* Seta Esquerda */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Slide anterior"
        className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center text-neutral-400 hover:text-black transition-colors z-20 cursor-pointer"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-[1.4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Seta Direita */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Próximo slide"
        className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center text-neutral-400 hover:text-black transition-colors z-20 cursor-pointer"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-[1.4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicadores / Bolinhas de paginação na parte inferior central */}
      <div className="absolute bottom-1.5 sm:bottom-3 md:bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCurrentSlide(idx)
            }}
            aria-label={`Ir para banner ${idx + 1}`}
            className={`h-1.5 sm:h-2 md:h-2.5 rounded-full border border-black transition-all cursor-pointer ${
              safeIndex === idx ? 'bg-black w-3 sm:w-4 md:w-5' : 'bg-white/70 hover:bg-white w-1.5 sm:w-2 md:w-2.5'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'

export default function HomeBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      id: 1,
      tituloPre: "Especial",
      tituloPrincipal: "Kids",
      desconto: "80",
      subtexto: "e condições exclusivas de frete grátis",
      imagem: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      tituloPre: "Coleção",
      tituloPrincipal: "Primavera",
      desconto: "70",
      subtexto: "ofertas imperdíveis com parcelamento sem juros",
      imagem: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 3,
      tituloPre: "Liquidação",
      tituloPrincipal: "Premium",
      desconto: "60",
      subtexto: "últimas peças de grandes marcas com frete especial",
      imagem: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const active = slides[currentSlide]

  return (
    <div className="relative w-full max-w-[940px] aspect-[940/370] overflow-hidden bg-neutral-100 border border-gray-200 shadow-sm mb-6 md:mb-10 group select-none mx-auto">
      {/* Imagem de Fundo de Alta Definição */}
      <img
        src={active.imagem}
        alt={`${active.tituloPre} ${active.tituloPrincipal}`}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
      />

      {/* Camada clara gradiente para garantir legibilidade dos textos e do selo */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent w-3/5 md:w-3/5 pointer-events-none" />

      {/* Conteúdo Tipográfico Idêntico ao Padrão Privalia - Escala Proporcional 940x370 */}
      <div className="absolute inset-y-0 left-3 sm:left-8 md:left-14 flex flex-col justify-center max-w-[55%] sm:max-w-[320px] md:max-w-[420px] z-10">
        {/* Título: Especial Kids */}
        <div className="flex flex-col leading-none">
          <span className="text-xs sm:text-2xl md:text-3xl font-serif italic text-neutral-800">
            {active.tituloPre}
          </span>
          <span className="text-2xl sm:text-5xl md:text-7xl font-serif font-black tracking-tight text-neutral-950 mt-0.5">
            {active.tituloPrincipal}
          </span>
        </div>

        {/* Badge / Caixa com borda arredondada de Desconto: Até 80% OFF */}
        <div className="mt-1 sm:mt-3 md:mt-5 inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white/95 backdrop-blur-[2px] border border-gray-200/80 px-2 py-0.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full shadow-sm w-fit">
          <span className="text-[8px] sm:text-xs md:text-sm italic font-serif text-neutral-600">
            Até
          </span>
          <span className="text-sm sm:text-2xl md:text-3xl font-black text-neutral-950 tracking-tight leading-none">
            {active.desconto}%
          </span>
          <span className="text-[8px] sm:text-xs font-bold uppercase tracking-wider text-neutral-900 border-l border-gray-300 pl-1 sm:pl-1.5 md:pl-2">
            OFF
          </span>
        </div>

        {/* Subtexto sutil: exibido quando houver espaço suficiente */}
        <p className="hidden sm:block text-[9px] sm:text-[11px] md:text-xs text-neutral-600 font-normal mt-1 sm:mt-2 md:mt-2.5 ml-0.5 sm:ml-1 line-clamp-1">
          {active.subtexto}
        </p>
      </div>

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
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Ir para banner ${idx + 1}`}
            className={`h-1.5 sm:h-2 md:h-2.5 rounded-full border border-black transition-all cursor-pointer ${
              currentSlide === idx ? 'bg-black w-2.5 sm:w-3' : 'bg-transparent w-1.5 sm:w-2 md:w-2.5'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

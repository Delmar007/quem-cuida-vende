'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  BANNER_FONTS_CAIXA_ALTA,
  BANNER_FONTS_CAIXA_BAIXA,
  loadGoogleFontBatch,
} from '@/lib/banner-fonts'

export type TextPosition9 =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type TextCaseMode = 'original' | 'uppercase' | 'lowercase'

interface BannerLineConfig {
  id: 1 | 2 | 3
  label: string
  text: string
  fontFamily: string
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
}

interface BannerProEditorModalProps {
  isOpen: boolean
  initialImageSrc?: string | null
  storeName?: string
  onClose: () => void
  onApply: (file: File, previewUrl: string) => void
}

const POSITION_GRID: { id: TextPosition9; label: string }[] = [
  { id: 'top-left', label: 'Sup. Esq.' },
  { id: 'top-center', label: 'Sup. Centro' },
  { id: 'top-right', label: 'Sup. Dir.' },
  { id: 'middle-left', label: 'Centro Esq.' },
  { id: 'middle-center', label: 'Centralizado' },
  { id: 'middle-right', label: 'Centro Dir.' },
  { id: 'bottom-left', label: 'Inf. Esq.' },
  { id: 'bottom-center', label: 'Inf. Centro' },
  { id: 'bottom-right', label: 'Inf. Dir.' },
]

function makeInitialLines(storeName?: string): BannerLineConfig[] {
  return [
    {
      id: 1,
      label: 'Linha 1 (Principal)',
      text: storeName ? storeName.toUpperCase() : 'SUPER OFERTA DA SEMANA',
      fontFamily: 'Bebas Neue',
      fontSize: 54,
      color: '#FFFFFF',
      bold: true,
      italic: false,
    },
    {
      id: 2,
      label: 'Linha 2 (Destaque)',
      text: 'ATÉ 50% DE DESCONTO EM TODA A LOJA',
      fontFamily: 'Montserrat',
      fontSize: 24,
      color: '#FB6600',
      bold: true,
      italic: false,
    },
    {
      id: 3,
      label: 'Linha 3 (Complemento)',
      text: 'Somente esta semana • Aproveite na loja física',
      fontFamily: 'DM Sans',
      fontSize: 18,
      color: '#F5F5F5',
      bold: false,
      italic: false,
    },
  ]
}

export default function BannerProEditorModal({
  isOpen,
  initialImageSrc,
  storeName,
  onClose,
  onApply,
}: BannerProEditorModalProps) {
  const BANNER_W = 940
  const BANNER_H = 370

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [bgSrc, setBgSrc] = useState<string | null>(initialImageSrc || null)
  const [bgColor, setBgColor] = useState('#171717')
  const [overlayOpacity, setOverlayOpacity] = useState(0.35)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [lines, setLines] = useState<BannerLineConfig[]>(() => makeInitialLines(storeName))
  const [activeLineId, setActiveLineId] = useState<1 | 2 | 3>(1)
  const [textPosition, setTextPosition] = useState<TextPosition9>('middle-center')
  const [textCaseMode, setTextCaseMode] = useState<TextCaseMode>('original')

  // Efeitos de sombra e contorno
  const [shadowEnabled, setShadowEnabled] = useState(true)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowBlur, setShadowBlur] = useState(12)
  const [shadowOffsetX, setShadowOffsetX] = useState(3)
  const [shadowOffsetY, setShadowOffsetY] = useState(4)
  const [strokeEnabled, setStrokeEnabled] = useState(false)
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)

  // Seletor de fontes (100 Caixa Alta + 100 Caixa Baixa)
  const [fontTab, setFontTab] = useState<'caixa_alta' | 'caixa_baixa'>('caixa_alta')
  const [fontSearch, setFontSearch] = useState('')
  const [fontsLoadedTick, setFontsLoadedTick] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgFileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar imagem inicial ao abrir
  useEffect(() => {
    if (!isOpen) return
    setBgSrc(initialImageSrc || null)
  }, [isOpen, initialImageSrc])

  // Carregar imagem no canvas quando bgSrc muda
  useEffect(() => {
    if (!isOpen || !bgSrc) {
      setBgImage(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setBgImage(img)
      const scaleX = BANNER_W / img.naturalWidth
      const scaleY = BANNER_H / img.naturalHeight
      setZoom(Number(Math.max(scaleX, scaleY).toFixed(3)) || 1)
      setPan({ x: 0, y: 0 })
    }
    img.src = bgSrc
  }, [isOpen, bgSrc])

  // Carregar lote de fontes Google Fonts conforme aba/busca para amostra real
  const activeFontList =
    fontTab === 'caixa_alta' ? BANNER_FONTS_CAIXA_ALTA : BANNER_FONTS_CAIXA_BAIXA
  const filteredFonts = activeFontList.filter((f) =>
    f.name.toLowerCase().includes(fontSearch.trim().toLowerCase())
  )

  useEffect(() => {
    if (!isOpen) return
    const selectedFamilies = lines.map((l) => l.fontFamily)
    const visiblePreviewFamilies = filteredFonts.slice(0, 40).map((f) => f.name)
    loadGoogleFontBatch([...selectedFamilies, ...visiblePreviewFamilies])
    const t = setTimeout(() => setFontsLoadedTick((v) => v + 1), 350)
    return () => clearTimeout(t)
  }, [isOpen, fontTab, fontSearch, lines])

  const transformTextCase = useCallback(
    (txt: string) => {
      if (textCaseMode === 'uppercase') return txt.toUpperCase()
      if (textCaseMode === 'lowercase') return txt.toLowerCase()
      return txt
    },
    [textCaseMode]
  )

  // Renderizar banner 940 x 370 no canvas
  const renderBanner = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, BANNER_W, BANNER_H)

    // 1. Fundo sólido
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, BANNER_W, BANNER_H)

    // 2. Imagem de fundo com pan/zoom
    if (bgImage) {
      const drawW = bgImage.naturalWidth * zoom
      const drawH = bgImage.naturalHeight * zoom
      const drawX = BANNER_W / 2 + pan.x - drawW / 2
      const drawY = BANNER_H / 2 + pan.y - drawH / 2
      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH)
    }

    // 3. Overlay escuro para contraste do texto
    if (overlayOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`
      ctx.fillRect(0, 0, BANNER_W, BANNER_H)
    }

    // 4. Desenhar as 3 linhas de texto no posicionamento escolhido (grade 3x3)
    const nonEmptyLines = lines.filter((l) => l.text.trim().length > 0)
    if (nonEmptyLines.length === 0) return

    const padX = 44
    const padY = 34
    const lineGap = 10

    const [vPos, hPos] = textPosition.split('-') as ['top' | 'middle' | 'bottom', 'left' | 'center' | 'right']
    const anchorX = hPos === 'left' ? padX : hPos === 'right' ? BANNER_W - padX : BANNER_W / 2
    ctx.textAlign = hPos
    ctx.textBaseline = 'top'

    const lineHeights = nonEmptyLines.map((l) => l.fontSize * 1.15)
    const totalBlockHeight =
      lineHeights.reduce((acc, h) => acc + h, 0) + lineGap * Math.max(0, nonEmptyLines.length - 1)

    let currentY =
      vPos === 'top'
        ? padY
        : vPos === 'bottom'
        ? BANNER_H - padY - totalBlockHeight
        : (BANNER_H - totalBlockHeight) / 2

    nonEmptyLines.forEach((line, idx) => {
      const displayTxt = transformTextCase(line.text)
      const weight = line.bold ? '700' : '400'
      const style = line.italic ? 'italic' : 'normal'
      ctx.font = `${style} ${weight} ${line.fontSize}px "${line.fontFamily}", sans-serif`

      ctx.save()
      if (shadowEnabled) {
        ctx.shadowColor = shadowColor
        ctx.shadowBlur = shadowBlur
        ctx.shadowOffsetX = shadowOffsetX
        ctx.shadowOffsetY = shadowOffsetY
      } else {
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }

      if (strokeEnabled && strokeWidth > 0) {
        ctx.lineWidth = strokeWidth * 2
        ctx.strokeStyle = strokeColor
        ctx.lineJoin = 'round'
        ctx.strokeText(displayTxt, anchorX, currentY)
      }

      ctx.fillStyle = line.color
      ctx.fillText(displayTxt, anchorX, currentY)
      ctx.restore()

      currentY += lineHeights[idx] + lineGap
    })
  }, [
    bgColor,
    bgImage,
    zoom,
    pan,
    overlayOpacity,
    lines,
    textPosition,
    transformTextCase,
    shadowEnabled,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
    strokeEnabled,
    strokeColor,
    strokeWidth,
    fontsLoadedTick,
  ])

  useEffect(() => {
    if (isOpen) renderBanner()
  }, [isOpen, renderBanner])

  // Botão "Voltar ao início da edição"
  const handleResetAll = () => {
    setBgSrc(initialImageSrc || null)
    setBgColor('#171717')
    setOverlayOpacity(0.35)
    setPan({ x: 0, y: 0 })
    setLines(makeInitialLines(storeName))
    setActiveLineId(1)
    setTextPosition('middle-center')
    setTextCaseMode('original')
    setShadowEnabled(true)
    setShadowColor('#000000')
    setShadowBlur(12)
    setShadowOffsetX(3)
    setShadowOffsetY(4)
    setStrokeEnabled(false)
    setStrokeColor('#000000')
    setStrokeWidth(2)
  }

  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setBgSrc(url)
  }

  const handleExportAndApply = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderBanner()
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const finalFile = new File([blob], `banner-triplo-pro-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        const previewUrl = URL.createObjectURL(blob)
        onApply(finalFile, previewUrl)
        onClose()
      },
      'image/jpeg',
      0.94
    )
  }

  const activeLine = lines.find((l) => l.id === activeLineId) || lines[0]

  const updateActiveLine = (patch: Partial<BannerLineConfig>) => {
    setLines((prev) => prev.map((l) => (l.id === activeLineId ? { ...l, ...patch } : l)))
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editor Profissional de Banner Triplo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-5xl rounded-[6px] shadow-2xl border border-neutral-300 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Cabeçalho do Editor */}
        <div className="px-4 py-3 bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-neutral-800">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] block">
              Tópico 03 • Banner Triplo (940 × 370 px)
            </span>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">
              Editor Profissional de Banners
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-[4px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
              title="Restaurar todas as configurações para o início da edição"
            >
              Voltar ao início da edição
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-[4px] bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer"
              aria-label="Fechar editor"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Corpo com Canvas ao Vivo + Controles */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-neutral-100 space-y-4">
          {/* Canvas 940 x 370 interativo (arraste para mover imagem de fundo) */}
          <div className="bg-neutral-950 p-2 sm:p-3 rounded-[6px] border border-neutral-300 shadow-inner">
            <canvas
              ref={canvasRef}
              width={BANNER_W}
              height={BANNER_H}
              onMouseDown={(e) => {
                if (!bgImage) return
                setIsDragging(true)
                setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
              }}
              onMouseMove={(e) => {
                if (!isDragging) return
                setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              className={`w-full h-auto aspect-[940/370] rounded-[4px] block ${
                bgImage ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
            />
          </div>

          {/* Grid de Controles Profissionais */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* COLUNA ESQUERDA (7 cols): Textos (3 Linhas) + 200 Fontes com Amostra Real */}
            <div className="lg:col-span-7 space-y-4">
              {/* Seleção das 3 Linhas + Caixa Alta/Baixa Global */}
              <div className="bg-white border border-neutral-200 rounded-[6px] p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    {lines.map((line) => (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => setActiveLineId(line.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-[4px] border transition-colors cursor-pointer ${
                          activeLineId === line.id
                            ? 'bg-[#FB6600] text-white border-[#FB6600]'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        Linha {line.id}
                      </button>
                    ))}
                  </div>

                  {/* Caixa Alta / Caixa Baixa em todos os textos */}
                  <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-[4px] border border-neutral-200">
                    {(
                      [
                        { id: 'original', label: 'Normal' },
                        { id: 'uppercase', label: 'CAIXA ALTA' },
                        { id: 'lowercase', label: 'caixa baixa' },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setTextCaseMode(mode.id)}
                        className={`px-2 py-1 text-[10.5px] font-bold rounded-[3px] cursor-pointer transition-colors ${
                          textCaseMode === mode.id
                            ? 'bg-neutral-900 text-white'
                            : 'text-neutral-600 hover:text-black'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor da Linha Ativa */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      {activeLine.label}
                    </label>
                    <input
                      type="text"
                      value={activeLine.text}
                      onChange={(e) => updateActiveLine({ text: e.target.value })}
                      placeholder={`Digite o texto da Linha ${activeLine.id} (deixe vazio para ocultar)`}
                      className="w-full border border-neutral-300 rounded-[4px] px-3 py-2 text-sm text-neutral-900 focus:border-[#FB6600] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-[10.5px] font-bold uppercase text-neutral-500 mb-1">
                        Tamanho ({activeLine.fontSize}px)
                      </label>
                      <input
                        type="range"
                        min={12}
                        max={86}
                        value={activeLine.fontSize}
                        onChange={(e) => updateActiveLine({ fontSize: Number(e.target.value) })}
                        className="w-full accent-[#FB6600] cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-bold uppercase text-neutral-500 mb-1">
                        Cor do Texto
                      </label>
                      <input
                        type="color"
                        value={activeLine.color}
                        onChange={(e) => updateActiveLine({ color: e.target.value })}
                        className="w-full h-8 border border-neutral-300 rounded-[4px] cursor-pointer p-0.5 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateActiveLine({ bold: !activeLine.bold })}
                        className={`flex-1 h-8 rounded-[4px] border text-xs font-black cursor-pointer ${
                          activeLine.bold
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-300'
                        }`}
                        title="Negrito"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveLine({ italic: !activeLine.italic })}
                        className={`flex-1 h-8 rounded-[4px] border text-xs italic font-serif cursor-pointer ${
                          activeLine.italic
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-300'
                        }`}
                        title="Itálico"
                      >
                        I
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Catálogo de 200 Fontes (100 Caixa Alta + 100 Caixa Baixa) com Amostra Real */}
              <div className="bg-white border border-neutral-200 rounded-[6px] p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFontTab('caixa_alta')}
                      className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-[4px] border cursor-pointer ${
                        fontTab === 'caixa_alta'
                          ? 'bg-[#FB6600] text-white border-[#FB6600]'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      Caixa Alta ({BANNER_FONTS_CAIXA_ALTA.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontTab('caixa_baixa')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-[4px] border cursor-pointer ${
                        fontTab === 'caixa_baixa'
                          ? 'bg-[#FB6600] text-white border-[#FB6600]'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      caixa baixa ({BANNER_FONTS_CAIXA_BAIXA.length})
                    </button>
                  </div>

                  <input
                    type="search"
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder="Buscar fonte..."
                    className="w-full sm:w-48 border border-neutral-300 rounded-[4px] px-2.5 py-1 text-xs focus:border-[#FB6600] focus:outline-none"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
                  {filteredFonts.map((f) => {
                    const isSelected = activeLine.fontFamily === f.name
                    return (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => updateActiveLine({ fontFamily: f.name })}
                        className={`px-3 py-2 text-left rounded-[4px] border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-orange-50 border-[#FB6600] text-[#FB6600]'
                            : 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-900'
                        }`}
                      >
                        <span
                          style={{ fontFamily: `"${f.name}", sans-serif` }}
                          className={`text-sm truncate ${
                            fontTab === 'caixa_alta' ? 'uppercase' : 'lowercase'
                          }`}
                        >
                          {f.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold uppercase shrink-0">Ativa</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA (5 cols): Posição 3×3 + Sombra/Efeitos + Fundo/Imagem */}
            <div className="lg:col-span-5 space-y-4">
              {/* Grade 3×3 de Posicionamento do Texto */}
              <div className="bg-white border border-neutral-200 rounded-[6px] p-3.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-2">
                  Local do Texto no Banner (9 Posições)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {POSITION_GRID.map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setTextPosition(pos.id)}
                      className={`py-2 px-1.5 text-[10.5px] font-bold rounded-[4px] border transition-colors cursor-pointer text-center ${
                        textPosition === pos.id
                          ? 'bg-[#FB6600] text-white border-[#FB6600]'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Efeitos: Sombra, Cor da Sombra e Contorno */}
              <div className="bg-white border border-neutral-200 rounded-[6px] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Efeitos de Sombra & Contorno
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shadowEnabled}
                      onChange={(e) => setShadowEnabled(e.target.checked)}
                      className="accent-[#FB6600]"
                    />
                    Sombra
                  </label>
                </div>

                {shadowEnabled && (
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                        Cor da Sombra
                      </label>
                      <input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-full h-8 border border-neutral-300 rounded-[4px] cursor-pointer p-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                        Desfoque ({shadowBlur}px)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={shadowBlur}
                        onChange={(e) => setShadowBlur(Number(e.target.value))}
                        className="w-full accent-[#FB6600]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                        Eixo X ({shadowOffsetX}px)
                      </label>
                      <input
                        type="range"
                        min={-15}
                        max={15}
                        value={shadowOffsetX}
                        onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                        className="w-full accent-[#FB6600]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                        Eixo Y ({shadowOffsetY}px)
                      </label>
                      <input
                        type="range"
                        min={-15}
                        max={15}
                        value={shadowOffsetY}
                        onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                        className="w-full accent-[#FB6600]"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strokeEnabled}
                      onChange={(e) => setStrokeEnabled(e.target.checked)}
                      className="accent-[#FB6600]"
                    />
                    Contorno
                  </label>
                  {strokeEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="w-8 h-7 border border-neutral-300 rounded cursor-pointer p-0.5"
                      />
                      <input
                        type="range"
                        min={1}
                        max={8}
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="w-24 accent-[#FB6600]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Imagem / Cor de Fundo */}
              <div className="bg-white border border-neutral-200 rounded-[6px] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Imagem & Fundo
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={bgFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleUploadBg}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-black text-white text-[10.5px] font-bold uppercase rounded-[4px] cursor-pointer"
                    >
                      {bgImage ? 'Trocar Foto' : 'Enviar Foto'}
                    </button>
                    {bgImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setBgSrc(null)
                          setBgImage(null)
                        }}
                        className="px-2 py-1 border border-neutral-300 text-neutral-700 text-[10.5px] font-bold rounded-[4px] cursor-pointer"
                      >
                        Remover Foto
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 items-center">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                      Cor de Fundo
                    </label>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-8 border border-neutral-300 rounded-[4px] cursor-pointer p-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                      Escurecer ({Math.round(overlayOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={0.85}
                      step={0.05}
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                      className="w-full accent-[#FB6600]"
                    />
                  </div>
                </div>

                {bgImage && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                      Zoom da Foto ({Math.round(zoom * 100)}%) — arraste a imagem acima
                    </label>
                    <input
                      type="range"
                      min={0.2}
                      max={3}
                      step={0.02}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-[#FB6600]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-4 py-3 bg-white border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-3.5 py-2 border border-neutral-300 hover:border-black text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-[4px] cursor-pointer"
          >
            Voltar ao início da edição
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-[4px] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExportAndApply}
              className="px-5 py-2 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-wider rounded-[4px] cursor-pointer shadow-xs"
            >
              Aplicar Banner no Tópico 03
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

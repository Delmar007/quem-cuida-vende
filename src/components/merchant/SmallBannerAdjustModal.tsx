'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface SmallBannerAdjustModalProps {
  isOpen: boolean
  imageSrc: string | null
  onClose: () => void
  onApply: (adjustedFile: File, previewUrl: string) => void
}

export default function SmallBannerAdjustModal({
  isOpen,
  imageSrc,
  onClose,
  onApply,
}: SmallBannerAdjustModalProps) {
  // Proporção oficial do Banner Pequeno (Card de Loja): 16:10 (400 × 250 px)
  const CROP_WIDTH = 480
  const CROP_HEIGHT = 300 // 480 / 1.6 = 300 px
  const CANVAS_WIDTH = 540
  const CANVAS_HEIGHT = 360
  const CENTER_X = CANVAS_WIDTH / 2
  const CENTER_Y = CANVAS_HEIGHT / 2

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [backgroundColor, setBackgroundColor] = useState<string>('#171717')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Carregar imagem ao abrir o modal
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setImage(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      // Ajuste inicial: preencher a área do banner pequeno
      const scaleX = CROP_WIDTH / img.naturalWidth
      const scaleY = CROP_HEIGHT / img.naturalHeight
      const coverScale = Math.max(scaleX, scaleY)
      setZoom(Number(coverScale.toFixed(3)) || 1.0)
      setPan({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [isOpen, imageSrc])

  // Renderizar no canvas interativo
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Limpar tela
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Fundo geral do canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Retângulo recortado (Área do banner pequeno 16:10)
    const cropX = CENTER_X - CROP_WIDTH / 2
    const cropY = CENTER_Y - CROP_HEIGHT / 2

    // 1. Fundo do card na cor escolhida
    ctx.save()
    ctx.fillStyle = backgroundColor
    ctx.fillRect(cropX, cropY, CROP_WIDTH, CROP_HEIGHT)

    // Clip no retângulo do banner
    ctx.beginPath()
    ctx.rect(cropX, cropY, CROP_WIDTH, CROP_HEIGHT)
    ctx.clip()

    // 2. Desenhar imagem com pan e zoom
    const drawWidth = image.naturalWidth * zoom
    const drawHeight = image.naturalHeight * zoom
    const drawX = CENTER_X + pan.x - drawWidth / 2
    const drawY = CENTER_Y + pan.y - drawHeight / 2

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()

    // 3. Máscara escura fora da área do banner
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.rect(cropX, cropY, CROP_WIDTH, CROP_HEIGHT)
    ctx.fill('evenodd')

    // 4. Borda de corte do Banner Pequeno
    ctx.strokeStyle = '#FB6600'
    ctx.lineWidth = 2.5
    ctx.strokeRect(cropX, cropY, CROP_WIDTH, CROP_HEIGHT)

    // 5. Linhas de terços para guia de composição
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 4])
    ctx.beginPath()
    ctx.moveTo(cropX + CROP_WIDTH / 3, cropY)
    ctx.lineTo(cropX + CROP_WIDTH / 3, cropY + CROP_HEIGHT)
    ctx.moveTo(cropX + (2 * CROP_WIDTH) / 3, cropY)
    ctx.lineTo(cropX + (2 * CROP_WIDTH) / 3, cropY + CROP_HEIGHT)
    ctx.moveTo(cropX, cropY + CROP_HEIGHT / 3)
    ctx.lineTo(cropX + CROP_WIDTH, cropY + CROP_HEIGHT / 3)
    ctx.moveTo(cropX, cropY + (2 * CROP_HEIGHT) / 3)
    ctx.lineTo(cropX + CROP_WIDTH, cropY + (2 * CROP_HEIGHT) / 3)
    ctx.stroke()

    ctx.restore()
  }, [image, zoom, pan, backgroundColor])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  // Mouse e Touch Dragging com suporte a escala responsiva
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    const scale = rect ? CANVAS_WIDTH / rect.width : 1
    setDragStart({ x: e.clientX * scale - pan.x, y: e.clientY * scale - pan.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const scale = rect ? CANVAS_WIDTH / rect.width : 1
    setPan({
      x: e.clientX * scale - dragStart.x,
      y: e.clientY * scale - dragStart.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  // Zoom pelo scroll da rodinha do mouse
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.04 : -0.04
    setZoom((prev) => Math.min(3.0, Math.max(0.1, Number((prev + delta).toFixed(3)))))
  }

  // Movimentação por botões de setas (Passo de 20px)
  const moveDirection = (dx: number, dy: number) => {
    setPan((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }))
  }

  // Predefinição: "Preencher Banner" (Cover)
  const handleCoverBanner = () => {
    if (!image) return
    const scaleX = CROP_WIDTH / image.naturalWidth
    const scaleY = CROP_HEIGHT / image.naturalHeight
    const coverScale = Math.max(scaleX, scaleY)
    setZoom(Number(coverScale.toFixed(3)))
    setPan({ x: 0, y: 0 })
  }

  // Predefinição: "Caber no Banner" (Contain)
  const handleFitInside = () => {
    if (!image) return
    const scaleX = (CROP_WIDTH * 0.9) / image.naturalWidth
    const scaleY = (CROP_HEIGHT * 0.9) / image.naturalHeight
    const containScale = Math.min(scaleX, scaleY)
    setZoom(Number(containScale.toFixed(3)))
    setPan({ x: 0, y: 0 })
  }

  // Centralizar
  const handleCenter = () => {
    setPan({ x: 0, y: 0 })
  }

  // Aplicar e Gerar Arquivo Final em Resolução 400 × 250 px (ou 800 × 500 px para retina)
  const handleApply = () => {
    if (!image) return

    const exportCanvas = document.createElement('canvas')
    const finalWidth = 400
    const finalHeight = 250
    exportCanvas.width = finalWidth
    exportCanvas.height = finalHeight
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    const scaleFactor = finalWidth / CROP_WIDTH // 400 / 480 = 0.8333

    // Fundo
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, finalWidth, finalHeight)

    // Desenhar imagem com o mesmo enquadramento
    const centerX = finalWidth / 2
    const centerY = finalHeight / 2
    const drawWidth = image.naturalWidth * zoom * scaleFactor
    const drawHeight = image.naturalHeight * zoom * scaleFactor
    const drawX = centerX + pan.x * scaleFactor - drawWidth / 2
    const drawY = centerY + pan.y * scaleFactor - drawHeight / 2

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)

    // Exportar como JPEG de alta qualidade
    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const finalFile = new File([blob], `banner-pequeno-ajustado-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })
      const previewUrl = URL.createObjectURL(blob)
      onApply(finalFile, previewUrl)
      onClose()
    }, 'image/jpeg', 0.92)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[2px] shadow-2xl border border-neutral-300 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        
        {/* Topo do Modal */}
        <div className="p-3.5 sm:p-4 bg-neutral-900 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] block">
              Dispositivo Banner Pequeno (16:10 / 400 × 250 px)
            </span>
            <h3 className="text-sm font-black uppercase tracking-tight">
              Movimentar Imagem, Zoom e Enquadramento
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer"
            title="Fechar sem salvar"
          >
            &times;
          </button>
        </div>

        {/* Corpo do Editor com Scroll se necessário no mobile */}
        <div className="p-3 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Arraste com o dedo ou mouse para mover para <strong>cima, baixo, esquerda ou direita</strong> e use os controles de zoom para enquadrar perfeitamente a miniatura do card da sua loja.
          </p>

          {/* Viewport Interativo com Canvas Responsivo */}
          <div className="flex justify-center bg-neutral-950 p-2 sm:p-4 rounded-[2px] border border-neutral-800 overflow-hidden">
            <div className="relative select-none shadow-lg max-w-full">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                className="cursor-move touch-none block max-w-full h-auto mx-auto"
                title="Clique e arraste para mover a imagem. Use a barra para dar zoom."
              />
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded pointer-events-none">
                Área Visível do Card (400 × 250 px • 16:10)
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-neutral-300 text-[9px] px-2 py-0.5 rounded pointer-events-none">
                ✋ Arraste para reposicionar
              </div>
            </div>
          </div>

          {/* Controles de Movimentação (Setas Direcionais) & Zoom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-3 sm:p-4 border border-neutral-200 rounded-[2px]">
            
            {/* 1. Direcionais (Cima, Baixo, Esquerda, Direita) */}
            <div>
              <span className="text-[10.5px] uppercase font-bold tracking-wider text-neutral-700 block mb-2">
                Movimentar Imagem:
              </span>
              <div className="flex flex-col items-center gap-1.5 w-fit mx-auto sm:mx-0">
                {/* Botão Cima */}
                <button
                  type="button"
                  onClick={() => moveDirection(0, -25)}
                  className="w-10 h-9 bg-white border border-neutral-300 hover:border-black rounded-[2px] font-bold text-neutral-800 flex items-center justify-center cursor-pointer shadow-2xs hover:bg-neutral-100 transition-colors active:scale-95 text-xs"
                  title="Mover para Cima"
                >
                  ▲
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Botão Esquerda */}
                  <button
                    type="button"
                    onClick={() => moveDirection(-25, 0)}
                    className="w-10 h-9 bg-white border border-neutral-300 hover:border-black rounded-[2px] font-bold text-neutral-800 flex items-center justify-center cursor-pointer shadow-2xs hover:bg-neutral-100 transition-colors active:scale-95 text-xs"
                    title="Mover para Esquerda"
                  >
                    ◀
                  </button>

                  {/* Centralizar */}
                  <button
                    type="button"
                    onClick={handleCenter}
                    className="px-2.5 h-9 bg-neutral-200 hover:bg-neutral-300 border border-neutral-300 rounded-[2px] text-[10px] font-bold uppercase text-neutral-800 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                    title="Centralizar Imagem"
                  >
                    Centro
                  </button>

                  {/* Botão Direita */}
                  <button
                    type="button"
                    onClick={() => moveDirection(25, 0)}
                    className="w-10 h-9 bg-white border border-neutral-300 hover:border-black rounded-[2px] font-bold text-neutral-800 flex items-center justify-center cursor-pointer shadow-2xs hover:bg-neutral-100 transition-colors active:scale-95 text-xs"
                    title="Mover para Direita"
                  >
                    ▶
                  </button>
                </div>

                {/* Botão Baixo */}
                <button
                  type="button"
                  onClick={() => moveDirection(0, 25)}
                  className="w-10 h-9 bg-white border border-neutral-300 hover:border-black rounded-[2px] font-bold text-neutral-800 flex items-center justify-center cursor-pointer shadow-2xs hover:bg-neutral-100 transition-colors active:scale-95 text-xs"
                  title="Mover para Baixo"
                >
                  ▼
                </button>
              </div>
            </div>

            {/* 2. Controle de Zoom e Ajustes Rápidos */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10.5px] uppercase font-bold tracking-wider text-neutral-700">
                    Zoom: {Math.round(zoom * 100)}%
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.1, Number((z - 0.05).toFixed(3))))}
                      className="w-7 h-7 border border-neutral-300 rounded bg-white hover:bg-neutral-100 text-xs font-bold flex items-center justify-center cursor-pointer"
                      title="Diminuir Zoom"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.05).toFixed(3))))}
                      className="w-7 h-7 border border-neutral-300 rounded bg-white hover:bg-neutral-100 text-xs font-bold flex items-center justify-center cursor-pointer"
                      title="Aumentar Zoom"
                    >
                      +
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-[#FB6600] cursor-pointer"
                />

                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={handleCoverBanner}
                    className="py-1 px-2.5 bg-white border border-neutral-300 hover:border-black rounded-[2px] text-[10px] font-bold uppercase tracking-wider text-neutral-800 transition-colors cursor-pointer text-center"
                  >
                    🖼️ Preencher Card
                  </button>
                  <button
                    type="button"
                    onClick={handleFitInside}
                    className="py-1 px-2.5 bg-white border border-neutral-300 hover:border-black rounded-[2px] text-[10px] font-bold uppercase tracking-wider text-neutral-800 transition-colors cursor-pointer text-center"
                  >
                    🎯 Caber Imagem Inteira
                  </button>
                </div>
              </div>

              {/* Fundo de Preenchimento para bordas */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-200 mt-2">
                <span className="text-[10px] font-bold uppercase text-neutral-600">
                  Fundo da Moldura:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBackgroundColor('#171717')}
                    className={`w-6 h-6 rounded border-2 cursor-pointer ${
                      backgroundColor === '#171717' ? 'border-[#FB6600] ring-1 ring-[#FB6600]' : 'border-neutral-300'
                    } bg-neutral-900`}
                    title="Preto Fosco"
                  />
                  <button
                    type="button"
                    onClick={() => setBackgroundColor('#000000')}
                    className={`w-6 h-6 rounded border-2 cursor-pointer ${
                      backgroundColor === '#000000' ? 'border-[#FB6600] ring-1 ring-[#FB6600]' : 'border-neutral-300'
                    } bg-black`}
                    title="Preto Absoluto"
                  />
                  <button
                    type="button"
                    onClick={() => setBackgroundColor('#ffffff')}
                    className={`w-6 h-6 rounded border-2 cursor-pointer ${
                      backgroundColor === '#ffffff' ? 'border-[#FB6600] ring-1 ring-[#FB6600]' : 'border-neutral-300'
                    } bg-white`}
                    title="Branco"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-4 sm:px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-neutral-500 text-center sm:text-left">
            Exportação em alta definição: <strong>400 × 250 pixels (16:10)</strong>
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase rounded-[2px] hover:bg-neutral-100 cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-initial px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer shadow-sm text-center"
            >
              ✓ Aplicar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

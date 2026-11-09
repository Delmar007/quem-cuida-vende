'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface LogoAdjustModalProps {
  isOpen: boolean
  imageSrc: string | null
  onClose: () => void
  onApply: (adjustedFile: File, previewUrl: string) => void
}

export default function LogoAdjustModal({
  isOpen,
  imageSrc,
  onClose,
  onApply,
}: LogoAdjustModalProps) {
  // Configurações do editor
  const CONTAINER_SIZE = 320 // Tamanho do viewport em pixels
  const CIRCLE_RADIUS = 130 // Raio do círculo (diâmetro de 260px)
  const CENTER = CONTAINER_SIZE / 2

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Carregar imagem
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setImage(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      // Ajuste inicial para caber com folga no círculo
      const maxDim = Math.max(img.naturalWidth, img.naturalHeight)
      const initialZoom = (CIRCLE_RADIUS * 2 * 0.9) / maxDim
      setZoom(Number(initialZoom.toFixed(2)) || 1.0)
      setPan({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [isOpen, imageSrc])

  // Desenhar no canvas interativo
  const renderInteractiveCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Limpar
    ctx.clearRect(0, 0, CONTAINER_SIZE, CONTAINER_SIZE)

    // Fundo do círculo
    ctx.save()
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, CIRCLE_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = backgroundColor
    ctx.fill()
    ctx.clip()

    // Desenhar imagem com pan e zoom
    const drawWidth = image.naturalWidth * zoom
    const drawHeight = image.naturalHeight * zoom
    const drawX = CENTER + pan.x - drawWidth / 2
    const drawY = CENTER + pan.y - drawHeight / 2

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()

    // Máscara escura fora do círculo para guiar o enquadramento
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.beginPath()
    ctx.rect(0, 0, CONTAINER_SIZE, CONTAINER_SIZE)
    ctx.arc(CENTER, CENTER, CIRCLE_RADIUS, 0, Math.PI * 2, true)
    ctx.fill()

    // Borda do círculo guia
    ctx.beginPath()
    ctx.arc(CENTER, CENTER, CIRCLE_RADIUS, 0, Math.PI * 2)
    ctx.strokeStyle = '#FB6600'
    ctx.lineWidth = 2.5
    ctx.setLineDash([6, 4])
    ctx.stroke()
    ctx.restore()
  }, [image, zoom, pan, backgroundColor])

  useEffect(() => {
    renderInteractiveCanvas()
  }, [renderInteractiveCanvas])

  // Mouse e Touch Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  // Zoom pelo scroll do mouse
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.05 : -0.05
    setZoom((prev) => Math.min(3.0, Math.max(0.1, Number((prev + delta).toFixed(2)))))
  }

  // Predefinição: "Caber no Círculo" (Contain)
  const handleFitInside = () => {
    if (!image) return
    const maxDim = Math.max(image.naturalWidth, image.naturalHeight)
    const fitZoom = (CIRCLE_RADIUS * 2 * 0.85) / maxDim
    setZoom(Number(fitZoom.toFixed(2)))
    setPan({ x: 0, y: 0 })
  }

  // Predefinição: "Preencher Círculo" (Cover)
  const handleCoverCircle = () => {
    if (!image) return
    const minDim = Math.min(image.naturalWidth, image.naturalHeight)
    const coverZoom = (CIRCLE_RADIUS * 2) / minDim
    setZoom(Number(coverZoom.toFixed(2)))
    setPan({ x: 0, y: 0 })
  }

  // Centralizar Posição
  const handleCenter = () => {
    setPan({ x: 0, y: 0 })
  }

  // Aplicar e Gerar Arquivo Final Ajustado (sem bordas ou anéis externos)
  const handleApply = () => {
    if (!image) return

    // Gerar em alta resolução (512x512)
    const exportCanvas = document.createElement('canvas')
    const exportSize = 512
    exportCanvas.width = exportSize
    exportCanvas.height = exportSize
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    // Escala calculada sobre o diâmetro do círculo para preencher 100% da imagem sem bordas
    const circleDiameter = CIRCLE_RADIUS * 2
    const scaleFactor = exportSize / circleDiameter

    // Clip circular para que a imagem fique perfeitamente redonda
    ctx.save()
    ctx.beginPath()
    ctx.arc(exportSize / 2, exportSize / 2, exportSize / 2, 0, Math.PI * 2)
    ctx.clip()

    // Fundo do círculo
    if (backgroundColor && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, exportSize, exportSize)
    }

    // Desenhar imagem com o mesmo enquadramento, sem anel ou borda externa
    const exportCenter = exportSize / 2
    const drawWidth = image.naturalWidth * zoom * scaleFactor
    const drawHeight = image.naturalHeight * zoom * scaleFactor
    const drawX = exportCenter + pan.x * scaleFactor - drawWidth / 2
    const drawY = exportCenter + pan.y * scaleFactor - drawHeight / 2

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()

    // Converter para Blob/File PNG
    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const finalFile = new File([blob], `logo-ajustado-${Date.now()}.png`, {
        type: 'image/png',
      })
      const previewUrl = URL.createObjectURL(blob)
      onApply(finalFile, previewUrl)
      onClose()
    }, 'image/png')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2px] shadow-2xl border border-neutral-300 overflow-hidden my-4">
        
        {/* Cabeçalho */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] block">
              Ferramenta de Enquadramento
            </span>
            <h3 className="text-sm font-black uppercase tracking-tight">
              Ajustar e Dar Zoom no Logotipo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white font-bold text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Corpo do Editor */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Arraste a imagem para posicionar e use a barra de zoom para fazê-la caber perfeitamente dentro da linha tracejada circular.
          </p>

          {/* Viewport Interativo */}
          <div className="flex justify-center bg-neutral-100 p-3 rounded-[2px] border border-neutral-200">
            <div className="relative shadow-md rounded-[2px] overflow-hidden bg-neutral-900 select-none">
              <canvas
                ref={canvasRef}
                width={CONTAINER_SIZE}
                height={CONTAINER_SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                className="cursor-move touch-none block"
                title="Clique e arraste para posicionar. Use o scroll para dar zoom."
              />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded pointer-events-none">
                ✋ Arraste para mover
              </span>
            </div>
          </div>

          {/* Controle Deslizante de Zoom */}
          <div className="space-y-1.5 bg-neutral-50 p-3 border border-neutral-200 rounded-[2px]">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
              <span className="flex items-center gap-1.5 uppercase text-[10.5px]">
                <span>🔍 Zoom na Imagem:</span>
                <span className="text-[#FB6600] font-mono">{Math.round(zoom * 100)}%</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.1, Number((z - 0.1).toFixed(2))))}
                  className="w-6 h-6 border border-neutral-300 rounded bg-white hover:bg-neutral-100 text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Diminuir Zoom"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                  className="w-6 h-6 border border-neutral-300 rounded bg-white hover:bg-neutral-100 text-xs font-bold flex items-center justify-center cursor-pointer"
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
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-[#FB6600] cursor-pointer"
            />
          </div>

          {/* Botões de Ação Rápida */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleFitInside}
              className="py-1.5 px-2 bg-white border border-neutral-300 hover:border-black rounded-[2px] text-[10.5px] font-bold uppercase tracking-wider text-neutral-800 transition-colors cursor-pointer text-center"
            >
              🎯 Caber no Círculo
            </button>
            <button
              type="button"
              onClick={handleCoverCircle}
              className="py-1.5 px-2 bg-white border border-neutral-300 hover:border-black rounded-[2px] text-[10.5px] font-bold uppercase tracking-wider text-neutral-800 transition-colors cursor-pointer text-center"
            >
              ⭕ Preencher
            </button>
            <button
              type="button"
              onClick={handleCenter}
              className="py-1.5 px-2 bg-white border border-neutral-300 hover:border-black rounded-[2px] text-[10.5px] font-bold uppercase tracking-wider text-neutral-800 transition-colors cursor-pointer text-center"
            >
              📍 Centralizar
            </button>
          </div>

          {/* Cor de Fundo de Preenchimento */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
            <span className="text-[10.5px] font-bold uppercase text-neutral-600">
              Cor de Fundo do Círculo:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBackgroundColor('#ffffff')}
                className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                  backgroundColor === '#ffffff' ? 'border-[#FB6600] ring-1 ring-[#FB6600]' : 'border-neutral-300'
                } bg-white`}
                title="Branco"
              />
              <button
                type="button"
                onClick={() => setBackgroundColor('#000000')}
                className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                  backgroundColor === '#000000' ? 'border-[#FB6600] ring-1 ring-[#FB6600]' : 'border-neutral-300'
                } bg-black`}
                title="Preto"
              />
              <button
                type="button"
                onClick={() => setBackgroundColor('#f5f5f5')}
                className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                  backgroundColor === '#f5f5f5' ? 'border-[#FB6600] ring-1 ring-[#FB6600]' : 'border-neutral-300'
                } bg-neutral-100`}
                title="Cinza Claro"
              />
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase rounded-[2px] hover:bg-neutral-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer shadow-sm"
          >
            ✓ Aplicar Ajuste
          </button>
        </div>

      </div>
    </div>
  )
}

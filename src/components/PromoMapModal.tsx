'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  PROMO_COLOR_DEFINITIONS,
  getPromoColor,
  getDistinctPromoFilters,
  PromoColorDef,
} from '@/lib/promoColors'
import { formatCurrencyBRL } from '@/components/store/StoreProductsCatalog'
import { getLocalProducts } from '@/lib/products-storage'
import { getLocalStores } from '@/lib/stores-storage'

// Coordenadas centrais aproximadas de bairros de Campo Grande / MS
const CAMPO_GRANDE_COORDS: Record<string, [number, number]> = {
  centro: [-20.463, -54.615],
  'chácara cachoeira': [-20.455, -54.582],
  'chacara cachoeira': [-20.455, -54.582],
  'jardim dos estados': [-20.457, -54.605],
  'altos da afonso pena': [-20.448, -54.575],
  'afonso pena': [-20.448, -54.575],
  tiradentes: [-20.468, -54.568],
  guanandi: [-20.505, -54.635],
  'coronel antonino': [-20.435, -54.602],
  'vila progresso': [-20.485, -54.612],
  'monte castelo': [-20.442, -54.622],
  sobrinho: [-20.46, -54.64],
  'são francisco': [-20.448, -54.613],
  'sao francisco': [-20.448, -54.613],
  moreninhas: [-20.535, -54.572],
  autonomistas: [-20.443, -54.585],
  carandá: [-20.435, -54.578],
  caranda: [-20.435, -54.578],
  universitário: [-20.508, -54.595],
  universitario: [-20.508, -54.595],
}

// Bairros padrão para distribuição de ofertas quando não especificado
const DEFAULT_NEIGHBORHOODS = [
  'centro',
  'jardim dos estados',
  'chácara cachoeira',
  'afonso pena',
  'tiradentes',
  'são francisco',
  'monte castelo',
  'vila progresso',
  'coronel antonino',
]

export interface MappedPromoProduct {
  id: string
  name: string
  storeName: string
  storeNeighborhood: string
  promoType: string
  promoLabel: string
  promoColor: PromoColorDef
  price: number
  regularPrice?: number | null
  promotionalPrice?: number | null
  discountPercent?: number | null
  imageUrl: string
  isVehicle?: boolean
  lat: number
  lng: number
}

interface PromoMapModalProps {
  isOpen: boolean
  onClose: () => void
  currentCity?: string
  currentUf?: string
}

export default function PromoMapModal({
  isOpen,
  onClose,
  currentCity = 'Campo Grande',
  currentUf = 'MS',
}: PromoMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [selectedPromoFilter, setSelectedPromoFilter] = useState<string>('todas')
  const [selectedProduct, setSelectedProduct] = useState<MappedPromoProduct | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [productsList, setProductsList] = useState<MappedPromoProduct[]>([])

  // Gera lista consolidada de produtos com localização para o mapa
  useEffect(() => {
    if (!isOpen) return

    // 1. Lojas locais e cadastradas
    const stores = getLocalStores()
    const storesMap = new Map(stores.map((s) => [s.id, s]))

    // 2. Produtos locais
    const localProds = getLocalProducts().filter((p) => p.is_active !== false)

    // 3. Produtos de demonstração diversificados com todos os tipos de promoção
    const demoItems: Array<{
      name: string
      store: string
      neighborhood: string
      promoType: string
      price: number
      regPrice?: number
      img: string
      isVeh?: boolean
    }> = [
      {
        name: 'Vestido Midi Canelado Premium',
        store: 'Águia Fashion',
        neighborhood: 'centro',
        promoType: 'outlet',
        price: 89.9,
        regPrice: 179.9,
        img: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Camisa Linho Pura Alfaiataria',
        store: 'Elegance Homem',
        neighborhood: 'jardim dos estados',
        promoType: 'lancamento',
        price: 159.0,
        regPrice: 220.0,
        img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Bolsa Estruturada Couro Bovino',
        store: 'Couros & Cia',
        neighborhood: 'chácara cachoeira',
        promoType: 'vitrine',
        price: 249.9,
        regPrice: 380.0,
        img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'iPhone 13 Pro 128GB Grafite',
        store: 'iTech Celulares',
        neighborhood: 'afonso pena',
        promoType: 'recondicionado',
        price: 3290.0,
        regPrice: 4200.0,
        img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Tênis Esportivo Running Ultra',
        store: 'Sport Outlet',
        neighborhood: 'centro',
        promoType: 'ultimas_unidades',
        price: 199.9,
        regPrice: 349.9,
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Perfume Sauvage Dior Original 100ml',
        store: 'Glamour Cosméticos',
        neighborhood: 'jardim dos estados',
        promoType: 'exclusividade',
        price: 520.0,
        regPrice: 690.0,
        img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Café Especial Torrado em Grãos 1kg',
        store: 'Armazém Pantaneiro',
        neighborhood: 'tiradentes',
        promoType: 'artezanal',
        price: 68.0,
        regPrice: 85.0,
        img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Jaqueta Bomber Couro Ecológico',
        store: 'Urban Street',
        neighborhood: 'são francisco',
        promoType: 'peca_unica',
        price: 189.0,
        regPrice: 320.0,
        img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Smartwatch Series 8 Alumínio 45mm',
        store: 'Eletro Outlet',
        neighborhood: 'chácara cachoeira',
        promoType: 'pequeno_defeito',
        price: 1199.0,
        regPrice: 1900.0,
        img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Sandália Salto Bloco Metalizada',
        store: 'Bella Donna Calçados',
        neighborhood: 'centro',
        promoType: 'outlet',
        price: 79.9,
        regPrice: 159.9,
        img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Toyota Corolla 2.0 XEi Flex Aut. 2023',
        store: 'Mato Grosso Veículos',
        neighborhood: 'coronel antonino',
        promoType: 'semi_novo',
        price: 129900.0,
        regPrice: 138000.0,
        img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=600&q=80',
        isVeh: true,
      },
      {
        name: 'Honda Civic Touring 1.5 Turbo 2021',
        store: 'Premier Motors',
        neighborhood: 'afonso pena',
        promoType: 'usado',
        price: 139000.0,
        regPrice: 145000.0,
        img: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80',
        isVeh: true,
      },
      {
        name: 'Poltrona Eames Couro Preto Legítimo',
        store: 'Design & Móveis',
        neighborhood: 'jardim dos estados',
        promoType: 'sob_encomenda',
        price: 1890.0,
        regPrice: 2400.0,
        img: 'https://images.unsplash.com/photo-1580481077195-c3a8a30f7193?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Creme Facial Hidratante Importado 50ml',
        store: 'Glamour Cosméticos',
        neighborhood: 'chácara cachoeira',
        promoType: 'importado',
        price: 189.0,
        regPrice: 279.0,
        img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Kit Cerveja Artesanal Pantaneira 4 un',
        store: 'Cervejaria Morena',
        neighborhood: 'monte castelo',
        promoType: 'novo',
        price: 49.9,
        regPrice: 65.0,
        img: 'https://images.unsplash.com/photo-1608270191763-71a7d6d37012?auto=format&fit=crop&w=400&q=80',
      },
    ]

    const mapped: MappedPromoProduct[] = []

    // Adiciona produtos reais cadastrados
    localProds.forEach((prod, idx) => {
      const storeObj = storesMap.get(prod.store_id)
      const neighborhoodRaw = (storeObj?.neighborhood || 'centro').toLowerCase().trim()
      const baseCoords = CAMPO_GRANDE_COORDS[neighborhoodRaw] || CAMPO_GRANDE_COORDS.centro

      // Dispersão sutil determinística para não sobrepor exatamente no mesmo pixel
      const jitterLat = ((idx * 17) % 19 - 9) * 0.0018
      const jitterLng = ((idx * 23) % 19 - 9) * 0.0018

      const pType = prod.promo_type || (prod.is_novidade ? 'lancamento' : 'outlet')
      const pColor = getPromoColor(pType)

      const hasDisc = Boolean(prod.promotional_price && prod.promotional_price < prod.price)
      const disc = hasDisc ? Math.round(((prod.price - prod.promotional_price!) / prod.price) * 100) : null

      mapped.push({
        id: prod.id,
        name: prod.name,
        storeName: storeObj?.name || 'Loja Parceira',
        storeNeighborhood: storeObj?.neighborhood || 'Centro',
        promoType: pColor.id,
        promoLabel: pColor.label,
        promoColor: pColor,
        price: hasDisc ? prod.promotional_price! : prod.price,
        regularPrice: prod.price,
        promotionalPrice: hasDisc ? prod.promotional_price : null,
        discountPercent: disc,
        imageUrl: prod.image_url || (prod.images && prod.images[0]) || demoItems[0].img,
        isVehicle: prod.is_vehicle,
        lat: baseCoords[0] + jitterLat,
        lng: baseCoords[1] + jitterLng,
      })
    })

    // Adiciona itens de demonstração
    demoItems.forEach((demo, idx) => {
      const baseCoords = CAMPO_GRANDE_COORDS[demo.neighborhood] || CAMPO_GRANDE_COORDS.centro
      const jitterLat = ((idx * 13) % 21 - 10) * 0.0022
      const jitterLng = ((idx * 19) % 21 - 10) * 0.0022

      const pColor = getPromoColor(demo.promoType)
      const hasDisc = Boolean(demo.regPrice && demo.price < demo.regPrice)
      const disc = hasDisc ? Math.round(((demo.regPrice! - demo.price) / demo.regPrice!) * 100) : null

      mapped.push({
        id: `demo-map-${idx}`,
        name: demo.name,
        storeName: demo.store,
        storeNeighborhood: demo.neighborhood.toUpperCase(),
        promoType: pColor.id,
        promoLabel: pColor.label,
        promoColor: pColor,
        price: demo.price,
        regularPrice: demo.regPrice,
        promotionalPrice: demo.price,
        discountPercent: disc,
        imageUrl: demo.img,
        isVehicle: demo.isVeh,
        lat: baseCoords[0] + jitterLat,
        lng: baseCoords[1] + jitterLng,
      })
    })

    setProductsList(mapped)
  }, [isOpen])

  // Carrega Leaflet JS e CSS do CDN no browser de forma 100% segura
  useEffect(() => {
    if (!isOpen) return

    if ((window as any).L) {
      setLeafletLoaded(true)
      return
    }

    // Injeta CSS do Leaflet
    const existingCss = document.getElementById('leaflet-css')
    if (!existingCss) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Injeta JS do Leaflet
    const existingScript = document.getElementById('leaflet-js')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => setLeafletLoaded(true)
      document.body.appendChild(script)
    } else {
      setLeafletLoaded(true)
    }
  }, [isOpen])

  // Produtos filtrados pelo chip de promoção selecionado na legenda
  const filteredProducts = useMemo(() => {
    if (selectedPromoFilter === 'todas') return productsList
    return productsList.filter((p) => p.promoType === selectedPromoFilter)
  }, [productsList, selectedPromoFilter])

  // Contagem de ofertas por tipo de promoção para a legenda
  const promoCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    productsList.forEach((p) => {
      counts[p.promoType] = (counts[p.promoType] || 0) + 1
    })
    return counts
  }, [productsList])

  // Lista de filtros de promoção para os chips da legenda
  const distinctPromos = useMemo(() => {
    return getDistinctPromoFilters().filter((p) => (promoCounts[p.id] || 0) > 0)
  }, [promoCounts])

  // Inicializa e atualiza o mapa Leaflet
  useEffect(() => {
    if (!isOpen || !leafletLoaded || !mapContainerRef.current) return

    const L = (window as any).L
    if (!L) return

    // Se o mapa ainda não foi instanciado, cria
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-20.463, -54.615], // Campo Grande centro
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors | Kittanda Outlet',
      }).addTo(map)

      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current

    // Limpa marcadores anteriores
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Adiciona os marcadores coloridos por tipo de promoção
    filteredProducts.forEach((prod) => {
      const pColor = prod.promoColor

      // Ícone customizado: Círculo na cor viva da promoção, exatamente em cima do imóvel
      const markerHtml = `
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 9999px;
            background-color: ${pColor.bgHex};
            opacity: 0.45;
            animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            background-color: ${pColor.bgHex};
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            <div style="width: 7px; height: 7px; border-radius: 9999px; background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></div>
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        className: 'promo-map-marker',
        html: markerHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16],
      })

      const marker = L.marker([prod.lat, prod.lng], { icon: customIcon }).addTo(map)

      const popupContent = `
        <div style="font-family: inherit; width: 230px; padding: 2px;">
          <div style="position: relative; width: 100%; height: 115px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; background: #f3f4f6;">
            <img src="${prod.imageUrl}" alt="${prod.name}" style="width: 100%; height: 100%; object-fit: cover;" />
            <span style="
              position: absolute;
              top: 6px;
              left: 6px;
              background-color: ${pColor.bgHex};
              color: #ffffff;
              font-size: 9.5px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 2.5px 7px;
              border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            ">
              ${prod.promoLabel}
            </span>
            ${
              prod.discountPercent && prod.discountPercent > 0
                ? `<span style="
                    position: absolute;
                    bottom: 6px;
                    right: 6px;
                    background: #facc15;
                    color: #000;
                    font-size: 10px;
                    font-weight: 900;
                    width: 28px;
                    height: 28px;
                    border-radius: 9999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.25);
                  ">-${prod.discountPercent}%</span>`
                : ''
            }
          </div>
          <h4 style="font-size: 12.5px; font-weight: 800; color: #111827; margin: 0 0 4px 0; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${prod.name}
          </h4>
          <p style="font-size: 11px; color: #4b5563; margin: 0 0 2px 0; font-weight: 700;">
            🏢 Imóvel / Loja: <span style="color: #111827;">${prod.storeName}</span>
          </p>
          <p style="font-size: 10.5px; color: #6b7280; margin: 0 0 6px 0;">
            📍 Campo Grande (MS) &bull; Bairro ${prod.storeNeighborhood}
          </p>
          <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 900; color: #111827;">
              R$ ${formatCurrencyBRL(prod.price)}
            </span>
            ${
              prod.regularPrice && prod.regularPrice > prod.price
                ? `<span style="font-size: 11px; text-decoration: line-through; color: #9ca3af;">
                    R$ ${formatCurrencyBRL(prod.regularPrice)}
                  </span>`
                : ''
            }
          </div>
          <a
            href="/#produto-${prod.id}"
            style="
              display: block;
              text-align: center;
              background-color: ${pColor.bgHex};
              color: #ffffff;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 6px 10px;
              border-radius: 6px;
              text-decoration: none;
              box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            "
          >
            Ver Oferta do Imóvel &rarr;
          </a>
        </div>
      `

      marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 200 })

      marker.on('click', () => {
        setSelectedProduct(prod)
      })

      markersRef.current.push(marker)
    })

    // Se houver pontos, ajusta visão para enquadrar todos
    if (filteredProducts.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      map.fitBounds(group.getBounds().pad(0.12), { maxZoom: 15, animate: true })
    }

    // Invalida tamanho para corrigir renderização após abertura da modal
    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  }, [isOpen, leafletLoaded, filteredProducts])

  // Centraliza o mapa num produto específico quando clicado na lista lateral
  const handleFocusProduct = (prod: MappedPromoProduct) => {
    setSelectedProduct(prod)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([prod.lat, prod.lng], 16, { animate: true })
      // Procura marcador correspondente e abre popup
      const marker = markersRef.current.find(
        (m) => m.getLatLng().lat === prod.lat && m.getLatLng().lng === prod.lng
      )
      if (marker) {
        marker.openPopup()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[92vh] max-h-[900px] rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
        {/* Cabeçalho Pro Max do Mapa */}
        <div className="px-5 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white flex items-center justify-between gap-3 shrink-0 border-b border-neutral-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FB6600] animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#FB6600]">
                Geolocalização &bull; Todas as Promoções
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>🗺️</span>
              <span>Mapa de Promoções — {currentCity} ({currentUf})</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-bold ml-1">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'oferta' : 'ofertas'}
              </span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors flex items-center justify-center text-xl font-bold cursor-pointer border border-transparent hover:border-neutral-700"
            aria-label="Fechar Mapa"
          >
            &times;
          </button>
        </div>

        {/* Barra Superior de Legenda com Cores Alegres e Filtro Interativo */}
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 mr-1 flex items-center gap-1">
              <span>Legenda:</span>
            </span>

            {/* Chip: Todas */}
            <button
              type="button"
              onClick={() => setSelectedPromoFilter('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                selectedPromoFilter === 'todas'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-neutral-300 hover:border-neutral-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FB6600]" />
              <span>Todas as Promoções ({productsList.length})</span>
            </button>

            {/* Chips por tipo de promoção com pontos coloridos alegres (Outlet em Laranja) */}
            {distinctPromos.map((p) => {
              const count = promoCounts[p.id] || 0
              const isSelected = selectedPromoFilter === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPromoFilter(isSelected ? 'todas' : p.id)}
                  style={{
                    backgroundColor: isSelected ? p.bgHex : '#ffffff',
                    borderColor: isSelected ? p.bgHex : '#e5e7eb',
                    color: isSelected ? '#ffffff' : '#374151',
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer flex items-center gap-2 shadow-2xs ${
                    isSelected ? 'shadow-xs scale-102' : 'hover:border-neutral-800'
                  }`}
                >
                  <span
                    style={{ backgroundColor: p.bgHex }}
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-white"
                  />
                  <span>{p.label}</span>
                  <span
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                      color: isSelected ? '#ffffff' : '#6b7280',
                    }}
                    className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Área Principal: Mapa à esquerda + Coluna de Ofertas à direita */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Contêiner do Mapa Leaflet */}
          <div className="flex-1 h-full min-h-[350px] relative bg-neutral-100">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {!leafletLoaded && (
              <div className="absolute inset-0 bg-neutral-100 flex flex-col items-center justify-center gap-2 z-10">
                <span className="text-3xl animate-bounce">🗺️</span>
                <span className="text-sm font-bold text-neutral-600">Carregando mapa interativo...</span>
              </div>
            )}

            {/* Dica flutuante no mapa */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg shadow-md border border-neutral-200 text-xs text-neutral-700 font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FB6600] animate-pulse" />
              <span>Clique nos pontos coloridos para ver os detalhes da oferta</span>
            </div>
          </div>

          {/* Coluna Lateral de Ofertas Mapeadas (Desktop) */}
          <div className="w-full md:w-80 lg:w-96 bg-neutral-50 border-t md:border-t-0 md:border-l border-neutral-200 flex flex-col h-48 md:h-full shrink-0">
            <div className="p-3 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-700">
                Ofertas na Região ({filteredProducts.length})
              </span>
              <span className="text-[11px] text-neutral-400 font-medium">
                Clique para localizar
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-200/80 p-2 space-y-2">
              {filteredProducts.map((prod) => {
                const isSelected = selectedProduct?.id === prod.id
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleFocusProduct(prod)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer bg-white border flex gap-3 ${
                      isSelected
                        ? 'border-[#FB6600] shadow-md ring-2 ring-[#FB6600]/20 scale-101'
                        : 'border-neutral-200/80 hover:border-neutral-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="w-18 h-18 rounded-lg overflow-hidden relative shrink-0 bg-neutral-100">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      <span
                        style={{ backgroundColor: prod.promoColor.bgHex }}
                        className="absolute top-1 left-1 text-[8.5px] font-black uppercase text-white px-1.5 py-0.5 rounded shadow-xs"
                      >
                        {prod.promoLabel}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-neutral-900 truncate">
                          {prod.name}
                        </h5>
                        <p className="text-[11px] text-neutral-500 truncate">
                          🏪 {prod.storeName}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                          📍 {prod.storeNeighborhood}
                        </p>
                      </div>

                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs font-black text-neutral-950">
                          R$ {formatCurrencyBRL(prod.price)}
                        </span>
                        {prod.discountPercent && prod.discountPercent > 0 && (
                          <span className="text-[10px] font-black bg-yellow-400 text-black px-1.5 py-0.2 rounded-full">
                            -{prod.discountPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredProducts.length === 0 && (
                <div className="p-6 text-center text-xs text-neutral-500">
                  Nenhuma promoção deste tipo encontrada nesta área.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé da Modal com Fechar e Atalho */}
        <div className="px-5 py-3 bg-white border-t border-neutral-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-500 font-medium">
            💡 Dica: cada ponto no mapa representa uma loja física ou ponto de retirada com oferta ativa.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-9 bg-neutral-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Fechar Mapa
          </button>
        </div>
      </div>
    </div>
  )
}

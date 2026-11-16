'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import AuthModal from '@/components/AuthModal'
import PlansModal from '@/components/PlansModal'
import { createPlanCheckoutAction } from '@/app/actions/mercadopago-checkout'
import { logoutAction, getSessionUserAction } from '@/app/login/actions'
import {
  ALPHABET,
  getStreetInitialLetter,
  getShoppingInitialLetter,
  mergeAndGroupStreetsByLetter,
  mergeAndGroupShoppingsByLetter,
  streetsMatch,
} from '@/lib/streets'
import {
  getCommercialStreetsByLetterAction,
  getCommercialShoppingsByLetterAction,
} from '@/app/actions/streets'
import {
  BRAZIL_STATES,
  CAMPO_GRANDE_MS_BAIRROS,
  DEFAULT_KITTANDA_LOCATION,
  KITTANDA_LOCATION_EVENT,
  KittandaLocation,
  getCitiesForUf,
  getStoredLocation,
  saveStoredLocation,
} from '@/lib/brazil-locations'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [unreadFeedPromosCount, setUnreadFeedPromosCount] = useState(0)
  const [recentFeedPromos, setRecentFeedPromos] = useState<any[]>([])
  const [isFeedPreviewOpen, setIsFeedPreviewOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<KittandaLocation>(DEFAULT_KITTANDA_LOCATION)
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false)
  const [isMobileCatOpen, setIsMobileCatOpen] = useState(false)
  const [isPromoMenuOpen, setIsPromoMenuOpen] = useState(false)
  const [isPlansOpen, setIsPlansOpen] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [porRuaMode, setPorRuaMode] = useState<'rua' | 'shopping'>('rua')
  const [streetsByLetter, setStreetsByLetter] = useState<Record<string, string[]>>(() =>
    mergeAndGroupStreetsByLetter()
  )
  const [shoppingsByLetter, setShoppingsByLetter] = useState<Record<string, string[]>>(() =>
    mergeAndGroupShoppingsByLetter()
  )
  
  const searchParams = useSearchParams()
  const hasParams =
    searchParams.has('tipo') ||
    searchParams.has('cat') ||
    searchParams.has('q') ||
    searchParams.has('filtro') ||
    searchParams.has('rua')
  const currentView = searchParams.get('tipo') || (hasParams ? 'lojas' : '')
  const currentCategory = searchParams.get('cat') || ''
  const currentSubcat = searchParams.get('subcat') || ''
  const rawFiltro = searchParams.get('filtro') || ''
  const currentFiltro = rawFiltro
  const currentQuery = searchParams.get('q') || ''
  const currentRua = searchParams.get('rua') || ''
  const currentUf = searchParams.get('uf') || ''
  const currentCidade = searchParams.get('cidade') || ''
  const currentBairro = searchParams.get('bairro') || ''

  const tiposPromocao: { id: string; label: string; isOrange?: boolean }[] = [
    { id: 'outlet', label: 'Outlet' },
    { id: 'lancamento', label: 'Lançamento' },
    { id: 'vitrine', label: 'Vitrine' },
    { id: 'recondicionado', label: 'Recondicionado' },
    { id: 'ultimas_unidades', label: 'Últimas unidades' },
    { id: 'exclusividade', label: 'Exclusividade' },
    { id: 'sob_encomenda', label: 'Sob Encomenda' },
    { id: 'importado', label: 'Importado' },
    { id: 'peca_unica', label: 'Peça única' },
    { id: 'pequeno_defeito', label: 'Pequeno Defeito' },
    { id: 'artezanal', label: 'Artezanal' },
    { id: 'novo', label: 'Novo' },
    { id: 'usado', label: 'Usado' },
    { id: 'feed_que_sigo', label: 'Produtos de Lojas que Sigo', isOrange: true },
  ]

  const activePromoObj = tiposPromocao.find((p) => p.id === currentFiltro.toLowerCase())

  const subcategoriasModa = [
    'Feminina',
    'Masculina',
    'Infantil',
    'Festa',
    'Country',
    'Praia',
    'Fitness',
    'Íntima',
    'Plus Size',
    'Streetwear',
  ]

  const subcategoriasPet = [
    'Shop',
    'Banho',
    'Clínica',
    'Hospital',
    'Hotel',
    'Táxi',
    'Farmácia',
    'Veterinário',
    'Domicílio',
    'Adestrador',
  ]

  const subcategoriasAgro = [
    'Agropecuária',
    'Máquinas',
    'Implementos',
    'Tratores',
    'Sementes',
    'Fertilizantes',
    'Defensivos',
    'Rações',
    'Peças',
    'Veterinária',
  ]

  const subcategoriasCarro = [
    'Usados',
    'Concessionária',
    'Peças',
    'Pneus',
    'Rodas',
    'Acessórios',
    'Som',
    'Óleos',
    'Baterias',
    'Estética',
    'Motos',
  ]

  const subcategoriasEscritorio = [
    'Papelaria',
    'Móveis',
    'Computadores',
    'Impressoras',
    'Suprimentos',
    'Escolar',
    'Escritório',
  ]

  const subcategoriasEletro = [
    'Celulares',
    'Eletrodomésticos',
    'Informática',
    'Games',
    'Áudio e Vídeo',
    'Acessórios',
    'Segurança',
  ]

  const subcategoriasCasa = [
    'Móveis',
    'Decoração',
    'Cama, Mesa e Banho',
    'Cozinha',
    'Eletrodomésticos',
    'Iluminação',
    'Jardim e Piscina',
    'Utilidades Domésticas',
    'Colchões',
  ]

  const subcategoriasBeleza = [
    'Cosméticos',
    'Maquiagem',
    'Perfumes',
    'Cabelos',
    'Skincare',
    'Unhas',
    'Barbearia',
    'Salão',
    'Estética',
    'Sobrancelhas e Cílios',
  ]

  const SUBCATEGORIAS_POR_CATEGORIA: Record<string, string[]> = {
    moda: subcategoriasModa,
    pet: subcategoriasPet,
    agro: subcategoriasAgro,
    carro: subcategoriasCarro,
    escritorio: subcategoriasEscritorio,
    eletro: subcategoriasEletro,
    casa: subcategoriasCasa,
    beleza: subcategoriasBeleza,
  }

  // Função centralizada para montar URLs mantendo todos os filtros combinados ativos
  const buildFilterUrl = ({
    tipo = currentView || 'produtos',
    cat = currentCategory,
    subcat = currentSubcat,
    filtro = currentFiltro,
    q = currentQuery,
    rua = currentRua,
    uf = currentUf,
    cidade = currentCidade,
    bairro = currentBairro,
  }: {
    tipo?: string
    cat?: string
    subcat?: string
    filtro?: string
    q?: string
    rua?: string
    uf?: string
    cidade?: string
    bairro?: string
  }) => {
    const params = new URLSearchParams()
    if (tipo) params.set('tipo', tipo)
    if (cat) params.set('cat', cat)
    // Valida se a subcategoria realmente pertence à categoria de destino
    if (subcat && cat && SUBCATEGORIAS_POR_CATEGORIA[cat]?.some((s) => s.toLowerCase() === subcat.toLowerCase())) {
      params.set('subcat', subcat.toLowerCase())
    }
    if (cat === 'por_rua' && rua) {
      params.set('rua', rua)
    }
    if (filtro) params.set('filtro', filtro)
    if (q) params.set('q', q)
    if (uf) params.set('uf', uf)
    if (cidade) params.set('cidade', cidade)
    if (bairro) params.set('bairro', bairro)
    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

  useEffect(() => {
    if (currentCategory !== 'por_rua') {
      setSelectedLetter(null)
      return
    }
    let active = true
    Promise.all([
      getCommercialStreetsByLetterAction(),
      getCommercialShoppingsByLetterAction(),
    ])
      .then(([groupedStreets, groupedShoppings]) => {
        if (!active) return
        if (groupedStreets) setStreetsByLetter(groupedStreets)
        if (groupedShoppings) setShoppingsByLetter(groupedShoppings)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [currentCategory])

  const [searchTerm, setSearchTerm] = useState(currentQuery)

  useEffect(() => {
    let mounted = true

    const fetchSession = () => {
      getSessionUserAction().then((sessionUser) => {
        if (!mounted) return
        if (sessionUser) {
          setUser(sessionUser)
          const photo = sessionUser.user_metadata?.avatar_url || (sessionUser.user_metadata as any)?.picture || null
          setAvatarUrl(photo)
        } else {
          setUser(null)
          setAvatarUrl(null)
        }
      })
    }

    fetchSession()
    window.addEventListener('kittanda:store-saved', fetchSession)

    return () => {
      mounted = false
      window.removeEventListener('kittanda:store-saved', fetchSession)
    }
  }, [searchParams.toString()])

  useEffect(() => {
    if (currentUf || currentCidade || currentBairro) {
      const fromUrl: KittandaLocation = {
        state: (currentUf || DEFAULT_KITTANDA_LOCATION.state).toUpperCase(),
        city: currentCidade || DEFAULT_KITTANDA_LOCATION.city,
        neighborhood: currentBairro,
      }
      setSelectedLocation(fromUrl)
      saveStoredLocation(fromUrl)
    } else {
      setSelectedLocation(getStoredLocation())
    }
    const handleLocationChanged = (ev: Event) => {
      const custom = ev as CustomEvent<KittandaLocation>
      if (custom.detail) {
        setSelectedLocation(custom.detail)
      } else {
        setSelectedLocation(getStoredLocation())
      }
    }
    window.addEventListener(KITTANDA_LOCATION_EVENT, handleLocationChanged)
    return () => {
      window.removeEventListener(KITTANDA_LOCATION_EVENT, handleLocationChanged)
    }
  }, [currentUf, currentCidade, currentBairro])

  const markFeedAsSeen = () => {
    setUnreadFeedPromosCount(0)
    try {
      localStorage.setItem('kittanda_feed_last_seen_at', new Date().toISOString())
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const isInsideFeed =
      pathname === '/feed' ||
      (pathname === '/perfil' && searchParams.get('aba') === 'feed')

    if (isInsideFeed) {
      markFeedAsSeen()
      return
    }

    if (!user) {
      setUnreadFeedPromosCount(0)
      setRecentFeedPromos([])
      return
    }

    let active = true
    fetch('/api/feed?limit=50')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data || !Array.isArray(data.promotions)) return
        setRecentFeedPromos(data.promotions.slice(0, 4))
        let lastSeenMs = 0
        try {
          const saved = localStorage.getItem('kittanda_feed_last_seen_at')
          if (saved) lastSeenMs = new Date(saved).getTime() || 0
        } catch {
          // ignore
        }
        const count =
          lastSeenMs > 0
            ? data.promotions.filter(
                (p: any) => new Date(p.created_at || 0).getTime() > lastSeenMs
              ).length
            : data.promotions.length
        setUnreadFeedPromosCount(count)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [user, pathname, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/?q=${encodeURIComponent(searchTerm.trim())}${currentView ? `&tipo=${currentView}` : ''}`)
    } else {
      router.push('/')
    }
  }

  const openLogin = () => {
    setAuthMode('login')
    setIsAuthOpen(true)
  }

  const openRegister = () => {
    setAuthMode('register')
    setIsAuthOpen(true)
  }

  const categories: { label: string; id: string; isOrange?: boolean }[] = [
    { label: 'Moda', id: 'moda' },
    { label: 'Pet', id: 'pet' },
    { label: 'Agro', id: 'agro' },
    { label: 'Carro', id: 'carro' },
    { label: 'Escritório', id: 'escritorio' },
    { label: 'Eletro', id: 'eletro' },
    { label: 'Casa', id: 'casa' },
    { label: 'Beleza', id: 'beleza' },
    { label: 'Por Rua', id: 'por_rua', isOrange: true },
  ]

  return (
    <>
      {/* 0. FAIXA SUPERIOR LARANJA: Largura total com UF, Cidade e Bairro dentro dos 940px */}
      <div className="w-full bg-[#FB6600] text-white relative z-40">
        <div className="mx-auto max-w-[940px] px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 min-w-0 font-bold uppercase tracking-wider">
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-[14px] md:text-[17px] text-white uppercase truncate">
              {[selectedLocation.state, selectedLocation.city, selectedLocation.neighborhood]
                .filter(Boolean)
                .join(' - ')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsLocationMenuOpen((prev) => !prev)}
            className="shrink-0 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer"
          >
            {isLocationMenuOpen ? 'Fechar' : 'Alterar Região'}
          </button>
        </div>

        {isLocationMenuOpen && (
          <div className="w-full bg-white text-neutral-900 border-b border-orange-200 shadow-md">
            <div className="mx-auto max-w-[940px] px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Estado (UF)
                </label>
                <select
                  value={selectedLocation.state}
                  onChange={(e) => {
                    const nextUf = e.target.value
                    const nextCity = getCitiesForUf(nextUf)[0] || ''
                    const nextLoc: KittandaLocation = { state: nextUf, city: nextCity, neighborhood: '' }
                    setSelectedLocation(nextLoc)
                    saveStoredLocation(nextLoc)
                    router.push(buildFilterUrl({ uf: nextLoc.state, cidade: nextLoc.city, bairro: '' }))
                  }}
                  className="w-full border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 rounded-[2px] focus:border-[#FB6600] focus:outline-none"
                >
                  {BRAZIL_STATES.map((st) => (
                    <option key={st.uf} value={st.uf}>
                      {st.uf} — {st.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Cidade
                </label>
                <select
                  value={selectedLocation.city}
                  onChange={(e) => {
                    const nextLoc: KittandaLocation = {
                      state: selectedLocation.state,
                      city: e.target.value,
                      neighborhood: '',
                    }
                    setSelectedLocation(nextLoc)
                    saveStoredLocation(nextLoc)
                    router.push(buildFilterUrl({ uf: nextLoc.state, cidade: nextLoc.city, bairro: '' }))
                  }}
                  className="w-full border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 rounded-[2px] focus:border-[#FB6600] focus:outline-none"
                >
                  {getCitiesForUf(selectedLocation.state).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Bairro
                </label>
                {selectedLocation.state === 'MS' && selectedLocation.city === 'Campo Grande' ? (
                  <select
                    value={selectedLocation.neighborhood}
                    onChange={(e) => {
                      const nextLoc: KittandaLocation = {
                        ...selectedLocation,
                        neighborhood: e.target.value,
                      }
                      setSelectedLocation(nextLoc)
                      saveStoredLocation(nextLoc)
                      router.push(
                        buildFilterUrl({
                          uf: nextLoc.state,
                          cidade: nextLoc.city,
                          bairro: nextLoc.neighborhood,
                        })
                      )
                    }}
                    className="w-full border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 rounded-[2px] focus:border-[#FB6600] focus:outline-none"
                  >
                    <option value="">Todos os bairros (cidade toda)</option>
                    {CAMPO_GRANDE_MS_BAIRROS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedLocation.neighborhood}
                    onChange={(e) => {
                      const nextLoc: KittandaLocation = {
                        ...selectedLocation,
                        neighborhood: e.target.value,
                      }
                      setSelectedLocation(nextLoc)
                      saveStoredLocation(nextLoc)
                      router.push(
                        buildFilterUrl({
                          uf: nextLoc.state,
                          cidade: nextLoc.city,
                          bairro: nextLoc.neighborhood.trim(),
                        })
                      )
                    }}
                    placeholder="Em branco = cidade toda"
                    className="w-full border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 rounded-[2px] focus:border-[#FB6600] focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. TOPO: Rola junto com a página */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[940px] px-4 min-h-[72px] py-1.5 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <img 
              src="/logo-kittanda-laranja.png" 
              alt="Kittanda Outlet" 
              className="w-[160px] sm:w-[250px] md:w-[300px] max-w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>

          {/* CAIXA DE BUSCA RETANGULAR COM ÍCONE DE LUPA PRETA */}
          <form onSubmit={handleSearch} className="flex-1 max-w-[480px] mx-2.5 hidden md:flex items-center border border-gray-300 focus-within:border-black transition-colors rounded-none bg-white">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por produto ou nome da loja..."
              className="w-full px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none rounded-none bg-transparent"
            />
            <button 
              type="submit"
              aria-label="Buscar"
              className="px-3 py-2 text-black hover:text-[#FB6600] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              title="Buscar"
            >
              <svg 
                className="w-4 h-4 stroke-[2]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* AÇÕES DO TOPO - DESKTOP */}
          <div className="hidden md:flex items-center gap-[2px] text-[13px] font-heading tracking-tight text-gray-500 font-normal shrink-0">
            {/* IMAGEM DO ROSTO / AVATAR DO LOGIN (GOOGLE, FACEBOOK OU PADRÃO) */}
            <div 
              onClick={() => {
                router.push('/perfil');
              }}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center shrink-0 bg-gray-50 transition-colors cursor-pointer hover:border-black"
              title={user ? (user.user_metadata?.full_name || user.email) : 'Meu Perfil'}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Foto do perfil" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg 
                  className="w-4 h-4 text-gray-400 fill-current" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>

            {user ? (
              <>
                <Link
                  href="/perfil"
                  className="text-[13px] text-black hover:text-[#FB6600] font-semibold uppercase truncate max-w-[100px] md:max-w-[130px] transition-colors cursor-pointer"
                  title="Acessar Meu Perfil (Dados, Foto, WhatsApp, Endereço, Favoritos, Seguindo e Feed que sigo)"
                >
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </Link>
                {Boolean(user.hasStore) && (
                  <>
                    <span className="text-gray-300 text-xs font-light">|</span>
                    <Link
                      href="/painel/loja"
                      className="text-[13px] hover:text-[#FB6600] text-neutral-800 font-semibold uppercase transition-colors cursor-pointer whitespace-nowrap"
                      title="Acessar painel da minha loja"
                    >
                      MINHA LOJA
                    </Link>
                  </>
                )}
                <span className="text-gray-300 text-xs font-light">|</span>
                <button 
                  type="button"
                  onClick={async () => {
                    await logoutAction()
                    setUser(null)
                    setAvatarUrl(null)
                    router.push('/')
                    router.refresh()
                  }}
                  className="text-[13px] hover:text-black font-semibold uppercase transition-colors cursor-pointer text-gray-500"
                >
                  SAIR
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={openLogin}
                  className="hover:text-black transition-colors cursor-pointer"
                >
                  Entrar
                </button>
                <span className="text-gray-300 text-xs font-light">|</span>
                <button 
                  type="button"
                  onClick={openRegister}
                  className="hover:text-black transition-colors cursor-pointer"
                >
                  Crie uma conta
                </button>
              </>
            )}
            <span className="text-gray-300 text-xs font-light">|</span>
            <div
              className="relative flex items-center"
              onMouseEnter={() => setIsFeedPreviewOpen(true)}
              onMouseLeave={() => setIsFeedPreviewOpen(false)}
            >
              <button
                type="button"
                aria-label={
                  unreadFeedPromosCount > 0
                    ? `Feed que sigo (${unreadFeedPromosCount} novidades)`
                    : 'Feed que sigo'
                }
                aria-haspopup="true"
                aria-expanded={isFeedPreviewOpen}
                aria-current={pathname === '/perfil' && searchParams.get('aba') === 'feed' ? 'page' : undefined}
                title="Feed que sigo — Novidades das lojas que você acompanha"
                className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB6600] ${
                  pathname === '/perfil' && searchParams.get('aba') === 'feed'
                    ? 'text-[#FB6600] bg-orange-50'
                    : 'text-neutral-700 hover:text-[#FB6600] hover:bg-orange-50/70'
                }`}
                onClick={() => {
                  markFeedAsSeen()
                  setIsFeedPreviewOpen(false)
                  router.push('/perfil?aba=feed')
                }}
              >
                <svg
                  aria-hidden="true"
                  className="w-[19px] h-[19px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadFeedPromosCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 bg-[#FB6600] text-white text-[9px] font-bold leading-none rounded-full flex items-center justify-center tabular-nums ring-2 ring-white shadow-xs">
                    {unreadFeedPromosCount > 99 ? '99+' : unreadFeedPromosCount}
                  </span>
                )}
              </button>

              {isFeedPreviewOpen && (
                <div
                  role="region"
                  aria-label="Prévia do Feed que sigo"
                  className="absolute right-0 top-full pt-2 z-50 w-80"
                >
                  <div className="bg-white border border-neutral-200 rounded-md shadow-xl overflow-hidden normal-case tracking-normal text-left">
                    <div className="px-3.5 py-2.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FB6600]" aria-hidden="true" />
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                          Feed que sigo
                        </span>
                      </div>
                      {unreadFeedPromosCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#FB6600] tabular-nums">
                          {unreadFeedPromosCount} {unreadFeedPromosCount === 1 ? 'nova' : 'novas'}
                        </span>
                      )}
                    </div>

                    {!user ? (
                      <div className="p-4 text-center space-y-2.5">
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          Entre na sua conta para acompanhar em um só lugar as novidades e promoções das lojas que você segue.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsFeedPreviewOpen(false)
                            openLogin()
                          }}
                          className="w-full py-2 bg-[#FB6600] hover:bg-[#e05b00] text-white text-[11px] font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
                        >
                          Entrar para ver meu Feed
                        </button>
                      </div>
                    ) : recentFeedPromos.length === 0 ? (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs font-semibold text-neutral-800">
                          Seu feed está pronto para você
                        </p>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          Siga suas lojas favoritas para receber aqui as últimas postagens e ofertas.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                        {recentFeedPromos.map((promo: any) => {
                          const storeName = promo?.stores?.name || 'Loja seguida'
                          const priceValue =
                            typeof promo?.price_promotional === 'number' && promo.price_promotional > 0
                              ? promo.price_promotional
                              : promo?.price_original
                          return (
                            <li key={promo.id}>
                              <Link
                                href={`/loja/${promo.store_id}`}
                                onClick={() => {
                                  markFeedAsSeen()
                                  setIsFeedPreviewOpen(false)
                                }}
                                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-orange-50/50 transition-colors"
                              >
                                <div className="w-11 h-11 rounded-[3px] bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                                  {promo.image_url ? (
                                    <img
                                      src={promo.image_url}
                                      alt={promo.title || 'Produto'}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                      <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#FB6600] truncate">
                                    {storeName}
                                  </p>
                                  <p className="text-xs font-semibold text-neutral-900 truncate">
                                    {promo.title}
                                  </p>
                                  {typeof priceValue === 'number' && priceValue > 0 && (
                                    <p className="text-[11px] font-bold text-neutral-800 tabular-nums">
                                      R$ {priceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    <div className="p-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          markFeedAsSeen()
                          setIsFeedPreviewOpen(false)
                          router.push('/perfil?aba=feed')
                        }}
                        className="flex-1 py-2 px-3 bg-[#FB6600] hover:bg-[#e05b00] text-white text-[11px] font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer text-center"
                      >
                        Abrir Feed que sigo
                      </button>
                      <Link
                        href="/?filtro=feed_que_sigo"
                        onClick={() => {
                          markFeedAsSeen()
                          setIsFeedPreviewOpen(false)
                        }}
                        className="py-2 px-2.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-semibold rounded-[3px] transition-colors whitespace-nowrap"
                      >
                        Catálogo
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/admin"
              onClick={() => setIsPromoMenuOpen(false)}
              title="Administração do Site"
              aria-label="Administração do Site"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-600 hover:text-[#FB6600] hover:bg-orange-50 transition-colors shrink-0"
            >
              <svg className="w-[18px] h-[18px] stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <span className="text-gray-300 text-xs font-light">|</span>
            <button
              type="button"
              onClick={() => setIsPlansOpen(true)}
              className="text-[13px] font-heading font-bold uppercase tracking-tight text-black hover:text-[#FB6600] transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>PLANOS</span>
            </button>
          </div>

          {/* AÇÕES DO TOPO - MOBILE (Linha 1: Sino + Engrenagem + Avatar + Nome + SAIR) */}
          <div className="flex md:hidden items-center gap-[2px] text-[15.5px] font-heading tracking-tight text-gray-500 font-normal shrink-0">
            <button
              type="button"
              aria-label={
                unreadFeedPromosCount > 0
                  ? `Feed que sigo (${unreadFeedPromosCount} novidades)`
                  : 'Feed que sigo'
              }
              aria-current={pathname === '/perfil' && searchParams.get('aba') === 'feed' ? 'page' : undefined}
              title="Abrir Feed que sigo"
              onClick={() => {
                markFeedAsSeen()
                router.push('/perfil?aba=feed')
              }}
              className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 cursor-pointer shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB6600] ${
                pathname === '/perfil' && searchParams.get('aba') === 'feed'
                  ? 'text-[#FB6600] bg-orange-50'
                  : 'text-neutral-700 hover:text-[#FB6600] hover:bg-orange-50/70'
              }`}
            >
              <svg
                aria-hidden="true"
                className="w-[25px] h-[25px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadFeedPromosCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[15px] h-[15px] px-1 bg-[#FB6600] text-white text-[9px] font-bold leading-none rounded-full flex items-center justify-center tabular-nums ring-2 ring-white shadow-xs">
                  {unreadFeedPromosCount > 99 ? '99+' : unreadFeedPromosCount}
                </span>
              )}
            </button>

            <Link
              href="/admin"
              onClick={() => setIsPromoMenuOpen(false)}
              title="Administração do Site"
              aria-label="Administração do Site"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-neutral-600 hover:text-[#FB6600] hover:bg-orange-50 transition-colors shrink-0"
            >
              <svg className="w-[23px] h-[23px] stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            <div 
              onClick={() => {
                router.push('/perfil');
              }}
              className="w-[32px] h-[32px] rounded-full overflow-hidden border border-gray-300 flex items-center justify-center shrink-0 bg-gray-50 transition-colors cursor-pointer hover:border-black"
              title={user ? (user.user_metadata?.full_name || user.email) : 'Meu Perfil'}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Foto do perfil" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg 
                  className="w-4 h-4 text-gray-400 fill-current" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            {user ? (
              <>
                <Link
                  href="/perfil"
                  className="ml-1 text-[15.5px] text-black hover:text-[#FB6600] font-semibold uppercase truncate max-w-[70px] transition-colors cursor-pointer"
                  title="Acessar Meu Perfil"
                >
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logoutAction()
                    setUser(null)
                    setAvatarUrl(null)
                    router.push('/')
                    router.refresh()
                  }}
                  className="ml-1 text-[13px] text-red-600 hover:text-red-700 font-semibold uppercase transition-colors cursor-pointer whitespace-nowrap"
                >
                  SAIR
                </button>
              </>
            ) : (
              <button 
                type="button"
                onClick={openLogin}
                className="ml-1 text-[15.5px] text-black font-semibold hover:text-[#FB6600] transition-colors cursor-pointer"
              >
                Entrar
              </button>
            )}
          </div>
        </div>

        {/* LINHA EXTRA NO MOBILE: MINHA LOJA (esq) + Caixa de Busca ampliada (centro) + PLANOS (dir) */}
        <div className="md:hidden w-full border-t border-gray-100 bg-neutral-50/70">
          <div className="mx-auto max-w-[940px] px-3 py-2 flex items-center justify-between gap-2 text-[15.5px] font-heading tracking-tight text-gray-600">
            <div className="shrink-0 flex items-center">
              {user ? (
                Boolean(user.hasStore) && (
                  <Link
                    href="/painel/loja"
                    className="text-[15.5px] text-neutral-900 hover:text-[#FB6600] font-bold uppercase transition-colors whitespace-nowrap"
                  >
                    MINHA LOJA
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  onClick={openRegister}
                  className="text-[15.5px] text-neutral-800 hover:text-[#FB6600] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Crie uma conta
                </button>
              )}
            </div>

            <form
              onSubmit={handleSearch}
              className="flex-1 min-w-0 flex items-center border border-gray-300 focus-within:border-black transition-colors rounded-none bg-white h-8"
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar por produto ou nome da loja"
                className="w-full min-w-0 px-2.5 py-1 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="px-2 py-1 text-black hover:text-[#FB6600] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                title="Buscar"
              >
                <svg
                  className="w-3.5 h-3.5 stroke-[2]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>

            <div className="shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => setIsPlansOpen(true)}
                className="text-[15.5px] font-bold uppercase tracking-tight text-black hover:text-[#FB6600] transition-colors cursor-pointer whitespace-nowrap"
              >
                PLANOS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CATEGORIAS FIXA: Permanece no topo no scroll */}
      <nav 
        aria-label="Navegação de categorias" 
        style={{ position: 'sticky', top: 0, zIndex: 50 }}
        className="w-full bg-white border-b border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative"
      >
        <div className="mx-auto max-w-[940px]">
          {/* ========================================================= */}
          {/* A. VERSÃO DESKTOP (md:flex): Layout horizontal completo   */}
          {/* ========================================================= */}
          <div className="hidden md:flex items-center justify-between gap-2 px-3">
            
            {/* LADO ESQUERDO: Botão de Seleção "Lojas" + Categorias */}
            <div className="flex items-center gap-1.5 lg:gap-2 font-heading text-[13px] font-semibold tracking-tight overflow-x-auto no-scrollbar py-0 flex-1 min-w-0">
              
              {/* BOTÃO "LOJAS" COM OS QUADRADINHOS */}
              <Link
                href={buildFilterUrl({ tipo: 'lojas' })}
                onClick={() => setIsPromoMenuOpen(false)}
                className={`flex items-center gap-1.5 py-3.5 whitespace-nowrap transition-colors duration-200 relative shrink-0 ${
                  currentView === 'lojas'
                    ? "text-[#FB6600] font-bold before:content-[''] before:absolute before:-top-[1px] before:left-0 before:right-0 before:h-[2.5px] before:bg-[#FB6600]"
                    : "text-black hover:text-[#FB6600]"
                }`}
              >
                <svg 
                  className={`w-4 h-4 stroke-[1.6] ${currentView === 'lojas' ? 'text-[#FB6600]' : 'text-black'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className="uppercase">LOJAS</span>
              </Link>

              {/* Linha vertical divisória entre Lojas e Categorias */}
              <div className="h-4 w-[1px] bg-gray-200 shrink-0" />

              {/* LISTA DE CATEGORIAS */}
              {categories.map((cat) => {
                const isCatActive = currentCategory === cat.id
                
                // Ao clicar em uma categoria já ativa, desmarca.
                // Ao clicar em outra categoria, verifica compatibilidade da subcategoria
                const targetCat = isCatActive ? '' : cat.id
                const targetSubcat = isCatActive ? '' : currentSubcat
                const targetRua = isCatActive || cat.id !== 'por_rua' ? '' : currentRua
                const targetUrl = buildFilterUrl({ cat: targetCat, subcat: targetSubcat, rua: targetRua })

                const lineStyle = isCatActive
                  ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#FB6600] font-bold"
                  : ""

                return (
                  <Link
                    key={cat.id}
                    href={targetUrl}
                    onClick={() => setIsPromoMenuOpen(false)}
                    className={`py-3.5 whitespace-nowrap uppercase transition-colors duration-200 relative shrink-0 ${
                      isCatActive
                        ? 'text-[#FB6600] font-bold ' + lineStyle
                        : cat.isOrange
                        ? 'text-[#FB6600] font-bold hover:text-[#e05b00]'
                        : 'text-black hover:text-[#FB6600]'
                    }`}
                  >
                    {cat.label}
                  </Link>
                )
              })}

              {/* BOTÃO ARREDONDADO PRETO: LIMPA FILTRO */}
              <div className="flex items-center shrink-0">
                <Link
                  href="/"
                  onClick={() => {
                    setIsPromoMenuOpen(false)
                    setSelectedLetter(null)
                    setSearchTerm('')
                  }}
                  title="Limpar todos os filtros"
                  className="inline-flex flex-col items-center justify-center px-[10.5px] py-[4.2px] bg-black hover:bg-neutral-800 text-white rounded-full text-[8.25px] font-bold uppercase leading-[1.05] tracking-tight shrink-0 transition-colors shadow-2xs scale-[1.03]"
                >
                  <span>Limpa</span>
                  <span>Filtro</span>
                </Link>
              </div>
            </div>

            {/* BOTÃO "TIPO DE PROMOÇÃO" COM MENU VERTICAL DROPDOWN */}
            <div className="relative pl-3 border-l border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setIsPromoMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wider py-1.5 px-3 whitespace-nowrap leading-none transition-all rounded-[2px] border cursor-pointer select-none ${
                  activePromoObj || isPromoMenuOpen
                    ? 'bg-[#FB6600] border-[#FB6600] text-white font-bold shadow-xs'
                    : 'bg-white border-gray-300 text-gray-800 hover:border-black hover:text-black font-bold'
                }`}
              >
                <span>{activePromoObj ? activePromoObj.label : 'Tipo de Promoção'}</span>
                <svg
                  className={`w-3.5 h-3.5 stroke-[2.2] transition-transform duration-200 ${
                    isPromoMenuOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isPromoMenuOpen && (
                <>
                  {/* Backdrop invisível para fechar ao clicar fora */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsPromoMenuOpen(false)}
                  />
                  {/* Menu Vertical de Promoções */}
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 shadow-xl z-50 py-1.5 rounded-[2px] animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Filtrar Promoção
                      </span>
                      {activePromoObj && (
                        <Link
                          href={buildFilterUrl({ filtro: '' })}
                          onClick={() => setIsPromoMenuOpen(false)}
                          className="text-[10px] font-bold text-[#FB6600] hover:underline"
                        >
                          Limpar
                        </Link>
                      )}
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[340px] overflow-y-auto">
                      {tiposPromocao.map((promo) => {
                        const isPromoSelected = currentFiltro.toLowerCase() === promo.id
                        const nextFiltro = isPromoSelected ? '' : promo.id
                        const targetHref =
                          promo.id === 'feed_que_sigo' && nextFiltro
                            ? buildFilterUrl({ tipo: 'produtos', filtro: nextFiltro })
                            : buildFilterUrl({ filtro: nextFiltro })
                        return (
                          <Link
                            key={promo.id}
                            href={targetHref}
                            onClick={() => setIsPromoMenuOpen(false)}
                            className={`flex items-center justify-between px-3.5 py-2.5 text-xs uppercase transition-colors ${
                              isPromoSelected
                                ? 'bg-orange-50/70 text-[#FB6600] font-bold'
                                : promo.isOrange
                                ? 'text-[#FB6600] hover:bg-orange-50/60 font-bold'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-[#FB6600] font-medium'
                            }`}
                          >
                            <span className={promo.isOrange ? 'text-[#FB6600] font-bold' : ''}>
                              {promo.label}
                            </span>
                            {isPromoSelected ? (
                              <span className="text-[10px] uppercase font-bold text-[#FB6600]">✓</span>
                            ) : (
                              <span className={`${promo.isOrange ? 'text-[#FB6600]' : 'text-gray-300'} text-xs`}>&rsaquo;</span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* LADO DIREITO: Botão de Seleção "Produtos" */}
            <div className="border-l border-gray-200 pl-3 flex items-center h-full shrink-0">
              <Link
                href={buildFilterUrl({ tipo: 'produtos' })}
                className={`flex items-center gap-1.5 py-3.5 font-heading text-[13px] font-semibold tracking-tight transition-colors relative shrink-0 ${
                  currentView === 'produtos'
                    ? "text-[#FB6600] font-bold before:content-[''] before:absolute before:-top-[1px] before:left-0 before:right-0 before:h-[2.5px] before:bg-[#FB6600]"
                    : "text-black hover:text-[#FB6600]"
                }`}
              >
                <svg 
                  className={`w-[18px] h-[18px] stroke-[1.6] ${currentView === 'produtos' ? 'text-[#FB6600]' : 'text-black'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className="uppercase">PRODUTOS</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* B. VERSÃO MOBILE (md:hidden): Lojas | Categorias ▾ | Produtos */}
          {/* ========================================================= */}
          <div className="flex md:hidden items-center justify-between gap-2 px-3 h-14 font-heading relative z-[60]">
            {/* LADO ESQUERDO: Lojas */}
            <Link
              href={buildFilterUrl({ tipo: 'lojas' })}
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileCatOpen(false)
              }}
              className={`flex items-center gap-2 py-3.5 text-[15.5px] font-semibold whitespace-nowrap transition-colors relative shrink-0 ${
                currentView === 'lojas'
                  ? "text-[#FB6600] font-bold before:content-[''] before:absolute before:-top-[1px] before:left-0 before:right-0 before:h-[2.5px] before:bg-[#FB6600]"
                  : "text-black hover:text-[#FB6600]"
              }`}
            >
              <svg 
                className={`w-[18px] h-[18px] stroke-[1.6] ${currentView === 'lojas' ? 'text-[#FB6600]' : 'text-black'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="uppercase">LOJAS</span>
            </Link>

            {/* MEIO: Botão Categorias que abre o Menu Vertical */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileCatOpen((prev) => !prev)
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 text-[15.5px] font-bold uppercase tracking-wide transition-all border rounded-none cursor-pointer relative z-[60] select-none max-w-[46vw] ${
                isMobileCatOpen || currentCategory
                  ? 'border-[#FB6600] text-[#FB6600] bg-orange-50/60 shadow-xs'
                  : 'border-gray-300 text-black hover:border-black bg-white'
              }`}
            >
              <span className="truncate">{currentCategory ? (categories.find(c => c.id === currentCategory)?.label || 'Categorias') : 'Categorias'}</span>
              <svg 
                className={`w-4 h-4 stroke-[2] shrink-0 transition-transform duration-200 ${
                  isMobileCatOpen ? 'rotate-180 text-[#FB6600]' : 'text-gray-500'
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* LADO DIREITO: Produtos */}
            <Link
              href={buildFilterUrl({ tipo: 'produtos' })}
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileCatOpen(false)
              }}
              className={`flex items-center gap-2 py-3.5 text-[15.5px] font-semibold whitespace-nowrap transition-colors relative shrink-0 ${
                currentView === 'produtos'
                  ? "text-[#FB6600] font-bold before:content-[''] before:absolute before:-top-[1px] before:left-0 before:right-0 before:h-[2.5px] before:bg-[#FB6600]"
                  : "text-black hover:text-[#FB6600]"
              }`}
            >
              <svg 
                className={`w-[18px] h-[18px] stroke-[1.6] ${currentView === 'produtos' ? 'text-[#FB6600]' : 'text-black'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="uppercase">PRODUTOS</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* C. MENU VERTICAL DE CATEGORIAS (MOBILE DROPDOWN)         */}
        {/* ========================================================= */}
        {isMobileCatOpen && (
          <>
            {/* Backdrop para fechar ao tocar fora */}
            <div 
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileCatOpen(false)
              }}
            />

            {/* Painel Vertical com as Categorias */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-2xl z-50 md:hidden animate-in fade-in slide-in-from-top-1 duration-200 max-h-[75vh] overflow-y-auto"
            >
              
              {/* Menu Vertical de Tipo de Promoção no Mobile */}
              <div className="bg-neutral-50 px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                    Tipo de Promoção
                  </span>
                  {activePromoObj && (
                    <Link
                      href={buildFilterUrl({ filtro: '' })}
                      onClick={() => setIsMobileCatOpen(false)}
                      className="text-[10px] font-bold text-[#FB6600] hover:underline"
                    >
                      Limpar ({activePromoObj.label})
                    </Link>
                  )}
                </div>
                <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-[2px] max-h-[108px] overflow-y-auto overscroll-contain">
                  {tiposPromocao.map((promo) => {
                    const isPromoSelected = currentFiltro.toLowerCase() === promo.id
                    const nextFiltro = isPromoSelected ? '' : promo.id
                    const targetHref =
                      promo.id === 'feed_que_sigo' && nextFiltro
                        ? buildFilterUrl({ tipo: 'produtos', filtro: nextFiltro })
                        : buildFilterUrl({ filtro: nextFiltro })
                    return (
                      <Link
                        key={promo.id}
                        href={targetHref}
                        onClick={() => setIsMobileCatOpen(false)}
                        className={`flex items-center justify-between px-3 h-9 text-[13px] uppercase transition-colors ${
                          isPromoSelected
                            ? 'bg-orange-50/70 text-[#FB6600] font-bold'
                            : promo.isOrange
                            ? 'text-[#FB6600] hover:bg-orange-50/60 font-bold'
                            : 'text-gray-700 hover:bg-gray-50 font-medium'
                        }`}
                      >
                        <span className={promo.isOrange ? 'text-[#FB6600] font-bold' : ''}>
                          {promo.label}
                        </span>
                        {isPromoSelected ? (
                          <span className="text-[10px] uppercase font-bold text-[#FB6600]">Ativo</span>
                        ) : (
                          <span className={`${promo.isOrange ? 'text-[#FB6600]' : 'text-gray-300'} text-xs`}>&rsaquo;</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Lista Vertical de Categorias */}
              <div className="py-2 px-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-3 py-1">
                  Categorias
                </span>
                <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-[2px] max-h-[108px] overflow-y-auto overscroll-contain">
                  {categories.filter((cat) => cat.id !== 'por_rua').map((cat) => {
                    const isCatActive = currentCategory === cat.id
                    const targetCat = isCatActive ? '' : cat.id
                    const targetSubcat = isCatActive ? '' : currentSubcat
                    const targetUrl = buildFilterUrl({ cat: targetCat, subcat: targetSubcat, rua: '' })

                    return (
                      <Link
                        key={cat.id}
                        href={targetUrl}
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsMobileCatOpen(false)
                        }}
                        className={`flex items-center justify-between px-3 h-9 text-[13px] uppercase tracking-wide transition-colors ${
                          isCatActive
                            ? 'text-[#FB6600] font-bold bg-orange-50/50'
                            : cat.isOrange
                            ? 'text-[#FB6600] font-bold hover:bg-orange-50/40'
                            : 'text-neutral-900 hover:text-[#FB6600] hover:bg-gray-50'
                        }`}
                      >
                        <span>{cat.label}</span>
                        {isCatActive ? (
                          <span className="text-[10px] uppercase font-bold text-[#FB6600]">Ativo</span>
                        ) : (
                          <span className="text-gray-300 text-sm">&rsaquo;</span>
                        )}
                      </Link>
                    )
                  })}
                </div>

                {/* Por Rua sempre aparente fora da rolagem */}
                {(() => {
                  const porRuaCat = categories.find((cat) => cat.id === 'por_rua')
                  if (!porRuaCat) return null
                  const isPorRuaActive = currentCategory === 'por_rua'
                  const targetUrl = buildFilterUrl({
                    cat: isPorRuaActive ? '' : 'por_rua',
                    subcat: isPorRuaActive ? '' : currentSubcat,
                    rua: isPorRuaActive ? '' : currentRua,
                  })
                  return (
                    <div className="mt-2 bg-white border border-gray-200 rounded-[2px]">
                      <Link
                        href={targetUrl}
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsMobileCatOpen(false)
                        }}
                        className={`flex items-center justify-between px-3 h-9 text-[13px] uppercase tracking-wide transition-colors ${
                          isPorRuaActive
                            ? 'text-[#FB6600] font-bold bg-orange-50/50'
                            : 'text-[#FB6600] font-bold hover:bg-orange-50/40'
                        }`}
                      >
                        <span>{porRuaCat.label}</span>
                        {isPorRuaActive ? (
                          <span className="text-[10px] uppercase font-bold text-[#FB6600]">Ativo</span>
                        ) : (
                          <span className="text-[#FB6600] text-sm">&rsaquo;</span>
                        )}
                      </Link>
                    </div>
                  )
                })()}

                {/* Opção para limpar todos os filtros */}
                <div className="mt-2 pt-2 border-t border-gray-100 px-3 pb-2 flex items-center justify-between gap-2">
                  <Link
                    href={buildFilterUrl({ cat: '', subcat: '', rua: '' })}
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMobileCatOpen(false)
                    }}
                    className="text-[13px] text-gray-500 hover:text-[#FB6600] uppercase flex items-center justify-between py-1 font-medium"
                  >
                    <span>LIMPAR CATEGORIA</span>
                  </Link>
                  <div className="flex items-center gap-[2px] shrink-0">
                    <Link
                      href="/"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMobileCatOpen(false)
                        setSelectedLetter(null)
                        setSearchTerm('')
                      }}
                      title="Limpar todos os filtros"
                      className="inline-flex flex-col items-center justify-center px-[12.5px] py-[4.2px] bg-black hover:bg-neutral-800 text-white rounded-full text-[8.75px] font-bold uppercase leading-[1.05] tracking-tight shrink-0 scale-[1.03]"
                    >
                      <span>Limpa</span>
                      <span>Filtro</span>
                    </Link>
                    <Link
                      href="/admin"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMobileCatOpen(false)
                      }}
                      title="Administração do Site"
                      aria-label="Administração do Site"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-neutral-200 text-neutral-700 hover:text-[#FB6600] hover:border-[#FB6600] transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* D. SUBCATEGORIAS DINÂMICAS OU BARRA DE RUAS A-Z ("Por Rua") */}
        {/* ========================================================= */}
        {currentCategory === 'por_rua' ? (
          <div className="w-full bg-white border-t border-gray-100 animate-in fade-in duration-200 relative">
            <div className="mx-auto max-w-[940px] px-4 py-2 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    aria-pressed={porRuaMode === 'rua'}
                    onClick={() => {
                      setPorRuaMode('rua')
                      setSelectedLetter(null)
                    }}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[2px] border transition-colors cursor-pointer ${
                      porRuaMode === 'rua'
                        ? 'bg-[#FB6600] text-white border-[#FB6600]'
                        : 'bg-white text-neutral-700 border-gray-300 hover:border-[#FB6600] hover:text-[#FB6600]'
                    }`}
                  >
                    Escolha a inicial da rua comercial
                  </button>
                  <button
                    type="button"
                    aria-pressed={porRuaMode === 'shopping'}
                    onClick={() => {
                      setPorRuaMode('shopping')
                      setSelectedLetter(null)
                    }}
                    className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-[2px] border transition-colors cursor-pointer ${
                      porRuaMode === 'shopping'
                        ? 'bg-[#FB6600] text-white border-[#FB6600]'
                        : 'bg-white text-neutral-700 border-gray-300 hover:border-[#FB6600] hover:text-[#FB6600]'
                    }`}
                  >
                    Escolha a inicial do Shopping e Galeria
                  </button>
                </div>
                {currentRua && (
                  <div className="flex items-center gap-1.5 text-[11px] bg-orange-50 border border-orange-200 text-[#FB6600] font-bold px-2.5 py-0.5 rounded-[2px]">
                    <span>Selecionado: {currentRua}</span>
                    <Link
                      href={buildFilterUrl({ cat: 'por_rua', subcat: '', rua: '' })}
                      className="text-gray-500 hover:text-black ml-1"
                      title="Limpar filtro selecionado"
                    >
                      ×
                    </Link>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-9 sm:flex sm:items-center sm:justify-between gap-1 sm:flex-wrap pb-0.5">
                {ALPHABET.map((letter) => {
                  const activeByLetter = porRuaMode === 'shopping' ? shoppingsByLetter : streetsByLetter
                  const isLetterOpen = selectedLetter === letter
                  const isActiveStreetLetter =
                    Boolean(currentRua) &&
                    (porRuaMode === 'shopping'
                      ? getShoppingInitialLetter(currentRua) === letter
                      : getStreetInitialLetter(currentRua) === letter)
                  const count = (activeByLetter[letter] || []).length

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedLetter((prev) => (prev === letter ? null : letter))}
                      title={
                        count > 0
                          ? `${count} ${porRuaMode === 'shopping' ? 'shopping(s)/galeria(s)' : 'rua(s)'} com a letra ${letter}`
                          : `Letra ${letter}`
                      }
                      className={`min-w-[28px] h-8 px-1 text-[15.5px] font-bold rounded-[2px] transition-colors cursor-pointer select-none flex items-center justify-center ${
                        isLetterOpen
                          ? 'bg-[#FB6600] text-white shadow-xs'
                          : isActiveStreetLetter
                          ? 'bg-orange-100 text-[#FB6600] border border-[#FB6600]'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-[#FB6600]'
                      }`}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedLetter && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSelectedLetter(null)}
                />
                <div className="mx-auto max-w-[940px] px-4 relative z-50">
                  <div className="w-full bg-white border border-orange-200 shadow-xl rounded-[2px] p-4 mb-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#FB6600]">
                        {porRuaMode === 'shopping'
                          ? `Shoppings e Galerias — Letra ${selectedLetter} (ordem alfabética)`
                          : `Principais ruas comerciais — Letra ${selectedLetter} (ordem alfabética)`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedLetter(null)}
                        className="text-xs font-semibold text-gray-400 hover:text-black cursor-pointer"
                      >
                        Fechar ×
                      </button>
                    </div>

                    {((porRuaMode === 'shopping' ? shoppingsByLetter : streetsByLetter)[selectedLetter] || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-[126px] overflow-y-auto overscroll-contain pr-1">
                        {((porRuaMode === 'shopping' ? shoppingsByLetter : streetsByLetter)[selectedLetter] || []).map((street) => {
                          const isSelectedStreet = streetsMatch(street, currentRua)
                          return (
                            <Link
                              key={street}
                              href={buildFilterUrl({ cat: 'por_rua', subcat: '', rua: street })}
                              onClick={() => setSelectedLetter(null)}
                              className={`px-2.5 py-2 text-[15px] leading-tight rounded-[2px] transition-colors flex items-center justify-between gap-2 ${
                                isSelectedStreet
                                  ? 'bg-[#FB6600] text-white font-bold'
                                  : 'text-gray-800 hover:bg-orange-50 hover:text-[#FB6600] font-medium'
                              }`}
                            >
                              <span className="truncate">{street}</span>
                              {isSelectedStreet && (
                                <span className="text-[10px] uppercase tracking-wider shrink-0">Ativa</span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-3">
                        Nenhuma rua comercial cadastrada com a letra {selectedLetter} no momento.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          currentCategory && SUBCATEGORIAS_POR_CATEGORIA[currentCategory] && (
            <div className="w-full bg-white border-t border-gray-100 animate-in fade-in duration-200">
              <div className="mx-auto max-w-[940px] px-4 py-2.5 md:py-2 flex items-center gap-5 md:gap-6 overflow-x-auto no-scrollbar text-[16px] md:text-[13px]">
                {SUBCATEGORIAS_POR_CATEGORIA[currentCategory].map((sub) => {
                  const isSelected = currentSubcat.toLowerCase() === sub.toLowerCase()
                  const targetSubcat = isSelected ? '' : sub.toLowerCase()
                  const targetUrl = buildFilterUrl({ subcat: targetSubcat })

                  return (
                    <Link
                      key={sub}
                      href={targetUrl}
                      className={`whitespace-nowrap uppercase transition-colors duration-150 py-1 font-medium ${
                        isSelected
                          ? 'text-[#FB6600] font-bold border-b-2 border-[#FB6600]'
                          : 'text-gray-700 hover:text-[#FB6600]'
                      }`}
                    >
                      {sub}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        )}
      </nav>

      {/* Modal de Autenticação */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser)
          const photo = loggedInUser?.user_metadata?.avatar_url || loggedInUser?.user_metadata?.picture || null
          setAvatarUrl(photo)
          setIsAuthOpen(false)
          router.refresh()
        }}
        initialMode={authMode} 
      />

      {/* Modal de Planos Comerciais */}
      <PlansModal
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
        onSelectPlan={async (plan) => {
          setIsPlansOpen(false)
          if (!user) {
            openLogin()
            return
          }

          if (typeof document !== 'undefined' && user.id) {
            document.cookie = `kittanda_has_store_${user.id}=true; path=/; max-age=31536000; SameSite=Lax`
          }
          setUser((prev: any) => (prev ? { ...prev, hasStore: true } : prev))

          // Se for o plano gratuito Bronze, vai direto para o painel
          if (plan === 'bronze') {
            router.push(`/painel/loja?plano=${plan}`)
            return
          }

          // Se for plano pago, tenta gerar a tela de pagamento do Mercado Pago
          try {
            const checkoutRes = await createPlanCheckoutAction({
              storeId: user.id,
              planId: plan,
            })

            if (checkoutRes.success && checkoutRes.checkoutUrl) {
              window.location.href = checkoutRes.checkoutUrl
              return
            } else if (checkoutRes.error) {
              alert(`Aviso Mercado Pago: ${checkoutRes.error}`)
            }
          } catch (err: any) {
            console.error('Erro ao gerar checkout do Mercado Pago:', err)
            alert(`Erro ao conectar com Mercado Pago: ${err?.message || err}`)
          }

          // Se não gerou link (ex: loja ainda sendo configurada), abre no painel com o plano selecionado
          router.push(`/painel/loja?plano=${plan}`)
        }}
      />
    </>
  )
}

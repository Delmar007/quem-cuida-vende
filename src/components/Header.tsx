'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import AuthModal from '@/components/AuthModal'
import PlansModal from '@/components/PlansModal'
import { createPlanCheckoutAction } from '@/app/actions/mercadopago-checkout'
import { logoutAction, getSessionUserAction } from '@/app/login/actions'

export default function Header() {
  const router = useRouter()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isMobileCatOpen, setIsMobileCatOpen] = useState(false)
  const [isPromoMenuOpen, setIsPromoMenuOpen] = useState(false)
  const [isPlansOpen, setIsPlansOpen] = useState(false)
  
  const searchParams = useSearchParams()
  const hasParams = searchParams.has('tipo') || searchParams.has('cat') || searchParams.has('q') || searchParams.has('filtro')
  const currentView = searchParams.get('tipo') || (hasParams ? 'lojas' : '')
  const currentCategory = searchParams.get('cat') || ''
  const currentSubcat = searchParams.get('subcat') || ''
  const rawFiltro = searchParams.get('filtro') || ''
  const currentFiltro = rawFiltro
  const currentQuery = searchParams.get('q') || ''

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
    { id: 'feed_que_sigo', label: 'Feed que sigo', isOrange: true },
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
    'Som Automotivo',
    'Óleos',
    'Baterias',
    'Estética',
    'Picapes',
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
  }: {
    tipo?: string
    cat?: string
    subcat?: string
    filtro?: string
    q?: string
  }) => {
    const params = new URLSearchParams()
    if (tipo) params.set('tipo', tipo)
    if (cat) params.set('cat', cat)
    // Valida se a subcategoria realmente pertence à categoria de destino
    if (subcat && cat && SUBCATEGORIAS_POR_CATEGORIA[cat]?.some((s) => s.toLowerCase() === subcat.toLowerCase())) {
      params.set('subcat', subcat.toLowerCase())
    }
    if (filtro) params.set('filtro', filtro)
    if (q) params.set('q', q)
    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

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

  const categories = [
    { label: 'Moda', id: 'moda' },
    { label: 'Pet', id: 'pet' },
    { label: 'Agro', id: 'agro' },
    { label: 'Carro', id: 'carro' },
    { label: 'Escritório', id: 'escritorio' },
    { label: 'Eletro', id: 'eletro' },
    { label: 'Casa', id: 'casa' },
    { label: 'Beleza', id: 'beleza' },
  ]

  return (
    <>
      {/* 1. TOPO: Rola junto com a página */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[940px] px-4 min-h-[72px] py-1.5 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <img 
              src="/logo-kittanda-laranja.png" 
              alt="Kittanda Outlet" 
              className="w-[200px] sm:w-[250px] md:w-[300px] max-w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>

          {/* CAIXA DE BUSCA RETANGULAR COM ÍCONE DE LUPA PRETA */}
          <form onSubmit={handleSearch} className="flex-1 max-w-[420px] mx-4 hidden sm:flex items-center border border-gray-300 focus-within:border-black transition-colors rounded-none bg-white">
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

          <div className="flex items-center gap-2.5 md:gap-3 text-[13px] text-gray-500 font-normal">
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
                  className="text-black hover:text-[#FB6600] font-medium truncate max-w-[100px] md:max-w-[130px] transition-colors cursor-pointer"
                  title="Acessar Meu Perfil (Dados, Foto, WhatsApp, Endereço, Favoritos, Seguindo e Feed que sigo)"
                >
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </Link>
                {Boolean(user.hasStore) && (
                  <>
                    <span className="text-gray-300 text-xs font-light">|</span>
                    <Link
                      href="/painel/loja"
                      className="hover:text-[#FB6600] text-neutral-800 font-semibold transition-colors cursor-pointer text-xs whitespace-nowrap"
                      title="Acessar painel da minha loja"
                    >
                      Minha Loja
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
                  className="hover:text-black transition-colors cursor-pointer text-gray-500"
                >
                  Sair
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
                <span className="hidden sm:inline text-gray-300 text-xs font-light">|</span>
                <button 
                  type="button"
                  onClick={openRegister}
                  className="hidden sm:inline hover:text-black transition-colors cursor-pointer"
                >
                  Crie uma conta
                </button>
              </>
            )}
            <span className="text-gray-300 text-xs font-light">|</span>
            <button 
              type="button" 
              aria-label="Feed que sigo"
              title="Abrir Feed que sigo"
              className="text-gray-400 hover:text-[#FB6600] transition-colors p-0.5 cursor-pointer"
              onClick={() => router.push('/perfil?aba=feed')}
            >
              <svg 
                className="w-5 h-5 stroke-[1.4]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                />
              </svg>
            </button>
            <span className="text-gray-300 text-xs font-light hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() => setIsPlansOpen(true)}
              className="text-[11px] font-bold uppercase tracking-wider text-black hover:text-[#FB6600] transition-colors cursor-pointer hidden sm:inline-flex items-center gap-1"
            >
              <span>Planos</span>
            </button>
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
          <div className="hidden md:flex items-center justify-between gap-3 px-4">
            
            {/* LADO ESQUERDO: Botão de Seleção "Lojas" + Categorias */}
            <div className="flex items-center gap-5 text-[13.5px] font-semibold overflow-x-auto no-scrollbar py-0 flex-1 min-w-0">
              
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
                <span>Lojas</span>
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
                const targetUrl = buildFilterUrl({ cat: targetCat, subcat: targetSubcat })

                const lineStyle = isCatActive
                  ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#FB6600] font-bold"
                  : ""

                return (
                  <Link
                    key={cat.id}
                    href={targetUrl}
                    onClick={() => setIsPromoMenuOpen(false)}
                    className={`py-3.5 whitespace-nowrap transition-colors duration-200 relative shrink-0 ${
                      isCatActive
                        ? 'text-[#FB6600] font-bold ' + lineStyle
                        : 'text-black hover:text-[#FB6600]'
                    }`}
                  >
                    {cat.label}
                  </Link>
                )
              })}
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
                <span>{activePromoObj ? `Promoção: ${activePromoObj.label}` : 'Tipo de Promoção'}</span>
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
                            className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${
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
            <div className="border-l border-gray-200 pl-6 flex items-center h-full shrink-0">
              <Link
                href={buildFilterUrl({ tipo: 'produtos' })}
                className={`flex items-center gap-2 py-3.5 text-[14px] font-semibold transition-colors relative shrink-0 ${
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
                <span>Produtos</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* B. VERSÃO MOBILE (md:hidden): Lojas | Categorias ▾ | Produtos */}
          {/* ========================================================= */}
          <div className="flex md:hidden items-center justify-between px-3 h-11 relative z-[60]">
            {/* LADO ESQUERDO: Lojas */}
            <Link
              href={buildFilterUrl({ tipo: 'lojas' })}
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileCatOpen(false)
              }}
              className={`flex items-center gap-1.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors relative shrink-0 ${
                currentView === 'lojas'
                  ? "text-[#FB6600] font-bold before:content-[''] before:absolute before:-top-[1px] before:left-0 before:right-0 before:h-[2px] before:bg-[#FB6600]"
                  : "text-black hover:text-[#FB6600]"
              }`}
            >
              <svg 
                className={`w-3.5 h-3.5 stroke-[1.6] ${currentView === 'lojas' ? 'text-[#FB6600]' : 'text-black'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Lojas</span>
            </Link>

            {/* MEIO: Botão Categorias que abre o Menu Vertical */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileCatOpen((prev) => !prev)
              }}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold uppercase tracking-wide transition-all border rounded-none cursor-pointer relative z-[60] select-none ${
                isMobileCatOpen || currentCategory
                  ? 'border-[#FB6600] text-[#FB6600] bg-orange-50/60 shadow-xs'
                  : 'border-gray-300 text-black hover:border-black bg-white'
              }`}
            >
              <span>{currentCategory ? (categories.find(c => c.id === currentCategory)?.label || 'Categorias') : 'Categorias'}</span>
              <svg 
                className={`w-3 h-3 stroke-[2] transition-transform duration-200 ${
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
              className={`flex items-center gap-1.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors relative shrink-0 ${
                currentView === 'produtos'
                  ? "text-[#FB6600] font-bold before:content-[''] before:absolute before:-top-[1px] before:left-0 before:right-0 before:h-[2px] before:bg-[#FB6600]"
                  : "text-black hover:text-[#FB6600]"
              }`}
            >
              <svg 
                className={`w-3.5 h-3.5 stroke-[1.6] ${currentView === 'produtos' ? 'text-[#FB6600]' : 'text-black'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Produtos</span>
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
                <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-[2px] max-h-[108px] overflow-y-auto">
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
                        className={`flex items-center justify-between px-3 h-9 text-xs transition-colors ${
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
                <div className="divide-y divide-gray-100">
                  {categories.map((cat) => {
                    const isCatActive = currentCategory === cat.id
                    const targetCat = isCatActive ? '' : cat.id
                    const targetSubcat = isCatActive ? '' : currentSubcat
                    const targetUrl = buildFilterUrl({ cat: targetCat, subcat: targetSubcat })

                    return (
                      <Link
                        key={cat.id}
                        href={targetUrl}
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsMobileCatOpen(false)
                        }}
                        className={`flex items-center justify-between px-3 py-3 text-xs tracking-wide transition-colors ${
                          isCatActive
                            ? 'text-[#FB6600] font-bold bg-orange-50/50'
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

                {/* Opção para limpar / ver todas as categorias */}
                <div className="mt-2 pt-2 border-t border-gray-100 px-3 pb-2">
                  <Link
                    href={buildFilterUrl({ cat: '', subcat: '' })}
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMobileCatOpen(false)
                    }}
                    className="text-xs text-gray-500 hover:text-[#FB6600] flex items-center justify-between py-1 font-medium"
                  >
                    <span>Limpar filtro de categoria</span>
                    <span className="text-gray-400">&times;</span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* D. SUBCATEGORIAS DINÂMICAS: Moda, Pet, Agro, Carro, Escritório, Eletro, Casa, Beleza, etc. (Apenas palavras, entre o banner e a linha inferior) */}
        {/* ========================================================= */}
        {(currentCategory && SUBCATEGORIAS_POR_CATEGORIA[currentCategory]) && (
          <div className="w-full bg-white border-t border-gray-100 animate-in fade-in duration-200">
            <div className="mx-auto max-w-[940px] px-4 py-2 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar text-[12.5px] sm:text-[13px]">
              {SUBCATEGORIAS_POR_CATEGORIA[currentCategory].map((sub) => {
                const isSelected = currentSubcat.toLowerCase() === sub.toLowerCase()
                const targetSubcat = isSelected ? '' : sub.toLowerCase()
                const targetUrl = buildFilterUrl({ subcat: targetSubcat })

                return (
                  <Link
                    key={sub}
                    href={targetUrl}
                    className={`whitespace-nowrap transition-colors duration-150 py-1 font-medium ${
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
            }
          } catch (err) {
            console.warn('Fallback para o painel da loja:', err)
          }

          // Se não gerou link (ex: loja ainda sendo configurada), abre no painel com o plano selecionado
          router.push(`/painel/loja?plano=${plan}`)
        }}
      />
    </>
  )
}

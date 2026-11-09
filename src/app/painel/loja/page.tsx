'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMyStoresAction, updateStoreAction, updateStorePlanAction, StoreAdminData } from '@/app/actions/store-admin'
import { getStoreProductsAction } from '@/app/actions/products'
import StorePreviewModal, { StorePreviewData } from '@/components/StorePreviewModal'
import PlansModal, { PlanType } from '@/components/PlansModal'
import LogoAdjustModal from '@/components/merchant/LogoAdjustModal'
import BannerAdjustModal from '@/components/merchant/BannerAdjustModal'
import SmallBannerAdjustModal from '@/components/merchant/SmallBannerAdjustModal'
import { getPlan } from '@/lib/plans'

// Módulos Expandidos da Área do Lojista
import MerchantCategoriesTab from '@/components/merchant/MerchantCategoriesTab'
import MerchantProductsTab from '@/components/merchant/MerchantProductsTab'
import MerchantInvitesTab from '@/components/merchant/MerchantInvitesTab'
import MerchantMetricsTab from '@/components/merchant/MerchantMetricsTab'
import MerchantFavoritesTab from '@/components/merchant/MerchantFavoritesTab'
import MerchantBirthdaysTab from '@/components/merchant/MerchantBirthdaysTab'
import MerchantSubscriptionTab from '@/components/merchant/MerchantSubscriptionTab'
import MerchantPromoTimerTab from '@/components/merchant/MerchantPromoTimerTab'

const CATEGORIAS = [
  { id: 'moda', label: 'Moda', icon: '👗' },
  { id: 'pet', label: 'Pet', icon: '🐾' },
  { id: 'agro', label: 'Agro', icon: '🌱' },
  { id: 'carro', label: 'Carro', icon: '🚗' },
  { id: 'escritorio', label: 'Escritório', icon: '💼' },
  { id: 'eletro', label: 'Eletro', icon: '⚡' },
  { id: 'casa', label: 'Casa', icon: '🏠' },
  { id: 'beleza', label: 'Beleza', icon: '💄' },
]

const SUBCATEGORIAS_POR_CATEGORIA: Record<string, string[]> = {
  moda: [
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
  ],
  pet: [
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
  ],
  agro: [
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
  ],
  carro: [
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
  ],
  escritorio: [
    'Papelaria',
    'Móveis',
    'Computadores',
    'Impressoras',
    'Suprimentos',
    'Escolar',
    'Escritório',
  ],
  eletro: [
    'Celulares',
    'Eletrodomésticos',
    'Informática',
    'Games',
    'Áudio e Vídeo',
    'Acessórios',
    'Segurança',
  ],
  casa: [
    'Móveis',
    'Decoração',
    'Cama, Mesa e Banho',
    'Cozinha',
    'Eletrodomésticos',
    'Iluminação',
    'Jardim e Piscina',
    'Utilidades Domésticas',
    'Colchões',
  ],
  beleza: [
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
  ],
}

// OS 11 TÓPICOS DA ÁREA DO LOJISTA
const TOPICOS = [
  {
    id: 1,
    numero: '01',
    titulo: 'Dados da loja',
    subtitulo: 'Nome, responsável, WhatsApp, logo, descrição e endereço comercial',
    icone: '🏬',
  },
  {
    id: 2,
    numero: '02',
    titulo: 'Categorias e Segmentos',
    subtitulo: 'Segmento principal e subcategorias da loja',
    icone: '🏷️',
  },
  {
    id: 3,
    numero: '03',
    titulo: 'Banner Triplo da Loja (Todos os Planos)',
    subtitulo: 'Topo interno da sua loja (e filtro Lojas no Plano Ouro)',
    icone: '🖼️',
  },
  {
    id: 4,
    numero: '04',
    titulo: 'Banner do Filtro Lojas (Single / Duplo)',
    subtitulo: 'Single (Bronze) ou Duplo (Bronze Plus e Prata) para o feed Lojas',
    icone: '🪪',
  },
  {
    id: 5,
    numero: '05',
    titulo: 'Categorias e Subcategorias',
    subtitulo: 'Organizar produtos por tipos e filtros',
    icone: '🗂️',
  },
  {
    id: 6,
    numero: '06',
    titulo: 'Catálogo de Produtos',
    subtitulo: 'Cadastrar produtos e limites do plano',
    icone: '📦',
  },
  {
    id: 7,
    numero: '07',
    titulo: 'Sistema de Convites VIP',
    subtitulo: 'Convide lojistas parceiros selecionados',
    icone: '🎟️',
  },
  {
    id: 8,
    numero: '08',
    titulo: 'Desempenho e Métricas',
    subtitulo: 'Acessos, cliques no WhatsApp e conversão',
    icone: '📊',
  },
  {
    id: 9,
    numero: '09',
    titulo: 'Lista de Preferidos',
    subtitulo: 'Produtos favoritados pelos clientes',
    icone: '❤️',
  },
  {
    id: 10,
    numero: '10',
    titulo: 'Aniversariantes Seguidores',
    subtitulo: 'Seguidores que comemoram este mês',
    icone: '🎂',
  },
  {
    id: 11,
    numero: '11',
    titulo: 'Plano & Cobrança',
    subtitulo: 'Vencimento dia 10, tolerância e faturas',
    icone: '💳',
  },
  {
    id: 12,
    numero: '13',
    titulo: 'Cronômetro de Promoção',
    subtitulo: 'Termômetro temporal de campanha com início e fim',
    icone: '⏱️',
  },
]

function MerchantStoreAdminContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Tópico ativo (1 a 12, aceitando 13 para Cronômetro de Promoção)
  const rawTopic = parseInt(searchParams.get('topico') || '1', 10)
  const initialTopic = rawTopic === 13 ? 12 : rawTopic
  const [currentTopic, setCurrentTopic] = useState<number>(
    initialTopic >= 1 && initialTopic <= 12 ? initialTopic : 1
  )
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Estados de Carregamento e Seleção de Loja
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(true)
  const [stores, setStores] = useState<StoreAdminData[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [productsCount, setProductsCount] = useState<number>(0)

  // Consulta da contagem real de produtos da loja ativa
  const loadStoreProductCount = async (storeId: string) => {
    if (!storeId) return
    try {
      const res = await getStoreProductsAction(storeId)
      if (res && res.success && res.products) {
        setProductsCount(res.products.length)
      } else {
        setProductsCount(0)
      }
    } catch {
      setProductsCount(0)
    }
  }

  // Estados dos Campos (Tópico 01 — Dados da Loja e Responsável)
  const [name, setName] = useState('')
  const [responsibleName, setResponsibleName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [cnpjCpf, setCnpjCpf] = useState('')

  // Logotipo
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isLogoAdjustModalOpen, setIsLogoAdjustModalOpen] = useState(false)
  const [logoAdjustSource, setLogoAdjustSource] = useState<string | null>(null)

  // Estados dos Campos (Tópico 02 — Endereço Comercial)
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)

  // Estados dos Campos (Tópico 03 — Categorias e Segmentos)
  const [category, setCategory] = useState('moda')
  const [subcategories, setSubcategories] = useState<string[]>(['Feminina', 'Masculina'])

  // Estados dos Campos (Tópico 04 — Dispositivo Banner Grande: 940 × 370 px)
  const [currentLargeBannerUrl, setCurrentLargeBannerUrl] = useState<string | null>(null)
  const [largeBannerFile, setLargeBannerFile] = useState<File | null>(null)
  const [largeBannerPreview, setLargeBannerPreview] = useState<string | null>(null)
  const largeBannerInputRef = useRef<HTMLInputElement>(null)
  const [isLargeBannerAdjustModalOpen, setIsLargeBannerAdjustModalOpen] = useState(false)
  const [largeBannerAdjustSource, setLargeBannerAdjustSource] = useState<string | null>(null)

  // Estados dos Campos (Tópico 05 — Dispositivo Banner Pequeno: 16:10 / 400 × 250 px)
  const [currentSmallBannerUrl, setCurrentSmallBannerUrl] = useState<string | null>(null)
  const [smallBannerFile, setSmallBannerFile] = useState<File | null>(null)
  const [smallBannerPreview, setSmallBannerPreview] = useState<string | null>(null)
  const smallBannerInputRef = useRef<HTMLInputElement>(null)
  const [isSmallBannerAdjustModalOpen, setIsSmallBannerAdjustModalOpen] = useState(false)
  const [smallBannerAdjustSource, setSmallBannerAdjustSource] = useState<string | null>(null)

  // Ações, Feedback e Modais
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Formatação de Telefone / WhatsApp
  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11)
    if (raw.length <= 2) return raw
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
  }

  // Formatação de CNPJ
  const formatCnpj = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 14)
    if (raw.length <= 2) return raw
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`
    if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`
    if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`
  }

  // Preencher formulário a partir da loja selecionada
  const populateStoreForm = (store: StoreAdminData) => {
    setName(store.name || '')
    setResponsibleName(store.responsible_name || '')
    setDescription(store.description || '')
    setCategory(store.category || 'moda')
    setSubcategories(store.subcategories || ['Feminina', 'Masculina'])
    setCep(store.cep || '')
    setStreet(store.street || '')
    setNumber(store.number || '')
    setNeighborhood(store.neighborhood || '')
    setCity(store.city || '')
    setState(store.state || '')
    setPhone(store.phone ? formatPhone(store.phone) : '')
    setCnpjCpf(store.cnpj_cpf ? formatCnpj(store.cnpj_cpf) : '')

    setCurrentLogoUrl(store.logo_url)
    setLogoFile(null)
    setLogoPreview(null)

    setCurrentLargeBannerUrl(store.large_banner_url)
    setLargeBannerFile(null)
    setLargeBannerPreview(null)

    setCurrentSmallBannerUrl(store.small_banner_url)
    setSmallBannerFile(null)
    setSmallBannerPreview(null)

    setIsDirty(false)
  }

  // Carregar lojas do usuário logado
  const loadUserStores = async () => {
    setLoading(true)
    try {
      const res = await getMyStoresAction()
      if (!res.authenticated) {
        setAuthenticated(false)
        return
      }
      setAuthenticated(true)
      const userStores = res.stores || []
      setStores(userStores)

      if (userStores.length > 0) {
        const initialStore = userStores[0]
        setSelectedStoreId(initialStore.id)
        populateStoreForm(initialStore)
      } else {
        // Inicializar loja default no plano gratuito Bronze
        const defaultStore: StoreAdminData = {
          id: `store-${Date.now()}`,
          name: '',
          slug: `loja-${Math.floor(1000 + Math.random() * 9000)}`,
          responsible_name: '',
          phone: '',
          cep: '',
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          category: 'moda',
          subcategories: [],
          large_banner_url: null,
          small_banner_url: null,
          logo_url: null,
          description: '',
          cnpj_cpf: null,
          plan: 'bronze',
          contracted_plan: 'bronze',
          effective_plan: 'bronze',
          subscription_status: 'active',
          payment_status: 'paid',
          is_active: true,
          created_at: new Date().toISOString(),
        }
        setStores([defaultStore])
        setSelectedStoreId(defaultStore.id)
        populateStoreForm(defaultStore)
      }
    } catch (err) {
      console.error('Falha ao consultar lojas:', err)
      setFeedback({ type: 'error', message: 'Erro ao carregar lojas do lojista.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserStores()
  }, [])

  useEffect(() => {
    if (selectedStoreId) {
      loadStoreProductCount(selectedStoreId)
    }
  }, [selectedStoreId])

  // Trocar de loja
  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    if (isDirty) {
      const confirmed = window.confirm(
        'Você possui alterações não salvas nesta loja. Deseja realmente trocar de loja e descartar as alterações?'
      )
      if (!confirmed) return
    }
    setSelectedStoreId(newId)
    loadStoreProductCount(newId)
    const found = stores.find((s) => s.id === newId)
    if (found) {
      populateStoreForm(found)
      setFeedback(null)
    }
  }

  // Alerta de saída com alterações pendentes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Busca automática do CEP via ViaCEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = raw
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`
    }
    setCep(formatted)
    setIsDirty(true)

    if (raw.length === 8) {
      setLoadingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setStreet(data.logradouro || '')
          setNeighborhood(data.bairro || '')
          setCity(data.localidade || '')
          setState(data.uf || '')
        }
      } catch (err) {
        console.warn('Erro ao consultar ViaCEP:', err)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  // Alternar categoria principal
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat)
    const validSubs = SUBCATEGORIAS_POR_CATEGORIA[newCat] || []
    setSubcategories((prev) => {
      const filtered = prev.filter((s) => validSubs.includes(s))
      if (filtered.length > 0) return filtered
      if (newCat === 'carro') return ['Usados', 'Concessionária']
      return validSubs.slice(0, 2)
    })
    setIsDirty(true)
  }

  // Alternar subcategoria
  const toggleSubcategory = (sub: string) => {
    setSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    )
    setIsDirty(true)
  }

  // Upload Logotipo com Abertura Automática da Ferramenta de Zoom e Enquadramento Circular
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setFeedback({ type: 'error', message: 'Formato inválido para logotipo. Use JPEG, PNG ou WebP.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'O arquivo do logotipo não pode exceder 5 MB.' })
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setLogoFile(file)
    setLogoPreview(objectUrl)
    setIsDirty(true)

    // Abre a ferramenta para permitir dar zoom e enquadrar perfeitamente dentro do círculo
    setLogoAdjustSource(objectUrl)
    setIsLogoAdjustModalOpen(true)
  }

  const handleApplyLogoAdjustment = (adjustedFile: File, previewUrl: string) => {
    setLogoFile(adjustedFile)
    setLogoPreview(previewUrl)
    setIsDirty(true)
    setFeedback({
      type: 'success',
      message: 'Logotipo enquadrado no círculo com sucesso! Lembre-se de clicar em "Salvar Alterações".',
    })
  }

  const handleOpenLogoAdjust = () => {
    const src = logoPreview || currentLogoUrl
    if (src) {
      setLogoAdjustSource(src)
      setIsLogoAdjustModalOpen(true)
    } else {
      logoInputRef.current?.click()
    }
  }

  const cancelLogoSelection = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  // Upload Banner Grande (940 × 370 px) com Abertura Automática da Ferramenta de Ajuste
  const handleLargeBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setFeedback({ type: 'error', message: 'Formato inválido para o banner grande. Use JPEG, PNG ou WebP.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'O banner grande excede o tamanho máximo de 5 MB.' })
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setLargeBannerFile(file)
    setLargeBannerPreview(objectUrl)
    setIsDirty(true)

    // Abre a ferramenta para movimentar e dar zoom no banner grande
    setLargeBannerAdjustSource(objectUrl)
    setIsLargeBannerAdjustModalOpen(true)
  }

  const handleApplyLargeBannerAdjustment = (adjustedFile: File, previewUrl: string) => {
    setLargeBannerFile(adjustedFile)
    setLargeBannerPreview(previewUrl)
    setIsDirty(true)
    setFeedback({
      type: 'success',
      message: 'Banner Grande enquadrado com sucesso! Lembre-se de clicar em "Salvar Alterações".',
    })
  }

  const handleOpenLargeBannerAdjust = () => {
    const src = largeBannerPreview || currentLargeBannerUrl
    if (src) {
      setLargeBannerAdjustSource(src)
      setIsLargeBannerAdjustModalOpen(true)
    } else {
      largeBannerInputRef.current?.click()
    }
  }

  const cancelLargeBannerSelection = () => {
    setLargeBannerFile(null)
    setLargeBannerPreview(null)
    if (largeBannerInputRef.current) largeBannerInputRef.current.value = ''
  }

  // Upload Banner Pequeno (16:10 / 400 × 250 px) com Abertura Automática da Ferramenta de Ajuste
  const handleSmallBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setFeedback({ type: 'error', message: 'Formato inválido para o banner pequeno. Use JPEG, PNG ou WebP.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'O banner pequeno excede o limite de 5 MB.' })
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setSmallBannerFile(file)
    setSmallBannerPreview(objectUrl)
    setIsDirty(true)

    // Abre a ferramenta para movimentar e dar zoom no banner pequeno
    setSmallBannerAdjustSource(objectUrl)
    setIsSmallBannerAdjustModalOpen(true)
  }

  const handleApplySmallBannerAdjustment = (adjustedFile: File, previewUrl: string) => {
    setSmallBannerFile(adjustedFile)
    setSmallBannerPreview(previewUrl)
    setIsDirty(true)
    setFeedback({
      type: 'success',
      message: 'Banner Pequeno enquadrado com sucesso! Lembre-se de clicar em "Salvar Alterações".',
    })
  }

  const handleOpenSmallBannerAdjust = () => {
    const src = smallBannerPreview || currentSmallBannerUrl
    if (src) {
      setSmallBannerAdjustSource(src)
      setIsSmallBannerAdjustModalOpen(true)
    } else {
      smallBannerInputRef.current?.click()
    }
  }

  const cancelSmallBannerSelection = () => {
    setSmallBannerFile(null)
    setSmallBannerPreview(null)
    if (smallBannerInputRef.current) smallBannerInputRef.current.value = ''
  }

  // Salvar alterações
  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedStoreId) return

    if (!name.trim() || name.trim().length < 2) {
      setFeedback({ type: 'error', message: 'O nome comercial da loja é obrigatório (mínimo 2 caracteres).' })
      setCurrentTopic(1)
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('responsible_name', responsibleName.trim())
      formData.append('description', description.trim())
      formData.append('category', category)
      formData.append('subcategories', JSON.stringify(subcategories))
      formData.append('cep', cep.trim())
      formData.append('street', street.trim())
      formData.append('number', number.trim())
      formData.append('neighborhood', neighborhood.trim())
      formData.append('city', city.trim())
      formData.append('state', state.trim().toUpperCase())
      formData.append('phone', phone)
      formData.append('cnpj_cpf', cnpjCpf.trim())

      const currentStoreForSave = stores.find((s) => s.id === selectedStoreId) || stores[0] || null
      const activePlanForSave = (currentStoreForSave?.effective_plan || currentStoreForSave?.plan || 'bronze').toLowerCase()

      if (logoFile) {
        formData.append('logo_file', logoFile)
      }
      if (largeBannerFile) {
        formData.append('large_banner_file', largeBannerFile)
      }
      if (smallBannerFile) {
        formData.append('small_banner_file', smallBannerFile)
      }

      const res = await updateStoreAction(selectedStoreId, formData)

      if (res.success && res.store) {
        setFeedback({ type: 'success', message: 'Dados da loja e banners atualizados e publicados com sucesso!' })
        setIsDirty(false)
        setStores((prev) =>
          prev.map((s) => (s.id === selectedStoreId ? res.store! : s))
        )
        populateStoreForm(res.store)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('kittanda:store-saved'))
        }
        router.refresh()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao salvar alterações da loja.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao salvar alterações.' })
    } finally {
      setIsSaving(false)
    }
  }

  const completedStepsCount = React.useMemo(() => {
    let count = 0
    if (name?.trim() && (city?.trim() || street?.trim())) count++
    if (category) count++
    if (largeBannerPreview || currentLargeBannerUrl) count++
    if (smallBannerPreview || currentSmallBannerUrl) count++
    if (subcategories && subcategories.length > 0) count++
    if (productsCount > 0) count++
    count += 5
    return count
  }, [name, city, street, category, largeBannerPreview, currentLargeBannerUrl, smallBannerPreview, currentSmallBannerUrl, subcategories, productsCount])

  const activeStore = stores.find((s) => s.id === selectedStoreId) || stores[0] || null

  const previewData: StorePreviewData = {
    name: name.trim() || 'Nome da Loja',
    description: description.trim() || null,
    category,
    subcategories,
    street: street.trim() || null,
    number: number.trim() || null,
    neighborhood: neighborhood.trim() || null,
    city: city.trim() || null,
    state: state.trim() || null,
    cep: cep.trim() || null,
    phone: phone || null,
    logoPreview: logoPreview || currentLogoUrl || activeStore?.logo_url || null,
    logoUrl: logoPreview || currentLogoUrl || activeStore?.logo_url || null,
    largeBannerPreview: largeBannerPreview || currentLargeBannerUrl || activeStore?.large_banner_url || null,
    largeBannerUrl: largeBannerPreview || currentLargeBannerUrl || activeStore?.large_banner_url || null,
    plan: activeStore?.effective_plan || activeStore?.plan || 'bronze',
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Carregando Área do Lojista...
        </span>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 border border-neutral-200 text-center shadow-sm">
        <span className="text-4xl block mb-3">🔒</span>
        <h2 className="text-lg font-bold text-neutral-900 mb-2">Acesso Restrito ao Lojista</h2>
        <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
          Para acessar a área do lojista e gerenciar sua loja na Kittanda Outlet, você precisa estar conectado.
        </p>
        <Link
          href="/login"
          className="inline-block w-full py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Fazer Login
        </Link>
      </div>
    )
  }

  const currentPlanConfig = getPlan(activeStore?.effective_plan || activeStore?.plan)
  const isBronze = (activeStore?.effective_plan || activeStore?.plan || 'bronze') === 'bronze'
  const activeTopic = TOPICOS.find((t) => t.id === currentTopic) || TOPICOS[0]

  return (
    <div className="w-full pb-20">
      {/* Topo Geral da Área do Lojista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Painel da loja
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Gerencie sua loja, catálogo e configurações.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor de lojas do lojista */}
          {stores.length > 0 && (
            <div className="flex items-center gap-1.5 mr-1">
              <label htmlFor="store-select" className="text-xs text-neutral-500 whitespace-nowrap">
                Loja:
              </label>
              <select
                id="store-select"
                value={selectedStoreId}
                onChange={handleStoreChange}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-neutral-200 rounded-[2px] text-neutral-800 focus:outline-none focus:border-neutral-900 transition-colors"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || 'Nova Loja (sem nome)'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const newStoreDraft: StoreAdminData = {
                    id: `store-${Date.now()}`,
                    name: '',
                    slug: `loja-${Math.floor(1000 + Math.random() * 9000)}`,
                    responsible_name: '',
                    phone: '',
                    cep: '',
                    street: '',
                    number: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    category: 'moda',
                    subcategories: ['Feminina', 'Masculina'],
                    large_banner_url: null,
                    small_banner_url: null,
                    logo_url: null,
                    description: '',
                    cnpj_cpf: '',
                    plan: 'bronze',
                    contracted_plan: 'bronze',
                    effective_plan: 'bronze',
                    subscription_status: 'active',
                    payment_status: 'paid',
                    is_active: true,
                    created_at: new Date().toISOString(),
                  }
                  setStores((prev) => [newStoreDraft, ...prev])
                  setSelectedStoreId(newStoreDraft.id)
                  populateStoreForm(newStoreDraft)
                  setCurrentTopic(1)
                  setFeedback({
                    type: 'success',
                    message: 'Preencha os dados da nova loja abaixo e clique em "Salvar Alterações".',
                  })
                }}
                className="px-2.5 py-1.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-semibold rounded-[2px] transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                title="Cadastrar mais uma loja na sua conta"
              >
                + Nova Loja
              </button>
            </div>
          )}

          {/* Botão Principal: Pré-visualizar loja */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            title="Pré-visualizar como o cliente vê no celular ou computador"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Pré-visualizar loja</span>
          </button>

          {/* Botão Secundário: Ver loja */}
          {activeStore && (
            <Link
              href={`/loja/${activeStore.slug || activeStore.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-300 text-xs font-semibold rounded-[2px] transition-colors flex items-center gap-1.5"
              title="Abrir vitrine da loja em nova aba"
            >
              <span>Ver loja</span>
              <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Alerta de Feedback (Sucesso / Erro) */}
      {feedback && (
        <div
          className={`p-4 mb-6 text-xs rounded-[2px] flex items-center justify-between border animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-sm font-bold opacity-60 hover:opacity-100 ml-4 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SELETOR RETRÁTIL DE ETAPAS DE GESTÃO NO MOBILE                            */}
      {/* ========================================================================= */}
      <div className="lg:hidden mb-6 bg-white border border-neutral-200/90 rounded-[4px] shadow-2xs overflow-hidden">
        {/* Cabeçalho do Seletor: Mostra a Etapa Ativa e Alterna Abertura */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="w-full p-3.5 flex items-center justify-between text-left bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer"
          aria-expanded={isMobileMenuOpen}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-7 h-7 rounded-[3px] bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              {activeTopic.numero}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
                Etapa {activeTopic.numero} de 11 • Toque para alterar
              </span>
              <span className="text-sm font-bold text-neutral-900 truncate block">
                {activeTopic.titulo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[11px] font-semibold text-neutral-500 hidden sm:inline">
              {isMobileMenuOpen ? 'Recolher' : 'Trocar etapa'}
            </span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180 bg-neutral-100 text-neutral-900' : 'bg-neutral-50 text-neutral-600'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Resumo compacto de produtos quando recolhido */}
        {!isMobileMenuOpen && (
          <div className="px-3.5 py-2 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600">
            <span>
              <strong>Plano {currentPlanConfig.name}:</strong> {productsCount}/{currentPlanConfig.maxActiveProducts} produtos
            </span>
            <button
              type="button"
              onClick={() => setIsPlansModalOpen(true)}
              className="text-[#FB6600] font-semibold hover:underline cursor-pointer"
            >
              Planos
            </button>
          </div>
        )}

        {/* Lista dos 11 Itens: ao clicar recolhe o restante, mostrando abaixo as caixas */}
        {isMobileMenuOpen && (
          <div className="border-t border-neutral-200/80 bg-neutral-50/40 p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span>Etapas de Gestão</span>
              <span className="font-mono text-neutral-500">{completedStepsCount}/11 concluídas</span>
            </div>

            <div className="divide-y divide-neutral-100 bg-white rounded-[3px] border border-neutral-200/60 overflow-hidden">
              {TOPICOS.map((topico) => {
                const isActive = currentTopic === topico.id
                const isRestrictedTopic = (topico.id === 3 && isBronze) || (topico.id === 4 && !isBronze)
                return (
                  <button
                    key={topico.id}
                    type="button"
                    onClick={() => {
                      setCurrentTopic(topico.id)
                      setIsMobileMenuOpen(false) // Recolhe o restante e mostra as caixas abaixo!
                    }}
                    className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer text-xs ${
                      isActive
                        ? 'bg-neutral-100/90 text-neutral-900 font-bold border-l-3 border-neutral-900'
                        : isRestrictedTopic
                        ? 'text-neutral-400 hover:bg-neutral-50 font-normal'
                        : 'text-neutral-700 hover:bg-neutral-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`font-mono text-xs shrink-0 ${isActive ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}>
                        {topico.numero}
                      </span>
                      <div className="min-w-0">
                        <span className={`block truncate ${topico.id === 6 ? 'font-black text-black' : ''}`}>
                          {topico.id === 6 ? <strong>{topico.titulo}</strong> : topico.titulo} {isRestrictedTopic ? '🔒' : ''}
                        </span>
                        <span className="text-[10px] text-neutral-400 block truncate font-normal">
                          {isRestrictedTopic ? 'Restrito — não pertence ao seu pacote' : topico.subtitulo}
                        </span>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="text-xs text-neutral-900 font-bold shrink-0 ml-2">✓ Ativo</span>
                    ) : isRestrictedTopic ? (
                      <span className="text-[10px] text-neutral-400 shrink-0 ml-2">🔒</span>
                    ) : (
                      <span className="text-xs text-neutral-400 shrink-0 ml-2">›</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Estrutura Principal: Menu Lateral Esquerdo + Área de Conteúdo */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        
        {/* ========================================================================= */}
        {/* MENU LATERAL ESQUERDO COM AS 11 ETAPAS (DESKTOP)                          */}
        {/* ========================================================================= */}
        <aside className="hidden lg:block w-[280px] shrink-0 bg-white border border-neutral-200/80 rounded-[4px] overflow-hidden sticky top-20 shadow-xs">
          
          {/* Identificação da Loja */}
          <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-neutral-200">
              {logoPreview || currentLogoUrl ? (
                <img src={logoPreview || currentLogoUrl!} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{name ? name[0].toUpperCase() : 'L'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-semibold text-neutral-900 truncate">
                {name || 'Minha Loja'}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {city ? `${city}${state ? ` • ${state}` : ''}` : 'Kittanda Outlet'}
              </p>
            </div>
          </div>

          {/* Resumo Compacto do Plano e Limite de Produtos (Requisito Seção 4) */}
          <div className="p-4 bg-neutral-50/60 border-b border-neutral-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800">
                Plano {currentPlanConfig.name}
              </span>
              <button
                type="button"
                onClick={() => setIsPlansModalOpen(true)}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
              >
                Planos
              </button>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {productsCount} de {currentPlanConfig.maxActiveProducts} produtos utilizados
            </div>
            <div className="w-full bg-neutral-200/80 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-neutral-800 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((productsCount / currentPlanConfig.maxActiveProducts) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Progresso Compacto das Etapas */}
          <div className="px-4 py-2 bg-white border-b border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="font-medium text-neutral-600">Etapas de Gestão</span>
            <span className="font-mono text-neutral-400">
              {completedStepsCount}/11 concluídas
            </span>
          </div>

          {/* Navegação Vertical das 11 Etapas */}
          <nav className="p-2 flex flex-col gap-0.5">
            {TOPICOS.map((topico) => {
              const isActive = currentTopic === topico.id
              const isRestrictedTopic = (topico.id === 3 && isBronze) || (topico.id === 4 && !isBronze)
              return (
                <button
                  key={topico.id}
                  type="button"
                  onClick={() => setCurrentTopic(topico.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[3px] text-left transition-colors cursor-pointer text-xs ${
                    isActive
                      ? 'bg-neutral-100/90 text-neutral-900 font-semibold border-l-2 border-neutral-900'
                      : isRestrictedTopic
                      ? 'text-neutral-400 hover:bg-neutral-50 font-normal'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-normal'
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] shrink-0 ${
                      isActive || topico.id === 6 ? 'text-neutral-900 font-black' : 'text-neutral-400'
                    }`}
                  >
                    {topico.numero}
                  </span>
                  <span className={`truncate flex-1 ${topico.id === 6 ? 'font-black text-neutral-950' : ''}`}>
                    {topico.id === 6 ? <strong>{topico.titulo}</strong> : topico.titulo}
                  </span>
                  {isRestrictedTopic && (
                    <span className="text-[10px] shrink-0" title="Restrito ao pacote">
                      🔒
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* ========================================================================= */}
        {/* ÁREA DE CONTEÚDO DO TÓPICO SELECIONADO                                    */}
        {/* ========================================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          <form id="store-profile-form" onSubmit={handleSaveChanges} className={currentTopic <= 4 ? "space-y-6" : "hidden"}>

            {/* ------------------------------------------------------------------- */}
            {/* TÓPICO 01: DADOS DA LOJA (IDENTIFICAÇÃO + ENDEREÇO COMERCIAL)      */}
            {/* ------------------------------------------------------------------- */}
            {currentTopic === 1 && (
              <section className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-[2px] shadow-sm animate-in fade-in duration-200">
                <div className="border-b border-neutral-100 pb-4 mb-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                      Tópico 01
                    </span>
                    <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                      Dados da loja
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Identificação da loja, responsável legal e endereço comercial.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Logotipo da Loja */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left border-b md:border-b-0 md:border-r border-neutral-100 pb-6 md:pb-0 md:pr-6">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2 block">
                      Logotipo / Imagem de Perfil
                    </label>

                    <div className="relative w-34 h-34 rounded-full overflow-hidden flex items-center justify-center shrink-0 mb-3 bg-neutral-100">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Preview do Logotipo"
                          className="w-full h-full object-cover"
                        />
                      ) : currentLogoUrl ? (
                        <img
                          src={currentLogoUrl}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-black uppercase text-neutral-400">
                          {name ? name[0] : 'L'}
                        </span>
                      )}
                    </div>

                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoFileChange}
                      className="hidden"
                      id="logo-file-input"
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-[2px]"
                      >
                        {logoFile || currentLogoUrl ? 'Substituir Logotipo' : 'Carregar Logotipo'}
                      </button>

                      {(logoPreview || currentLogoUrl) && (
                        <button
                          type="button"
                          onClick={handleOpenLogoAdjust}
                          className="px-3 py-1.5 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black text-[10.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-[2px] flex items-center justify-center gap-1.5 bg-neutral-50 shadow-2xs"
                          title="Dar zoom na imagem e fazer caber perfeitamente no círculo"
                        >
                          <span>🔍 Ajustar Zoom no Círculo</span>
                        </button>
                      )}

                      {logoFile && (
                        <button
                          type="button"
                          onClick={cancelLogoSelection}
                          className="px-3 py-1 text-[10.5px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          Cancelar seleção
                        </button>
                      )}

                      <span className="text-[10px] text-neutral-400 mt-1 leading-tight">
                        Formatos: JPEG, PNG, WebP (até 5MB).
                      </span>
                    </div>
                  </div>

                  {/* Campos Cadastrais */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Nome Comercial da Loja *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="Ex.: Elegance Moda & Outlet"
                        className="w-full border border-neutral-300 px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Nome do Responsável Legal *
                      </label>
                      <input
                        type="text"
                        required
                        value={responsibleName}
                        onChange={(e) => {
                          setResponsibleName(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="Ex.: Carlos Eduardo Santos"
                        className="w-full border border-neutral-300 px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                          WhatsApp da Loja *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => {
                            setPhone(formatPhone(e.target.value))
                            setIsDirty(true)
                          }}
                          placeholder="(67) 99876-5432"
                          className="w-full border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                        />
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">
                          Clientes chamarão diretamente neste número.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                          CNPJ
                        </label>
                        <input
                          type="text"
                          maxLength={18}
                          value={cnpjCpf}
                          onChange={(e) => {
                            setCnpjCpf(formatCnpj(e.target.value))
                            setIsDirty(true)
                          }}
                          placeholder="00.000.000/0001-00"
                          className="w-full border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                          Descrição Comercial da Loja
                        </label>
                        <span className={`text-[10.5px] font-medium ${
                          description.length > 500 ? 'text-rose-600 font-bold' : 'text-neutral-400'
                        }`}>
                          {description.length}/500 caracteres
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="Apresente sua loja aos consumidores da região, principais marcas, especialidades e diferenciais..."
                        className="w-full border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Divisória e Seção de Endereço Comercial integrada no Tópico 01 */}
                <div className="border-t border-neutral-200 mt-8 pt-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                      Endereço Comercial & Localização Física
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Endereço para os consumidores encontrarem seu estabelecimento e calcularem proximidade.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                          CEP {loadingCep && <span className="text-xs text-[#FB6600] animate-pulse">Buscando...</span>}
                        </label>
                        <input
                          type="text"
                          maxLength={9}
                          value={cep}
                          onChange={handleCepChange}
                          placeholder="79000-000"
                          className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                        />
                        <span className="text-[10px] text-neutral-400 mt-0.5 block">
                          Auto-preenchimento ViaCEP
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                          Logradouro / Rua / Avenida
                        </label>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => {
                            setStreet(e.target.value)
                            setIsDirty(true)
                          }}
                          placeholder="Ex.: Rua 14 de Julho"
                          className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                          Número
                        </label>
                        <input
                          type="text"
                          value={number}
                          onChange={(e) => {
                            setNumber(e.target.value)
                            setIsDirty(true)
                          }}
                          placeholder="1234 ou S/N"
                          className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                          Bairro
                        </label>
                        <input
                          type="text"
                          value={neighborhood}
                          onChange={(e) => {
                            setNeighborhood(e.target.value)
                            setIsDirty(true)
                          }}
                          placeholder="Centro"
                          className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                          Cidade / Município
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value)
                            setIsDirty(true)
                          }}
                          placeholder="Campo Grande"
                          className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                          Estado (UF)
                        </label>
                        <select
                          value={state}
                          onChange={(e) => {
                            setState(e.target.value)
                            setIsDirty(true)
                          }}
                          className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px] bg-white font-semibold"
                        >
                          <option value="">Selecione o Estado</option>
                          {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TÓPICO 02: CATEGORIAS E SEGMENTOS                                  */}
            {/* ------------------------------------------------------------------- */}
            {currentTopic === 2 && (
              <section className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-[2px] shadow-sm animate-in fade-in duration-200">
                <div className="border-b border-neutral-100 pb-4 mb-6">
                  <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                    Tópico 02
                  </span>
                  <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                    Segmento Comercial & Subcategorias
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Selecione o nicho principal da sua loja e marque as subcategorias que definem os produtos vendidos.
                  </p>
                </div>

                {/* Seleção da Categoria Principal */}
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2">
                    Categoria Principal da Loja *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {CATEGORIAS.map((cat) => {
                      const isCatSelected = category === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`p-3.5 border rounded-[2px] text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isCatSelected
                              ? 'bg-[#FB6600] text-white border-[#FB6600] shadow-xs'
                              : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {cat.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Seleção das Subcategorias */}
                <div className="pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Subcategorias e Especialidades Atendidas
                    </label>
                    {subcategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSubcategories([])
                          setIsDirty(true)
                        }}
                        className="text-[11px] text-neutral-500 hover:text-rose-600 font-semibold underline cursor-pointer"
                        title="Desmarcar todas as subcategorias selecionadas"
                      >
                        Limpar informações
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mb-3">
                    Clique nas subcategorias para selecionar ou desmarcar. O destaque laranja indica que a loja será filtrada por este termo.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(SUBCATEGORIAS_POR_CATEGORIA[category] || []).map((sub) => {
                      const isSelected = subcategories.includes(sub)
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubcategory(sub)}
                          className={`text-xs px-3.5 py-1.5 rounded-[2px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#FB6600] text-white border-[#FB6600] shadow-xs'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                          }`}
                        >
                          {isSelected ? `✓ ${sub}` : `+ ${sub}`}
                        </button>
                      )
                    })}
                  </div>

                  {category === 'carro' &&
                    subcategories.some((s) =>
                      ['usados', 'concessionária', 'concessionaria'].includes(s.toLowerCase().trim())
                    ) && (
                      <div className="mt-4 p-4 bg-orange-50/80 border border-[#FB6600]/40 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-neutral-800 space-y-0.5">
                          <strong className="font-black text-[#FB6600] uppercase tracking-wider block">
                            🚗 Cadastro Especial de Veículos (Carro / Usados e Concessionária) Ativado
                          </strong>
                          <p className="text-[11px] text-neutral-600">
                            No <strong>Tópico 06 (Catálogo de Produtos)</strong>, sua loja possui o formulário exclusivo para veículos (Marca, Modelo, Versão, Ano, KM, Câmbio, Tração, Placa Interna, até 12 fotos, Preço de Custo Interno, Preço de Venda e Preço FIPE Interno).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentTopic(6)}
                          className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded-[2px] shrink-0 cursor-pointer transition-colors"
                        >
                          Ir para Catálogo (06) &rarr;
                        </button>
                      </div>
                    )}
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TÓPICO 03: DISPOSITIVO BANNER TRIPLO DA LOJA (TODOS OS PLANOS)      */}
            {/* ------------------------------------------------------------------- */}
            {currentTopic === 3 && (
              <section className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-[2px] shadow-sm animate-in fade-in duration-200">
                <div className="border-b border-neutral-100 pb-4 mb-6 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                      Tópico 03 • Banner Triplo da Loja (Liberado em Todos os Planos)
                    </span>
                    <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                      Dispositivo Banner Triplo Grande (940 × 370 px)
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {currentPlanConfig.feedBannerType === 'triple'
                        ? 'Banner Triplo exibido no topo da página da sua loja e também em 3 colunas no filtro Lojas (Plano Ouro).'
                        : currentPlanConfig.feedBannerType === 'double'
                        ? `Banner Triplo exibido dentro da página da sua loja. No filtro Lojas aparecerá o seu Banner Duplo (Tópico 04).`
                        : 'Banner Triplo exibido dentro da página da sua loja (Plano Bronze Gratuito). Não aparece no filtro Lojas (onde aparece o seu Banner Single do Tópico 04).'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px] bg-black text-[#FB6600]">
                    Pacote Atual: Plano {currentPlanConfig.name}
                  </span>
                </div>

                {/* Prévia do Banner Triplo da Loja */}
                <div className="relative w-full aspect-[21/9] sm:aspect-[21/7] max-h-[340px] bg-neutral-900 border border-neutral-300 rounded-[2px] overflow-hidden flex items-center justify-center mb-4 shadow-inner">
                  {largeBannerPreview ? (
                    <img
                      src={largeBannerPreview}
                      alt="Banner Triplo da Loja"
                      className="w-full h-full object-cover"
                    />
                  ) : currentLargeBannerUrl ? (
                    <img
                      src={currentLargeBannerUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 text-neutral-400">
                      <span className="text-4xl block mb-2">🖼️</span>
                      <span className="text-xs font-bold uppercase tracking-wider block text-white">
                        {name || 'Nome da Loja'} — Banner Triplo da Loja
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Dimensão recomendada: 940 × 370 px (Capa interna da loja{currentPlanConfig.feedBannerType === 'triple' ? ' + 3 Colunas no Filtro Lojas' : ''})
                      </span>
                    </div>
                  )}

                  {/* Badges de sobreposição no banner */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs text-white text-[9.5px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-[2px]">
                    {currentPlanConfig.feedBannerType === 'triple'
                      ? 'Banner Triplo • Loja + Filtro Lojas (3 Colunas)'
                      : 'Banner Triplo • Exclusivo Dentro da Sua Loja'}
                  </div>

                  <div className="absolute top-3 right-3 bg-[#FB6600] text-white text-[9.5px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-[2px]">
                    Plano {currentPlanConfig.name}
                  </div>
                </div>

                <input
                  ref={largeBannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLargeBannerFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => largeBannerInputRef.current?.click()}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-[2px]"
                  >
                    {largeBannerFile
                      ? 'Substituir Banner Triplo (940 × 370 px)'
                      : 'Enviar Banner Triplo (940 × 370 px)'}
                  </button>

                  {(largeBannerPreview || currentLargeBannerUrl) && (
                    <button
                      type="button"
                      onClick={handleOpenLargeBannerAdjust}
                      className="px-4 py-2.5 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-[2px] flex items-center gap-1.5 bg-neutral-50 shadow-2xs"
                      title="Mover para cima, baixo, esquerda, direita e dar zoom"
                    >
                      <span>🔍 Ajustar Zoom & Posição</span>
                    </button>
                  )}

                  {largeBannerFile && (
                    <button
                      type="button"
                      onClick={cancelLargeBannerSelection}
                      className="px-4 py-2 text-xs text-rose-600 hover:text-rose-800 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancelar Seleção
                    </button>
                  )}
                </div>

                <div className="mt-4 p-3 bg-neutral-50 rounded-[2px] border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                  <p>
                    • <strong>Onde este Banner Triplo aparece:</strong>{' '}
                    {currentPlanConfig.feedBannerType === 'triple' ? (
                      <span>No topo interno da página da sua loja <strong>e também em destaque de 3 colunas no filtro Lojas</strong> (benefício exclusivo do Plano Ouro).</span>
                    ) : currentPlanConfig.feedBannerType === 'double' ? (
                      <span>No topo interno da página da sua loja. <strong>No filtro Lojas aparece apenas o seu Banner Duplo</strong> (configure no Tópico 04).</span>
                    ) : (
                      <span>No topo interno da página da sua loja (inclusive no Plano Bronze Gratuito). <strong>Este banner grande não aparece no filtro Lojas</strong> — no filtro Lojas aparece o seu Banner Single (Tópico 04).</span>
                    )}
                  </p>
                  <p>• Formatos aceitos: <strong>JPEG, PNG ou WebP</strong> com peso máximo de até <strong>5 MB</strong>.</p>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TÓPICO 04: DISPOSITIVO BANNER DO FILTRO LOJAS (SINGLE OU DUPLO)     */}
            {/* ------------------------------------------------------------------- */}
            {currentTopic === 4 && (
              <section className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-[2px] shadow-sm animate-in fade-in duration-200">
                <div className="border-b border-neutral-100 pb-4 mb-6 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                      Tópico 04 • {isBronze ? 'Banner Single no Filtro Lojas (Plano Bronze)' : currentPlanConfig.feedBannerType === 'double' ? `Banner Duplo no Filtro Lojas (Plano ${currentPlanConfig.name})` : 'Plano Ouro (Usa Banner Triplo em Lojas)'}
                    </span>
                    <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                      {isBronze
                        ? 'Dispositivo Banner Single para o Filtro Lojas (1 Coluna • 400 × 250 px)'
                        : currentPlanConfig.feedBannerType === 'double'
                        ? 'Dispositivo Banner Duplo para o Filtro Lojas (2 Colunas • 620 × 220 px)'
                        : 'Banner do Filtro Lojas (Plano Ouro • 3 Colunas)'}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {isBronze
                        ? 'Banner Single (1 coluna) exibido no filtro Lojas para o seu Plano Bronze (Gratuito).'
                        : currentPlanConfig.feedBannerType === 'double'
                        ? `No Plano ${currentPlanConfig.name}, você tem o Banner Triplo dentro da loja (Tópico 03) e este Banner Duplo (2 colunas) que aparece no filtro Lojas.`
                        : 'No Plano Ouro, o seu Banner Triplo cadastrado no Tópico 03 já aparece diretamente em 3 colunas no filtro Lojas.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px] bg-black text-[#FB6600]">
                    Pacote Atual: Plano {currentPlanConfig.name}
                  </span>
                </div>

                {currentPlanConfig.feedBannerType === 'triple' ? (
                  <div className="border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center rounded-[2px]">
                    <span className="text-4xl block mb-3">👑</span>
                    <h3 className="text-base font-black uppercase tracking-tight text-neutral-900 mb-2">
                      Seu Plano Ouro Exibe o Banner Triplo Direto em Lojas
                    </h3>
                    <p className="text-xs text-neutral-600 max-w-lg mx-auto mb-5 leading-relaxed">
                      Como sua loja está no <strong>Plano Ouro</strong>, o seu <strong>Banner Triplo (3 Colunas)</strong> cadastrado no <strong>Tópico 03</strong> é exibido tanto dentro da sua loja quanto em destaque máximo no filtro <strong>Lojas</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentTopic(3)}
                      className="px-5 py-2.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer transition-colors"
                    >
                      Gerenciar Meu Banner Triplo (Tópico 03)
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Prévia do Card Banner (Single para Bronze / Duplo para Bronze Plus e Prata) */}
                    <div
                      className={`w-full ${
                        currentPlanConfig.feedBannerType === 'double'
                          ? 'max-w-[460px] aspect-[16/10]'
                          : 'max-w-[340px] aspect-[16/10]'
                      } bg-neutral-900 border border-neutral-300 rounded-[2px] overflow-hidden flex items-center justify-center relative shadow-sm`}
                    >
                      {smallBannerPreview ? (
                        <img
                          src={smallBannerPreview}
                          alt={isBronze ? 'Banner Single' : 'Banner Duplo'}
                          className="w-full h-full object-cover"
                        />
                      ) : currentSmallBannerUrl ? (
                        <img
                          src={currentSmallBannerUrl}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-neutral-400">
                          <span className="text-3xl block mb-1">🪪</span>
                          <span className="text-xs font-bold uppercase tracking-wider block text-white">
                            {isBronze ? 'Banner Single (1 Coluna em Lojas)' : 'Banner Duplo (2 Colunas em Lojas)'}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {isBronze ? 'Proporção 16:10 (400 × 250 px)' : 'Exibido em 2 colunas no filtro Lojas'}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-xs p-2 rounded text-white">
                        <span className="text-[11px] font-bold block truncate">{name || 'Nome da Loja'}</span>
                        <span className="text-[9px] text-neutral-300 block capitalize">
                          {isBronze ? 'Exibido em 1 coluna no filtro Lojas' : 'Exibido em 2 colunas no filtro Lojas'}
                        </span>
                      </div>
                    </div>

                    {/* Controles de Upload */}
                    <div>
                      <input
                        ref={smallBannerInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleSmallBannerFileChange}
                        className="hidden"
                      />

                      <div className="flex flex-col gap-2.5">
                        <button
                          type="button"
                          onClick={() => smallBannerInputRef.current?.click()}
                          className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-[2px] text-center"
                        >
                          {smallBannerFile
                            ? `Substituir ${isBronze ? 'Banner Single' : 'Banner Duplo'}`
                            : isBronze
                            ? 'Enviar Banner Single (Filtro Lojas)'
                            : 'Enviar Banner Duplo (Filtro Lojas)'}
                        </button>

                        {(smallBannerPreview || currentSmallBannerUrl) && (
                          <button
                            type="button"
                            onClick={handleOpenSmallBannerAdjust}
                            className="w-full sm:w-auto px-4 py-2 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-[2px] flex items-center justify-center gap-1.5 bg-neutral-50 shadow-2xs text-center"
                            title="Mover para cima, baixo, esquerda, direita e dar zoom"
                          >
                            <span>🔍 Ajustar Zoom & Enquadramento</span>
                          </button>
                        )}

                        {smallBannerFile && (
                          <button
                            type="button"
                            onClick={cancelSmallBannerSelection}
                            className="px-3 py-1 text-xs text-rose-600 hover:text-rose-800 font-bold uppercase cursor-pointer text-left"
                          >
                            Cancelar seleção
                          </button>
                        )}

                        <div className="p-3 bg-neutral-50 rounded-[2px] border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                          {isBronze ? (
                            <>
                              <p>• <strong>Regra do Plano Bronze (Gratuito):</strong> Você tem o <strong>Banner Triplo</strong> (Tópico 03) para o topo interno da sua loja e este <strong>Banner Single (1 coluna)</strong> que aparece no filtro <strong>Lojas</strong>.</p>
                              <p>• O seu Banner Triplo não aparece no filtro Lojas no Plano Bronze.</p>
                            </>
                          ) : (
                            <>
                              <p>• <strong>Regra do Plano {currentPlanConfig.name}:</strong> Você tem o <strong>Banner Triplo</strong> (Tópico 03) para o topo interno da sua loja e este <strong>Banner Duplo (2 colunas)</strong> que aparece no filtro <strong>Lojas</strong>.</p>
                              <p>• No filtro Lojas aparece exclusivamente o seu Banner Duplo.</p>
                            </>
                          )}
                          <p>• Formatos suportados: JPEG, PNG ou WebP até 5 MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </form>

            {/* =================================================================== */}
            {/* DISPOSITIVO 05: CATEGORIAS E SUBCATEGORIAS DE PRODUTOS              */}
            {/* =================================================================== */}
            {currentTopic === 5 && (
              <MerchantCategoriesTab
                storeId={selectedStoreId}
                storeName={name}
              />
            )}

            {/* =================================================================== */}
            {/* DISPOSITIVO 06: CATÁLOGO DE PRODUTOS                                */}
            {/* =================================================================== */}
            {currentTopic === 6 && (
              <MerchantProductsTab
                storeId={selectedStoreId}
                storeName={name}
                planKey={activeStore?.effective_plan || activeStore?.plan || 'bronze'}
                storeCategory={category}
                storeSubcategories={subcategories}
                onOpenPlansModal={() => setIsPlansModalOpen(true)}
                onProductCountChange={setProductsCount}
              />
            )}

            {/* =================================================================== */}
            {/* DISPOSITIVO 07: SISTEMA DE CONVITES VIP                             */}
            {/* =================================================================== */}
            {currentTopic === 7 && (
              <MerchantInvitesTab
                storeId={selectedStoreId}
                storeName={name}
              />
            )}

            {/* =================================================================== */}
            {/* DISPOSITIVO 08: DESEMPENHO E MÉTRICAS                               */}
            {/* =================================================================== */}
            {currentTopic === 8 && (
              <MerchantMetricsTab
                storeId={selectedStoreId}
                storeName={name}
              />
            )}

            {/* =================================================================== */}
            {/* DISPOSITIVO 09: LISTA DE PREFERIDOS                                 */}
            {/* =================================================================== */}
            {currentTopic === 9 && (
              <MerchantFavoritesTab
                storeId={selectedStoreId}
                storeName={name}
              />
            )}

            {/* =================================================================== */}
            {/* DISPOSITIVO 10: ANIVERSARIANTES SEGUIDORES                          */}
            {/* =================================================================== */}
            {currentTopic === 10 && (
              <MerchantBirthdaysTab
                storeId={selectedStoreId}
                storeName={name}
              />
            )}

            {/* =================================================================== */}
            {/* DISPOSITIVO 11: PLANO & COBRANÇA                                    */}
            {/* =================================================================== */}
            {currentTopic === 11 && (
              <MerchantSubscriptionTab
                storeId={selectedStoreId}
                storeName={name}
                onOpenPlansModal={() => setIsPlansModalOpen(true)}
              />
            )}

            {/* =================================================================== */}
            {/* DISPOSITIVO 12: CRONÔMETRO DE PROMOÇÃO (TERMÔMETRO TEMPORAL)        */}
            {/* =================================================================== */}
            {currentTopic === 12 && (
              <MerchantPromoTimerTab
                storeId={selectedStoreId}
                storeName={name}
              />
            )}

            {/* =================================================================== */}
            {/* BARRA DE NAVEGAÇÃO E AÇÕES                                         */}
            {/* =================================================================== */}
            <div className="bg-white border border-neutral-200 p-4 sm:p-5 rounded-[2px] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              
              {/* Botões de Avançar / Voltar entre os 12 Tópicos */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  disabled={currentTopic <= 1}
                  onClick={() => setCurrentTopic((prev) => Math.max(1, prev - 1))}
                  className="px-3.5 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black transition-colors rounded-[2px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &larr; Tópico Anterior
                </button>

                <button
                  type="button"
                  disabled={currentTopic >= 12}
                  onClick={() => setCurrentTopic((prev) => Math.min(12, prev + 1))}
                  className="px-3.5 py-2.5 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-black transition-colors rounded-[2px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Próximo Tópico &rarr;
                </button>
              </div>

              {/* Botões de Ação Final */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-4 py-2.5 border border-black hover:bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider transition-colors rounded-[2px] cursor-pointer"
                >
                  Pré-visualizar Loja
                </button>

                {currentTopic <= 4 ? (
                  <button
                    type="submit"
                    form="store-profile-form"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 rounded-[2px]"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                ) : isDirty ? (
                  <button
                    type="submit"
                    form="store-profile-form"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 rounded-[2px]"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações Pendentes'}
                  </button>
                ) : null}
              </div>
            </div>

        </main>

      </div>

      {/* Modal de Pré-visualização Realista (Desktop / Celular) com Ações Diretas */}
      <StorePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewData}
        storeId={selectedStoreId}
        onNavigateTopic={(topicId) => {
          setIsPreviewOpen(false)
          setCurrentTopic(topicId)
        }}
        onOpenLogoAdjust={() => {
          setIsPreviewOpen(false)
          handleOpenLogoAdjust()
        }}
        onOpenLargeBannerAdjust={() => {
          setIsPreviewOpen(false)
          handleOpenLargeBannerAdjust()
        }}
        onOpenSmallBannerAdjust={() => {
          setIsPreviewOpen(false)
          handleOpenSmallBannerAdjust()
        }}
      />

      {/* Dispositivo de Zoom e Enquadramento Circular do Logotipo */}
      <LogoAdjustModal
        isOpen={isLogoAdjustModalOpen}
        imageSrc={logoAdjustSource}
        onClose={() => setIsLogoAdjustModalOpen(false)}
        onApply={handleApplyLogoAdjustment}
      />

      {/* Dispositivo de Zoom, Movimentação e Enquadramento do Banner Grande (940 × 370 px) */}
      <BannerAdjustModal
        isOpen={isLargeBannerAdjustModalOpen}
        imageSrc={largeBannerAdjustSource}
        onClose={() => setIsLargeBannerAdjustModalOpen(false)}
        onApply={handleApplyLargeBannerAdjustment}
      />

      {/* Dispositivo de Zoom, Movimentação e Enquadramento do Banner Pequeno (16:10 / 400 × 250 px) */}
      <SmallBannerAdjustModal
        isOpen={isSmallBannerAdjustModalOpen}
        imageSrc={smallBannerAdjustSource}
        onClose={() => setIsSmallBannerAdjustModalOpen(false)}
        onApply={handleApplySmallBannerAdjustment}
      />

      {/* Modal de Escolha de Planos */}
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        onSelectPlan={async (plan: PlanType) => {
          setIsPlansModalOpen(false)
          if (selectedStoreId) {
            setFeedback(null)
            const res = await updateStorePlanAction(selectedStoreId, plan)
            if (res.success && res.store) {
              setStores((prev) =>
                prev.map((s) => (s.id === selectedStoreId ? { ...s, ...res.store } : s))
              )
              setFeedback({
                type: 'success',
                message: `Plano alterado para ${getPlan(plan).name} com sucesso! O limite de produtos foi atualizado.`,
              })
            } else {
              setFeedback({
                type: 'error',
                message: res.error || 'Erro ao atualizar plano.',
              })
            }
          }
        }}
      />
    </div>
  )
}

export default function MerchantStoreAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Carregando Área do Lojista...
          </span>
        </div>
      }
    >
      <MerchantStoreAdminContent />
    </Suspense>
  )
}

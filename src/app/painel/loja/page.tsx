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
import { createPlanCheckoutAction } from '@/app/actions/mercadopago-checkout'

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

// OS 12 TÓPICOS DA ÁREA DO LOJISTA
const TOPICOS = [
  {
    id: 1,
    numero: '01',
    titulo: 'Dados da Loja',
    subtitulo: 'Identificação, logotipo e endereço',
    icone: '🏬',
  },
  {
    id: 2,
    numero: '02',
    titulo: 'Categoria e Subcategorias',
    subtitulo: 'Nicho principal e especialidades',
    icone: '🏷️',
  },
  {
    id: 3,
    numero: '03',
    titulo: 'Banner Triplo',
    subtitulo: 'Capa 940 × 370 px da loja',
    icone: '🖼️',
  },
  {
    id: 4,
    numero: '04',
    titulo: 'Banner Single / Duplo',
    subtitulo: 'Destaque no filtro Lojas',
    icone: '🪪',
  },
  {
    id: 5,
    numero: '05',
    titulo: 'Categorias de Produtos',
    subtitulo: 'Organização interna do catálogo',
    icone: '🗂️',
  },
  {
    id: 6,
    numero: '06',
    titulo: 'Catálogo de Produtos',
    subtitulo: 'Cadastro e gestão de itens',
    icone: '📦',
  },
  {
    id: 7,
    numero: '07',
    titulo: 'Convites VIP',
    subtitulo: 'Indicação de lojistas parceiros',
    icone: '🎟️',
  },
  {
    id: 8,
    numero: '08',
    titulo: 'Métricas',
    subtitulo: 'Acessos e cliques no WhatsApp',
    icone: '📊',
  },
  {
    id: 9,
    numero: '09',
    titulo: 'Favoritos',
    subtitulo: 'Produtos mais curtidos',
    icone: '❤️',
  },
  {
    id: 10,
    numero: '10',
    titulo: 'Aniversariantes',
    subtitulo: 'Seguidores aniversariantes do mês',
    icone: '🎂',
  },
  {
    id: 11,
    numero: '11',
    titulo: 'Plano & Cobrança',
    subtitulo: 'Assinatura e faturas',
    icone: '💳',
  },
  {
    id: 12,
    numero: '12',
    titulo: 'Cronômetro de Promoção',
    subtitulo: 'Termômetro de campanha',
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
      <div className="bg-white border border-neutral-200 rounded-md p-4 sm:p-6 mb-6 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#FB6600] block">
              Área do Lojista
            </span>
            <h1 className="font-heading text-2xl sm:text-[26px] font-extrabold tracking-tight text-neutral-900">
              Painel da Loja
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor de lojas do lojista */}
          {stores.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="store-select" className="text-xs sm:text-sm font-semibold text-neutral-600 whitespace-nowrap">
                Loja:
              </label>
              <select
                id="store-select"
                value={selectedStoreId}
                onChange={handleStoreChange}
                className="flex-1 sm:flex-none sm:min-w-[180px] h-10 px-3 text-sm font-medium bg-white border border-neutral-300 rounded-md text-neutral-900 focus:outline-none focus:border-[#FB6600] transition-colors"
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
                    message: 'Preencha os dados da nova loja e clique em "Salvar Alterações".',
                  })
                }}
                className="h-10 px-3.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shadow-xs shrink-0"
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
            className="h-10 px-4 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs flex-1 sm:flex-none"
            title="Pré-visualizar vitrine"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Pré-visualizar</span>
          </button>

          {/* Botão Secundário: Ver loja */}
          {activeStore && (
            <Link
              href={`/loja/${activeStore.slug || activeStore.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 bg-white hover:bg-neutral-50 text-neutral-800 hover:text-black border border-neutral-300 text-xs sm:text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
              title="Abrir vitrine em nova aba"
            >
              <span>Ver loja</span>
              <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Alerta de Feedback (Sucesso / Erro) */}
      {feedback && (
        <div
          className={`p-4 mb-6 text-sm rounded-md flex items-center justify-between border animate-in fade-in duration-200 ${
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
            className="text-base font-bold opacity-60 hover:opacity-100 ml-4 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SELETOR RETRÁTIL DE ETAPAS NO MOBILE                                      */}
      {/* ========================================================================= */}
      <div className="lg:hidden mb-6 bg-white border border-neutral-200 rounded-md shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
          aria-expanded={isMobileMenuOpen}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-md bg-neutral-900 text-white font-mono text-sm font-bold flex items-center justify-center shrink-0">
              {activeTopic.numero}
            </span>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-500 block">
                Etapa {activeTopic.numero} de {TOPICOS.length}
              </span>
              <span className="text-base font-bold text-neutral-900 truncate block">
                {activeTopic.titulo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-xs font-semibold text-neutral-500 hidden sm:inline">
              {isMobileMenuOpen ? 'Fechar' : 'Alterar'}
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180 bg-neutral-100 text-neutral-900' : 'bg-neutral-50 text-neutral-600'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {!isMobileMenuOpen && (
          <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-700">
            <span>
              <strong>Plano {currentPlanConfig.name}:</strong> {productsCount}/{currentPlanConfig.maxActiveProducts} {currentPlanConfig.itemLabel}
            </span>
            <button
              type="button"
              onClick={() => setIsPlansModalOpen(true)}
              className="text-[#FB6600] font-bold hover:underline cursor-pointer"
            >
              Ver Planos
            </button>
          </div>
        )}

        {isMobileMenuOpen && (
          <div className="border-t border-neutral-200 bg-neutral-50/50 p-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="divide-y divide-neutral-100 bg-white rounded-md border border-neutral-200 overflow-hidden">
              {TOPICOS.map((topico) => {
                const isActive = currentTopic === topico.id
                return (
                  <button
                    key={topico.id}
                    type="button"
                    onClick={() => {
                      setCurrentTopic(topico.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer text-sm ${
                      isActive
                        ? 'bg-orange-50/70 text-[#FB6600] font-bold border-l-[3px] border-[#FB6600]'
                        : 'text-neutral-800 hover:bg-neutral-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`font-mono text-xs shrink-0 ${isActive ? 'text-[#FB6600] font-bold' : 'text-neutral-400'}`}>
                        {topico.numero}
                      </span>
                      <span className="block truncate">{topico.titulo}</span>
                    </div>

                    {isActive ? (
                      <span className="text-xs text-[#FB6600] font-bold shrink-0 ml-2">✓</span>
                    ) : (
                      <span className="text-sm text-neutral-400 shrink-0 ml-2">›</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Estrutura Principal: Menu Lateral Esquerdo + Área de Conteúdo */}
      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
        
        {/* ========================================================================= */}
        {/* MENU LATERAL ESQUERDO COM AS 12 ETAPAS (DESKTOP)                          */}
        {/* ========================================================================= */}
        <aside className="hidden lg:block w-[290px] shrink-0 bg-white border border-neutral-200 rounded-md overflow-hidden sticky top-20 shadow-xs">
          
          {/* Identificação da Loja */}
          <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden border border-neutral-200">
              {logoPreview || currentLogoUrl ? (
                <img src={logoPreview || currentLogoUrl!} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{name ? name[0].toUpperCase() : 'L'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-neutral-900 truncate">
                {name || 'Minha Loja'}
              </h3>
              <p className="text-xs text-neutral-500 truncate mt-0.5">
                {city ? `${city}${state ? ` • ${state}` : ''}` : 'Kittanda Outlet'}
              </p>
            </div>
          </div>

          {/* Resumo Compacto do Plano e Limite */}
          <div className="p-4 bg-neutral-50/70 border-b border-neutral-100">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-neutral-900">
                Plano {currentPlanConfig.name}
              </span>
              <button
                type="button"
                onClick={() => setIsPlansModalOpen(true)}
                className="text-xs font-semibold text-[#FB6600] hover:underline cursor-pointer"
              >
                Planos
              </button>
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              {productsCount} de {currentPlanConfig.maxActiveProducts} {currentPlanConfig.itemLabel}
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#FB6600] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((productsCount / currentPlanConfig.maxActiveProducts) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Navegação Vertical das 12 Etapas */}
          <nav className="p-2 flex flex-col gap-0.5">
            {TOPICOS.map((topico) => {
              const isActive = currentTopic === topico.id
              return (
                <button
                  key={topico.id}
                  type="button"
                  onClick={() => setCurrentTopic(topico.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-left transition-colors cursor-pointer text-[13.5px] ${
                    isActive
                      ? 'bg-orange-50/80 text-[#FB6600] font-bold border-l-[3px] border-[#FB6600]'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                  }`}
                >
                  <span
                    className={`font-mono text-xs shrink-0 ${
                      isActive ? 'text-[#FB6600] font-bold' : 'text-neutral-400'
                    }`}
                  >
                    {topico.numero}
                  </span>
                  <span className="truncate flex-1">{topico.titulo}</span>
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
              <section className="bg-white border border-neutral-200 p-5 sm:p-8 rounded-md shadow-xs animate-in fade-in duration-200">
                <div className="border-b border-neutral-200 pb-4 mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FB6600] block mb-1">
                    Tópico 01
                  </span>
                  <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900">
                    Dados da Loja
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Logotipo da Loja */}
                  <div className="lg:col-span-4 bg-neutral-50/80 border border-neutral-200 rounded-md p-5 flex flex-col items-center text-center">
                    <label className="text-xs sm:text-[13px] font-bold text-neutral-800 mb-3 block">
                      Logotipo
                    </label>

                    <div className="relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center shrink-0 mb-4 bg-white border border-neutral-200 shadow-2xs">
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

                    <div className="flex flex-col gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full h-10 px-4 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer rounded-md"
                      >
                        {logoFile || currentLogoUrl ? 'Substituir Logotipo' : 'Carregar Logotipo'}
                      </button>

                      {(logoPreview || currentLogoUrl) && (
                        <button
                          type="button"
                          onClick={handleOpenLogoAdjust}
                          className="w-full h-10 px-4 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black text-xs sm:text-sm font-semibold transition-colors cursor-pointer rounded-md flex items-center justify-center gap-1.5 bg-white"
                          title="Ajustar enquadramento circular"
                        >
                          <span>Ajustar Zoom</span>
                        </button>
                      )}

                      {logoFile && (
                        <button
                          type="button"
                          onClick={cancelLogoSelection}
                          className="py-1 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          Cancelar seleção
                        </button>
                      )}

                      <span className="text-xs text-neutral-500 mt-1">
                        JPEG, PNG ou WebP até 5 MB
                      </span>
                    </div>
                  </div>

                  {/* Campos Cadastrais */}
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Nome da Loja *
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
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Responsável Legal *
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
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        WhatsApp *
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
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
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
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800">
                          Descrição da Loja
                        </label>
                        <span className={`text-xs font-medium ${
                          description.length > 500 ? 'text-rose-600 font-bold' : 'text-neutral-500'
                        }`}>
                          {description.length}/500
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={500}
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="Principais marcas, especialidades e diferenciais da sua loja..."
                        className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço Comercial alinhado em grid de 12 colunas */}
                <div className="border-t border-neutral-200 mt-8 pt-6">
                  <h3 className="font-heading text-base sm:text-lg font-extrabold text-neutral-900 mb-4">
                    Endereço Comercial
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-3">
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        CEP {loadingCep && <span className="text-xs text-[#FB6600] animate-pulse">...</span>}
                      </label>
                      <input
                        type="text"
                        maxLength={9}
                        value={cep}
                        onChange={handleCepChange}
                        placeholder="79000-000"
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-7">
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Rua / Avenida
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => {
                          setStreet(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="Ex.: Av. Afonso Pena"
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Número
                      </label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => {
                          setNumber(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="1234"
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
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
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value)
                          setIsDirty(true)
                        }}
                        placeholder="Campo Grande"
                        className="w-full h-11 border border-neutral-300 px-3.5 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Estado (UF)
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value)
                          setIsDirty(true)
                        }}
                        className="w-full h-11 border border-neutral-300 px-3 text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 rounded-md font-semibold transition-colors"
                      >
                        <option value="">UF</option>
                        {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TÓPICO 02: CATEGORIAS E SEGMENTOS                                  */}
            {/* ------------------------------------------------------------------- */}
            {currentTopic === 2 && (
              <section className="bg-white border border-neutral-200 p-5 sm:p-8 rounded-md shadow-xs animate-in fade-in duration-200">
                <div className="border-b border-neutral-200 pb-4 mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FB6600] block mb-1">
                    Tópico 02
                  </span>
                  <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900">
                    Categoria &amp; Subcategorias
                  </h2>
                </div>

                {/* Seleção da Categoria Principal */}
                <div className="mb-7">
                  <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-3">
                    Categoria Principal *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CATEGORIAS.map((cat) => {
                      const isCatSelected = category === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`min-h-[52px] px-4 py-3 border rounded-md text-left transition-all cursor-pointer flex items-center gap-3 ${
                            isCatSelected
                              ? 'bg-[#FB6600] text-white border-[#FB6600] shadow-xs'
                              : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <span className="text-xl shrink-0">{cat.icon}</span>
                          <span className="text-sm font-bold">
                            {cat.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Seleção das Subcategorias */}
                <div className="pt-6 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <label className="block text-xs sm:text-[13px] font-bold text-neutral-800">
                      Subcategorias
                    </label>
                    {subcategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSubcategories([])
                          setIsDirty(true)
                        }}
                        className="text-xs text-neutral-500 hover:text-rose-600 font-semibold underline cursor-pointer"
                      >
                        Limpar seleção
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {(SUBCATEGORIAS_POR_CATEGORIA[category] || []).map((sub) => {
                      const isSelected = subcategories.includes(sub)
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubcategory(sub)}
                          className={`text-xs sm:text-sm px-4 py-2 rounded-md font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#FB6600] text-white border-[#FB6600] shadow-xs'
                              : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
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
                      <div className="mt-6 p-4 bg-orange-50/80 border border-[#FB6600]/40 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <strong className="text-sm font-bold text-[#FB6600] block">
                            🚗 Ficha Especial de Veículos Ativada
                          </strong>
                          <p className="text-xs sm:text-sm text-neutral-700">
                            Formulário exclusivo para veículos disponível no Tópico 06 (Catálogo de Produtos).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentTopic(6)}
                          className="h-10 px-4 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-md shrink-0 cursor-pointer transition-colors"
                        >
                          Abrir Catálogo &rarr;
                        </button>
                      </div>
                    )}
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TÓPICO 03: BANNER TRIPLO DA LOJA                                    */}
            {/* ------------------------------------------------------------------- */}
            {currentTopic === 3 && (
              <section className="bg-white border border-neutral-200 p-5 sm:p-8 rounded-md shadow-xs animate-in fade-in duration-200">
                <div className="border-b border-neutral-200 pb-4 mb-6 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#FB6600] block mb-1">
                      Tópico 03
                    </span>
                    <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900">
                      Banner Triplo (940 × 370 px)
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                      {currentPlanConfig.feedBannerType === 'triple'
                        ? 'Exibido no topo da página da loja e na vitrine principal.'
                        : 'Exibido no topo interno da página da sua loja.'}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-neutral-900 text-[#FB6600]">
                    Plano {currentPlanConfig.name}
                  </span>
                </div>

                {/* Prévia do Banner Triplo da Loja */}
                <div className="relative w-full aspect-[21/9] sm:aspect-[21/7] max-h-[340px] bg-neutral-900 border border-neutral-300 rounded-md overflow-hidden flex items-center justify-center mb-5 shadow-inner">
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
                      <span className="text-sm font-bold block text-white">
                        {name || 'Sua Loja'} — 940 × 370 px
                      </span>
                    </div>
                  )}
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
                    className="h-11 px-5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer rounded-md"
                  >
                    {largeBannerFile || currentLargeBannerUrl ? 'Substituir Banner Triplo' : 'Enviar Banner Triplo'}
                  </button>

                  {(largeBannerPreview || currentLargeBannerUrl) && (
                    <button
                      type="button"
                      onClick={handleOpenLargeBannerAdjust}
                      className="h-11 px-4 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black text-xs sm:text-sm font-semibold transition-colors cursor-pointer rounded-md flex items-center gap-2 bg-white"
                      title="Ajustar zoom e posição"
                    >
                      <span>Ajustar Enquadramento</span>
                    </button>
                  )}

                  {largeBannerFile && (
                    <button
                      type="button"
                      onClick={cancelLargeBannerSelection}
                      className="px-3 py-2 text-xs sm:text-sm text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Cancelar seleção
                    </button>
                  )}
                </div>

                <p className="mt-4 text-xs text-neutral-500">
                  Formatos aceitos: JPEG, PNG ou WebP (até 5 MB).
                </p>
              </section>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* TÓPICO 04: BANNER DO FILTRO LOJAS (SINGLE OU DUPLO)                 */}
            {/* ------------------------------------------------------------------- */}
            {currentTopic === 4 && (
              <section className="bg-white border border-neutral-200 p-5 sm:p-8 rounded-md shadow-xs animate-in fade-in duration-200">
                <div className="border-b border-neutral-200 pb-4 mb-6 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#FB6600] block mb-1">
                      Tópico 04
                    </span>
                    <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900">
                      {isBronze
                        ? 'Banner Single (400 × 250 px)'
                        : currentPlanConfig.feedBannerType === 'double'
                        ? 'Banner Duplo (620 × 220 px)'
                        : 'Banner do Filtro Lojas'}
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                      {isBronze
                        ? 'Exibido em 1 coluna na busca de Lojas.'
                        : currentPlanConfig.feedBannerType === 'double'
                        ? 'Exibido em 2 colunas na busca de Lojas.'
                        : 'No seu plano, o Banner Triplo do Tópico 03 já aparece diretamente na busca de Lojas.'}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-md bg-neutral-900 text-[#FB6600]">
                    Plano {currentPlanConfig.name}
                  </span>
                </div>

                {currentPlanConfig.feedBannerType === 'triple' ? (
                  <div className="border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center rounded-md">
                    <span className="text-4xl block mb-3">👑</span>
                    <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 mb-2">
                      Banner Triplo Ativo na Página Principal
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto mb-5 leading-relaxed">
                      O Plano {currentPlanConfig.name} utiliza o Banner Triplo do Tópico 03 diretamente no feed.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentTopic(3)}
                      className="h-11 px-5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs sm:text-sm font-bold rounded-md cursor-pointer transition-colors"
                    >
                      Gerenciar Banner Triplo &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    {/* Prévia do Card Banner */}
                    <div className="md:col-span-6 flex items-center justify-center bg-neutral-50 border border-neutral-200 rounded-md p-4">
                      <div className="w-full max-w-[440px] aspect-[16/10] bg-neutral-900 border border-neutral-300 rounded-md overflow-hidden flex items-center justify-center relative shadow-sm">
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
                            <span className="text-3xl block mb-1.5">🪪</span>
                            <span className="text-sm font-bold block text-white">
                              {isBronze ? 'Banner Single (1 Coluna)' : 'Banner Duplo (2 Colunas)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controles de Upload alinhados */}
                    <div className="md:col-span-6 bg-neutral-50 border border-neutral-200 rounded-md p-5 flex flex-col justify-center gap-3">
                      <input
                        ref={smallBannerInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleSmallBannerFileChange}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => smallBannerInputRef.current?.click()}
                        className="w-full h-11 px-5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer rounded-md text-center"
                      >
                        {smallBannerFile || currentSmallBannerUrl
                          ? `Substituir ${isBronze ? 'Banner Single' : 'Banner Duplo'}`
                          : isBronze
                          ? 'Enviar Banner Single'
                          : 'Enviar Banner Duplo'}
                      </button>

                      {(smallBannerPreview || currentSmallBannerUrl) && (
                        <button
                          type="button"
                          onClick={handleOpenSmallBannerAdjust}
                          className="w-full h-11 px-4 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black text-xs sm:text-sm font-semibold transition-colors cursor-pointer rounded-md flex items-center justify-center gap-2 bg-white text-center"
                          title="Ajustar zoom e enquadramento"
                        >
                          <span>Ajustar Enquadramento</span>
                        </button>
                      )}

                      {smallBannerFile && (
                        <button
                          type="button"
                          onClick={cancelSmallBannerSelection}
                          className="py-1 text-xs sm:text-sm text-rose-600 hover:text-rose-800 font-semibold cursor-pointer text-center"
                        >
                          Cancelar seleção
                        </button>
                      )}

                      <p className="text-xs text-neutral-500 text-center pt-1">
                        Formatos aceitos: JPEG, PNG ou WebP até 5 MB.
                      </p>
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
            <div className="bg-white border border-neutral-200 p-4 sm:p-5 rounded-md shadow-xs flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
              
              {/* Botões de Avançar / Voltar entre os 12 Tópicos */}
              <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={currentTopic <= 1}
                  onClick={() => setCurrentTopic((prev) => Math.max(1, prev - 1))}
                  className="h-11 px-4 border border-neutral-300 hover:border-black text-xs sm:text-sm font-semibold text-neutral-800 hover:text-black transition-colors rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &larr; Anterior
                </button>

                <button
                  type="button"
                  disabled={currentTopic >= 12}
                  onClick={() => setCurrentTopic((prev) => Math.min(12, prev + 1))}
                  className="h-11 px-4 border border-neutral-300 hover:border-black text-xs sm:text-sm font-semibold text-neutral-800 hover:text-black transition-colors rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Próximo &rarr;
                </button>
              </div>

              {/* Botões de Ação Final */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="h-11 px-4 border border-neutral-300 hover:border-black hover:bg-neutral-50 text-neutral-900 text-xs sm:text-sm font-semibold transition-colors rounded-md cursor-pointer"
                >
                  Pré-visualizar
                </button>

                {currentTopic <= 4 ? (
                  <button
                    type="submit"
                    form="store-profile-form"
                    disabled={isSaving}
                    className="h-11 px-6 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 rounded-md"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                ) : isDirty ? (
                  <button
                    type="submit"
                    form="store-profile-form"
                    disabled={isSaving}
                    className="h-11 px-6 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 rounded-md"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Pendências'}
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
          if (!selectedStoreId) return

          // Se for o plano gratuito Bronze, atualiza direto
          if (plan === 'bronze') {
            setFeedback(null)
            const res = await updateStorePlanAction(selectedStoreId, plan)
            if (res.success && res.store) {
              setStores((prev) =>
                prev.map((s) => (s.id === selectedStoreId ? { ...s, ...res.store } : s))
              )
              setFeedback({
                type: 'success',
                message: 'Plano Bronze Gratuito ativado com sucesso! Limite de 20 produtos ativos.',
              })
            }
            return
          }

          // Se for plano pago (Bronze Plus, Prata ou Ouro), gera o Checkout Pro do Mercado Pago
          setFeedback({
            type: 'success',
            message: `Gerando pagamento para o Plano ${getPlan(plan).name}... Aguarde um instante.`,
          })

          try {
            const checkoutRes = await createPlanCheckoutAction({
              storeId: selectedStoreId,
              planId: plan,
            })

            if (checkoutRes.success && checkoutRes.checkoutUrl) {
              window.location.href = checkoutRes.checkoutUrl
            } else {
              setFeedback({
                type: 'error',
                message: checkoutRes.error || 'Não foi possível abrir o checkout do Mercado Pago.',
              })
            }
          } catch (err: any) {
            setFeedback({
              type: 'error',
              message: err?.message || 'Erro ao conectar com Mercado Pago.',
            })
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

'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  getStoreProductsAction,
  createProductAction,
  updateProductAction,
  toggleProductActiveAction,
  deleteProductAction,
  uploadProductImageAction,
  CreateProductInput,
  UpdateProductInput,
} from '@/app/actions/products'
import { getStoreCategoriesAction } from '@/app/actions/categories'
import { StoreCategoryWithSubcategories } from '@/lib/categories-storage'
import { StoredProduct } from '@/lib/products-storage'
import { getPlan, PlanId } from '@/lib/plans'
import { formatCurrencyBRL } from '@/components/store/StoreProductsCatalog'
import ProductCardImageCarousel from '@/components/ProductCardImageCarousel'
import { FIPE_MARCAS } from '@/lib/fipeMarcas'

// Marcas FIPE únicas ordenadas alfabeticamente
const FIPE_VEHICLE_BRANDS: string[] = Array.from(
  new Set(FIPE_MARCAS.map((m: any) => m.nome.trim()))
).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))

interface MerchantProductsTabProps {
  storeId: string
  storeName: string
  planKey: string
  storeCategory?: string
  storeSubcategories?: string[]
  onOpenPlansModal: () => void
  onProductCountChange?: (count: number) => void
}

// Helper para compressão de fotos no cliente antes do upload (reduz fotos pesadas de celulares para ~200kb)
async function compressImageForUpload(file: File, maxWidth = 1400, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxWidth) / height)
            height = maxWidth
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(file)
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file)
            const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressed)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export default function MerchantProductsTab({
  storeId,
  storeName,
  planKey,
  storeCategory,
  storeSubcategories = [],
  onOpenPlansModal,
  onProductCountChange,
}: MerchantProductsTabProps) {
  // Lista de produtos e categorias
  const [products, setProducts] = useState<StoredProduct[]>([])
  const [categories, setCategories] = useState<StoreCategoryWithSubcategories[]>([])
  const [loading, setLoading] = useState(true)

  // Detecta automaticamente se a loja pertence ao segmento Carro -> Usados / Concessionária
  const isVehicleSegmentStore = useMemo(() => {
    const cat = (storeCategory || '').toLowerCase().trim()
    if (cat !== 'carro') return false
    if (!storeSubcategories || storeSubcategories.length === 0) return true
    return storeSubcategories.some((sub) => {
      const s = sub.toLowerCase().trim()
      return s === 'usados' || s === 'concessionária' || s === 'concessionaria'
    })
  }, [storeCategory, storeSubcategories])

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSubcategory, setFilterSubcategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterPromo, setFilterPromo] = useState<'all' | 'promo_only'>('all')
  const [filterHighlight, setFilterHighlight] = useState<'all' | 'outlet' | 'novidade'>('all')

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<StoredProduct | null>(null)
  const [previewProduct, setPreviewProduct] = useState<StoredProduct | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<StoredProduct | null>(null)

  // Estados do formulário de produto (Padrão + Veículos)
  const [formIsVehicle, setFormIsVehicle] = useState<boolean>(isVehicleSegmentStore)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formPromoPrice, setFormPromoPrice] = useState('')
  const [formCostPriceInternal, setFormCostPriceInternal] = useState('')
  const [formFipePriceInternal, setFormFipePriceInternal] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formSubcategory, setFormSubcategory] = useState('')
  // Tipo de Promoção do Produto
  const [formPromoType, setFormPromoType] = useState<string>('outlet')
  const [formHighlight, setFormHighlight] = useState<'none' | 'novidade' | 'outlet'>('novidade')
  const [formIsActive, setFormIsActive] = useState(true)

  // Estados para Unidades, Pesos e Medidas (Produtos Gerais Pro Max)
  const [formUnitValue, setFormUnitValue] = useState('')
  const [formUnitType, setFormUnitType] = useState('un')
  const [formSizes, setFormSizes] = useState<string[]>([])
  const [formColors, setFormColors] = useState<string[]>([])
  const [customSizeInput, setCustomSizeInput] = useState('')
  const [customColorInput, setCustomColorInput] = useState('')

  // Estados exclusivos para Cadastro de Veículos (Segmento Carro / Usados e Concessionária)
  const [formVehicleCategory, setFormVehicleCategory] = useState('Carros')
  const [formVehicleBrand, setFormVehicleBrand] = useState('')
  const [formVehicleModel, setFormVehicleModel] = useState('')
  const [formVehicleVersion, setFormVehicleVersion] = useState('')
  const [formVehicleYearFab, setFormVehicleYearFab] = useState('')
  const [formVehicleYearModel, setFormVehicleYearModel] = useState('')
  const [formVehicleKm, setFormVehicleKm] = useState('')
  const [formVehicleTransmission, setFormVehicleTransmission] = useState('Automático')
  const [formVehicleTraction, setFormVehicleTraction] = useState('4x2')
  const [formVehiclePlateInternal, setFormVehiclePlateInternal] = useState('')

  useEffect(() => {
    setFormIsVehicle(isVehicleSegmentStore)
  }, [isVehicleSegmentStore])

  // Limite de fotos: 12 fotos no cadastro de veículos (Carro / Usados e Concessionária) e 6 fotos no padrão
  const MAX_PHOTOS = formIsVehicle ? 12 : 6
  const [formImages, setFormImages] = useState<string[]>([])
  const [formPhotoOrientation, setFormPhotoOrientation] = useState<'vertical' | 'horizontal'>('vertical')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const CATEGORIAS_VEICULOS = [
    { id: 'Carros', label: 'Carros', icon: '🚗' },
    { id: 'Motos', label: 'Motos', icon: '🏍️' },
    { id: 'Caminhões', label: 'Caminhões', icon: '🚚' },
    { id: 'Ônibus/Vans', label: 'Ônibus/Vans', icon: '🚐' },
    { id: 'Triciclos/Quadriciclos/UTV', label: 'Triciclos/Quadriciclos/UTV', icon: '🛞' },
    { id: 'Náutico', label: 'Náutico', icon: '🚤' },
    { id: 'Tratatores/Rebocáveis', label: 'Tratatores/Rebocáveis', icon: '🚜' },
  ]

  const TIPOS_PROMOCAO_VEICULOS = [
    { id: 'novo', label: 'Novo' },
    { id: 'usado', label: 'Usado' },
    { id: 'semi_novo', label: 'Semi-novo' },
  ]

  const TIPOS_PROMOCAO = [
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
  ]

  const getPromoLabel = (promoId?: string | null, isOutlet?: boolean, isNovidade?: boolean) => {
    const key = (promoId || '').toLowerCase()
    if (key === 'semi_novo' || key === 'seminovo' || key === 'semi-novo') return 'Semi-novo'
    const found = TIPOS_PROMOCAO.find((t) => t.id === key)
    if (found) return found.label
    if (isOutlet) return 'Outlet'
    if (isNovidade) return 'Lançamento'
    return 'Outlet'
  }

  // Feedback e submissão
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Configuração do plano e cotas
  const planConfig = getPlan(planKey as PlanId)
  const maxProducts = planConfig.maxActiveProducts

  // Carregar produtos e categorias
  const loadData = async () => {
    setLoading(true)
    try {
      const [resProds, resCats] = await Promise.all([
        getStoreProductsAction(storeId),
        getStoreCategoriesAction(storeId),
      ])

      if (resProds.success && resProds.products) {
        setProducts(resProds.products)
        onProductCountChange?.(resProds.products.length)
      }
      if (resCats.success && resCats.categories) {
        setCategories(resCats.categories)
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha ao carregar dados do catálogo.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (storeId) {
      loadData()
    }
  }, [storeId])

  // Indicadores do Catálogo (KPIs)
  const totalCount = products.length
  const activeCount = products.filter((p) => p.is_active).length
  const inactiveCount = totalCount - activeCount
  const promoCount = products.filter(
    (p) => p.promotional_price && p.promotional_price < p.price
  ).length
  const outletCount = products.filter((p) => p.is_outlet).length
  const novidadesCount = products.filter((p) => p.is_novidade).length
  
  const availableSlots = Math.max(0, maxProducts - totalCount)
  const occupancyPercentage = Math.min(100, Math.round((totalCount / maxProducts) * 100))
  const limitReached = totalCount >= maxProducts

  // Subcategorias disponíveis para o filtro atual
  const activeFilterCategoryObj = categories.find(
    (c) => c.name.toLowerCase().trim() === filterCategory.toLowerCase().trim()
  )
  const filterSubcategories = activeFilterCategoryObj ? activeFilterCategoryObj.subcategories : []

  // Subcategorias disponíveis no formulário para a categoria selecionada
  const activeFormCategoryObj = categories.find(
    (c) => c.name.toLowerCase().trim() === formCategory.toLowerCase().trim()
  )
  const formAvailableSubcategories = activeFormCategoryObj ? activeFormCategoryObj.subcategories : []

  // Reset de subcategoria se categoria for alterada no formulário
  const handleFormCategoryChange = (newCatName: string) => {
    setFormCategory(newCatName)
    const match = categories.find((c) => c.name.toLowerCase().trim() === newCatName.toLowerCase().trim())
    if (match && match.subcategories.length > 0) {
      setFormSubcategory(match.subcategories[0].name)
    } else {
      setFormSubcategory('')
    }
  }

  // Filtragem dos produtos para a listagem
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // 1. Busca por nome, SKU ou placa interna
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const matchName = prod.name.toLowerCase().includes(term)
        const matchSku = prod.sku?.toLowerCase().includes(term) || false
        const matchPlate = prod.vehicle_plate_internal?.toLowerCase().includes(term) || false
        if (!matchName && !matchSku && !matchPlate) return false
      }

      // 2. Categoria
      if (filterCategory !== 'all') {
        if (prod.category?.toLowerCase().trim() !== filterCategory.toLowerCase().trim()) {
          return false
        }
      }

      // 3. Subcategoria
      if (filterSubcategory !== 'all') {
        if (prod.subcategory?.toLowerCase().trim() !== filterSubcategory.toLowerCase().trim()) {
          return false
        }
      }

      // 4. Status
      if (filterStatus === 'active' && !prod.is_active) return false
      if (filterStatus === 'inactive' && prod.is_active) return false

      // 5. Promoção
      if (filterPromo === 'promo_only') {
        const isPromo = prod.promotional_price && prod.promotional_price < prod.price
        if (!isPromo) return false
      }

      // 6. Destaque
      if (filterHighlight === 'outlet' && !prod.is_outlet) return false
      if (filterHighlight === 'novidade' && !prod.is_novidade) return false

      return true
    })
  }, [products, searchTerm, filterCategory, filterSubcategory, filterStatus, filterPromo, filterHighlight])

  // Abrir Modal de Novo Produto
  const handleOpenCreateModal = () => {
    if (limitReached) {
      setFeedback({
        type: 'error',
        message: `Limite de ${maxProducts} produtos do plano ${planConfig.name} atingido. Exclua um produto ou faça upgrade para liberar novas vagas.`,
      })
      return
    }

    const useVehicleMode = isVehicleSegmentStore
    setEditingProduct(null)
    setFormIsVehicle(useVehicleMode)
    setFormName('')
    setFormDescription('')
    setFormSku('')
    setFormPrice('')
    setFormPromoPrice('')
    setFormCostPriceInternal('')
    setFormFipePriceInternal('')
    setFormPromoType(useVehicleMode ? 'seminovo' === 'seminovo' ? 'semi_novo' : 'usado' : 'outlet')
    setFormHighlight(useVehicleMode ? 'novidade' : 'outlet')
    setFormIsActive(true)
    setFormImages([])
    setFormPhotoOrientation(useVehicleMode ? 'horizontal' : 'vertical')

    // Campos Pro Max de Produtos Gerais
    setFormUnitValue('')
    setFormUnitType('un')
    setFormSizes([])
    setFormColors([])
    setCustomSizeInput('')
    setCustomColorInput('')

    // Campos de veículo resetados
    setFormVehicleCategory('Carros')
    setFormVehicleBrand('')
    setFormVehicleModel('')
    setFormVehicleVersion('')
    setFormVehicleYearFab('')
    setFormVehicleYearModel('')
    setFormVehicleKm('')
    setFormVehicleTransmission('Automático')
    setFormVehicleTraction('4x2')
    setFormVehiclePlateInternal('')

    if (categories.length > 0) {
      const defaultCat = categories[0]
      setFormCategory(defaultCat.name)
      if (defaultCat.subcategories.length > 0) {
        setFormSubcategory(defaultCat.subcategories[0].name)
      } else {
        setFormSubcategory('')
      }
    } else {
      setFormCategory('')
      setFormSubcategory('')
    }

    setIsFormModalOpen(true)
  }

  // Abrir Modal de Edição
  const handleOpenEditModal = (prod: StoredProduct) => {
    const isVeh = Boolean(prod.is_vehicle) || isVehicleSegmentStore
    const maxLimit = isVeh ? 12 : 6
    setEditingProduct(prod)
    setFormIsVehicle(isVeh)
    setFormName(prod.name)
    setFormDescription(prod.description || '')
    setFormSku(prod.sku || '')
    setFormPrice(String(prod.price))
    setFormPromoPrice(prod.promotional_price ? String(prod.promotional_price) : '')
    setFormCostPriceInternal(prod.cost_price_internal ? String(prod.cost_price_internal) : '')
    setFormFipePriceInternal(prod.fipe_price_internal ? String(prod.fipe_price_internal) : '')
    setFormCategory(prod.category || (categories[0]?.name || ''))
    setFormSubcategory(prod.subcategory || '')

    // Campos Pro Max de Produtos Gerais
    setFormUnitValue(prod.unit_value || '')
    setFormUnitType(prod.unit_type || 'un')
    setFormSizes(prod.sizes || [])
    setFormColors(prod.colors || [])
    setCustomSizeInput('')
    setCustomColorInput('')

    setFormVehicleCategory(prod.vehicle_category || 'Carros')
    setFormVehicleBrand(prod.vehicle_brand || '')
    setFormVehicleModel(prod.vehicle_model || '')
    setFormVehicleVersion(prod.vehicle_version || '')
    setFormVehicleYearFab(prod.vehicle_year_fab || '')
    setFormVehicleYearModel(prod.vehicle_year_model || '')
    setFormVehicleKm(prod.vehicle_km || '')
    setFormVehicleTransmission(prod.vehicle_transmission || 'Automático')
    setFormVehicleTraction(prod.vehicle_traction || '4x2')
    setFormVehiclePlateInternal(prod.vehicle_plate_internal || '')

    // Tipo de promoção salvo no produto
    const savedPromo = (prod.promo_type || (isVeh ? 'semi_novo' : prod.is_outlet ? 'outlet' : 'lancamento')).toLowerCase()
    setFormPromoType(savedPromo)
    if (savedPromo === 'outlet') {
      setFormHighlight('outlet')
    } else {
      setFormHighlight('novidade')
    }

    setFormIsActive(prod.is_active)
    setFormPhotoOrientation((prod as any).photo_orientation || (isVeh ? 'horizontal' : 'vertical'))

    const existingImages = prod.images && prod.images.length > 0
      ? prod.images
      : prod.image_url
      ? [prod.image_url]
      : []
    setFormImages(existingImages.slice(0, maxLimit))

    setIsFormModalOpen(true)
  }

  // Upload de Imagens (Até 12 fotos para veículos ou 6 fotos no padrão)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = MAX_PHOTOS - formImages.length
    if (remainingSlots <= 0) {
      setFeedback({ type: 'error', message: `O limite máximo é de ${MAX_PHOTOS} fotos por produto.` })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      setFeedback({
        type: 'error',
        message: `Limite de ${MAX_PHOTOS} fotos por produto. Apenas ${remainingSlots} foto(s) adicional(is) foram selecionadas.`,
      })
    }

    setUploadingImage(true)
    try {
      const newUploadedUrls: string[] = []
      for (const file of filesToUpload) {
        const compressedFile = await compressImageForUpload(file)
        const fd = new FormData()
        fd.append('file', compressedFile)
        const res = await uploadProductImageAction(fd)
        if (res.success && res.url) {
          newUploadedUrls.push(res.url)
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao enviar foto.' })
        }
      }

      if (newUploadedUrls.length > 0) {
        setFormImages((prev) => [...prev, ...newUploadedUrls].slice(0, MAX_PHOTOS))
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha durante o upload da imagem.' })
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSetCoverImage = (indexToCover: number) => {
    setFormImages((prev) => {
      const target = prev[indexToCover]
      const remaining = prev.filter((_, idx) => idx !== indexToCover)
      return [target, ...remaining]
    })
  }

  // Salvar Produto (Criar ou Atualizar)
  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // No modo veículo, compõe o título automaticamente a partir de Marca + Modelo + Versão caso formName esteja vazio
    let finalTitle = formName.trim()
    if (formIsVehicle) {
      if (!formVehicleBrand.trim() || !formVehicleModel.trim()) {
        setFeedback({ type: 'error', message: 'Informe pelo menos a Marca e o Modelo do veículo.' })
        return
      }
      const composedVehicleTitle = [
        formVehicleBrand.trim(),
        formVehicleModel.trim(),
        formVehicleVersion.trim(),
        formVehicleYearModel.trim() || formVehicleYearFab.trim(),
      ]
        .filter(Boolean)
        .join(' ')
      if (!finalTitle) {
        finalTitle = composedVehicleTitle
      }
    }

    if (!finalTitle || finalTitle.length < 2) {
      setFeedback({ type: 'error', message: 'O título do produto deve ter no mínimo 2 caracteres.' })
      return
    }

    const parsedPrice = parseFloat(formPrice.replace(/\./g, '').replace(',', '.'))
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFeedback({
        type: 'error',
        message: formIsVehicle
          ? 'Informe um Preço de Venda válido maior que zero.'
          : 'Informe um preço regular válido maior que zero.',
      })
      return
    }

    let parsedPromo: number | undefined = undefined
    if (formPromoPrice.trim()) {
      parsedPromo = parseFloat(formPromoPrice.replace(/\./g, '').replace(',', '.'))
      if (isNaN(parsedPromo) || parsedPromo <= 0) {
        setFeedback({ type: 'error', message: 'O preço promocional deve ser maior que zero.' })
        return
      }
      if (parsedPromo >= parsedPrice) {
        setFeedback({ type: 'error', message: 'O preço promocional deve ser obrigatoriamente inferior ao preço de venda/regular.' })
        return
      }
    }

    let parsedCostInternal: number | undefined = undefined
    if (formCostPriceInternal.trim()) {
      const c = parseFloat(formCostPriceInternal.replace(/\./g, '').replace(',', '.'))
      if (!isNaN(c) && c > 0) parsedCostInternal = c
    }

    let parsedFipeInternal: number | undefined = undefined
    if (formFipePriceInternal.trim()) {
      const f = parseFloat(formFipePriceInternal.replace(/\./g, '').replace(',', '.'))
      if (!isNaN(f) && f > 0) parsedFipeInternal = f
    }

    const effectiveCategory = formCategory.trim() || (formIsVehicle ? formVehicleCategory || 'Carro' : '')
    if (!effectiveCategory) {
      setFeedback({ type: 'error', message: 'Selecione uma categoria para o produto.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      const coverImage = formImages.length > 0 ? formImages[0] : undefined
      const effectivePhotoOrientation: 'vertical' | 'horizontal' = formIsVehicle ? 'horizontal' : 'vertical'

      if (editingProduct) {
        const payload: UpdateProductInput = {
          id: editingProduct.id,
          storeId,
          name: finalTitle,
          description: formDescription,
          sku: formSku,
          price: parsedPrice,
          promotionalPrice: parsedPromo,
          costPriceInternal: parsedCostInternal,
          fipePriceInternal: parsedFipeInternal,
          imageUrl: coverImage,
          images: formImages.slice(0, MAX_PHOTOS),
          photoOrientation: effectivePhotoOrientation,
          category: effectiveCategory,
          subcategory: formSubcategory || undefined,
          promoType: formPromoType,
          isVehicle: formIsVehicle,
          vehicleCategory: formIsVehicle ? formVehicleCategory : undefined,
          vehicleBrand: formIsVehicle ? formVehicleBrand : undefined,
          vehicleModel: formIsVehicle ? formVehicleModel : undefined,
          vehicleVersion: formIsVehicle ? formVehicleVersion : undefined,
          vehicleYearFab: formIsVehicle ? formVehicleYearFab : undefined,
          vehicleYearModel: formIsVehicle ? formVehicleYearModel : undefined,
          vehicleKm: formIsVehicle ? formVehicleKm : undefined,
          vehicleTransmission: formIsVehicle ? formVehicleTransmission : undefined,
          vehicleTraction: formIsVehicle ? formVehicleTraction : undefined,
          vehiclePlateInternal: formIsVehicle ? formVehiclePlateInternal : undefined,
          unitType: !formIsVehicle ? formUnitType : undefined,
          unitValue: !formIsVehicle ? formUnitValue : undefined,
          sizes: !formIsVehicle && formSizes.length > 0 ? formSizes : undefined,
          colors: !formIsVehicle && formColors.length > 0 ? formColors : undefined,
          isOutlet: formPromoType === 'outlet',
          isNovidade: formPromoType === 'lancamento',
          isActive: formIsActive,
        }

        const res = await updateProductAction(payload)
        if (res.success) {
          setFeedback({ type: 'success', message: `"${finalTitle}" atualizado com sucesso!` })
          setIsFormModalOpen(false)
          await loadData()
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao atualizar produto.' })
        }
      } else {
        const payload: CreateProductInput = {
          storeId,
          name: finalTitle,
          description: formDescription,
          sku: formSku,
          price: parsedPrice,
          promotionalPrice: parsedPromo,
          costPriceInternal: parsedCostInternal,
          fipePriceInternal: parsedFipeInternal,
          imageUrl: coverImage,
          images: formImages.slice(0, MAX_PHOTOS),
          photoOrientation: effectivePhotoOrientation,
          category: effectiveCategory,
          subcategory: formSubcategory || undefined,
          promoType: formPromoType,
          isVehicle: formIsVehicle,
          vehicleCategory: formIsVehicle ? formVehicleCategory : undefined,
          vehicleBrand: formIsVehicle ? formVehicleBrand : undefined,
          vehicleModel: formIsVehicle ? formVehicleModel : undefined,
          vehicleVersion: formIsVehicle ? formVehicleVersion : undefined,
          vehicleYearFab: formIsVehicle ? formVehicleYearFab : undefined,
          vehicleYearModel: formIsVehicle ? formVehicleYearModel : undefined,
          vehicleKm: formIsVehicle ? formVehicleKm : undefined,
          vehicleTransmission: formIsVehicle ? formVehicleTransmission : undefined,
          vehicleTraction: formIsVehicle ? formVehicleTraction : undefined,
          vehiclePlateInternal: formIsVehicle ? formVehiclePlateInternal : undefined,
          unitType: !formIsVehicle ? formUnitType : undefined,
          unitValue: !formIsVehicle ? formUnitValue : undefined,
          sizes: !formIsVehicle && formSizes.length > 0 ? formSizes : undefined,
          colors: !formIsVehicle && formColors.length > 0 ? formColors : undefined,
          isOutlet: formPromoType === 'outlet',
          isNovidade: formPromoType === 'lancamento',
          isActive: formIsActive,
        }

        const res = await createProductAction(payload)
        if (res.success) {
          setFeedback({ type: 'success', message: `"${finalTitle}" cadastrado com sucesso!` })
          setIsFormModalOpen(false)
          await loadData()
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao cadastrar produto.' })
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro inesperado na gravação do produto.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle de Ativação Instantânea na Listagem
  const handleToggleActive = async (prod: StoredProduct) => {
    const newStatus = !prod.is_active
    try {
      const res = await toggleProductActiveAction(prod.id, storeId, newStatus)
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, is_active: newStatus } : p))
        )
      } else {
        setFeedback({ type: 'error', message: res.error || 'Falha ao alterar status.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao alterar status do produto.' })
    }
  }

  // Confirmação e Exclusão de Produto
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return

    setSubmitting(true)
    try {
      const res = await deleteProductAction(deleteConfirmation.id, storeId)
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Produto "${deleteConfirmation.name}" excluído. 1 vaga liberada no catálogo!`,
        })
        setDeleteConfirmation(null)
        await loadData()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Falha ao excluir produto.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro inesperado ao excluir produto.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Cálculo da porcentagem de desconto do formulário
  const calculatedDiscount = useMemo(() => {
    const reg = parseFloat(formPrice.replace(',', '.'))
    const pro = parseFloat(formPromoPrice.replace(',', '.'))
    if (!isNaN(reg) && !isNaN(pro) && reg > 0 && pro > 0 && pro < reg) {
      const percent = Math.round(((reg - pro) / reg) * 100)
      return percent
    }
    return null
  }, [formPrice, formPromoPrice])

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* CABEÇALHO DO CATÁLOGO DE PRODUTOS                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-8 border border-neutral-200 rounded-md shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#FB6600] block mb-1">
            Tópico 06
          </span>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Catálogo de Produtos
          </h2>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={limitReached}
            className={`h-10 px-5 text-white text-xs sm:text-sm font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              limitReached
                ? 'bg-neutral-400 opacity-60 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-black shadow-xs'
            }`}
            title={limitReached ? `Limite de ${maxProducts} ${planConfig.itemLabel} atingido` : 'Cadastrar novo item'}
          >
            <span>+ Adicionar Produto</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* ALERTA DE FEEDBACK                                                */}
      {/* ----------------------------------------------------------------- */}
      {feedback && (
        <div
          className={`p-4 text-sm rounded-md flex items-center justify-between border animate-in fade-in duration-200 ${
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

      {/* ----------------------------------------------------------------- */}
      {/* PAINEL DE RESUMO E INDICADORES DO CATÁLOGO                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Cadastrado */}
        <div className="bg-white border border-neutral-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 block mb-1.5">
            Cadastrados
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-neutral-900">{totalCount}</span>
            <span className="text-sm font-semibold text-neutral-400">/ {maxProducts}</span>
          </div>
        </div>

        {/* Vagas Restantes */}
        <div className="bg-white border border-neutral-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 block mb-1.5">
            Disponíveis
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-extrabold ${availableSlots === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {availableSlots}
            </span>
            <span className="text-xs font-semibold text-neutral-400">vagas</span>
          </div>
        </div>

        {/* Ocupação do Plano */}
        <div className="bg-white border border-neutral-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 block mb-1.5">
            Ocupação
          </span>
          <div>
            <span className="text-2xl font-extrabold text-neutral-900 block leading-none">{occupancyPercentage}%</span>
            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all duration-500 ${
                  occupancyPercentage >= 100
                    ? 'bg-rose-500'
                    : occupancyPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Produtos Ativos */}
        <div className="bg-white border border-neutral-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-700 block mb-1.5">
            Ativos
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-800">{activeCount}</span>
            <span className="text-xs text-neutral-400">visíveis</span>
          </div>
        </div>

        {/* Produtos Inativos */}
        <div className="bg-white border border-neutral-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-neutral-500 block mb-1.5">
            Inativos
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-neutral-700">{inactiveCount}</span>
            <span className="text-xs text-neutral-400">ocultos</span>
          </div>
        </div>

        {/* Em Promoção */}
        <div className="bg-white border border-neutral-200 p-4 rounded-md shadow-2xs flex flex-col justify-between">
          <span className="text-xs font-bold text-[#FB6600] block mb-1.5">
            Em Promoção
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#FB6600]">{promoCount}</span>
            <span className="text-xs text-neutral-400">ofertas</span>
          </div>
        </div>
      </div>

      {/* Alerta de Limite Atingido / Upgrade Recomendado */}
      {limitReached && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-300 rounded-md text-sm text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="block font-bold">
                Limite de {maxProducts} {planConfig.itemLabel} atingido no Plano {planConfig.name}.
              </strong>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Exclua itens ou faça upgrade de plano para cadastrar mais.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPlansModal}
            className="h-10 px-4 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-md whitespace-nowrap cursor-pointer transition-colors"
          >
            Ver Planos
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* BARRA DE BUSCA E FILTROS DE PRODUTOS                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white p-4 sm:p-5 border border-neutral-200 rounded-md shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Busca por Nome ou SKU */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome ou código SKU..."
              className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 text-sm"
            />
          </div>

          {/* Filtro por Categoria Principal */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Categoria
            </label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setFilterSubcategory('all')
              }}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] text-sm bg-white"
            >
              <option value="all">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Subcategoria */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Subcategoria
            </label>
            <select
              value={filterSubcategory}
              disabled={filterCategory === 'all' || filterSubcategories.length === 0}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] text-sm bg-white disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              <option value="all">Todas</option>
              {filterSubcategories.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] text-sm bg-white"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>

          {/* Filtro por Promoção / Destaque */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Destaque
            </label>
            <select
              value={filterHighlight !== 'all' ? filterHighlight : filterPromo === 'promo_only' ? 'promo' : 'all'}
              onChange={(e) => {
                const val = e.target.value
                if (val === 'promo') {
                  setFilterPromo('promo_only')
                  setFilterHighlight('all')
                } else if (val === 'outlet') {
                  setFilterPromo('all')
                  setFilterHighlight('outlet')
                } else if (val === 'novidade') {
                  setFilterPromo('all')
                  setFilterHighlight('novidade')
                } else {
                  setFilterPromo('all')
                  setFilterHighlight('all')
                }
              }}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] text-sm bg-white"
            >
              <option value="all">Todos</option>
              <option value="promo">Com Preço Promocional</option>
              <option value="outlet">Outlet</option>
              <option value="novidade">Lançamento</option>
            </select>
          </div>
        </div>

        {/* Resumo de Resultados e Reset */}
        <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 text-xs sm:text-sm text-neutral-600">
          <span>
            Exibindo <strong className="text-neutral-900">{filteredProducts.length}</strong> de <strong className="text-neutral-900">{totalCount}</strong> item(ns)
          </span>
          {(searchTerm || filterCategory !== 'all' || filterSubcategory !== 'all' || filterStatus !== 'all' || filterPromo !== 'all' || filterHighlight !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setFilterCategory('all')
                setFilterSubcategory('all')
                setFilterStatus('all')
                setFilterPromo('all')
                setFilterHighlight('all')
              }}
              className="text-[#FB6600] hover:underline font-bold cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* LISTAGEM DOS PRODUTOS COM FOTOS GRANDES E TIPOGRAFIA LEGÍVEL      */}
      {/* ----------------------------------------------------------------- */}
      {loading ? (
        <div className="py-20 text-center text-sm text-neutral-500 bg-white border border-neutral-200 rounded-md">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando catálogo de produtos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 p-10 sm:p-12 text-center rounded-md">
          <span className="text-4xl block mb-3">📦</span>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900">Nenhum produto encontrado</h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
            {products.length === 0
              ? 'Seu catálogo ainda não possui itens cadastrados.'
              : 'Nenhum item corresponde aos filtros selecionados.'}
          </p>
          {products.length === 0 && !limitReached && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-5 h-11 px-5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-md cursor-pointer"
            >
              + Cadastrar Primeiro Produto
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredProducts.map((prod) => {
            const hasPromo = Boolean(prod.promotional_price && prod.promotional_price < prod.price)
            const salePrice = hasPromo ? prod.promotional_price! : prod.price
            const referencePrice = hasPromo
              ? prod.price
              : prod.fipe_price_internal && prod.fipe_price_internal > prod.price
                ? prod.fipe_price_internal
                : null
            const discountPercent = referencePrice
              ? Math.round(((referencePrice - salePrice) / referencePrice) * 100)
              : 0
            // Carros sempre na horizontal e produtos sempre na vertical
            const isHorizontalPhoto = Boolean(prod.is_vehicle)

            return (
              <div
                key={prod.id}
                className={`bg-white border border-neutral-200 rounded-md shadow-xs overflow-hidden transition-all hover:border-neutral-300 ${
                  !prod.is_active ? 'opacity-70 bg-neutral-50/40' : ''
                }`}
              >
                <div className="p-3 sm:p-3.5 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:items-center">
                  {/* Coluna A: Nome em cima da foto + Foto (tipo de promoção no canto inferior esquerdo) */}
                  <div className={`shrink-0 flex flex-col gap-1 ${isHorizontalPhoto ? 'w-44 sm:w-48' : 'w-24 sm:w-28'}`}>
                    <h4 className="text-sm sm:text-[15px] font-extrabold text-neutral-900 leading-tight truncate" title={prod.name}>
                      {prod.name}
                    </h4>

                    <button
                      type="button"
                      onClick={() => setPreviewProduct(prod)}
                      className={`${
                        isHorizontalPhoto
                          ? 'w-44 h-28 sm:w-48 sm:h-32'
                          : 'w-24 h-32 sm:w-28 sm:h-36'
                      } bg-neutral-100 border border-neutral-200 rounded-md overflow-hidden relative shrink-0 flex items-center justify-center cursor-pointer group`}
                      title="Clique para pré-visualizar"
                    >
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl text-neutral-400">🖼️</span>
                      )}
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-[#FB6600] text-white text-[10px] font-bold uppercase tracking-wide rounded shadow-xs">
                        {getPromoLabel(prod.promo_type, prod.is_outlet, prod.is_novidade)}
                      </span>
                      {prod.images && prod.images.length > 1 && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          +{prod.images.length - 1} fotos
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Coluna B: B1 à esquerda e B2 à direita aproveitando todo o espaço */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                    {/* B1 (Esquerda): Categoria do veículo, categoria, subcategoria, SKU e Unidade/Peso */}
                    <div className="min-w-0 flex-1 space-y-1">
                      {prod.is_vehicle && prod.vehicle_category && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-neutral-900 text-white text-[11px] font-bold uppercase rounded">
                            {prod.vehicle_category}
                          </span>
                        </div>
                      )}

                      <div className="text-xs sm:text-sm text-neutral-600 flex flex-col gap-0.5">
                        <span className="font-semibold text-neutral-800 capitalize">{prod.category}</span>
                        {prod.subcategory && (
                          <span>{prod.subcategory}</span>
                        )}
                        {prod.sku && (
                          <span className="font-mono text-xs text-neutral-500">SKU: {prod.sku}</span>
                        )}
                      </div>

                      {/* Unidade / Peso / Medida para produtos gerais */}
                      {!prod.is_vehicle && (prod.unit_value || prod.unit_type) && (
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 border border-orange-200 text-neutral-900 rounded font-bold text-xs">
                            <span>📦</span>
                            <span>
                              {prod.unit_value ? `${prod.unit_value} ` : ''}
                              {prod.unit_type || 'un'}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Cores disponíveis para produtos gerais */}
                      {!prod.is_vehicle && prod.colors && prod.colors.length > 0 && (
                        <div className="pt-0.5 flex items-center gap-1 flex-wrap text-xs text-neutral-600">
                          <span className="font-semibold text-neutral-700 text-[11px]">Cores:</span>
                          {prod.colors.slice(0, 4).map((c) => (
                            <span key={c} className="px-1.5 py-0.2 text-[10px] bg-neutral-100 border border-neutral-200 rounded font-medium">
                              {c}
                            </span>
                          ))}
                          {prod.colors.length > 4 && (
                            <span className="text-[10px] text-neutral-400">+{prod.colors.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* B2 (Direita): Ano/KM/Câmbio/Tração para veículo OU Grade de Tamanhos / Descrição para produto */}
                    <div className="min-w-0 sm:text-right flex flex-col sm:items-end gap-1 text-xs sm:text-sm text-neutral-600 shrink-0">
                      {prod.is_vehicle ? (
                        <>
                          {(prod.vehicle_year_model || prod.vehicle_year_fab) && (
                            <span className="whitespace-nowrap">
                              {prod.vehicle_year_model || prod.vehicle_year_fab}
                            </span>
                          )}
                          {prod.vehicle_km && (
                            <span className="whitespace-nowrap">
                              {String(prod.vehicle_km).toLowerCase().includes('km')
                                ? prod.vehicle_km
                                : `${prod.vehicle_km} km`}
                            </span>
                          )}
                          {prod.vehicle_transmission && (
                            <span className="whitespace-nowrap">
                              <strong className="text-neutral-800">Câmbio:</strong> {prod.vehicle_transmission}
                            </span>
                          )}
                          {prod.vehicle_traction && (
                            <span className="whitespace-nowrap">
                              {prod.vehicle_traction}
                            </span>
                          )}
                          {prod.vehicle_plate_internal && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[11px] rounded whitespace-nowrap">
                              🔒 Placa: {prod.vehicle_plate_internal}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Grade de Tamanhos em Destaque */}
                          {prod.sizes && prod.sizes.length > 0 && (
                            <div className="flex flex-col sm:items-end gap-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                                Tamanhos:
                              </span>
                              <div className="flex flex-wrap gap-1 sm:justify-end max-w-[220px]">
                                {prod.sizes.map((sz) => (
                                  <span
                                    key={sz}
                                    className="px-1.5 py-0.5 bg-neutral-900 text-white rounded text-[10px] font-bold shadow-2xs"
                                  >
                                    {sz}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {prod.description && (
                            <p className="text-xs text-neutral-500 line-clamp-2 max-w-xs sm:text-right mt-0.5">{prod.description}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Coluna C: Preço de venda, FIPE/preço riscado e percentual + 2 colunas de botões (C1 e C2) */}
                  <div className="lg:w-44 shrink-0 pt-2.5 lg:pt-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-neutral-100 flex flex-col justify-between gap-2">
                    {/* Preços */}
                    <div className="flex flex-col lg:items-end gap-0.5">
                      <span className={`text-lg font-extrabold leading-tight whitespace-nowrap ${hasPromo ? 'text-[#FB6600]' : 'text-neutral-900'}`}>
                        R$ {formatCurrencyBRL(salePrice)}
                      </span>

                      {referencePrice && (
                        <div className="flex items-center gap-1.5 flex-wrap lg:justify-end">
                          <span className="line-through text-neutral-400 text-xs font-medium whitespace-nowrap">
                            {!hasPromo && prod.fipe_price_internal ? 'FIPE ' : ''}R$ {formatCurrencyBRL(referencePrice)}
                          </span>
                          {discountPercent > 0 && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                              -{discountPercent}%
                            </span>
                          )}
                        </div>
                      )}

                      {(prod.cost_price_internal || (hasPromo && prod.fipe_price_internal)) && (
                        <div className="flex items-center gap-1.5 flex-wrap lg:justify-end mt-0.5">
                          {prod.cost_price_internal && (
                            <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              🔒 Custo: R$ {formatCurrencyBRL(prod.cost_price_internal)}
                            </span>
                          )}
                          {hasPromo && prod.fipe_price_internal && (
                            <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                              🔒 FIPE: R$ {formatCurrencyBRL(prod.fipe_price_internal)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botões em 2 colunas: C1 (Ativo, Prévia) e C2 (Editar, Excluir) — tamanho reduzido pela metade */}
                    <div className="grid grid-cols-2 gap-1 w-36 lg:ml-auto">
                      {/* C1 */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod)}
                          className={`h-5 px-1.5 text-[10px] leading-none font-bold rounded transition-colors cursor-pointer border text-center whitespace-nowrap ${
                            prod.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                          }`}
                          title={prod.is_active ? 'Clique para desativar' : 'Clique para ativar'}
                        >
                          {prod.is_active ? '✓ Ativo' : '✕ Inativo'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewProduct(prod)}
                          className="h-5 px-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-[10px] leading-none font-semibold rounded cursor-pointer transition-colors"
                        >
                          Prévia
                        </button>
                      </div>

                      {/* C2 */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(prod)}
                          className="h-5 px-1.5 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 text-[10px] leading-none font-semibold rounded cursor-pointer transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmation(prod)}
                          className="h-5 px-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-neutral-300 hover:border-rose-300 text-[10px] leading-none font-semibold rounded cursor-pointer transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL DE CADASTRO E EDIÇÃO DE PRODUTO (COMPLETO - PRO MAX UI/UX)   */}
      {/* ----------------------------------------------------------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            {/* Header Pro Max */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white flex items-center justify-between gap-3 flex-wrap shrink-0 border-b border-neutral-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FB6600] animate-pulse" />
                  <span className="text-[11px] uppercase font-black tracking-widest text-[#FB6600]">
                    {editingProduct ? 'Editar Cadastro' : 'Novo Item'} &bull; {formIsVehicle ? 'Veículos & FIPE' : 'Catálogo Padrão'}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{formIsVehicle ? '🚗' : '🛍️'}</span>
                  <span>
                    {editingProduct
                      ? editingProduct.name
                      : formIsVehicle
                      ? 'Cadastro de Veículo'
                      : 'Cadastro de Produto'}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Seletor de Modo: Produto Padrão vs Veículo (Segmented Control Pro) */}
                <div className="flex items-center bg-neutral-800/90 p-1 rounded-xl border border-neutral-700/80 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setFormIsVehicle(false)
                      if (['novo', 'usado', 'semi_novo'].includes(formPromoType)) {
                        setFormPromoType('outlet')
                      }
                      setFormImages((prev) => prev.slice(0, 6))
                    }}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                      !formIsVehicle
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    <span>🛍️</span>
                    <span>Padrão</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormIsVehicle(true)
                      setFormPhotoOrientation('horizontal')
                      if (!['novo', 'usado', 'semi_novo'].includes(formPromoType)) {
                        setFormPromoType('semi_novo')
                      }
                    }}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                      formIsVehicle
                        ? 'bg-gradient-to-r from-[#FB6600] to-[#e05b00] text-white shadow-sm'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    <span>🚗</span>
                    <span>Veículo</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors flex items-center justify-center text-xl font-bold cursor-pointer border border-transparent hover:border-neutral-700"
                  aria-label="Fechar"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Form Body Scrollable */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveProduct(e)
              }}
              className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-neutral-50/40"
            >
              {/* Seção 1: Informações Básicas */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs font-black inline-flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900">
                      Informações Básicas {formIsVehicle ? '— Veículo' : 'do Produto'}
                    </h4>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-semibold">
                    * Campos obrigatórios
                  </span>
                </div>

                {formIsVehicle ? (
                  <div className="space-y-4">
                    {/* Categoria do Veículo (Menu vertical / dropdown selecionável) */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Categoria do Veículo <span className="text-[#FB6600]">*</span>
                      </label>
                      <select
                        value={formVehicleCategory}
                        onChange={(e) => setFormVehicleCategory(e.target.value)}
                        className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-bold bg-white cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="">____SELECIONE____</option>
                        {CATEGORIAS_VEICULOS.map((vCat) => (
                          <option key={vCat.id} value={vCat.id}>
                            {vCat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Marca (Tabela FIPE), Modelo e Versão */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Marca (Tabela FIPE) <span className="text-[#FB6600]">*</span>
                        </label>
                        <select
                          value={formVehicleBrand}
                          onChange={(e) => setFormVehicleBrand(e.target.value)}
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-bold bg-white cursor-pointer transition-all shadow-2xs"
                        >
                          <option value="">____SELECIONE A MARCA FIPE____</option>
                          {FIPE_VEHICLE_BRANDS.map((brandName) => (
                            <option key={brandName} value={brandName}>
                              {brandName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Modelo <span className="text-[#FB6600]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formVehicleModel}
                          onChange={(e) => setFormVehicleModel(e.target.value)}
                          placeholder="Ex.: Corolla, Hilux, Gol..."
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-semibold transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Versão
                        </label>
                        <input
                          type="text"
                          value={formVehicleVersion}
                          onChange={(e) => setFormVehicleVersion(e.target.value)}
                          placeholder="Ex.: 2.0 XEi Flex Aut."
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-semibold transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Ano, Ano/Modelo, KM, Câmbio, Tração e Placa (Interno) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Ano (Fab.)
                        </label>
                        <input
                          type="text"
                          value={formVehicleYearFab}
                          onChange={(e) => setFormVehicleYearFab(e.target.value)}
                          placeholder="Ex.: 2023"
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-semibold transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Ano / Modelo
                        </label>
                        <input
                          type="text"
                          value={formVehicleYearModel}
                          onChange={(e) => setFormVehicleYearModel(e.target.value)}
                          placeholder="Ex.: 2023/2024"
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-semibold transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          KM
                        </label>
                        <input
                          type="text"
                          value={formVehicleKm}
                          onChange={(e) => setFormVehicleKm(e.target.value)}
                          placeholder="Ex.: 42.000"
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-semibold transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Câmbio
                        </label>
                        <select
                          value={formVehicleTransmission}
                          onChange={(e) => setFormVehicleTransmission(e.target.value)}
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-bold bg-white transition-all shadow-2xs"
                        >
                          <option value="Automático">Automático</option>
                          <option value="Manual">Manual</option>
                          <option value="CVT">CVT</option>
                          <option value="Automatizado">Automatizado</option>
                          <option value="Semi-automático">Semi-automático</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Tração
                        </label>
                        <select
                          value={formVehicleTraction}
                          onChange={(e) => setFormVehicleTraction(e.target.value)}
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-bold bg-white transition-all shadow-2xs"
                        >
                          <option value="4x2">4x2</option>
                          <option value="4x4">4x4</option>
                          <option value="Dianteira">Dianteira</option>
                          <option value="Traseira">Traseira</option>
                          <option value="AWD / Integral">AWD / Integral</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs sm:text-[13px] font-bold text-neutral-800">
                            Placa (Interno)
                          </label>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300/60">
                            🔒 Privado
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formVehiclePlateInternal}
                          onChange={(e) => setFormVehiclePlateInternal(e.target.value.toUpperCase())}
                          placeholder="Ex.: ABC-1D23"
                          className="w-full h-11 px-3.5 text-sm border border-amber-300 bg-amber-50/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-500 font-mono font-bold uppercase transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Título Personalizado Opcional + Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Título no Card (Opcional)
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder={
                            [formVehicleBrand, formVehicleModel, formVehicleVersion, formVehicleYearModel || formVehicleYearFab]
                              .filter(Boolean)
                              .join(' ') || 'Ex.: Toyota Corolla 2.0 XEi'
                          }
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-semibold transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Status na Vitrine
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer h-11 px-3.5 border border-neutral-300 rounded-xl bg-neutral-50/80 hover:bg-neutral-100/60 transition-colors shadow-2xs">
                          <input
                            type="checkbox"
                            checked={formIsActive}
                            onChange={(e) => setFormIsActive(e.target.checked)}
                            className="w-4 h-4 text-[#FB6600] rounded accent-[#FB6600] cursor-pointer"
                          />
                          <span className="font-bold text-xs sm:text-sm text-neutral-800">
                            {formIsActive ? '🟢 Ativo na vitrine' : '⚪ Inativo (oculto)'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Descrição Detalhada (Opcional) */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Descrição e Opcionais (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Opcionais do veículo, revisões feitas na concessionária, manual, chave reserva, garantia..."
                        className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] resize-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Nome do Produto <span className="text-[#FB6600]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex.: Camisa Slim Fit Algodão Pima..."
                        className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-bold transition-all shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Código Interno / SKU (Opcional)
                        </label>
                        <input
                          type="text"
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          placeholder="Ex.: CAM-SLIM-01"
                          className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-mono font-semibold transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                          Status na Vitrine
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer h-11 px-3.5 border border-neutral-300 rounded-xl bg-neutral-50/80 hover:bg-neutral-100/60 transition-colors shadow-2xs">
                          <input
                            type="checkbox"
                            checked={formIsActive}
                            onChange={(e) => setFormIsActive(e.target.checked)}
                            className="w-4 h-4 text-[#FB6600] rounded accent-[#FB6600] cursor-pointer"
                          />
                          <span className="font-bold text-xs sm:text-sm text-neutral-800">
                            {formIsActive ? '🟢 Ativo na vitrine' : '⚪ Inativo (oculto)'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Sub-card: Medidas, Peso, Volume e Unidade de Venda */}
                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-white border border-neutral-200/90 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📦</span>
                          <label className="block text-xs sm:text-[13px] font-black text-neutral-900">
                            Medida, Peso ou Volume
                          </label>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-semibold bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200/60">
                          Ex.: 1kg de café, 500g, 750ml, 1 par de sapatos
                        </span>
                      </div>

                      {/* Atalhos Rápidos Pro Max */}
                      <div>
                        <span className="block text-[11px] font-extrabold uppercase tracking-wide text-neutral-600 mb-1.5">
                          Atalhos Rápidos de 1 Clique:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { val: '1', type: 'kg', label: '1kg' },
                            { val: '500', type: 'g', label: '500g' },
                            { val: '250', type: 'g', label: '250g' },
                            { val: '100', type: 'g', label: '100g' },
                            { val: '1', type: 'L', label: '1L' },
                            { val: '750', type: 'ml', label: '750ml' },
                            { val: '500', type: 'ml', label: '500ml' },
                            { val: '350', type: 'ml', label: '350ml' },
                            { val: '1', type: 'un', label: '1 un' },
                            { val: '1', type: 'par', label: '1 par' },
                            { val: '1', type: 'kit', label: '1 kit' },
                            { val: '1', type: 'cx', label: '1 cx' },
                          ].map((preset) => {
                            const isSelected = formUnitValue === preset.val && formUnitType === preset.type
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setFormUnitValue(preset.val)
                                  setFormUnitType(preset.type)
                                }}
                                className={`px-2.5 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#FB6600] to-[#e05b00] text-white border-[#FB6600] shadow-xs scale-102'
                                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900 hover:text-black'
                                }`}
                              >
                                {preset.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Campos Quantidade e Unidade */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Quantidade / Valor Numérico
                          </label>
                          <input
                            type="text"
                            value={formUnitValue}
                            onChange={(e) => setFormUnitValue(e.target.value)}
                            placeholder="Ex.: 1 (para 1kg), 500 (para 500g)..."
                            className="w-full h-10 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] bg-white font-bold transition-all shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Unidade de Medida
                          </label>
                          <select
                            value={formUnitType}
                            onChange={(e) => setFormUnitType(e.target.value)}
                            className="w-full h-10 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] bg-white font-bold cursor-pointer transition-all shadow-2xs"
                          >
                            <option value="un">un (Unidade padrão)</option>
                            <option value="kg">kg (Quilograma - Ex.: 1kg de café / carne)</option>
                            <option value="g">g (Gramas - Ex.: 500g, 250g)</option>
                            <option value="L">L (Litros - Ex.: 1L de azeite / bebida)</option>
                            <option value="ml">ml (Mililitros - Ex.: 350ml, 750ml)</option>
                            <option value="par">par (Par - Ex.: 1 par de calçados / luvas)</option>
                            <option value="kit">kit (Kit com múltiplos itens)</option>
                            <option value="cx">cx (Caixa fechada)</option>
                            <option value="pct">pct (Pacote)</option>
                            <option value="m">m (Metros)</option>
                            <option value="cm">cm (Centímetros)</option>
                            <option value="duzia">dúzia (Dúzia)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Sub-card: Grade de Tamanhos e Numerações */}
                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-white border border-neutral-200/90 rounded-xl space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📏</span>
                          <label className="block text-xs sm:text-[13px] font-black text-neutral-900">
                            Grade de Tamanhos e Numerações
                          </label>
                        </div>
                        {formSizes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormSizes([])}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer underline decoration-dotted"
                          >
                            Limpar selecionados ({formSizes.length})
                          </button>
                        )}
                      </div>

                      {/* Roupas Adulto */}
                      <div>
                        <span className="block text-[11px] font-extrabold uppercase tracking-wide text-neutral-700 mb-1.5 flex items-center gap-1.5">
                          <span>👕</span>
                          <span>Roupas Adulto (PP ao XXG e Plus Size):</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'G1', 'G2', 'G3', 'Único'].map((size) => {
                            const isSelected = formSizes.includes(size)
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => {
                                  setFormSizes((prev) =>
                                    isSelected ? prev.filter((s) => s !== size) : [...prev, size]
                                  )
                                }}
                                className={`min-w-10 h-8 px-2 text-xs font-black rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                  isSelected
                                    ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs scale-105'
                                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-900 hover:text-black'
                                }`}
                              >
                                {size}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Calçados / Sapatos: Infantil ao Adulto (18 ao 46) */}
                      <div>
                        <span className="block text-[11px] font-extrabold uppercase tracking-wide text-neutral-700 mb-1.5 flex items-center gap-1.5">
                          <span>👟</span>
                          <span>Calçados (Numeração Infantil ao Adulto — 18 ao 46):</span>
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {[
                            '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
                            '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41',
                            '42', '43', '44', '45', '46'
                          ].map((num) => {
                            const isSelected = formSizes.includes(num)
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  setFormSizes((prev) =>
                                    isSelected ? prev.filter((s) => s !== num) : [...prev, num]
                                  )
                                }}
                                className={`w-8 h-7 text-[11px] font-black rounded-md border transition-all cursor-pointer shadow-2xs ${
                                  isSelected
                                    ? 'bg-[#FB6600] text-white border-[#FB6600] shadow-xs scale-105'
                                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-900'
                                }`}
                              >
                                {num}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Roupas Infantil / Bebê */}
                      <div>
                        <span className="block text-[11px] font-extrabold uppercase tracking-wide text-neutral-700 mb-1.5 flex items-center gap-1.5">
                          <span>👶</span>
                          <span>Roupas Infantil e Bebê:</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            'RN', '0-3m', '3-6m', '6-9m', '9-12m', '1 ano', '2 anos', '3 anos',
                            '4 anos', '6 anos', '8 anos', '10 anos', '12 anos', '14 anos', '16 anos'
                          ].map((inf) => {
                            const isSelected = formSizes.includes(inf)
                            return (
                              <button
                                key={inf}
                                type="button"
                                onClick={() => {
                                  setFormSizes((prev) =>
                                    isSelected ? prev.filter((s) => s !== inf) : [...prev, inf]
                                  )
                                }}
                                className={`px-2.5 h-7 text-[11px] font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                  isSelected
                                    ? 'bg-neutral-800 text-white border-neutral-800 shadow-xs'
                                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-900'
                                }`}
                              >
                                {inf}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Cama, Mesa e Banho */}
                      <div>
                        <span className="block text-[11px] font-extrabold uppercase tracking-wide text-neutral-700 mb-1.5 flex items-center gap-1.5">
                          <span>🛏️</span>
                          <span>Cama, Mesa e Banho:</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['Solteiro', 'Casal', 'Queen', 'King', 'Super King'].map((cama) => {
                            const isSelected = formSizes.includes(cama)
                            return (
                              <button
                                key={cama}
                                type="button"
                                onClick={() => {
                                  setFormSizes((prev) =>
                                    isSelected ? prev.filter((s) => s !== cama) : [...prev, cama]
                                  )
                                }}
                                className={`px-3 h-7 text-[11px] font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                  isSelected
                                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-900'
                                }`}
                              >
                                {cama}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Adicionar Tamanho Personalizado */}
                      <div className="pt-2 border-t border-neutral-200/80 flex items-center gap-2">
                        <input
                          type="text"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const trimmed = customSizeInput.trim()
                              if (trimmed && !formSizes.includes(trimmed)) {
                                setFormSizes((prev) => [...prev, trimmed])
                                setCustomSizeInput('')
                              }
                            }
                          }}
                          placeholder="Outro tamanho (ex.: 48, G4, 120x80cm, Sob Medida...)"
                          className="flex-1 h-9 px-3 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] bg-white font-semibold transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = customSizeInput.trim()
                            if (trimmed && !formSizes.includes(trimmed)) {
                              setFormSizes((prev) => [...prev, trimmed])
                              setCustomSizeInput('')
                            }
                          }}
                          className="h-9 px-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-xs"
                        >
                          + Adicionar
                        </button>
                      </div>

                      {/* Tags Selecionadas */}
                      {formSizes.length > 0 && (
                        <div className="p-3 bg-white border border-neutral-200/90 rounded-xl flex items-center gap-1.5 flex-wrap shadow-2xs">
                          <span className="text-xs font-black text-neutral-700 mr-1">Tamanhos selecionados:</span>
                          {formSizes.map((sz) => (
                            <span
                              key={sz}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-900 text-white rounded-lg text-xs font-black shadow-xs"
                            >
                              <span>{sz}</span>
                              <button
                                type="button"
                                onClick={() => setFormSizes((prev) => prev.filter((s) => s !== sz))}
                                className="hover:text-red-300 text-sm cursor-pointer leading-none"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sub-card: Cores Disponíveis (Opcional) */}
                    <div className="p-4 bg-gradient-to-br from-neutral-50 to-white border border-neutral-200/90 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🎨</span>
                          <label className="block text-xs sm:text-[13px] font-black text-neutral-900">
                            Cores Disponíveis (Opcional)
                          </label>
                        </div>
                        {formColors.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormColors([])}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer underline decoration-dotted"
                          >
                            Limpar cores ({formColors.length})
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          'Preto', 'Branco', 'Cinza', 'Azul', 'Vermelho', 'Verde',
                          'Amarelo', 'Rosa', 'Bege', 'Marrom', 'Colorido'
                        ].map((cor) => {
                          const isSelected = formColors.includes(cor)
                          return (
                            <button
                              key={cor}
                              type="button"
                              onClick={() => {
                                setFormColors((prev) =>
                                  isSelected ? prev.filter((c) => c !== cor) : [...prev, cor]
                                )
                              }}
                              className={`px-3 py-1 text-xs font-bold rounded-full border transition-all cursor-pointer shadow-2xs ${
                                isSelected
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs scale-105'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900 hover:text-black'
                              }`}
                            >
                              {cor}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={customColorInput}
                          onChange={(e) => setCustomColorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const trimmed = customColorInput.trim()
                              if (trimmed && !formColors.includes(trimmed)) {
                                setFormColors((prev) => [...prev, trimmed])
                                setCustomColorInput('')
                              }
                            }
                          }}
                          placeholder="Outra cor (ex.: Azul Marinho, Estampado, Dourado...)"
                          className="flex-1 h-9 px-3 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] bg-white font-medium transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = customColorInput.trim()
                            if (trimmed && !formColors.includes(trimmed)) {
                              setFormColors((prev) => [...prev, trimmed])
                              setCustomColorInput('')
                            }
                          }}
                          className="h-9 px-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-xs"
                        >
                          + Adicionar Cor
                        </button>
                      </div>

                      {formColors.length > 0 && (
                        <div className="p-3 bg-white border border-neutral-200/90 rounded-xl flex items-center gap-1.5 flex-wrap shadow-2xs">
                          <span className="text-xs font-black text-neutral-700 mr-1">Cores selecionadas:</span>
                          {formColors.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-900 rounded-full text-xs font-black shadow-2xs"
                            >
                              <span>{c}</span>
                              <button
                                type="button"
                                onClick={() => setFormColors((prev) => prev.filter((x) => x !== c))}
                                className="hover:text-red-500 cursor-pointer text-sm leading-none"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Descrição do Produto (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Composição do material, detalhes de modelagem, especificações técnicas, modo de conservação..."
                        className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] resize-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 2: Categorias e Subcategorias */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
                  <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs font-black inline-flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900">
                    Categoria e Subcategoria
                  </h4>
                </div>

                {categories.length === 0 ? (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-950 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
                    <span className="font-medium">
                      Nenhuma categoria cadastrada no Tópico 05.
                      {formIsVehicle && ` Será usada "${formVehicleCategory}" por padrão.`}
                    </span>
                    <a
                      href="?topico=5"
                      className="font-black underline text-black hover:text-[#FB6600] transition-colors"
                    >
                      Configurar Categorias &rarr;
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Categoria Principal {!formIsVehicle && <span className="text-[#FB6600]">*</span>}
                      </label>
                      <select
                        required={!formIsVehicle}
                        value={formCategory}
                        onChange={(e) => handleFormCategoryChange(e.target.value)}
                        className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-bold bg-white cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="">
                          {formIsVehicle
                            ? `Padrão do veículo (${formVehicleCategory || 'Auto'})`
                            : 'Selecione uma categoria...'}
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Subcategoria
                      </label>
                      <select
                        value={formSubcategory}
                        onChange={(e) => setFormSubcategory(e.target.value)}
                        disabled={formAvailableSubcategories.length === 0}
                        className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-semibold bg-white disabled:bg-neutral-100 disabled:text-neutral-400 cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="">
                          {formAvailableSubcategories.length === 0
                            ? 'Sem subcategorias'
                            : 'Nenhuma subcategoria'}
                        </option>
                        {formAvailableSubcategories.map((sub) => (
                          <option key={sub.id} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Tipo de Promoção */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs font-black inline-flex items-center justify-center shadow-xs">
                      3
                    </span>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900">
                      Tipo de Promoção <span className="text-[#FB6600]">*</span>
                    </h4>
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#FB6600] text-white shadow-2xs">
                    Selo no card
                  </span>
                </div>

                <div
                  className={`grid gap-2.5 ${
                    formIsVehicle ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                  }`}
                >
                  {(formIsVehicle ? TIPOS_PROMOCAO_VEICULOS : TIPOS_PROMOCAO).map((promo) => {
                    const isSelected = formPromoType === promo.id
                    return (
                      <button
                        key={promo.id}
                        type="button"
                        onClick={() => setFormPromoType(promo.id)}
                        className={`h-11 px-3.5 text-xs sm:text-sm rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#FB6600] to-[#e05b00] border-[#FB6600] text-white font-black shadow-xs scale-101'
                            : 'bg-white border-neutral-300 text-neutral-800 hover:border-neutral-900 font-bold hover:bg-neutral-50'
                        }`}
                      >
                        <span className="truncate">{promo.label}</span>
                        {isSelected && <span className="text-sm shrink-0">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Seção 4: Fotos dos Produtos */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs font-black inline-flex items-center justify-center shadow-xs">
                      4
                    </span>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900">
                      Galeria de Fotos ({formImages.length}/{MAX_PHOTOS})
                    </h4>
                  </div>
                  <span className="text-xs text-neutral-500 font-semibold">
                    ⭐ A 1ª foto é a capa da vitrine
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-2">
                  {formImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-neutral-100 border border-neutral-300/80 rounded-xl overflow-hidden relative group shadow-xs transition-all hover:shadow-md"
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 ? (
                        <>
                          <span className="absolute top-2 left-2 bg-gradient-to-r from-[#FB6600] to-[#e05b00] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-md">
                            {getPromoLabel(formPromoType)}
                          </span>
                          {calculatedDiscount && calculatedDiscount > 0 && (
                            <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-yellow-400 text-black font-black text-[11px] flex items-center justify-center shadow-md border border-yellow-500/50">
                              -{calculatedDiscount}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="absolute top-2 left-2 bg-neutral-900/85 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow">
                          Foto {idx + 1}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(idx)}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-black rounded-lg text-xs font-black cursor-pointer shadow-md transition-transform hover:scale-105"
                            title="Tornar foto de capa"
                          >
                            ⭐ Capa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-md transition-transform hover:scale-105"
                          title="Remover foto"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Slots para adicionar até 12 fotos (Veículo) ou 6 fotos (Padrão) */}
                  {Array.from({ length: Math.max(0, MAX_PHOTOS - formImages.length) }).map((_, slotIdx) => {
                    const photoNumber = formImages.length + slotIdx + 1
                    const isNextSlot = slotIdx === 0
                    return (
                      <button
                        key={`slot-${photoNumber}`}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-3 transition-all cursor-pointer ${
                          isNextSlot
                            ? 'border-[#FB6600]/60 hover:border-[#FB6600] text-neutral-800 hover:text-black bg-orange-50/20 hover:bg-orange-50/40 shadow-2xs'
                            : 'border-neutral-200 hover:border-neutral-400 text-neutral-400 hover:text-neutral-700 bg-neutral-50/40'
                        }`}
                      >
                        <span className="text-2xl mb-1.5">{uploadingImage && isNextSlot ? '⏳' : '📷'}</span>
                        <span className="text-xs font-black text-center">
                          {uploadingImage && isNextSlot ? 'Enviando...' : `Foto ${photoNumber}/${MAX_PHOTOS}`}
                        </span>
                        {isNextSlot && (
                          <span className="text-[10px] font-bold text-[#FB6600] mt-0.5">+ Adicionar</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Enquadramento Travado: Veículos sempre horizontal, Produtos sempre vertical */}
                <div className="pt-3 border-t border-neutral-100">
                  {formIsVehicle ? (
                    <div className="p-3.5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white rounded-xl flex items-center gap-3.5 shadow-xs border border-neutral-800">
                      <span className="text-2xl shrink-0">🚗</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-white">
                            Enquadramento Travado: Horizontal (16:9)
                          </span>
                          <span className="px-2 py-0.5 bg-[#FB6600] text-white text-[10px] uppercase rounded-full font-black tracking-wide">
                            Automático
                          </span>
                        </div>
                        <span className="text-xs text-neutral-300 block mt-0.5">
                          Carros e veículos são padronizados no formato horizontal panorâmico para melhor visualização.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white rounded-xl flex items-center gap-3.5 shadow-xs border border-neutral-800">
                      <span className="text-2xl shrink-0">🛍️</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-white">
                            Enquadramento Travado: Vertical (3:4)
                          </span>
                          <span className="px-2 py-0.5 bg-[#FB6600] text-white text-[10px] uppercase rounded-full font-black tracking-wide">
                            Automático
                          </span>
                        </div>
                        <span className="text-xs text-neutral-300 block mt-0.5">
                          Roupas, calçados, bebidas e produtos de catálogo são padronizados no formato vertical estilo e-commerce.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 5: Preços do Produto */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
                  <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs font-black inline-flex items-center justify-center shadow-xs">
                    5
                  </span>
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-900">
                    Preços e Condições Comerciais {formIsVehicle ? '(Veículo)' : '(Produto)'}
                  </h4>
                </div>

                {formIsVehicle ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Preço de Custo (Interno) */}
                      <div className="p-4 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-black text-amber-950">
                            Custo de Aquisição
                          </label>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-200/70 text-amber-950 rounded-full border border-amber-300">
                            🔒 Oculto
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">R$</span>
                          <input
                            type="text"
                            value={formCostPriceInternal}
                            onChange={(e) => setFormCostPriceInternal(e.target.value)}
                            placeholder="0,00"
                            className="w-full h-11 pl-10 pr-3.5 text-sm border border-amber-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold text-neutral-900 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Preço de Venda (Público) */}
                      <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded-xl space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-black text-emerald-950">
                            Preço de Venda <span className="text-[#FB6600]">*</span>
                          </label>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-600 text-white rounded-full shadow-xs">
                            Público
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-700">R$</span>
                          <input
                            type="text"
                            required
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            placeholder="118.900,00"
                            className="w-full h-11 pl-10 pr-3.5 text-sm border border-emerald-400 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-neutral-950 transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Preço FIPE (Interno) */}
                      <div className="p-4 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-black text-amber-950">
                            Valor Tabela FIPE
                          </label>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-200/70 text-amber-950 rounded-full border border-amber-300">
                            🔒 Oculto
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">R$</span>
                          <input
                            type="text"
                            value={formFipePriceInternal}
                            onChange={(e) => setFormFipePriceInternal(e.target.value)}
                            placeholder="122.400,00"
                            className="w-full h-11 pl-10 pr-3.5 text-sm border border-amber-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold text-neutral-900 transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-center gap-2.5 shadow-2xs">
                      <span className="text-base shrink-0">🔒</span>
                      <span>
                        <strong>Privacidade dos Dados Internos (Custo, FIPE e Placa):</strong> visíveis somente neste painel gerencial; clientes e visitantes veem estritamente o Preço de Venda público.
                      </span>
                    </div>

                    {/* Preço Promocional Opcional */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-700">
                          Preço Promocional (Opcional)
                        </label>
                        {calculatedDiscount && (
                          <span className="text-xs font-black text-black bg-yellow-400 px-2.5 py-0.5 rounded-full shadow-2xs border border-yellow-500/40">
                            Desconto: {calculatedDiscount}%
                          </span>
                        )}
                      </div>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">R$</span>
                        <input
                          type="text"
                          value={formPromoPrice}
                          onChange={(e) => setFormPromoPrice(e.target.value)}
                          placeholder="Opcional"
                          className="w-full h-11 pl-10 pr-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-black text-[#FB6600] transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                        Preço Regular (R$) <span className="text-[#FB6600]">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">R$</span>
                        <input
                          type="text"
                          required
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          placeholder="0,00"
                          className="w-full h-11 pl-10 pr-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-black text-neutral-900 transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs sm:text-[13px] font-bold text-neutral-800">
                          Preço Promocional (Opcional)
                        </label>
                        {calculatedDiscount && (
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300/70 shadow-2xs">
                            {calculatedDiscount}% OFF
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">R$</span>
                        <input
                          type="text"
                          value={formPromoPrice}
                          onChange={(e) => setFormPromoPrice(e.target.value)}
                          placeholder="Ex.: 89,90"
                          className="w-full h-11 pl-10 pr-3.5 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FB6600]/25 focus:border-[#FB6600] font-black text-[#FB6600] transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé Fixo / Sticky Pro Max */}
              <div className="pt-4 border-t border-neutral-200/90 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs font-bold text-neutral-500 hidden sm:flex items-center gap-2">
                  <span>{formIsVehicle ? '🚗 Modo Veículo' : '🛍️ Modo Produto Padrão'}</span>
                  <span>&bull;</span>
                  <span>{formImages.length} {formImages.length === 1 ? 'foto' : 'fotos'}</span>
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="h-11 px-5 border border-neutral-300 text-neutral-700 text-xs sm:text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSaveProduct()
                    }}
                    disabled={submitting}
                    className="h-11 px-6 bg-gradient-to-r from-[#FB6600] to-[#e05b00] hover:from-[#e05b00] hover:to-[#c44e00] text-white text-xs sm:text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-98"
                  >
                    {submitting ? (
                      <>
                        <span className="animate-spin text-sm">⏳</span>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>
                          {editingProduct
                            ? 'Salvar Alterações'
                            : formIsVehicle
                            ? 'Cadastrar Veículo'
                            : 'Cadastrar Produto'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO                                  */}
      {/* ----------------------------------------------------------------- */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-md shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>Confirmar Exclusão</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="text-white hover:opacity-80 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 bg-neutral-50 border border-neutral-200 rounded-md">
                <div className="w-16 h-20 bg-neutral-200 rounded-md overflow-hidden shrink-0 flex items-center justify-center">
                  {deleteConfirmation.image_url ? (
                    <img
                      src={deleteConfirmation.image_url}
                      alt={deleteConfirmation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">🖼️</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-neutral-900 truncate">
                    {deleteConfirmation.name}
                  </h4>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-700 block mt-0.5">
                    R$ {formatCurrencyBRL(deleteConfirmation.price)}
                  </span>
                  <span className="text-xs text-neutral-500 capitalize">
                    {deleteConfirmation.category} {deleteConfirmation.subcategory ? `• ${deleteConfirmation.subcategory}` : ''}
                  </span>
                </div>
              </div>

              <p className="text-sm text-neutral-700 leading-relaxed">
                Tem certeza que deseja excluir este item permanentemente do catálogo?
              </p>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="h-10 px-4 border border-neutral-300 text-neutral-700 text-xs sm:text-sm font-semibold rounded-md hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL DE PRÉ-VISUALIZAÇÃO DO CARD DO PRODUTO                      */}
      {/* ----------------------------------------------------------------- */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2px] shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-3 bg-neutral-900 text-white flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Pré-visualização do Card
              </span>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="text-white hover:opacity-80 font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 bg-neutral-100 flex items-center justify-center">
              <div className="w-full bg-white border border-gray-200 grid grid-cols-1 overflow-hidden shadow-sm rounded-[2px]">
                {/* Sizer invisível para manter o card de carros com o mesmo tamanho do card de produtos */}
                <div className="col-start-1 row-start-1 invisible pointer-events-none select-none flex flex-col w-full" aria-hidden="true">
                  <div className="w-full aspect-[4/5]" />
                  <div className="p-3 flex flex-col justify-between">
                    <div className="h-[76px]" />
                    <div className="h-[34px] mt-3" />
                  </div>
                </div>

                <div className="col-start-1 row-start-1 flex flex-col h-full w-full justify-between overflow-hidden">
                  <ProductCardImageCarousel
                    images={
                      previewProduct.images && previewProduct.images.length > 0
                        ? previewProduct.images
                        : previewProduct.image_url
                        ? [previewProduct.image_url]
                        : []
                    }
                    alt={previewProduct.name}
                    photoOrientation={
                      previewProduct.photo_orientation ||
                      (previewProduct.is_vehicle ? 'horizontal' : 'vertical')
                    }
                    promoBadgeLabel={getPromoLabel(
                      previewProduct.promo_type,
                      previewProduct.is_outlet,
                      previewProduct.is_novidade
                    )}
                    subcategory={previewProduct.subcategory}
                    hasDiscount={Boolean(
                      previewProduct.promotional_price &&
                        previewProduct.promotional_price > 0 &&
                        previewProduct.promotional_price < previewProduct.price
                    )}
                    discountPercent={
                      previewProduct.promotional_price &&
                      previewProduct.promotional_price > 0 &&
                      previewProduct.promotional_price < previewProduct.price
                        ? Math.round(
                            ((previewProduct.price - previewProduct.promotional_price) /
                              previewProduct.price) *
                              100
                          )
                        : null
                    }
                  />

                  <div className="p-3 flex flex-col flex-grow justify-between">
                    <div className="flex flex-col flex-grow">
                      <span className="text-[9.5px] uppercase font-bold text-gray-400 block tracking-wider mb-0.5 capitalize">
                        {previewProduct.category} {previewProduct.subcategory ? `• ${previewProduct.subcategory}` : ''}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1 leading-snug mb-1">
                        {previewProduct.name}
                      </h4>

                      {previewProduct.is_vehicle || previewProduct.photo_orientation === 'horizontal' ? (
                        <div className="mt-1.5 flex flex-col gap-1.5 flex-grow justify-center">
                          <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2.5 py-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">
                              Versão
                            </span>
                            <span className="text-[11px] font-semibold text-neutral-800 leading-snug line-clamp-2 block">
                              {previewProduct.vehicle_version || previewProduct.description || 'Consulte especificações da versão'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2 py-1">
                              <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">KM</span>
                              <span className="text-[11px] font-bold text-neutral-900 truncate block">{previewProduct.vehicle_km || 'Consulte'}</span>
                            </div>
                            <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2 py-1">
                              <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">Tração</span>
                              <span className="text-[11px] font-bold text-neutral-900 truncate block">{previewProduct.vehicle_traction || 'Integral / 4x2'}</span>
                            </div>
                            <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2 py-1">
                              <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">Ano</span>
                              <span className="text-[11px] font-bold text-neutral-900 truncate block">{previewProduct.vehicle_year_fab || '—'}</span>
                            </div>
                            <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2 py-1">
                              <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">Ano/Modelo</span>
                              <span className="text-[11px] font-bold text-neutral-900 truncate block">
                                {previewProduct.vehicle_year_fab && previewProduct.vehicle_year_model
                                  ? `${previewProduct.vehicle_year_fab}/${previewProduct.vehicle_year_model}`
                                  : previewProduct.vehicle_year_model || previewProduct.vehicle_year_fab || '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        previewProduct.description && (
                          <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                            {previewProduct.description}
                          </p>
                        )
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-100">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-black">
                          R$ {formatCurrencyBRL(previewProduct.promotional_price || previewProduct.price)}
                        </span>
                        {previewProduct.promotional_price && previewProduct.promotional_price < previewProduct.price && (
                          <span className="text-[10px] text-gray-400 line-through">
                            R$ {formatCurrencyBRL(previewProduct.price)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 w-full text-center py-1.5 bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-[2px]">
                        Pedir no WhatsApp
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-center">
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="px-4 py-1.5 bg-black text-white text-xs font-bold uppercase rounded-[2px]"
              >
                Fechar Prévia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

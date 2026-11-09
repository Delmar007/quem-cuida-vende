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

  // Estados exclusivos para Cadastro de Veículos (Segmento Carro / Usados e Concessionária)
  const [formVehicleCategory, setFormVehicleCategory] = useState('Carro')
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
    { id: 'Carro', label: 'Carro', icon: '🚗' },
    { id: 'Moto', label: 'Moto', icon: '🏍️' },
    { id: 'Caminhão', label: 'Caminhão', icon: '🚚' },
    { id: 'Ônibus/Van', label: 'Ônibus/Van', icon: '🚐' },
    { id: 'Triciclo/Quadriciclo/UTV', label: 'Triciclo/Quadriciclo/UTV', icon: '🛞' },
    { id: 'Náutica', label: 'Náutica', icon: '🚤' },
    { id: 'Tratores/Rebocáveis', label: 'Tratores/Rebocáveis', icon: '🚜' },
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

    // Campos de veículo resetados
    setFormVehicleCategory('Carro')
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

    setFormVehicleCategory(prod.vehicle_category || 'Carro')
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
          photoOrientation: formPhotoOrientation,
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
          photoOrientation: formPhotoOrientation,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-neutral-200/80 rounded-[4px]">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Catálogo de Produtos
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Cadastre e gerencie os produtos da sua loja, organize categorias, configure preços e controle a exibição aos clientes.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            disabled={limitReached}
            className={`px-4 py-2 text-white text-xs font-semibold rounded-[2px] transition-all flex items-center gap-2 cursor-pointer ${
              limitReached
                ? 'bg-neutral-400 opacity-60 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-black'
            }`}
            title={limitReached ? `Limite de ${maxProducts} produtos atingido` : 'Cadastrar novo produto'}
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
          className={`p-4 text-xs rounded-[2px] flex items-center justify-between border animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-sm font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* PAINEL DE RESUMO E INDICADORES DO CATÁLOGO (REQUISITO SEÇÃO 3)    */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Cadastrado */}
        <div className="bg-white border border-neutral-200 p-4 rounded-[2px] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Cadastrados
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-neutral-900">{totalCount}</span>
            <span className="text-xs font-semibold text-neutral-400">/ {maxProducts}</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">Total no catálogo</span>
        </div>

        {/* Vagas Disponíveis */}
        <div className="bg-white border border-neutral-200 p-4 rounded-[2px] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Vagas Restantes
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-black ${availableSlots === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {availableSlots}
            </span>
            <span className="text-[10px] font-semibold text-neutral-400">vagas</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">Disponíveis</span>
        </div>

        {/* Ocupação do Plano */}
        <div className="bg-white border border-neutral-200 p-4 rounded-[2px] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Ocupação
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-neutral-900">{occupancyPercentage}%</span>
          </div>
          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-1.5">
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

        {/* Produtos Ativos */}
        <div className="bg-white border border-neutral-200 p-4 rounded-[2px] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Ativos na Loja
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-800">{activeCount}</span>
            <span className="text-[10px] text-neutral-400">visíveis</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">Vitrine pública</span>
        </div>

        {/* Produtos Inativos */}
        <div className="bg-white border border-neutral-200 p-4 rounded-[2px] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
            Inativos (Pausa)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-neutral-700">{inactiveCount}</span>
            <span className="text-[10px] text-neutral-400">itens</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">Ocultos na vitrine</span>
        </div>

        {/* Em Promoção */}
        <div className="bg-white border border-neutral-200 p-4 rounded-[2px] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB6600] block mb-1">
            Em Promoção
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#FB6600]">{promoCount}</span>
            <span className="text-[10px] text-neutral-400">itens</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">Com desconto real</span>
        </div>
      </div>

      {/* Alerta de Limite Atingido / Upgrade Recomendado */}
      {limitReached && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-[2px] text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚠️</span>
            <div>
              <strong className="block font-bold">
                Você atingiu o limite de {maxProducts} produtos do seu plano {planConfig.name}.
              </strong>
              <p className="text-[11px] text-amber-800">
                Para cadastrar novos produtos, exclua itens desnecessários ou contrate um plano superior com maior capacidade de catálogo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPlansModal}
            className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[2px] whitespace-nowrap cursor-pointer transition-colors"
          >
            Ver Planos Superiores
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* BARRA DE BUSCA E FILTROS DE PRODUTOS                               */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white p-4 border border-neutral-200 rounded-[2px] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Busca por Nome ou SKU */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
              Buscar Produto
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou código SKU..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black text-xs"
            />
          </div>

          {/* Filtro por Categoria Principal */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
              Categoria
            </label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setFilterSubcategory('all')
              }}
              className="w-full px-3 py-2 border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black text-xs bg-white"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Subcategoria */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
              Subcategoria
            </label>
            <select
              value={filterSubcategory}
              disabled={filterCategory === 'all' || filterSubcategories.length === 0}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black text-xs bg-white disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              <option value="all">Todas as subcategorias</option>
              {filterSubcategories.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black text-xs bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Inativos</option>
            </select>
          </div>

          {/* Filtro por Promoção / Destaque */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
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
              className="w-full px-3 py-2 border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black text-xs bg-white"
            >
              <option value="all">Todos os destaques</option>
              <option value="promo">Com Preço Promocional</option>
              <option value="outlet">Destaque Outlet</option>
              <option value="novidade">Destaque Novidade</option>
            </select>
          </div>
        </div>

        {/* Resumo de Resultados e Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
          <span>
            Exibindo <strong>{filteredProducts.length}</strong> de <strong>{totalCount}</strong> produto(s)
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
      {/* LISTAGEM DOS PRODUTOS (TABELA DESKTOP / CARDS MOBILE)             */}
      {/* ----------------------------------------------------------------- */}
      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-500 bg-white border border-neutral-200 rounded-[2px]">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Carregando catálogo de produtos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 p-12 text-center rounded-[2px]">
          <span className="text-3xl block mb-2">📦</span>
          <h3 className="text-sm font-bold text-neutral-800">Nenhum produto encontrado</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {products.length === 0
              ? 'Seu catálogo ainda não possui produtos cadastrados. Clique abaixo para cadastrar o primeiro item!'
              : 'Nenhum produto corresponde aos filtros selecionados. Tente alterar ou limpar os filtros.'}
          </p>
          {products.length === 0 && !limitReached && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer"
            >
              + Cadastrar Primeiro Produto
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-[2px] shadow-xs overflow-hidden">
          {/* Tabela Responsiva Desktop */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4 w-16">Foto</th>
                  <th className="py-3 px-4">Produto & SKU</th>
                  <th className="py-3 px-4">Classificação</th>
                  <th className="py-3 px-4">Preço Regular</th>
                  <th className="py-3 px-4">Preço Promocional</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((prod) => {
                  const hasPromo = Boolean(prod.promotional_price && prod.promotional_price < prod.price)
                  const discountPercent = hasPromo
                    ? Math.round(((prod.price - prod.promotional_price!) / prod.price) * 100)
                    : 0

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        !prod.is_active ? 'opacity-60 bg-neutral-50/30' : ''
                      }`}
                    >
                      {/* Foto */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-14 bg-neutral-100 border border-neutral-200 rounded-[2px] overflow-hidden relative shrink-0 flex items-center justify-center">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base text-neutral-400">🖼️</span>
                          )}
                          {prod.images && prod.images.length > 1 && (
                            <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-bold px-1 rounded">
                              +{prod.images.length - 1}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nome, SKU e Tipo de Promoção */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="px-1.5 py-0.5 bg-[#FB6600] text-white text-[8.5px] font-black uppercase rounded-[2px]">
                            {getPromoLabel(prod.promo_type, prod.is_outlet, prod.is_novidade)}
                          </span>
                          {prod.is_vehicle && prod.vehicle_category && (
                            <span className="px-1.5 py-0.5 bg-neutral-900 text-white text-[8.5px] font-bold uppercase rounded-[2px]">
                              {prod.vehicle_category}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-neutral-900 leading-snug truncate" title={prod.name}>
                          {prod.name}
                        </h4>
                        {prod.is_vehicle && (
                          <div className="text-[10px] text-neutral-500 mt-0.5 space-y-0.5">
                            <span className="block truncate">
                              {[
                                prod.vehicle_year_model || prod.vehicle_year_fab,
                                prod.vehicle_km ? `${prod.vehicle_km} km` : null,
                                prod.vehicle_transmission,
                                prod.vehicle_traction,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </span>
                            {prod.vehicle_plate_internal && (
                              <span className="inline-block px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[9.5px] rounded-[2px]">
                                🔒 Placa (Interno): {prod.vehicle_plate_internal}
                              </span>
                            )}
                          </div>
                        )}
                        {prod.sku && (
                          <span className="text-[10px] font-mono text-neutral-400 block truncate">
                            SKU: {prod.sku}
                          </span>
                        )}
                      </td>

                      {/* Categoria e Subcategoria */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-neutral-800 block capitalize">
                          {prod.category}
                        </span>
                        {prod.subcategory ? (
                          <span className="text-[10px] text-neutral-500 block truncate">
                            ↳ {prod.subcategory}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic">Sem subcategoria</span>
                        )}
                      </td>

                      {/* Preço Regular / Venda + Dados Internos (Custo / FIPE) */}
                      <td className="py-3 px-4 font-bold text-neutral-800 whitespace-nowrap">
                        {hasPromo ? (
                          <span className="line-through text-neutral-400 text-[11px] block">
                            R$ {formatCurrencyBRL(prod.price)}
                          </span>
                        ) : (
                          <span className="block">R$ {formatCurrencyBRL(prod.price)}</span>
                        )}
                        {prod.cost_price_internal && (
                          <span className="text-[9.5px] font-semibold text-neutral-500 block mt-0.5">
                            🔒 Custo: R$ {formatCurrencyBRL(prod.cost_price_internal)}
                          </span>
                        )}
                        {prod.fipe_price_internal && (
                          <span className="text-[9.5px] font-semibold text-amber-800 bg-amber-50 px-1 py-0.2 rounded inline-block mt-0.5">
                            🔒 FIPE: R$ {formatCurrencyBRL(prod.fipe_price_internal)}
                          </span>
                        )}
                      </td>

                      {/* Preço Promocional */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasPromo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-[#FB6600] text-sm">
                              R$ {formatCurrencyBRL(prod.promotional_price)}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded">
                              -{discountPercent}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10.5px] text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod)}
                          className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded-[2px] transition-colors cursor-pointer border ${
                            prod.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                          }`}
                          title={prod.is_active ? 'Clique para desativar' : 'Clique para ativar'}
                        >
                          {prod.is_active ? '✓ Ativo' : '✕ Inativo'}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewProduct(prod)}
                            className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded cursor-pointer"
                            title="Visualizar card na vitrine"
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded cursor-pointer font-bold"
                            title="Editar produto"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmation(prod)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer font-bold"
                            title="Excluir produto"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL DE CADASTRO E EDIÇÃO DE PRODUTO (COMPLETO)                  */}
      {/* ----------------------------------------------------------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-[2px] shadow-2xl border border-neutral-200 overflow-hidden my-6">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                  {editingProduct ? 'Editar Cadastro' : 'Novo Produto'} •{' '}
                  {formIsVehicle ? 'Segmento Carro / Usados e Concessionária' : 'Cadastro no Catálogo'}
                </span>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  {editingProduct
                    ? editingProduct.name
                    : formIsVehicle
                    ? 'Cadastro de Veículo (Carro / Usados e Concessionária)'
                    : 'Cadastro no Catálogo'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Seletor de Modo: Produto Padrão vs Veículo (Carro / Usados e Concessionária) */}
                <div className="flex items-center bg-neutral-800 p-0.5 rounded-[2px] border border-neutral-700">
                  <button
                    type="button"
                    onClick={() => {
                      setFormIsVehicle(false)
                      if (['novo', 'usado', 'semi_novo'].includes(formPromoType)) {
                        setFormPromoType('outlet')
                      }
                      setFormImages((prev) => prev.slice(0, 6))
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-[2px] transition-colors cursor-pointer ${
                      !formIsVehicle
                        ? 'bg-white text-black'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    🛍️ Padrão
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
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-[2px] transition-colors cursor-pointer ${
                      formIsVehicle
                        ? 'bg-[#FB6600] text-white'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    🚗 Carro / Usados & Concessionária
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="text-neutral-400 hover:text-white font-bold text-lg cursor-pointer ml-1"
                >
                  &times;
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveProduct(e)
              }}
              className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto"
            >
              {/* Seção 1: Informações Básicas (Diferenciada para Carro / Usados e Concessionária) */}
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-1 mb-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                    1. Informações Básicas {formIsVehicle ? '— Dados do Veículo' : ''}
                  </h4>
                  {formIsVehicle && (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-[2px] bg-neutral-900 text-[#FB6600] uppercase">
                      Segmento: Carro / Usados e Concessionária
                    </span>
                  )}
                </div>

                {formIsVehicle ? (
                  <div className="space-y-4">
                    {/* Categoria do Veículo */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">
                        Categoria *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {CATEGORIAS_VEICULOS.map((vCat) => {
                          const selected = formVehicleCategory === vCat.id
                          return (
                            <button
                              key={vCat.id}
                              type="button"
                              onClick={() => setFormVehicleCategory(vCat.id)}
                              className={`px-2.5 py-2 text-xs rounded-[2px] border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                                selected
                                  ? 'bg-[#FB6600] border-[#FB6600] text-white font-black shadow-2xs'
                                  : 'bg-white border-neutral-200 text-neutral-800 hover:border-black font-semibold'
                              }`}
                            >
                              <span>{vCat.icon}</span>
                              <span className="truncate">{vCat.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Marca, Modelo e Versão */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Marca *
                        </label>
                        <input
                          type="text"
                          required
                          value={formVehicleBrand}
                          onChange={(e) => setFormVehicleBrand(e.target.value)}
                          placeholder="Ex: Toyota, VW, Honda..."
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Modelo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formVehicleModel}
                          onChange={(e) => setFormVehicleModel(e.target.value)}
                          placeholder="Ex: Corolla, Hilux, Gol..."
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Versão
                        </label>
                        <input
                          type="text"
                          value={formVehicleVersion}
                          onChange={(e) => setFormVehicleVersion(e.target.value)}
                          placeholder="Ex: 2.0 XEi 16V Flex Aut."
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold"
                        />
                      </div>
                    </div>

                    {/* Ano, Ano/Modelo, KM, Câmbio, Tração e Placa (Interno) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Ano (Fabricação)
                        </label>
                        <input
                          type="text"
                          value={formVehicleYearFab}
                          onChange={(e) => setFormVehicleYearFab(e.target.value)}
                          placeholder="Ex: 2023"
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Ano / Modelo
                        </label>
                        <input
                          type="text"
                          value={formVehicleYearModel}
                          onChange={(e) => setFormVehicleYearModel(e.target.value)}
                          placeholder="Ex: 2023/2024"
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          KM (Quilometragem)
                        </label>
                        <input
                          type="text"
                          value={formVehicleKm}
                          onChange={(e) => setFormVehicleKm(e.target.value)}
                          placeholder="Ex: 42.000"
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Câmbio
                        </label>
                        <select
                          value={formVehicleTransmission}
                          onChange={(e) => setFormVehicleTransmission(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold bg-white"
                        >
                          <option value="Automático">Automático</option>
                          <option value="Manual">Manual</option>
                          <option value="CVT">CVT</option>
                          <option value="Automatizado">Automatizado</option>
                          <option value="Semi-automático">Semi-automático</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Tração
                        </label>
                        <select
                          value={formVehicleTraction}
                          onChange={(e) => setFormVehicleTraction(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold bg-white"
                        >
                          <option value="4x2">4x2</option>
                          <option value="4x4">4x4</option>
                          <option value="Dianteira">Dianteira</option>
                          <option value="Traseira">Traseira</option>
                          <option value="AWD / Integral">AWD / Integral</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-neutral-700 uppercase">
                            Placa (Interno)
                          </label>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded uppercase">
                            🔒 Interno
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formVehiclePlateInternal}
                          onChange={(e) => setFormVehiclePlateInternal(e.target.value.toUpperCase())}
                          placeholder="Ex: ABC-1D23 (Oculto)"
                          className="w-full px-3 py-2 text-xs border border-amber-300 bg-amber-50/40 rounded-[2px] focus:outline-none focus:border-black font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Título Personalizado Opcional + Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Título no Card (Gerado automaticamente ou personalize)
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder={
                            [formVehicleBrand, formVehicleModel, formVehicleVersion, formVehicleYearModel || formVehicleYearFab]
                              .filter(Boolean)
                              .join(' ') || 'Ex: Toyota Corolla 2.0 XEi 2023/2024'
                          }
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Status de Publicação
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer h-9 px-3 border border-neutral-300 rounded-[2px] bg-neutral-50 text-xs">
                          <input
                            type="checkbox"
                            checked={formIsActive}
                            onChange={(e) => setFormIsActive(e.target.checked)}
                            className="w-4 h-4 text-[#FB6600] rounded"
                          />
                          <span className="font-semibold text-neutral-800">
                            {formIsActive ? 'Ativo (Visível na loja)' : 'Inativo (Oculto)'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Descrição Detalhada (Opcional) */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Descrição Detalhada (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Informe opcionais do veículo, estado de conservação, único dono, revisões em concessionária, garantia..."
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: Camisa Cavada Slim Fit Algodão..."
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Código Interno / SKU (Opcional)
                        </label>
                        <input
                          type="text"
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          placeholder="Ex: CAM-SLIM-01"
                          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                          Status de Publicação
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer h-9 px-3 border border-neutral-300 rounded-[2px] bg-neutral-50 text-xs">
                          <input
                            type="checkbox"
                            checked={formIsActive}
                            onChange={(e) => setFormIsActive(e.target.checked)}
                            className="w-4 h-4 text-[#FB6600] rounded"
                          />
                          <span className="font-semibold text-neutral-800">
                            {formIsActive ? 'Ativo (Visível na loja)' : 'Inativo (Oculto)'}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Descrição Detalhada (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Detalhes sobre material, modelagem, especificações técnicas..."
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 2: Seleção de Categoria e Subcategoria (Dispositivo nº 6) */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-1 mb-3">
                  2. Classificação Oficial (Dispositivo nº 6) — Categorias e Subcategorias
                </h4>
                {categories.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-[2px] text-xs text-amber-900 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      Nenhuma categoria personalizada cadastrada ainda no Dispositivo nº 6.
                      {formIsVehicle && ` Será usada a categoria "${formVehicleCategory}" por padrão.`}
                    </span>
                    <a
                      href="?topico=6"
                      className="font-bold underline text-black hover:text-[#FB6600]"
                    >
                      Configurar Categorias &rarr;
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Categoria Principal (Dispositivo nº 6) *
                      </label>
                      <select
                        required={!formIsVehicle}
                        value={formCategory}
                        onChange={(e) => handleFormCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-semibold bg-white"
                      >
                        <option value="">
                          {formIsVehicle
                            ? `Usar categoria do veículo (${formVehicleCategory})`
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
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Subcategoria Vinculada
                      </label>
                      <select
                        value={formSubcategory}
                        onChange={(e) => setFormSubcategory(e.target.value)}
                        disabled={formAvailableSubcategories.length === 0}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black bg-white disabled:bg-neutral-100 disabled:text-neutral-400"
                      >
                        <option value="">
                          {formAvailableSubcategories.length === 0
                            ? 'Sem subcategorias cadastradas'
                            : 'Nenhuma subcategoria (apenas principal)'}
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

              {/* Seção 3: Tipo de Promoção do Produto (Antes das Fotos - Aparece no Canto Superior Esquerdo do Card) */}
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-1 mb-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                    3. Tipo de Promoção do Produto *
                  </h4>
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-[2px] bg-[#FB6600] text-white uppercase">
                    Canto Superior Esquerdo do Card
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mb-3">
                  {formIsVehicle ? (
                    <>
                      Selecione a condição do veículo (<strong>Novo</strong>, <strong>Usado</strong> ou <strong>Semi-novo</strong>). Ela aparecerá em destaque no <strong>canto superior esquerdo do card</strong>:
                    </>
                  ) : (
                    <>
                      Selecione o tipo de promoção deste produto (mesmo filtro do menu horizontal). Ele aparecerá em destaque no <strong>canto superior esquerdo do card</strong>:
                    </>
                  )}
                </p>

                <div
                  className={`grid gap-2 ${
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
                        className={`px-3 py-2.5 text-xs rounded-[2px] border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-[#FB6600] border-[#FB6600] text-white font-black shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:border-black font-semibold'
                        }`}
                      >
                        <span className="truncate">{promo.label}</span>
                        {isSelected && <span className="text-[10px] shrink-0">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Seção 4: Fotos dos Produtos (Até 12 fotos no modo Veículo / Até 6 fotos no padrão) */}
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-1 mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                      4. Fotos do Produto ({formImages.length} de {MAX_PHOTOS})
                    </h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 uppercase">
                      Até {MAX_PHOTOS} fotos
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    A primeira imagem será a foto de capa
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-2">
                  {formImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-neutral-100 border border-neutral-300 rounded-[2px] overflow-hidden relative group shadow-2xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 ? (
                        <>
                          <span className="absolute top-1 left-1 bg-[#FB6600] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-[2px] shadow">
                            {getPromoLabel(formPromoType)}
                          </span>
                          {calculatedDiscount && calculatedDiscount > 0 && (
                            <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-yellow-400 text-black font-black text-[8px] flex items-center justify-center shadow border border-yellow-500/40">
                              {calculatedDiscount}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="absolute top-1 left-1 bg-neutral-800/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                          Foto {idx + 1}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(idx)}
                            className="p-1 bg-white hover:bg-neutral-200 text-black rounded text-[9px] font-bold cursor-pointer"
                            title="Tornar foto de capa"
                          >
                            ⭐ Capa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold cursor-pointer"
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
                        className={`aspect-square border-2 border-dashed rounded-[2px] flex flex-col items-center justify-center p-2 transition-colors cursor-pointer ${
                          isNextSlot
                            ? 'border-neutral-400 hover:border-black text-neutral-700 hover:text-black bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-400 text-neutral-400 hover:text-neutral-700 bg-neutral-50/50'
                        }`}
                      >
                        <span className="text-lg mb-0.5">{uploadingImage && isNextSlot ? '⏳' : '📷'}</span>
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-center">
                          {uploadingImage && isNextSlot ? 'Enviando...' : `+ Foto ${photoNumber}/${MAX_PHOTOS}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-neutral-400">
                  * Você pode adicionar até <strong>{MAX_PHOTOS} fotos</strong> por {formIsVehicle ? 'veículo' : 'produto'}. No card da vitrine, o selo <strong>{getPromoLabel(formPromoType)}</strong> aparecerá no canto superior esquerdo.
                </p>

                {/* Opção de Orientação da Foto no Card */}
                <div className="pt-3 mt-2 border-t border-neutral-100">
                  <label className="block text-xs font-bold text-neutral-800 uppercase mb-1">
                    Enquadramento da Foto no Card da Vitrine
                  </label>
                  <p className="text-[11px] text-neutral-500 mb-2.5">
                    Escolha o formato ideal para exibir a foto inteira sem cortes indesejados nas laterais:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormPhotoOrientation('vertical')}
                      className={`p-2.5 border rounded-[2px] text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        formPhotoOrientation === 'vertical'
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-base">📱</span>
                      <div>
                        <span className="text-xs font-bold block leading-tight">Foto Vertical (Padrão)</span>
                        <span className={`text-[10px] block ${formPhotoOrientation === 'vertical' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          Ideal para Moda, Vestuário e Pessoas
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormPhotoOrientation('horizontal')}
                      className={`p-2.5 border rounded-[2px] text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        formPhotoOrientation === 'horizontal'
                          ? 'bg-[#FB6600] text-white border-[#FB6600] shadow-xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-base">🖥️</span>
                      <div>
                        <span className="text-xs font-bold block leading-tight">Foto na Horizontal</span>
                        <span className={`text-[10px] block ${formPhotoOrientation === 'horizontal' ? 'text-orange-100' : 'text-neutral-400'}`}>
                          Ideal para Carros, Eletro (Mostra a foto inteira)
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção 5: Preços do Produto */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-1 mb-3">
                  5. Preços {formIsVehicle ? 'do Veículo (Custo Interno, Venda e Tabela FIPE Interna)' : 'do Produto'}
                </h4>

                {formIsVehicle ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Preço de Custo (Interno) */}
                      <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-[2px]">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-neutral-800 uppercase">
                            Preço de Custo (Interno)
                          </label>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded uppercase">
                            🔒 Não aparece
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">R$</span>
                          <input
                            type="text"
                            value={formCostPriceInternal}
                            onChange={(e) => setFormCostPriceInternal(e.target.value)}
                            placeholder="0,00"
                            className="w-full pl-9 pr-3 py-2 text-xs border border-amber-300 bg-white rounded-[2px] focus:outline-none focus:border-black font-bold text-neutral-800"
                          />
                        </div>
                        <span className="text-[10px] text-amber-900/80 block mt-1">
                          Uso interno — nunca exibido aos clientes.
                        </span>
                      </div>

                      {/* Preço de Venda (Público) */}
                      <div className="p-3 bg-emerald-50/40 border border-emerald-300 rounded-[2px]">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-black text-neutral-900 uppercase">
                            Preço Venda (R$) *
                          </label>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white rounded uppercase">
                            Visível no Card
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-neutral-500">R$</span>
                          <input
                            type="text"
                            required
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            placeholder="Ex: 118.900,00"
                            className="w-full pl-9 pr-3 py-2 text-xs border border-emerald-400 bg-white rounded-[2px] focus:outline-none focus:border-black font-black text-neutral-900"
                          />
                        </div>
                        <span className="text-[10px] text-emerald-900/80 block mt-1">
                          Valor principal anunciado no card da vitrine.
                        </span>
                      </div>

                      {/* Preço FIPE (Interno) */}
                      <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-[2px]">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-neutral-800 uppercase">
                            Preço FIPE (Interno)
                          </label>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded uppercase">
                            🔒 Não aparece
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">R$</span>
                          <input
                            type="text"
                            value={formFipePriceInternal}
                            onChange={(e) => setFormFipePriceInternal(e.target.value)}
                            placeholder="Ex: 122.400,00"
                            className="w-full pl-9 pr-3 py-2 text-xs border border-amber-300 bg-white rounded-[2px] focus:outline-none focus:border-black font-bold text-neutral-800"
                          />
                        </div>
                        <span className="text-[10px] text-amber-900/80 block mt-1">
                          Fica salvo apenas para o lojista saber.
                        </span>
                      </div>
                    </div>

                    {/* Aviso obrigatório sobre o Preço FIPE e Preço de Custo Internos */}
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-[2px] text-xs text-amber-950 flex items-start gap-2.5">
                      <span className="text-base shrink-0">🔒</span>
                      <div className="leading-relaxed">
                        <strong className="font-black uppercase tracking-wider block text-amber-950 mb-0.5">
                          Aviso Importante ao Lojista — Informações Internas Ocultas no Card:
                        </strong>
                        <p className="text-[11px] text-amber-900">
                          O <strong>Preço FIPE (Interno)</strong>, o <strong>Preço de Custo (Interno)</strong> e a <strong>Placa (Interno)</strong> <strong>não irão aparecer no card</strong> nem na vitrine pública da loja. O <strong>Preço FIPE fica registrado apenas para o lojista saber</strong> e consultar como referência rápida no seu painel administrativo. Para os visitantes e compradores, será exibido exclusivamente o <strong>Preço de Venda</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Preço Promocional Opcional (caso queira ativar o círculo amarelo de desconto) */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-neutral-600 uppercase">
                          Preço Promocional de Oferta (Opcional — ativa o círculo amarelo de % no card)
                        </label>
                        {calculatedDiscount && (
                          <span className="text-[10px] font-bold text-black bg-yellow-400 px-2 py-0.5 rounded-full">
                            Desconto no Card: {calculatedDiscount}%
                          </span>
                        )}
                      </div>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">R$</span>
                        <input
                          type="text"
                          value={formPromoPrice}
                          onChange={(e) => setFormPromoPrice(e.target.value)}
                          placeholder="Deixe em branco se não houver desconto"
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-bold text-[#FB6600]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                        Preço Regular (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">R$</span>
                        <input
                          type="text"
                          required
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          placeholder="0,00"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-black"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-neutral-700 uppercase">
                          Preço Promocional (Opcional)
                        </label>
                        {calculatedDiscount && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            Economia: {calculatedDiscount}% OFF
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">R$</span>
                        <input
                          type="text"
                          value={formPromoPrice}
                          onChange={(e) => setFormPromoPrice(e.target.value)}
                          placeholder="Ex: 89,90"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black font-black text-[#FB6600]"
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Deve ser menor que o preço regular para ser exibido como oferta.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões do Modal */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase rounded-[2px] hover:bg-neutral-50 cursor-pointer"
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
                  className="px-6 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'Salvando...'
                    : editingProduct
                    ? 'Salvar Alterações'
                    : formIsVehicle
                    ? 'Cadastrar Veículo'
                    : 'Cadastrar Produto'}
                </button>
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
          <div className="bg-white w-full max-w-md rounded-[2px] shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Confirmar Exclusão</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="text-white hover:opacity-80 font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-[2px]">
                <div className="w-12 h-14 bg-neutral-200 rounded-[2px] overflow-hidden shrink-0 flex items-center justify-center">
                  {deleteConfirmation.image_url ? (
                    <img
                      src={deleteConfirmation.image_url}
                      alt={deleteConfirmation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>🖼️</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-neutral-900 truncate">
                    {deleteConfirmation.name}
                  </h4>
                  <span className="text-[10.5px] text-neutral-500 block">
                    Preço: R$ {formatCurrencyBRL(deleteConfirmation.price)}
                  </span>
                  <span className="text-[10px] text-neutral-400 capitalize">
                    {deleteConfirmation.category} {deleteConfirmation.subcategory ? `• ${deleteConfirmation.subcategory}` : ''}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Tem certeza que deseja excluir este produto? Ao confirmar, ele será removido permanentemente do catálogo e <strong>1 vaga será liberada imediatamente</strong> no seu plano.
              </p>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase rounded-[2px] hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Excluindo...' : 'Sim, Excluir Produto'}
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

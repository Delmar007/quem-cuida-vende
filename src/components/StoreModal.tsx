'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProfileData, createStoreAction } from '@/app/actions/profile'
import { PlanId } from '@/lib/plans'

interface StoreModalProps {
  isOpen: boolean
  onClose: () => void
  profile: ProfileData | null
  initialPlan?: PlanId
  onStoreCreated?: () => void
}

const CATEGORIAS = [
  { id: 'moda', label: 'Moda' },
  { id: 'pet', label: 'Pet' },
  { id: 'agro', label: 'Agro' },
  { id: 'carro', label: 'Carro' },
  { id: 'escritorio', label: 'Escritório' },
  { id: 'eletro', label: 'Eletro' },
  { id: 'casa', label: 'Casa' },
  { id: 'beleza', label: 'Beleza' },
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

export default function StoreModal({
  isOpen,
  onClose,
  profile,
  initialPlan = 'bronze',
  onStoreCreated,
}: StoreModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan)
  const [name, setName] = useState('')
  const [responsibleName, setResponsibleName] = useState('')
  const [description, setDescription] = useState('')
  const [cnpjCpf, setCnpjCpf] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [category, setCategory] = useState('moda')
  const [subcategories, setSubcategories] = useState<string[]>(['Feminina', 'Masculina'])
  
  // Dispositivo Banner Grande (940 x 370)
  const [largeBannerUrl, setLargeBannerUrl] = useState('')
  const [largeBannerPreview, setLargeBannerPreview] = useState('')
  
  // Dispositivo Banner Pequeno
  const [smallBannerUrl, setSmallBannerUrl] = useState('')
  const [smallBannerPreview, setSmallBannerPreview] = useState('')

  const [loadingCep, setLoadingCep] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [createdSuccess, setCreatedSuccess] = useState<any>(null)

  // Pré-preencher o nome do responsável com o nome salvo do usuário
  useEffect(() => {
    if (isOpen && profile) {
      setResponsibleName(profile.display_name || '')
      setFeedback(null)
      setCreatedSuccess(null)
      if (initialPlan) {
        setSelectedPlan(initialPlan)
      }
    }
  }, [isOpen, profile, initialPlan])

  if (!isOpen) return null

  // Busca automática do CEP via ViaCEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = raw
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`
    }
    setCep(formatted)

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

  // Alternar subcategoria
  const toggleSubcategory = (sub: string) => {
    setSubcategories(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    )
  }

  // Upload do Banner Grande (940 x 370 px)
  const handleLargeBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLargeBannerPreview(url)
    }
  }

  // Upload do Banner Pequeno
  const handleSmallBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSmallBannerPreview(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Informe o nome da sua loja.' })
      setLoading(false)
      return
    }

    try {
      const isSinglePlan = selectedPlan === 'bronze'
      const finalLargeBanner = !isSinglePlan ? (largeBannerPreview || largeBannerUrl) : ''
      const finalSmallBanner = isSinglePlan ? (smallBannerPreview || smallBannerUrl) : ''

      const res = await createStoreAction({
        name: name.trim(),
        responsibleName: responsibleName.trim(),
        phone: profile?.phone || undefined,
        cep: cep.trim(),
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        category,
        subcategories,
        largeBannerUrl: finalLargeBanner || undefined,
        smallBannerUrl: finalSmallBanner || undefined,
        logoUrl: logoPreview || logoUrl || undefined,
        description: description.trim() || undefined,
        cnpjCpf: cnpjCpf.trim() || undefined,
        plan: selectedPlan,
      })

      if (res.success) {
        setCreatedSuccess(res.store)
        if (onStoreCreated) onStoreCreated()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao registrar loja.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro inesperado.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[800px] my-8 bg-white rounded-[2px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-black text-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors cursor-pointer mr-1 p-1 -ml-2 rounded hover:bg-white/10"
              title="Voltar"
              aria-label="Voltar"
            >
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Voltar</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#FB6600] text-white flex items-center justify-center font-bold text-sm">
              🏬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-white">
                  Abrir Minha Loja
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#FB6600] text-white">
                  Plano {selectedPlan === 'bronze_plus' ? 'Bronze Plus (R$ 30/mês)' : selectedPlan.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                Cadastre seus dados comerciais e banners de destaque
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto flex-1">
          {createdSuccess ? (
            <div className="text-center py-10 px-4">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Loja Aberta com Sucesso!
              </h3>
              <p className="text-sm text-neutral-600 max-w-md mx-auto mb-6">
                Parabéns! Sua loja <strong>{name}</strong> foi aberta e cadastrada com sucesso. Agora você pode visualizar sua vitrine pública ou gerenciar produtos e banners no seu painel.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/loja/${createdSuccess.id || createdSuccess.slug}`}
                  onClick={onClose}
                  className="w-full sm:w-auto bg-[#FB6600] hover:bg-[#e05b00] text-white px-6 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors shadow-sm text-center"
                >
                  Ver Minha Loja
                </Link>
                <Link
                  href="/painel/loja"
                  onClick={onClose}
                  className="w-full sm:w-auto bg-black hover:bg-neutral-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors text-center"
                >
                  Ir para Minha Loja (Painel)
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto border border-gray-300 text-gray-700 hover:bg-gray-100 px-5 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {feedback && (
                <div className={`p-3 text-xs rounded-sm ${
                  feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {feedback.message}
                </div>
              )}

              {/* 1. DADOS DA LOJA */}
              <div className="border border-gray-200 p-4 rounded-[2px] bg-gray-50/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
                  1. Dados da Loja & Responsável
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Nome da Loja *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Boutique Elegance Outlet"
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                        Nome do Responsável *
                      </label>
                      <span className="text-[10px] text-[#FB6600] font-medium">
                        (Preenchido do seu cadastro)
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={responsibleName}
                      onChange={(e) => setResponsibleName(e.target.value)}
                      placeholder="Nome completo do responsável"
                      className="w-full border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-neutral-800 focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      CNPJ ou CPF (Identificação Fiscal)
                    </label>
                    <input
                      type="text"
                      value={cnpjCpf}
                      onChange={(e) => setCnpjCpf(e.target.value)}
                      placeholder="00.000.000/0001-00 ou CPF"
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Logotipo / Foto de Perfil Comercial
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setLogoPreview(URL.createObjectURL(file))
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Descrição da Loja
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conte sobre sua loja física, produtos que comercializa e especialidades..."
                    className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* 2. ENDEREÇO */}
              <div className="border border-gray-200 p-4 rounded-[2px] bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                    2. Endereço Comercial
                  </h3>
                  {loadingCep && (
                    <span className="text-[11px] text-[#FB6600] font-medium animate-pulse">
                      Buscando CEP...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="UF (ex: SP)"
                      maxLength={2}
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cidade"
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Rua / Logradouro
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Rua / Avenida"
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="Nº"
                      className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. CATEGORIAS & SUBCATEGORIAS (MENUS VERTICAIS) */}
              <div className="border border-gray-200 p-4 rounded-[2px] bg-gray-50/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
                  3. Categorias e Segmentos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Menu Vertical de Categorias */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                      Categoria Principal (Menu Vertical) *
                    </label>
                    <div className="flex flex-col border border-gray-200 bg-white rounded-[2px] divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {CATEGORIAS.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.id)
                            setSubcategories([])
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-xs text-left cursor-pointer transition-colors ${
                            category === cat.id 
                              ? 'bg-black text-white font-bold' 
                              : 'text-neutral-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{cat.label}</span>
                          {category === cat.id && (
                            <span className="text-[#FB6600] text-xs">&bull;</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Menu Vertical de Subcategorias */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                        Subcategorias / Segmentos *
                      </label>
                      <span className="text-[10px] text-gray-500">
                        {subcategories.length} selecionada(s)
                      </span>
                    </div>
                    <div className="flex flex-col border border-gray-200 bg-white rounded-[2px] divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {(SUBCATEGORIAS_POR_CATEGORIA[category] || []).map((sub) => {
                        const checked = subcategories.includes(sub)
                        return (
                          <label
                            key={sub}
                            className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors ${
                              checked ? 'bg-[#FFF7ED] text-[#FB6600] font-semibold' : 'text-neutral-700 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSubcategory(sub)}
                              className="accent-[#FB6600] cursor-pointer"
                            />
                            <span>{sub}</span>
                          </label>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 px-0.5">
                      <span className="text-[10px] text-gray-500">
                        Marque as opções correspondentes
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const allSubs = SUBCATEGORIAS_POR_CATEGORIA[category] || []
                          const allSelected = allSubs.every(s => subcategories.includes(s))
                          setSubcategories(allSelected ? [] : [...allSubs])
                        }}
                        className="text-[10px] font-semibold text-[#FB6600] hover:underline cursor-pointer"
                      >
                        {(SUBCATEGORIAS_POR_CATEGORIA[category] || []).every(s => subcategories.includes(s))
                          ? 'Desmarcar todas'
                          : 'Selecionar todas'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. CADASTRO DE BANNER RESTRITO AO PLANO CONTRATADO */}
              <div className="border border-gray-200 p-4 rounded-[2px] bg-gray-50/50">
                {selectedPlan === 'bronze' && (
                  <>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                        4. Dispositivo Banner Single (Plano Bronze Gratuito)
                      </h3>
                      <span className="text-[10px] bg-black text-[#FB6600] px-2 py-0.5 font-bold uppercase tracking-wider rounded-[2px]">
                        Banner Single • 1 Coluna no Feed (400 × 250 px)
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mb-3">
                      Seu pacote contratado é o <strong>Plano Bronze (Gratuito)</strong>, que inclui exclusivamente o <strong>Banner Single (Pequeno)</strong> no feed de lojas.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <div className="w-40 h-24 bg-gray-200 border-2 border-dashed border-gray-300 rounded-[2px] overflow-hidden flex items-center justify-center shrink-0 relative">
                        {smallBannerPreview || smallBannerUrl ? (
                          <>
                            <img
                              src={smallBannerPreview || smallBannerUrl}
                              alt="Preview Banner Single"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSmallBannerPreview('')
                                setSmallBannerUrl('')
                              }}
                              className="absolute top-1 right-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 uppercase tracking-wider rounded-[2px] hover:bg-black cursor-pointer"
                            >
                              Remover
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-2">
                            <span className="text-lg block">🪪</span>
                            <span className="text-[10px] text-gray-500 font-semibold">Banner Single</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col gap-2 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <label className="bg-black hover:bg-neutral-800 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer rounded-[2px]">
                            Escolher Banner Single
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSmallBannerFile}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-gray-400">ou</span>
                        </div>
                        <input
                          type="url"
                          value={smallBannerUrl}
                          onChange={(e) => setSmallBannerUrl(e.target.value)}
                          placeholder="URL do Banner Single (https://...)"
                          className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 bg-neutral-100 border border-neutral-200 rounded-[2px] flex items-center justify-between gap-2 text-[11px] text-neutral-600">
                      <span>
                        🔒 <strong>Formatos Restritos:</strong> O cadastro de <strong>Banner Duplo</strong> (Bronze Plus / Prata) e <strong>Banner Triplo</strong> (Ouro) não pertence a este pacote.
                      </span>
                    </div>
                  </>
                )}

                {(selectedPlan === 'bronze_plus' || selectedPlan === 'prata') && (
                  <>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                        4. Dispositivo Banner Duplo (Plano {selectedPlan === 'bronze_plus' ? 'Bronze Plus' : 'Prata'})
                      </h3>
                      <span className="text-[10px] bg-black text-[#FB6600] px-2 py-0.5 font-bold uppercase tracking-wider rounded-[2px]">
                        Banner Duplo • 2 Colunas no Feed (620 × 220 px)
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mb-3">
                      Seu pacote contratado é o <strong>Plano {selectedPlan === 'bronze_plus' ? 'Bronze Plus' : 'Prata'}</strong>, que libera exclusivamente o cadastro do <strong>Banner Duplo (2 colunas no feed)</strong>.
                    </p>

                    <div className="w-full aspect-[620/220] bg-gray-200 border-2 border-dashed border-gray-300 rounded-[2px] overflow-hidden flex items-center justify-center relative mb-3">
                      {largeBannerPreview || largeBannerUrl ? (
                        <>
                          <img
                            src={largeBannerPreview || largeBannerUrl}
                            alt="Preview Banner Duplo"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLargeBannerPreview('')
                              setLargeBannerUrl('')
                            }}
                            className="absolute top-2 right-2 bg-black/75 text-white text-[10px] px-2 py-1 uppercase tracking-wider rounded-[2px] hover:bg-black cursor-pointer"
                          >
                            Remover
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 p-4">
                          <div className="text-2xl mb-1">🖼️</div>
                          <span className="text-xs font-semibold block text-gray-600">Dispositivo Banner Duplo (2 Colunas • 620 × 220 px)</span>
                          <span className="text-[10px]">Carregue uma imagem ou informe uma URL</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="bg-black hover:bg-neutral-800 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer rounded-[2px]">
                        Escolher Banner Duplo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLargeBannerFile}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-400">ou</span>
                      <input
                        type="url"
                        value={largeBannerUrl}
                        onChange={(e) => setLargeBannerUrl(e.target.value)}
                        placeholder="URL do Banner Duplo (https://...)"
                        className="flex-1 min-w-[200px] border border-gray-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-black focus:outline-none"
                      />
                    </div>

                    <div className="mt-3 p-2.5 bg-neutral-100 border border-neutral-200 rounded-[2px] flex items-center justify-between gap-2 text-[11px] text-neutral-600">
                      <span>
                        🔒 <strong>Formatos Restritos:</strong> O cadastro de <strong>Banner Single</strong> (Bronze) e <strong>Banner Triplo</strong> (Ouro) não pertence a este pacote.
                      </span>
                    </div>
                  </>
                )}

                {selectedPlan === 'ouro' && (
                  <>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                        4. Dispositivo Banner Triplo (Plano Ouro)
                      </h3>
                      <span className="text-[10px] bg-black text-[#FB6600] px-2 py-0.5 font-bold uppercase tracking-wider rounded-[2px]">
                        Banner Triplo • 3 Colunas / Linha Inteira (940 × 370 px)
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mb-3">
                      Seu pacote contratado é o <strong>Plano Ouro</strong>, que libera exclusivamente o cadastro do <strong>Banner Triplo (3 colunas / linha inteira no feed)</strong>.
                    </p>

                    <div className="w-full aspect-[940/370] bg-gray-200 border-2 border-dashed border-gray-300 rounded-[2px] overflow-hidden flex items-center justify-center relative mb-3">
                      {largeBannerPreview || largeBannerUrl ? (
                        <>
                          <img
                            src={largeBannerPreview || largeBannerUrl}
                            alt="Preview Banner Triplo"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLargeBannerPreview('')
                              setLargeBannerUrl('')
                            }}
                            className="absolute top-2 right-2 bg-black/75 text-white text-[10px] px-2 py-1 uppercase tracking-wider rounded-[2px] hover:bg-black cursor-pointer"
                          >
                            Remover
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-gray-400 p-4">
                          <div className="text-2xl mb-1">👑</div>
                          <span className="text-xs font-semibold block text-gray-600">Dispositivo Banner Triplo (3 Colunas • 940 × 370 px)</span>
                          <span className="text-[10px]">Carregue uma imagem ou informe uma URL</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="bg-black hover:bg-neutral-800 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer rounded-[2px]">
                        Escolher Banner Triplo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLargeBannerFile}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-400">ou</span>
                      <input
                        type="url"
                        value={largeBannerUrl}
                        onChange={(e) => setLargeBannerUrl(e.target.value)}
                        placeholder="URL do Banner Triplo (https://...)"
                        className="flex-1 min-w-[200px] border border-gray-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-black focus:outline-none"
                      />
                    </div>

                    <div className="mt-3 p-2.5 bg-neutral-100 border border-neutral-200 rounded-[2px] flex items-center justify-between gap-2 text-[11px] text-neutral-600">
                      <span>
                        🔒 <strong>Formatos Restritos:</strong> O cadastro de <strong>Banner Single</strong> (Bronze) e <strong>Banner Duplo</strong> (Bronze Plus / Prata) não pertence a este pacote.
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#FB6600] hover:bg-[#e05b00] text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Salvando Loja...' : 'Salvar e Abrir Loja'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

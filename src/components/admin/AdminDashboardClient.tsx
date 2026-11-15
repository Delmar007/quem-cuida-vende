'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AdminBannerConfig,
  BannerDirection,
  DEFAULT_ADMIN_BANNER_CONFIG,
  GoldOrderMode,
  SiteBannerFrequency,
  SiteBannerItem,
  normalizeBannerConfig,
} from '@/lib/admin-banners-storage'
import {
  saveAdminBannerConfigAction,
  verifyAdminPasswordAction,
} from '@/app/actions/admin-banners'

export interface AdminGoldStoreSummary {
  id: string
  name: string
  slug?: string | null
  plan?: string
  large_banner_url?: string | null
  small_banner_url?: string | null
  created_at?: string
}

interface AdminDashboardClientProps {
  initialConfig: AdminBannerConfig
  goldStores: AdminGoldStoreSummary[]
}

type ManagerTab = 'banners' | 'lojas_ouro' | 'config'

const DIRECTION_OPTIONS: { id: BannerDirection; label: string; arrow: string }[] = [
  { id: 'top-to-bottom', label: 'De cima para baixo', arrow: '↓' },
  { id: 'bottom-to-top', label: 'De baixo para cima', arrow: '↑' },
  { id: 'left-to-right', label: 'Da esquerda para a direita', arrow: '→' },
  { id: 'right-to-left', label: 'Da direita para a esquerda', arrow: '←' },
]

export default function AdminDashboardClient({
  initialConfig,
  goldStores,
}: AdminDashboardClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(false)

  const [activeTab, setActiveTab] = useState<ManagerTab>('banners')
  const [config, setConfig] = useState<AdminBannerConfig>(() =>
    normalizeBannerConfig(initialConfig)
  )
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Novo banner do site
  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newTargetUrl, setNewTargetUrl] = useState('/')
  const [newFrequency, setNewFrequency] = useState<SiteBannerFrequency>(5)

  useEffect(() => {
    try {
      const unlocked = sessionStorage.getItem('kittanda_admin_unlocked') === '1'
      if (unlocked) setIsAuthenticated(true)

      const localRaw = localStorage.getItem('kittanda_admin_banners_config')
      if (localRaw) {
        const parsed = normalizeBannerConfig(JSON.parse(localRaw))
        if (
          !initialConfig.updatedAt ||
          (parsed.updatedAt && parsed.updatedAt > initialConfig.updatedAt)
        ) {
          setConfig(parsed)
        }
      }
    } catch {
      // ignore
    }
  }, [initialConfig])

  const persistConfig = async (nextConfig: AdminBannerConfig, successMessage: string) => {
    setSaving(true)
    setFeedback(null)
    const normalized = {
      ...normalizeBannerConfig(nextConfig),
      updatedAt: new Date().toISOString(),
    }
    setConfig(normalized)
    try {
      localStorage.setItem('kittanda_admin_banners_config', JSON.stringify(normalized))
    } catch {
      // ignore
    }
    try {
      const res = await saveAdminBannerConfigAction(normalized)
      if (res.success) {
        setFeedback({ type: 'success', msg: successMessage })
      } else {
        setFeedback({ type: 'error', msg: 'Não foi possível salvar no servidor.' })
      }
    } catch {
      setFeedback({ type: 'success', msg: `${successMessage} (salvo localmente)` })
    } finally {
      setSaving(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckingAuth(true)
    setAuthError('')
    try {
      const res = await verifyAdminPasswordAction(passwordInput)
      if (res.ok) {
        setIsAuthenticated(true)
        try {
          sessionStorage.setItem('kittanda_admin_unlocked', '1')
        } catch {
          // ignore
        }
      } else {
        setAuthError('Senha de administrador incorreta.')
      }
    } catch {
      setAuthError('Erro ao validar senha.')
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewImageUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAddSiteBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newImageUrl.trim()) {
      setFeedback({ type: 'error', msg: 'Informe o título e a imagem do banner.' })
      return
    }
    const newItem: SiteBannerItem = {
      id: `site_banner_${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim(),
      imageUrl: newImageUrl.trim(),
      targetUrl: newTargetUrl.trim() || '/',
      frequency: newFrequency,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    const nextConfig: AdminBannerConfig = {
      ...config,
      siteBanners: [newItem, ...config.siteBanners],
    }
    setNewTitle('')
    setNewSubtitle('')
    setNewImageUrl('')
    setNewTargetUrl('/')
    await persistConfig(nextConfig, 'Banner do site adicionado com sucesso!')
  }

  const handleToggleBanner = async (id: string) => {
    const nextConfig: AdminBannerConfig = {
      ...config,
      siteBanners: config.siteBanners.map((b) =>
        b.id === id ? { ...b, isActive: !b.isActive } : b
      ),
    }
    await persistConfig(nextConfig, 'Status do banner atualizado!')
  }

  const handleDeleteBanner = async (id: string) => {
    const nextConfig: AdminBannerConfig = {
      ...config,
      siteBanners: config.siteBanners.filter((b) => b.id !== id),
    }
    await persistConfig(nextConfig, 'Banner removido!')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-neutral-50">
        <div className="w-full max-w-sm bg-white border border-neutral-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading text-lg font-extrabold text-neutral-900 uppercase tracking-wide">
              Administração do Site
            </h1>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#FB6600] text-white">
              Restrito
            </span>
          </div>
          <p className="text-xs text-neutral-500 mb-5">
            Digite a senha de administrador para acessar os gerenciadores de banners, lojas e configurações.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Senha Admin
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Digite a senha..."
                className="w-full h-10 px-3 text-sm border border-neutral-300 focus:outline-none focus:border-[#FB6600]"
              />
            </div>
            {authError && (
              <p className="text-xs font-semibold text-red-600">{authError}</p>
            )}
            <button
              type="submit"
              disabled={checkingAuth}
              className="w-full h-10 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              {checkingAuth ? 'Verificando...' : 'Acessar Painel Admin'}
            </button>
          </form>
          <div className="mt-4 pt-3 border-t border-neutral-100 text-center">
            <Link href="/" className="text-xs text-neutral-500 hover:text-[#FB6600]">
              &larr; Voltar para a vitrine
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6">
      {/* Cabeçalho do Painel Admin */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FB6600] block">
            Painel Administrativo
          </span>
          <h1 className="font-heading text-xl font-extrabold text-neutral-900">
            Central de Gerenciamento do Site
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-1.5 text-xs font-bold border border-neutral-300 hover:border-black text-neutral-800 transition-colors"
          >
            Ver Página Inicial
          </Link>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('kittanda_admin_unlocked')
              setIsAuthenticated(false)
              setPasswordInput('')
            }}
            className="px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-700 text-white cursor-pointer"
          >
            Sair do Admin
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-5 px-4 py-2.5 text-xs font-bold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* LAYOUT DE 4 COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* COLUNA 1 (ESQUERDA): MENU VERTICAL COM TODOS OS GERENCIADORES */}
        <aside className="bg-white border border-neutral-200 shadow-2xs">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Gerenciadores
            </span>
          </div>
          <nav className="flex flex-col divide-y divide-neutral-100">
            <button
              type="button"
              onClick={() => setActiveTab('banners')}
              className={`text-left px-4 py-3 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'banners'
                  ? 'bg-orange-50 text-[#FB6600] border-l-4 border-[#FB6600]'
                  : 'text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span>1. Banners (Ouro &amp; Site)</span>
              <span>&rsaquo;</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lojas_ouro')}
              className={`text-left px-4 py-3 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'lojas_ouro'
                  ? 'bg-orange-50 text-[#FB6600] border-l-4 border-[#FB6600]'
                  : 'text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span>2. Lojas Ouro ({goldStores.length})</span>
              <span>&rsaquo;</span>
            </button>

            <Link
              href="/admin/assinaturas"
              className="text-left px-4 py-3 text-xs font-bold flex items-center justify-between text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              <span>3. Assinaturas &amp; Planos</span>
              <span>&rsaquo;</span>
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`text-left px-4 py-3 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-orange-50 text-[#FB6600] border-l-4 border-[#FB6600]'
                  : 'text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span>4. Configurações Gerais</span>
              <span>&rsaquo;</span>
            </button>
          </nav>
        </aside>

        {/* COLUNAS 2, 3 E 4: CONTEÚDO DO GERENCIADOR SELECIONADO */}
        {activeTab === 'banners' && (
          <>
            {/* COLUNA 2: ADICIONADOR DE BANNERS DO SITE */}
            <section className="bg-white border border-neutral-200 p-4 shadow-2xs space-y-4">
              <div className="border-b border-neutral-100 pb-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                  Adicionar Banner do Site
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Trabalha em conjunto com os banners dos clientes Ouro na página inicial.
                </p>
              </div>

              <form onSubmit={handleAddSiteBanner} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                    Título do Banner *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex.: Ofertas da Semana"
                    className="w-full h-9 px-3 text-xs border border-neutral-300 focus:outline-none focus:border-[#FB6600]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                    Subtítulo / Chamada (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="Ex.: Confira os destaques da cidade"
                    className="w-full h-9 px-3 text-xs border border-neutral-300 focus:outline-none focus:border-[#FB6600]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                    URL da Imagem ou Upload *
                  </label>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://... ou envie uma imagem abaixo"
                    className="w-full h-9 px-3 text-xs border border-neutral-300 focus:outline-none focus:border-[#FB6600] mb-1.5"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="block w-full text-[11px] text-neutral-600 file:mr-2 file:py-1 file:px-2.5 file:border file:border-neutral-300 file:text-[11px] file:font-bold file:bg-neutral-50 hover:file:bg-neutral-100 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                    Link ao Clicar no Banner (Loja ou Filtro)
                  </label>
                  <input
                    type="text"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    placeholder="/loja/nome-da-loja ou /?tipo=produtos"
                    className="w-full h-9 px-3 text-xs border border-neutral-300 focus:outline-none focus:border-[#FB6600]"
                  />
                  {goldStores.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setNewTargetUrl(e.target.value)
                      }}
                      className="mt-1.5 w-full h-8 px-2 text-[11px] border border-neutral-200 bg-neutral-50 text-neutral-700"
                    >
                      <option value="">Atalho: selecionar página de uma loja Ouro...</option>
                      {goldStores.map((st) => (
                        <option key={st.id} value={`/loja/${st.slug || st.id}`}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-800 mb-1">
                    Regra de Exibição (Intercalação)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewFrequency(5)}
                      className={`py-2 px-2 text-[11px] font-bold border cursor-pointer transition-colors ${
                        newFrequency === 5
                          ? 'bg-[#FB6600] text-white border-[#FB6600]'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                      }`}
                    >
                      A cada 5 Ouro
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFrequency(10)}
                      className={`py-2 px-2 text-[11px] font-bold border cursor-pointer transition-colors ${
                        newFrequency === 10
                          ? 'bg-[#FB6600] text-white border-[#FB6600]'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                      }`}
                    >
                      A cada 10 Ouro
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-10 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {saving ? 'Salvando...' : '+ Adicionar Banner'}
                </button>
              </form>
            </section>

            {/* COLUNA 3: TEMPORIZADOR, VISUALIZAÇÃO E ORDEM DOS BANNERS OURO */}
            <section className="bg-white border border-neutral-200 p-4 shadow-2xs space-y-4">
              <div className="border-b border-neutral-100 pb-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                  Controle dos Banners (Página Início)
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Afeta todos os banners Ouro e do site na página inicial.
                </p>
              </div>

              {/* Temporizador 5 a 15 segundos */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-neutral-800">
                    Temporizador de Troca (5s a 15s)
                  </label>
                  <span className="text-xs font-extrabold text-[#FB6600] tabular-nums">
                    {config.intervalSeconds}s
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={15}
                  step={1}
                  value={config.intervalSeconds}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      intervalSeconds: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#FB6600] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 font-semibold">
                  <span>5s (Rápido)</span>
                  <span>10s</span>
                  <span>15s (Lento)</span>
                </div>
              </div>

              {/* Sistema de Visualização / Direção */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-neutral-800">
                  Direção de Visualização dos Banners Ouro
                </label>
                <div className="flex flex-col divide-y divide-neutral-200 border border-neutral-200 bg-white">
                  {DIRECTION_OPTIONS.map((dir) => {
                    const active = config.direction === dir.id
                    return (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({ ...prev, direction: dir.id }))
                        }
                        className={`px-3 py-2 text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          active
                            ? 'bg-orange-50 text-[#FB6600] font-bold'
                            : 'text-neutral-700 hover:bg-neutral-50 font-medium'
                        }`}
                      >
                        <span>
                          {dir.arrow} {dir.label}
                        </span>
                        {active && <span className="text-[10px] uppercase">Ativo</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ordem dos Banners Ouro: Randômico vs Ordem de Chegada */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-neutral-800">
                  Ordem dos Banners de Clientes Ouro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'arrival', label: 'Ordem de chegada' },
                      { id: 'random', label: 'Randômico' },
                    ] as { id: GoldOrderMode; label: string }[]
                  ).map((mode) => {
                    const active = config.goldOrderMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({ ...prev, goldOrderMode: mode.id }))
                        }
                        className={`py-2 px-2.5 text-[11px] font-bold border cursor-pointer transition-colors ${
                          active
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                        }`}
                      >
                        {mode.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  persistConfig(config, 'Configurações dos banners salvas com sucesso!')
                }
                className="w-full h-10 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </section>

            {/* COLUNA 4: BANNERS CADASTRADOS & RESUMO DA FILA */}
            <section className="bg-white border border-neutral-200 p-4 shadow-2xs space-y-4">
              <div className="border-b border-neutral-100 pb-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                  Banners do Site ({config.siteBanners.length})
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Clientes Ouro ativos na fila: <strong>{goldStores.length}</strong>
                </p>
              </div>

              {config.siteBanners.length === 0 ? (
                <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 text-center">
                  <p className="text-xs text-neutral-500">
                    Nenhum banner próprio do site cadastrado ainda.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {config.siteBanners.map((b) => (
                    <div
                      key={b.id}
                      className="border border-neutral-200 p-2.5 space-y-2 bg-neutral-50/50"
                    >
                      <div className="aspect-[940/370] w-full overflow-hidden bg-neutral-200 border border-neutral-200">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {b.title}
                          </p>
                          <p className="text-[10px] text-neutral-500 truncate">
                            Destino: {b.targetUrl}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-[#FB6600]/10 text-[#FB6600] shrink-0">
                          A cada {b.frequency} Ouro
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200">
                        <button
                          type="button"
                          onClick={() => handleToggleBanner(b.id)}
                          className={`text-[10px] font-bold px-2 py-1 border cursor-pointer ${
                            b.isActive
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                          }`}
                        >
                          {b.isActive ? 'Ativo' : 'Pausado'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(b.id)}
                          className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'lojas_ouro' && (
          <section className="lg:col-span-3 bg-white border border-neutral-200 p-5 shadow-2xs">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-900 mb-3">
              Lojas Plano Ouro Elegíveis para o Banner Principal ({goldStores.length})
            </h2>
            {goldStores.length === 0 ? (
              <p className="text-xs text-neutral-500">Nenhuma loja Ouro cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goldStores.map((st, idx) => (
                  <Link
                    key={st.id}
                    href={`/loja/${st.slug || st.id}`}
                    className="border border-neutral-200 hover:border-[#FB6600] transition-colors p-3 block"
                  >
                    <div className="aspect-[16/9] bg-neutral-100 overflow-hidden mb-2">
                      <img
                        src={
                          st.large_banner_url ||
                          st.small_banner_url ||
                          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={st.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-neutral-900 truncate">
                        #{idx + 1} {st.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-[#FB6600]">
                        Abrir Loja &rsaquo;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'config' && (
          <section className="lg:col-span-3 bg-white border border-neutral-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-900">
              Configurações Gerais do Admin
            </h2>
            <p className="text-xs text-neutral-600">
              A senha padrão de acesso é configurada pela variável de ambiente{' '}
              <code className="bg-neutral-100 px-1.5 py-0.5">ADMIN_PASSWORD</code> (padrão:{' '}
              <code className="bg-neutral-100 px-1.5 py-0.5">admin123</code>).
            </p>
            <button
              type="button"
              onClick={() =>
                persistConfig(
                  DEFAULT_ADMIN_BANNER_CONFIG,
                  'Configurações restauradas para o padrão!'
                )
              }
              className="px-4 py-2 text-xs font-bold border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
            >
              Restaurar Padrão dos Banners
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

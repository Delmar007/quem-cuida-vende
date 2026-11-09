'use client'

import React, { useState, useEffect } from 'react'
import { StoreAdminData } from '@/app/actions/store-admin'
import {
  getStoreProductsAction,
  createProductAction,
  toggleProductActiveAction,
  deleteProductAction,
} from '@/app/actions/products'

interface ProductsTabProps {
  store: StoreAdminData | null
  maxProductsAllowed?: number
}

export default function ProductsTab({
  store,
  maxProductsAllowed = 20,
}: ProductsTabProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [promotionalPrice, setPromotionalPrice] = useState('')
  const [category, setCategory] = useState(store?.category || 'moda')
  const [subcategory, setSubcategory] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [description, setDescription] = useState('')
  const [isOutlet, setIsOutlet] = useState(true)
  const [isNovidade, setIsNovidade] = useState(false)

  const loadProducts = async () => {
    if (!store?.id) return
    setLoading(true)
    try {
      const res = await getStoreProductsAction(store.id)
      if (res.success && res.products) {
        setProducts(res.products)
      }
    } catch (err) {
      console.warn('Erro ao carregar produtos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [store?.id])

  const activeCount = products.filter((p) => p.is_active).length
  const progressPercent = Math.min(100, Math.round((activeCount / maxProductsAllowed) * 100))

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store?.id) return
    setSubmitting(true)
    setFeedback(null)

    const numericPrice = parseFloat(price.replace(',', '.'))
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFeedback({ type: 'error', message: 'Informe um preço válido.' })
      setSubmitting(false)
      return
    }

    const numericPromoPrice = promotionalPrice
      ? parseFloat(promotionalPrice.replace(',', '.'))
      : undefined

    try {
      const res = await createProductAction({
        storeId: store.id,
        name: name.trim(),
        price: numericPrice,
        promotionalPrice: numericPromoPrice,
        category: category.toLowerCase().trim(),
        subcategory: subcategory.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
        isOutlet,
        isNovidade,
        isActive: true,
      })

      if (res.success) {
        setFeedback({ type: 'success', message: 'Produto cadastrado com sucesso!' })
        setName('')
        setPrice('')
        setPromotionalPrice('')
        setImageUrl('')
        setDescription('')
        setIsModalOpen(false)
        loadProducts()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao cadastrar produto.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro inesperado.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (productId: string, currentActive: boolean) => {
    if (!store?.id) return
    try {
      const res = await toggleProductActiveAction(productId, store.id, !currentActive)
      if (res.success) {
        loadProducts()
      } else {
        alert(res.error || 'Erro ao alterar status do produto.')
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status.')
    }
  }

  const handleDelete = async (productId: string) => {
    if (!store?.id) return
    if (!confirm('Deseja realmente excluir este produto?')) return
    try {
      const res = await deleteProductAction(productId, store.id)
      if (res.success) {
        loadProducts()
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 2 */}
      <div className="bg-white border border-neutral-200 p-6 rounded-[2px] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
                Tópico 2 • Catálogo Comercial
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Plano Gratuito
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Cadastrar & Gerenciar Produtos
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Cadastre e gerencie seus produtos ativos na vitrine da Kittanda Outlet com fotos, preços e marcações de outlet.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FB6600] hover:bg-[#e05b00] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <span className="text-base font-bold">+</span>
            <span>Cadastrar Produto</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 mb-5 text-xs rounded-[2px] flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)} className="font-bold ml-2">
              &times;
            </button>
          </div>
        )}

        {/* Barra de Limite de Produtos do Plano Gratuito */}
        <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-[2px] mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Produtos Ativos na Vitrine
            </span>
            <span className="text-xs font-extrabold text-neutral-900">
              {activeCount} de {maxProductsAllowed} produtos permitidos
            </span>
          </div>

          <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                activeCount >= maxProductsAllowed
                  ? 'bg-red-500'
                  : activeCount >= maxProductsAllowed * 0.8
                  ? 'bg-amber-500'
                  : 'bg-[#FB6600]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[10.5px] text-neutral-500">
            <span>Plano Bronze (Gratuito): 20 produtos inclusos</span>
            {activeCount >= maxProductsAllowed && (
              <span className="text-red-600 font-bold">
                Limite atingido! Desative um item ou faça upgrade de plano.
              </span>
            )}
          </div>
        </div>

        {/* Tabela de Produtos */}
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Carregando produtos cadastrados...
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-[2px] p-8">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-1">
              Nenhum produto cadastrado ainda
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
              Comece a cadastrar suas peças, promoções de outlet e novidades para que os clientes da sua região encontrem sua loja.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-black hover:bg-neutral-800 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-pointer"
            >
              Cadastrar Primeiro Produto
            </button>
          </div>
        ) : (
          <div className="border border-neutral-200 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 text-neutral-600 uppercase text-[10px] font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-3">Produto</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Preço</th>
                  <th className="p-3">Modalidade</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-200 rounded-[2px] overflow-hidden shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                              🛍️
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-neutral-900 block truncate max-w-[200px]">
                            {p.name}
                          </span>
                          {p.description && (
                            <span className="text-[10px] text-neutral-400 block truncate max-w-[200px]">
                              {p.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-neutral-700 capitalize">
                      {p.category} {p.subcategory ? `• ${p.subcategory}` : ''}
                    </td>
                    <td className="p-3">
                      <span className="font-extrabold text-neutral-900">
                        {typeof p.price === 'number' ? `R$ ${p.price.toFixed(2).replace('.', ',')}` : p.price}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {p.is_outlet && (
                          <span className="bg-[#FB6600] text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                            Outlet
                          </span>
                        )}
                        {p.is_novidade && (
                          <span className="bg-black text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                            Novidade
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded ${
                          p.is_active ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(p.id, Boolean(p.is_active))}
                          className="text-[11px] font-semibold text-neutral-600 hover:text-black cursor-pointer underline"
                        >
                          {p.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-800 cursor-pointer ml-1"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastro de Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-[2px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Cadastrar Novo Produto
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-black text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Vestido Midi Floral Estampado"
                  className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 89,90"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                    Preço Promocional (Opcional)
                  </label>
                  <input
                    type="text"
                    value={promotionalPrice}
                    onChange={(e) => setPromotionalPrice(e.target.value)}
                    placeholder="Ex: 59,90"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none bg-white"
                  >
                    <option value="moda">Moda</option>
                    <option value="pet">Pet</option>
                    <option value="casa">Casa</option>
                    <option value="beleza">Beleza</option>
                    <option value="agro">Agro</option>
                    <option value="carro">Carro</option>
                    <option value="eletro">Eletro</option>
                    <option value="escritorio">Escritório</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                    Subcategoria
                  </label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Ex: Feminina, Festa, Praia"
                    className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                  URL da Foto do Produto
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                  Descrição do Produto
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes sobre tecido, medidas, cores disponíveis..."
                  className="w-full border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={isOutlet}
                    onChange={(e) => setIsOutlet(e.target.checked)}
                    className="accent-[#FB6600] w-4 h-4"
                  />
                  <span>Oferta Outlet</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={isNovidade}
                    onChange={(e) => setIsNovidade(e.target.checked)}
                    className="accent-black w-4 h-4"
                  />
                  <span>Lançamento / Novidade</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

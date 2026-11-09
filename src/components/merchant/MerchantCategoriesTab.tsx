'use client'

import React, { useState, useEffect } from 'react'
import {
  getStoreCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createSubcategoryAction,
  updateSubcategoryAction,
  deleteSubcategoryAction,
  clearStoreCategoriesAction,
} from '@/app/actions/categories'
import { StoreCategoryWithSubcategories, StoreCategory, StoreSubcategory } from '@/lib/categories-storage'

interface MerchantCategoriesTabProps {
  storeId: string
  storeName: string
}

export default function MerchantCategoriesTab({
  storeId,
  storeName,
}: MerchantCategoriesTabProps) {
  const [categories, setCategories] = useState<StoreCategoryWithSubcategories[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Modais de Criação / Edição
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryIsActive, setCategoryIsActive] = useState(true)

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<StoreSubcategory | null>(null)
  const [selectedParentCategory, setSelectedParentCategory] = useState<StoreCategory | null>(null)
  const [subcategoryName, setSubcategoryName] = useState('')
  const [subcategoryDescription, setSubcategoryDescription] = useState('')
  const [subcategoryIsActive, setSubcategoryIsActive] = useState(true)

  // Modal de Confirmação de Exclusão com Detecção de Vínculos
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'category' | 'subcategory'
    id: string
    categoryId?: string
    name: string
    linkedProductsCount: number
    message?: string
  } | null>(null)

  // Modal para Limpar Todas as Informações de Categorias
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleClearAllCategories = async () => {
    setClearing(true)
    try {
      const res = await clearStoreCategoriesAction(storeId)
      if (res.success) {
        setCategories([])
        setExpandedCategories({})
        setIsClearModalOpen(false)
        setFeedback({
          type: 'success',
          message: 'Categorias e subcategorias limpas com sucesso! Agora você pode cadastrar a estrutura personalizada da sua loja.',
        })
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao limpar categorias.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha na comunicação com o servidor.' })
    } finally {
      setClearing(false)
    }
  }

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await getStoreCategoriesAction(storeId)
      if (res.success) {
        setCategories(res.categories)
        // Expandir por padrão as primeiras categorias
        const initialExpanded: Record<string, boolean> = {}
        res.categories.forEach((c) => {
          initialExpanded[c.id] = true
        })
        setExpandedCategories(initialExpanded)
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao carregar categorias.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha na comunicação com o servidor.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (storeId) {
      loadCategories()
    }
  }, [storeId])

  const toggleExpand = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  // --- Handlers de Categoria ---

  const handleOpenNewCategoryModal = () => {
    setEditingCategory(null)
    setCategoryName('')
    setCategoryDescription('')
    setCategoryIsActive(true)
    setIsCategoryModalOpen(true)
  }

  const handleOpenEditCategoryModal = (cat: StoreCategory) => {
    setEditingCategory(cat)
    setCategoryName(cat.name)
    setCategoryDescription(cat.description || '')
    setCategoryIsActive(cat.is_active)
    setIsCategoryModalOpen(true)
  }

  const handleSaveCategory = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!categoryName.trim()) {
      setFeedback({ type: 'error', message: 'O nome da categoria é obrigatório.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      if (editingCategory) {
        const res = await updateCategoryAction({
          id: editingCategory.id,
          storeId,
          name: categoryName,
          description: categoryDescription,
          isActive: categoryIsActive,
        })
        if (res.success) {
          setFeedback({ type: 'success', message: `Categoria "${categoryName}" atualizada com sucesso!` })
          setIsCategoryModalOpen(false)
          await loadCategories()
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao atualizar categoria.' })
        }
      } else {
        const res = await createCategoryAction({
          storeId,
          name: categoryName,
          description: categoryDescription,
          isActive: categoryIsActive,
        })
        if (res.success) {
          setFeedback({ type: 'success', message: `Categoria "${categoryName}" cadastrada com sucesso!` })
          setIsCategoryModalOpen(false)
          await loadCategories()
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao criar categoria.' })
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro inesperado ao salvar categoria.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategoryPrompt = (cat: StoreCategoryWithSubcategories) => {
    const linkedCount = cat.products_count || 0
    if (linkedCount > 0) {
      setDeleteConfirmation({
        type: 'category',
        id: cat.id,
        name: cat.name,
        linkedProductsCount: linkedCount,
        message: `Atenção: A categoria "${cat.name}" possui ${linkedCount} produto(s) vinculado(s) no seu catálogo. Ao confirmar a exclusão, os produtos permanecerão no seu catálogo, mas ficarão sem categoria específica até que você os reclassifique.`,
      })
    } else {
      setDeleteConfirmation({
        type: 'category',
        id: cat.id,
        name: cat.name,
        linkedProductsCount: 0,
        message: `Deseja realmente excluir a categoria "${cat.name}" e todas as suas subcategorias?`,
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return
    setSubmitting(true)
    setFeedback(null)

    try {
      if (deleteConfirmation.type === 'category') {
        const res = await deleteCategoryAction({
          id: deleteConfirmation.id,
          storeId,
          force: true,
        })
        if (res.success) {
          setFeedback({ type: 'success', message: `Categoria "${deleteConfirmation.name}" excluída com sucesso.` })
          setDeleteConfirmation(null)
          loadCategories()
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao excluir categoria.' })
        }
      } else {
        const res = await deleteSubcategoryAction({
          id: deleteConfirmation.id,
          categoryId: deleteConfirmation.categoryId!,
          storeId,
          force: true,
        })
        if (res.success) {
          setFeedback({ type: 'success', message: `Subcategoria "${deleteConfirmation.name}" excluída com sucesso.` })
          setDeleteConfirmation(null)
          loadCategories()
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao excluir subcategoria.' })
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro inesperado ao realizar exclusão.' })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Handlers de Subcategoria ---

  const handleOpenNewSubcategoryModal = (parentCat: StoreCategory) => {
    setSelectedParentCategory(parentCat)
    setEditingSubcategory(null)
    setSubcategoryName('')
    setSubcategoryDescription('')
    setSubcategoryIsActive(true)
    setIsSubcategoryModalOpen(true)
  }

  const handleOpenEditSubcategoryModal = (parentCat: StoreCategory, sub: StoreSubcategory) => {
    setSelectedParentCategory(parentCat)
    setEditingSubcategory(sub)
    setSubcategoryName(sub.name)
    setSubcategoryDescription(sub.description || '')
    setSubcategoryIsActive(sub.is_active)
    setIsSubcategoryModalOpen(true)
  }

  const handleSaveSubcategory = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!selectedParentCategory) return
    if (!subcategoryName.trim()) {
      setFeedback({ type: 'error', message: 'O nome da subcategoria é obrigatório.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      if (editingSubcategory) {
        const res = await updateSubcategoryAction({
          id: editingSubcategory.id,
          categoryId: selectedParentCategory.id,
          storeId,
          name: subcategoryName,
          description: subcategoryDescription,
          isActive: subcategoryIsActive,
        })
        if (res.success) {
          setFeedback({ type: 'success', message: `Subcategoria "${subcategoryName}" atualizada!` })
          setIsSubcategoryModalOpen(false)
          await loadCategories()
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao atualizar subcategoria.' })
        }
      } else {
        const res = await createSubcategoryAction({
          categoryId: selectedParentCategory.id,
          storeId,
          name: subcategoryName,
          description: subcategoryDescription,
          isActive: subcategoryIsActive,
        })
        if (res.success) {
          setFeedback({ type: 'success', message: `Subcategoria "${subcategoryName}" vinculada a "${selectedParentCategory.name}"!` })
          setIsSubcategoryModalOpen(false)
          await loadCategories()
        } else {
          setFeedback({ type: 'error', message: res.error || 'Erro ao criar subcategoria.' })
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao salvar subcategoria.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubcategoryPrompt = (parentCat: StoreCategory, sub: StoreSubcategory) => {
    const linkedCount = (sub as any).products_count || 0
    if (linkedCount > 0) {
      setDeleteConfirmation({
        type: 'subcategory',
        id: sub.id,
        categoryId: parentCat.id,
        name: sub.name,
        linkedProductsCount: linkedCount,
        message: `A subcategoria "${sub.name}" possui ${linkedCount} produto(s) vinculado(s). Ao confirmar a exclusão, os produtos permanecerão cadastrados na categoria "${parentCat.name}", mas sem subcategoria vinculada.`,
      })
    } else {
      setDeleteConfirmation({
        type: 'subcategory',
        id: sub.id,
        categoryId: parentCat.id,
        name: sub.name,
        linkedProductsCount: 0,
        message: `Deseja realmente excluir a subcategoria "${sub.name}" da categoria "${parentCat.name}"?`,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Dispositivo nº 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-black uppercase text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
              Dispositivo nº 6
            </span>
            <span className="text-xs font-bold text-neutral-500">• Organização do Catálogo</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
              Ilimitado
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
            Categorias e Subcategorias de Produtos
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Cadastre quantas categorias e subcategorias precisar para sua loja (sem limite de quantidade). Essa estrutura alimentará automaticamente os menus de navegação e os filtros de produtos da sua vitrine pública.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="px-3.5 py-2.5 border border-neutral-300 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 text-neutral-700 text-xs font-semibold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 bg-white shadow-2xs"
              title="Limpar todas as categorias e subcategorias"
            >
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Limpar Informações</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenNewCategoryModal}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <span>+ Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
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

      {/* Exemplo Didático / Card Informativo de Funcionamento Hierárquico */}
      <div className="bg-gradient-to-r from-neutral-50 to-orange-50/40 p-4 border border-neutral-200 rounded-[2px] text-xs text-neutral-600">
        <div className="flex items-start gap-2.5">
          <span className="text-base">💡</span>
          <div>
            <strong className="text-neutral-900 block font-bold mb-0.5">
              Como funciona a classificação hierárquica na sua loja:
            </strong>
            <p className="leading-relaxed">
              Você pode criar uma categoria principal como <strong>Camisas</strong> e desdobrá-la em subcategorias como{' '}
              <span className="font-semibold text-neutral-800">Cavada</span>,{' '}
              <span className="font-semibold text-neutral-800">Manga Longa</span>,{' '}
              <span className="font-semibold text-neutral-800">Gola Rolê</span> e{' '}
              <span className="font-semibold text-neutral-800">Polo</span>. Ao cadastrar produtos no dispositivo seguinte, essas opções aparecerão automaticamente vinculadas!
            </p>
          </div>
        </div>
      </div>

      {/* Listagem Hierárquica de Categorias e Subcategorias */}
      {loading ? (
        <div className="py-16 text-center text-xs text-neutral-500">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Carregando categorias e subcategorias...
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white p-12 border border-dashed border-neutral-300 rounded-[2px] text-center">
          <span className="text-3xl block mb-2">🏷️</span>
          <h3 className="text-sm font-bold text-neutral-800">Nenhuma categoria cadastrada ainda</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Crie sua primeira categoria principal para começar a organizar seu catálogo de produtos.
          </p>
          <button
            type="button"
            onClick={handleOpenNewCategoryModal}
            className="mt-4 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[2px] hover:bg-neutral-800 cursor-pointer"
          >
            + Criar Primeira Categoria
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, index) => {
            const isExpanded = expandedCategories[cat.id] ?? true
            const subCount = cat.subcategories.length
            const prodCount = cat.products_count || 0

            return (
              <div
                key={cat.id}
                className={`bg-white border rounded-[2px] overflow-hidden transition-all shadow-xs ${
                  cat.is_active ? 'border-neutral-200' : 'border-neutral-200 opacity-75'
                }`}
              >
                {/* Linha da Categoria Principal */}
                <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-white border border-neutral-300 text-neutral-600 hover:text-black hover:border-black cursor-pointer font-bold text-xs"
                      title={isExpanded ? 'Recolher subcategorias' : 'Expandir subcategorias'}
                    >
                      {isExpanded ? '▼' : '►'}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-400">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                          {cat.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                            cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {cat.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                        <span>{subCount} subcategoria(s)</span>
                        <span>•</span>
                        <span className="text-neutral-700 font-semibold">{prodCount} produto(s) vinculado(s)</span>
                        {cat.description && (
                          <>
                            <span>•</span>
                            <span className="italic text-neutral-400 truncate max-w-xs">{cat.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações da Categoria */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenNewSubcategoryModal(cat)}
                      className="px-2.5 py-1.5 bg-[#FB6600] hover:bg-[#e01283] text-white text-[11px] font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>+ Subcategoria</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditCategoryModal(cat)}
                      className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-[11px] font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategoryPrompt(cat)}
                      className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-neutral-300 hover:border-rose-300 text-[11px] font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Subcategorias (Hierarquia / Árvore) */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    {subCount === 0 ? (
                      <div className="p-4 bg-neutral-50/70 border border-dashed border-neutral-200 rounded-[2px] text-center text-xs text-neutral-500">
                        <span>Nenhuma subcategoria vinculada a <strong>{cat.name}</strong>.</span>
                        <button
                          type="button"
                          onClick={() => handleOpenNewSubcategoryModal(cat)}
                          className="ml-2 text-[#FB6600] font-bold hover:underline cursor-pointer"
                        >
                          + Adicionar primeira subcategoria
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">
                          Subcategorias vinculadas ({subCount})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {cat.subcategories.map((sub) => {
                            const subProdCount = (sub as any).products_count || 0
                            return (
                              <div
                                key={sub.id}
                                className="p-3 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-[2px] flex items-center justify-between gap-3 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-[#FB6600] text-xs font-bold">↳</span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-neutral-900 truncate">
                                        {sub.name}
                                      </h4>
                                      <span
                                        className={`px-1.5 py-0.2 text-[8.5px] font-black uppercase rounded ${
                                          sub.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                                        }`}
                                      >
                                        {sub.is_active ? 'Ativa' : 'Inativa'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-neutral-500 block truncate">
                                      {subProdCount} produto(s) classificado(s)
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSubcategoryModal(cat, sub)}
                                    className="p-1 text-neutral-600 hover:text-black text-xs font-bold cursor-pointer"
                                    title="Editar subcategoria"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubcategoryPrompt(cat, sub)}
                                    className="p-1 text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                                    title="Excluir subcategoria"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2px] shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {editingCategory ? 'Editar Categoria Principal' : 'Nova Categoria Principal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-neutral-400 hover:text-white font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveCategory(e)
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Camisas, Calças, Vestidos, Acessórios..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Breve explicação sobre os produtos desta categoria..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={categoryIsActive}
                    onChange={(e) => setCategoryIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#FB6600] rounded"
                  />
                  <span>Categoria ativa (visível no menu e filtros da loja)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase rounded-[2px] hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSaveCategory()
                  }}
                  disabled={submitting}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Subcategoria */}
      {isSubcategoryModalOpen && selectedParentCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2px] shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="text-neutral-400 hover:text-white font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveSubcategory(e)
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Categoria Principal Vinculada
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedParentCategory.name}
                  className="w-full px-3 py-2 text-xs bg-neutral-100 border border-neutral-300 rounded-[2px] text-neutral-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Nome da Subcategoria *
                </label>
                <input
                  type="text"
                  required
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  placeholder="Ex: Cavada, Manga Longa, Polo..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={subcategoryDescription}
                  onChange={(e) => setSubcategoryDescription(e.target.value)}
                  placeholder="Detalhes adicionais..."
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-[2px] focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={subcategoryIsActive}
                    onChange={(e) => setSubcategoryIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#FB6600] rounded"
                  />
                  <span>Subcategoria ativa (disponível no catálogo e filtros)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubcategoryModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase rounded-[2px] hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSaveSubcategory()
                  }}
                  disabled={submitting}
                  className="px-5 py-2 bg-[#FB6600] hover:bg-[#e01283] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingSubcategory ? 'Salvar Subcategoria' : 'Criar Subcategoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão com Detecção de Vínculos de Produtos */}
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
                className="text-white/80 hover:text-white font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-neutral-700 leading-relaxed">
                {deleteConfirmation.message}
              </p>

              {deleteConfirmation.linkedProductsCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-[2px] text-amber-950 text-[11px]">
                  <strong>Garantia de segurança:</strong> Seus produtos NÃO serão apagados. Eles apenas serão desvinculados desta classificação e continuarão salvos no seu catálogo.
                </div>
              )}

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
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
                  {submitting ? 'Excluindo...' : 'Sim, Excluir Registro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Limpar Todas as Categorias */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2px] shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span>⚠️</span>
                <span>Limpar Categorias e Subcategorias</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="text-neutral-400 hover:text-white font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-neutral-700 leading-relaxed">
                Deseja realmente limpar todas as <strong>{categories.length} categoria(s)</strong> e suas subcategorias cadastradas nesta loja?
              </p>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-[2px] text-[11px] text-neutral-600 leading-relaxed">
                Essa ação removerá os registros para que você possa organizar a estrutura de categorias personalizada da sua loja do zero. Seus produtos cadastrados continuarão intactos no catálogo.
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  disabled={clearing}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-[2px] hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClearAllCategories}
                  disabled={clearing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {clearing ? 'Limpando...' : 'Sim, Limpar Tudo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

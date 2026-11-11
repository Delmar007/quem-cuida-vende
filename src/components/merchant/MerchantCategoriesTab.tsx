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
      {/* Cabeçalho do Tópico 05 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-8 border border-neutral-200 rounded-md shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#FB6600] block mb-1">
            Tópico 05
          </span>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Categorias de Produtos
          </h2>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2.5">
          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="h-10 px-4 border border-neutral-300 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 text-neutral-700 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-2 bg-white"
              title="Limpar todas as categorias e subcategorias"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Limpar Tudo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenNewCategoryModal}
            className="h-10 px-4 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <span>+ Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
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

      {/* Listagem Hierárquica de Categorias e Subcategorias */}
      {loading ? (
        <div className="py-16 text-center text-sm text-neutral-500">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando categorias...
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white p-10 sm:p-12 border border-dashed border-neutral-300 rounded-md text-center">
          <span className="text-4xl block mb-3">🏷️</span>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900">
            Nenhuma categoria cadastrada
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
            Crie a primeira categoria para organizar os produtos da sua loja.
          </p>
          <button
            type="button"
            onClick={handleOpenNewCategoryModal}
            className="mt-5 h-11 px-5 bg-neutral-900 text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-black cursor-pointer transition-colors"
          >
            + Nova Categoria
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
                className={`bg-white border rounded-md overflow-hidden transition-all shadow-xs ${
                  cat.is_active ? 'border-neutral-200' : 'border-neutral-200 opacity-75'
                }`}
              >
                {/* Cabeçalho da Categoria Principal */}
                <div className="p-4 sm:p-5 bg-neutral-50/90 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-neutral-300 text-neutral-600 hover:text-black hover:border-black cursor-pointer font-bold text-xs shrink-0 mt-0.5 sm:mt-0"
                      title={isExpanded ? 'Recolher' : 'Expandir'}
                    >
                      {isExpanded ? '▼' : '►'}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-mono font-bold text-neutral-400">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 tracking-tight">
                          {cat.name}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                            cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {cat.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mt-1 text-xs sm:text-sm text-neutral-600">
                        <span>{subCount} subcategoria(s)</span>
                        <span className="text-neutral-300">&bull;</span>
                        <span className="font-semibold text-neutral-800">{prodCount} produto(s)</span>
                        {cat.description && (
                          <>
                            <span className="text-neutral-300">&bull;</span>
                            <span className="text-neutral-500 truncate max-w-sm">{cat.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações da Categoria */}
                  <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenNewSubcategoryModal(cat)}
                      className="h-9 px-3.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>+ Subcategoria</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditCategoryModal(cat)}
                      className="h-9 px-3.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategoryPrompt(cat)}
                      className="h-9 px-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-neutral-300 hover:border-rose-300 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Subcategorias */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-white">
                    {subCount === 0 ? (
                      <div className="p-5 bg-neutral-50/80 border border-dashed border-neutral-200 rounded-md flex flex-col sm:flex-row items-center justify-center gap-2.5 text-center text-xs sm:text-sm text-neutral-600">
                        <span>
                          Nenhuma subcategoria vinculada a <strong className="text-neutral-900">{cat.name}</strong>.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenNewSubcategoryModal(cat)}
                          className="text-[#FB6600] font-bold hover:underline cursor-pointer"
                        >
                          + Adicionar subcategoria
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                          Subcategorias ({subCount})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {cat.subcategories.map((sub) => {
                            const subProdCount = (sub as any).products_count || 0
                            return (
                              <div
                                key={sub.id}
                                className="p-3.5 sm:p-4 bg-neutral-50/70 hover:bg-neutral-100/80 border border-neutral-200 rounded-md flex items-center justify-between gap-3 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-[#FB6600] text-sm font-bold shrink-0">↳</span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm font-bold text-neutral-900 truncate">
                                        {sub.name}
                                      </h4>
                                      <span
                                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                                          sub.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                                        }`}
                                      >
                                        {sub.is_active ? 'Ativa' : 'Inativa'}
                                      </span>
                                    </div>
                                    <span className="text-xs text-neutral-600 block mt-0.5">
                                      {subProdCount} produto(s)
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSubcategoryModal(cat, sub)}
                                    className="w-8 h-8 rounded-md border border-neutral-200 bg-white hover:border-neutral-400 text-neutral-700 hover:text-black flex items-center justify-center text-sm cursor-pointer transition-colors"
                                    title="Editar subcategoria"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubcategoryPrompt(cat, sub)}
                                    className="w-8 h-8 rounded-md border border-neutral-200 bg-white hover:border-rose-300 hover:bg-rose-50 text-rose-500 hover:text-rose-700 flex items-center justify-center text-sm cursor-pointer transition-colors"
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
          <div className="bg-white w-full max-w-md rounded-md shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-neutral-400 hover:text-white font-bold text-lg cursor-pointer"
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
                <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex.: Camisas, Sedan, Acessórios..."
                  className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Breve descrição da categoria..."
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 resize-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={categoryIsActive}
                    onChange={(e) => setCategoryIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#FB6600] rounded"
                  />
                  <span>Categoria ativa na vitrine</span>
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="h-10 px-4 border border-neutral-300 text-neutral-700 text-xs sm:text-sm font-semibold rounded-md hover:bg-neutral-50 cursor-pointer"
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
                  className="h-10 px-5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingCategory ? 'Salvar' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Subcategoria */}
      {isSubcategoryModalOpen && selectedParentCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-md shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold">
                {editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubcategoryModalOpen(false)}
                className="text-neutral-400 hover:text-white font-bold text-lg cursor-pointer"
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
                <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                  Categoria Principal
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedParentCategory.name}
                  className="w-full h-11 px-3.5 text-sm bg-neutral-100 border border-neutral-300 rounded-md text-neutral-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                  Nome da Subcategoria *
                </label>
                <input
                  type="text"
                  required
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  placeholder="Ex.: Polo, Chevrolet, Volkswagen..."
                  className="w-full h-11 px-3.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-bold text-neutral-800 mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={subcategoryDescription}
                  onChange={(e) => setSubcategoryDescription(e.target.value)}
                  placeholder="Detalhes adicionais..."
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-[#FB6600] focus:ring-2 focus:ring-[#FB6600]/15 resize-none"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={subcategoryIsActive}
                    onChange={(e) => setSubcategoryIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#FB6600] rounded"
                  />
                  <span>Subcategoria ativa na vitrine</span>
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSubcategoryModalOpen(false)}
                  className="h-10 px-4 border border-neutral-300 text-neutral-700 text-xs sm:text-sm font-semibold rounded-md hover:bg-neutral-50 cursor-pointer"
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
                  className="h-10 px-5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs sm:text-sm font-semibold rounded-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingSubcategory ? 'Salvar' : 'Criar Subcategoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
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
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-neutral-700 leading-relaxed">
                {deleteConfirmation.message}
              </p>

              {deleteConfirmation.linkedProductsCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-amber-950 text-xs sm:text-sm">
                  <strong>Aviso:</strong> Os produtos não serão apagados do catálogo, apenas desvinculados.
                </div>
              )}

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
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

      {/* Modal de Confirmação de Limpar Todas as Categorias */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-md shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>Limpar Categorias</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="text-neutral-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-sm text-neutral-700 leading-relaxed">
                Deseja remover todas as <strong>{categories.length} categoria(s)</strong> e suas subcategorias? Seus produtos continuarão salvos no catálogo.
              </p>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  disabled={clearing}
                  className="h-10 px-4 border border-neutral-300 text-neutral-700 text-xs sm:text-sm font-semibold rounded-md hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClearAllCategories}
                  disabled={clearing}
                  className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-md cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {clearing ? 'Limpando...' : 'Limpar Tudo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

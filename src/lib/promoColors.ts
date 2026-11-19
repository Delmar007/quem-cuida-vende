/**
 * Sistema Unificado de Cores das Promoções - Kittanda Outlet
 * Cada tipo de promoção possui uma cor alegre e vibrante exclusiva,
 * mantendo "Outlet" na cor Laranja oficial (#FB6600).
 */

export interface PromoColorDef {
  id: string
  label: string
  bgHex: string
  textClass: string
  bgClass: string
  borderHex: string
  ringClass: string
}

export const PROMO_COLOR_DEFINITIONS: Record<string, PromoColorDef> = {
  outlet: {
    id: 'outlet',
    label: 'Outlet',
    bgHex: '#FB6600', // Laranja oficial mantido
    textClass: 'text-white',
    bgClass: 'bg-[#FB6600]',
    borderHex: '#e05b00',
    ringClass: 'ring-[#FB6600]/30',
  },
  lancamento: {
    id: 'lancamento',
    label: 'Lançamento',
    bgHex: '#0284C7', // Azul elétrico / Sky vibrante
    textClass: 'text-white',
    bgClass: 'bg-[#0284C7]',
    borderHex: '#0369a1',
    ringClass: 'ring-[#0284C7]/30',
  },
  novidades: {
    id: 'novidades',
    label: 'Lançamento',
    bgHex: '#0284C7',
    textClass: 'text-white',
    bgClass: 'bg-[#0284C7]',
    borderHex: '#0369a1',
    ringClass: 'ring-[#0284C7]/30',
  },
  vitrine: {
    id: 'vitrine',
    label: 'Vitrine',
    bgHex: '#8B5CF6', // Roxo Real / Violeta alegre
    textClass: 'text-white',
    bgClass: 'bg-[#8B5CF6]',
    borderHex: '#7c3aed',
    ringClass: 'ring-[#8B5CF6]/30',
  },
  recondicionado: {
    id: 'recondicionado',
    label: 'Recondicionado',
    bgHex: '#059669', // Verde esmeralda alegre
    textClass: 'text-white',
    bgClass: 'bg-[#059669]',
    borderHex: '#047857',
    ringClass: 'ring-[#059669]/30',
  },
  ultimas_unidades: {
    id: 'ultimas_unidades',
    label: 'Últimas unidades',
    bgHex: '#EF4444', // Vermelho coral vibrante
    textClass: 'text-white',
    bgClass: 'bg-[#EF4444]',
    borderHex: '#dc2626',
    ringClass: 'ring-[#EF4444]/30',
  },
  exclusividade: {
    id: 'exclusividade',
    label: 'Exclusividade',
    bgHex: '#F59E0B', // Dourado âmbar alegre
    textClass: 'text-white',
    bgClass: 'bg-[#F59E0B]',
    borderHex: '#d97706',
    ringClass: 'ring-[#F59E0B]/30',
  },
  sob_encomenda: {
    id: 'sob_encomenda',
    label: 'Sob Encomenda',
    bgHex: '#6366F1', // Índigo vibrante
    textClass: 'text-white',
    bgClass: 'bg-[#6366F1]',
    borderHex: '#4f46e5',
    ringClass: 'ring-[#6366F1]/30',
  },
  importado: {
    id: 'importado',
    label: 'Importado',
    bgHex: '#2563EB', // Azul royal vivo
    textClass: 'text-white',
    bgClass: 'bg-[#2563EB]',
    borderHex: '#1d4ed8',
    ringClass: 'ring-[#2563EB]/30',
  },
  peca_unica: {
    id: 'peca_unica',
    label: 'Peça única',
    bgHex: '#EC4899', // Rosa choque magenta vibrante
    textClass: 'text-white',
    bgClass: 'bg-[#EC4899]',
    borderHex: '#db2777',
    ringClass: 'ring-[#EC4899]/30',
  },
  pequeno_defeito: {
    id: 'pequeno_defeito',
    label: 'Pequeno Defeito',
    bgHex: '#EA580C', // Laranja cobre vibrante
    textClass: 'text-white',
    bgClass: 'bg-[#EA580C]',
    borderHex: '#c2410c',
    ringClass: 'ring-[#EA580C]/30',
  },
  artezanal: {
    id: 'artezanal',
    label: 'Artezanal',
    bgHex: '#16A34A', // Verde menta vivo
    textClass: 'text-white',
    bgClass: 'bg-[#16A34A]',
    borderHex: '#15803d',
    ringClass: 'ring-[#16A34A]/30',
  },
  artesanal: {
    id: 'artesanal',
    label: 'Artezanal',
    bgHex: '#16A34A',
    textClass: 'text-white',
    bgClass: 'bg-[#16A34A]',
    borderHex: '#15803d',
    ringClass: 'ring-[#16A34A]/30',
  },
  novo: {
    id: 'novo',
    label: 'Novo',
    bgHex: '#0D9488', // Verde petróleo teal vivo
    textClass: 'text-white',
    bgClass: 'bg-[#0D9488]',
    borderHex: '#0f766e',
    ringClass: 'ring-[#0D9488]/30',
  },
  usado: {
    id: 'usado',
    label: 'Usado',
    bgHex: '#475569', // Ardósia moderno
    textClass: 'text-white',
    bgClass: 'bg-[#475569]',
    borderHex: '#334155',
    ringClass: 'ring-[#475569]/30',
  },
  semi_novo: {
    id: 'semi_novo',
    label: 'Semi-novo',
    bgHex: '#0891B2', // Ciano vivo
    textClass: 'text-white',
    bgClass: 'bg-[#0891B2]',
    borderHex: '#0e7490',
    ringClass: 'ring-[#0891B2]/30',
  },
  'semi-novo': {
    id: 'semi-novo',
    label: 'Semi-novo',
    bgHex: '#0891B2',
    textClass: 'text-white',
    bgClass: 'bg-[#0891B2]',
    borderHex: '#0e7490',
    ringClass: 'ring-[#0891B2]/30',
  },
  feed_que_sigo: {
    id: 'feed_que_sigo',
    label: 'Produtos de Lojas que Sigo',
    bgHex: '#9333EA', // Fúcsia roxo
    textClass: 'text-white',
    bgClass: 'bg-[#9333EA]',
    borderHex: '#7e22ce',
    ringClass: 'ring-[#9333EA]/30',
  },
}

/**
 * Normaliza a chave ou nome do tipo de promoção e retorna sua definição de cor.
 * Fallback padrão: Laranja Oficial (#FB6600).
 */
export function getPromoColor(promoTypeOrLabel?: string | null): PromoColorDef {
  if (!promoTypeOrLabel) {
    return PROMO_COLOR_DEFINITIONS.outlet
  }

  const normalized = promoTypeOrLabel
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')

  // Procura por ID direto
  if (PROMO_COLOR_DEFINITIONS[normalized]) {
    return PROMO_COLOR_DEFINITIONS[normalized]
  }

  // Procura por correspondências parciais conhecidas
  if (normalized.includes('outlet')) return PROMO_COLOR_DEFINITIONS.outlet
  if (normalized.includes('lancamento') || normalized.includes('novidade')) return PROMO_COLOR_DEFINITIONS.lancamento
  if (normalized.includes('vitrine')) return PROMO_COLOR_DEFINITIONS.vitrine
  if (normalized.includes('recondicionado')) return PROMO_COLOR_DEFINITIONS.recondicionado
  if (normalized.includes('ultima') || normalized.includes('ultimas')) return PROMO_COLOR_DEFINITIONS.ultimas_unidades
  if (normalized.includes('exclusiv')) return PROMO_COLOR_DEFINITIONS.exclusividade
  if (normalized.includes('encomenda')) return PROMO_COLOR_DEFINITIONS.sob_encomenda
  if (normalized.includes('importad')) return PROMO_COLOR_DEFINITIONS.importado
  if (normalized.includes('peca_unica') || normalized.includes('unica')) return PROMO_COLOR_DEFINITIONS.peca_unica
  if (normalized.includes('defeito')) return PROMO_COLOR_DEFINITIONS.pequeno_defeito
  if (normalized.includes('artesanal') || normalized.includes('artezanal')) return PROMO_COLOR_DEFINITIONS.artezanal
  if (normalized.includes('semi')) return PROMO_COLOR_DEFINITIONS.semi_novo
  if (normalized.includes('novo')) return PROMO_COLOR_DEFINITIONS.novo
  if (normalized.includes('usado')) return PROMO_COLOR_DEFINITIONS.usado
  if (normalized.includes('sigo') || normalized.includes('seguind')) return PROMO_COLOR_DEFINITIONS.feed_que_sigo

  // Fallback seguro em laranja
  return {
    id: normalized,
    label: promoTypeOrLabel,
    bgHex: '#FB6600',
    textClass: 'text-white',
    bgClass: 'bg-[#FB6600]',
    borderHex: '#e05b00',
    ringClass: 'ring-[#FB6600]/30',
  }
}

/**
 * Retorna uma lista de promoções principais únicas para exibição na legenda e filtros do mapa.
 */
export function getDistinctPromoFilters(): PromoColorDef[] {
  return [
    PROMO_COLOR_DEFINITIONS.outlet,
    PROMO_COLOR_DEFINITIONS.lancamento,
    PROMO_COLOR_DEFINITIONS.vitrine,
    PROMO_COLOR_DEFINITIONS.recondicionado,
    PROMO_COLOR_DEFINITIONS.ultimas_unidades,
    PROMO_COLOR_DEFINITIONS.exclusividade,
    PROMO_COLOR_DEFINITIONS.sob_encomenda,
    PROMO_COLOR_DEFINITIONS.importado,
    PROMO_COLOR_DEFINITIONS.peca_unica,
    PROMO_COLOR_DEFINITIONS.pequeno_defeito,
    PROMO_COLOR_DEFINITIONS.artezanal,
    PROMO_COLOR_DEFINITIONS.novo,
    PROMO_COLOR_DEFINITIONS.semi_novo,
    PROMO_COLOR_DEFINITIONS.usado,
  ]
}

/**
 * Configuração Comercial dos Planos • Kittanda Outlet
 * 
 * Lojas em Geral:
 * 1. Bronze: Gratuito, até 20 produtos ativos
 * 2. Bronze Plus: R$ 30,00/mês, até 100 produtos ativos (mesmos benefícios do Prata)
 * 3. Prata: R$ 50,00/mês, até 200 produtos ativos
 * 4. Ouro: R$ 100,00/mês, até 500 produtos ativos (benefícios exclusivos e sorteios)
 *
 * Loja de Carros & Concessionárias:
 * 5. Loja de Carros (auto_50): R$ 50,00/mês, até 50 veículos ativos (Banner Duplo)
 * 6. Concessionária (auto_100): R$ 150,00/mês, até 100 veículos ativos (Banner Triplo)
 */

export type PlanId = 'bronze' | 'bronze_plus' | 'prata' | 'ouro' | 'auto_50' | 'auto_100'

export interface PlanDefinition {
  id: PlanId
  name: string
  label: string
  segment: 'geral' | 'veiculos'
  itemLabel: string
  price: number
  priceFormatted: string
  period: string
  maxActiveProducts: number
  maxPromotions: number
  feedBannerType: 'single' | 'double' | 'triple'
  feedBannerLabel: string
  badgeText?: string
  badgeClass?: string
  borderClass?: string
  highlight?: boolean
  hasSecondaryCategoryBanner: boolean
  hasHighlightNovidades: boolean
  hasMainPageBanner: boolean
  hasBirthdayList: boolean
  hasMonthlyRaffles: boolean
  description: string
  benefits: string[]
  ctaText: string
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    label: 'Plano Bronze',
    segment: 'geral',
    itemLabel: 'produtos ativos',
    price: 0,
    priceFormatted: 'R$ 0,00',
    period: '/mês',
    maxActiveProducts: 20,
    maxPromotions: 5,
    feedBannerType: 'single',
    feedBannerLabel: 'No Plano Bronze (Gratuito) a loja aparece no feed com Banner Single (1 coluna)',
    badgeText: 'Gratuito',
    badgeClass: 'bg-gray-100 text-gray-700',
    borderClass: 'border-gray-200',
    hasSecondaryCategoryBanner: false,
    hasHighlightNovidades: false,
    hasMainPageBanner: false,
    hasBirthdayList: false,
    hasMonthlyRaffles: false,
    description: 'Plano gratuito de entrada para pequenos lojistas iniciarem no marketplace.',
    benefits: [
      'Banner Triplo (Grande) exclusivo dentro da página da sua loja',
      'Exibição da loja no filtro Lojas com Banner Single (1 coluna)',
      'Página própria da loja dentro da Kittanda Outlet',
      'Cadastro e divulgação de até 20 produtos ativos',
      'Participação no marketplace',
      'Possibilidade de ser seguido pelos consumidores',
      'Publicação de ofertas e novidades conforme as regras',
      'Recebimento de contatos de clientes pelo WhatsApp',
      'Área administrativa para gestão de produtos',
    ],
    ctaText: 'Abrir loja grátis',
  },
  bronze_plus: {
    id: 'bronze_plus',
    name: 'Bronze Plus',
    label: 'Plano Bronze Plus',
    segment: 'geral',
    itemLabel: 'produtos ativos',
    price: 30,
    priceFormatted: 'R$ 30,00',
    period: '/mês',
    maxActiveProducts: 100,
    maxPromotions: 15,
    feedBannerType: 'double',
    feedBannerLabel: 'No Plano Bronze Plus a loja aparece no feed com Banner Duplo (2 colunas)',
    badgeText: 'Mais Vendido',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    borderClass: 'border-amber-300',
    hasSecondaryCategoryBanner: true,
    hasHighlightNovidades: true,
    hasMainPageBanner: false,
    hasBirthdayList: false,
    hasMonthlyRaffles: false,
    description: 'Plano intermediário econômico com todos os benefícios do Prata e até 100 produtos.',
    benefits: [
      'Todos os benefícios do Bronze, mais:',
      'Banner Triplo dentro da loja + Banner Duplo (2 colunas) no filtro Lojas',
      'Cadastro e divulgação de até 100 produtos ativos',
      'Banner de divulgação nas páginas de categorias secundárias',
      'Opção de destacar novidades da loja',
      'Participação no feed personalizado para seguidores',
      'Divulgação de promoções exclusivas para clientes',
      'Área administrativa completa de gestão',
    ],
    ctaText: 'Quero ser Bronze Plus',
  },
  prata: {
    id: 'prata',
    name: 'Prata',
    label: 'Plano Prata',
    segment: 'geral',
    itemLabel: 'produtos ativos',
    price: 50,
    priceFormatted: 'R$ 50,00',
    period: '/mês',
    maxActiveProducts: 200,
    maxPromotions: 30,
    feedBannerType: 'double',
    feedBannerLabel: 'No Plano Prata a loja aparece no feed com Banner Duplo (2 colunas)',
    badgeText: 'Intermediário',
    badgeClass: 'bg-neutral-200 text-neutral-800',
    borderClass: 'border-gray-300',
    hasSecondaryCategoryBanner: true,
    hasHighlightNovidades: true,
    hasMainPageBanner: false,
    hasBirthdayList: false,
    hasMonthlyRaffles: false,
    description: 'Maior espaço para catálogos consolidados com até 200 produtos cadastrados.',
    benefits: [
      'Todos os benefícios do Bronze, mais:',
      'Banner Triplo dentro da loja + Banner Duplo (2 colunas) no filtro Lojas',
      'Cadastro e divulgação de até 200 produtos ativos',
      'Banner de divulgação nas páginas de categorias secundárias',
      'Opção de destacar novidades da loja',
      'Maior espaço para exposição do catálogo',
      'Possibilidade de divulgar promoções para os seguidores',
      'Área administrativa completa de gestão',
    ],
    ctaText: 'Quero ser Prata',
  },
  ouro: {
    id: 'ouro',
    name: 'Ouro',
    label: 'Plano Ouro',
    segment: 'geral',
    itemLabel: 'produtos ativos',
    price: 100,
    priceFormatted: 'R$ 100,00',
    period: '/mês',
    maxActiveProducts: 500,
    maxPromotions: 100,
    feedBannerType: 'triple',
    feedBannerLabel: 'No Plano Ouro a loja aparece no feed com Banner Triplo (3 colunas - linha inteira)',
    badgeText: 'Mais Completo',
    badgeClass: 'bg-orange-50 text-[#FB6600] border border-orange-200',
    borderClass: 'border-[#FB6600]',
    highlight: true,
    hasSecondaryCategoryBanner: true,
    hasHighlightNovidades: true,
    hasMainPageBanner: true,
    hasBirthdayList: true,
    hasMonthlyRaffles: true,
    description: 'Exposição máxima na plataforma com banner na home, até 500 produtos e sorteios mensais.',
    benefits: [
      'Todos os benefícios do Prata, mais:',
      'Banner Triplo (3 colunas) tanto dentro da loja quanto no filtro Lojas',
      'Cadastro e divulgação de até 500 produtos ativos',
      'Banner de divulgação na página principal da Kittanda',
      'Destaque para novidades e produtos de outlet',
      'Acesso à lista de aniversariantes elegíveis (LGPD)',
      'Acesso à página de favoritos conforme permissões',
      'Participação em campanhas de sorteios mensais para seguidores',
    ],
    ctaText: 'Quero ser Ouro',
  },
  auto_50: {
    id: 'auto_50',
    name: 'Loja de Carros',
    label: 'Plano Loja de Carros',
    segment: 'veiculos',
    itemLabel: 'veículos ativos',
    price: 50,
    priceFormatted: 'R$ 50,00',
    period: '/mês',
    maxActiveProducts: 50,
    maxPromotions: 25,
    feedBannerType: 'double',
    feedBannerLabel: 'No Plano Loja de Carros a loja aparece no feed com Banner Duplo (2 colunas)',
    badgeText: 'Multimarcas',
    badgeClass: 'bg-slate-800 text-white border border-slate-700',
    borderClass: 'border-slate-700',
    hasSecondaryCategoryBanner: true,
    hasHighlightNovidades: true,
    hasMainPageBanner: false,
    hasBirthdayList: false,
    hasMonthlyRaffles: false,
    description: 'Plano dedicado para lojas de seminovos, multimarcas e revendas com até 50 veículos no catálogo.',
    benefits: [
      'Banner Triplo dentro da loja + Banner Duplo (2 colunas) no filtro Lojas',
      'Cadastro de até 50 veículos ativos com até 12 fotos por anúncio',
      'Ficha técnica exclusiva: Marca, Modelo, Versão, Ano, KM, Câmbio e Tração',
      'Controle interno privado de Preço FIPE, Custo e Placa no painel',
      'Destaque na categoria Carro (Usados e Multimarcas)',
      'Botão direto para negociação imediata via WhatsApp',
      'Cronômetro de ofertas e termômetro temporal de campanha',
    ],
    ctaText: 'Contratar R$ 50/mês',
  },
  auto_100: {
    id: 'auto_100',
    name: 'Concessionária',
    label: 'Plano Concessionária',
    segment: 'veiculos',
    itemLabel: 'veículos ativos',
    price: 150,
    priceFormatted: 'R$ 150,00',
    period: '/mês',
    maxActiveProducts: 100,
    maxPromotions: 50,
    feedBannerType: 'triple',
    feedBannerLabel: 'No Plano Concessionária a loja aparece no feed com Banner Triplo (3 colunas - linha inteira)',
    badgeText: 'Concessionárias',
    badgeClass: 'bg-orange-50 text-[#FB6600] border border-orange-200',
    borderClass: 'border-[#FB6600]',
    highlight: true,
    hasSecondaryCategoryBanner: true,
    hasHighlightNovidades: true,
    hasMainPageBanner: true,
    hasBirthdayList: true,
    hasMonthlyRaffles: true,
    description: 'Exposição máxima para concessionárias e grandes pátios com até 100 veículos e Banner Triplo.',
    benefits: [
      'Todos os benefícios do Plano Loja de Carros, mais:',
      'Banner Triplo (3 colunas) dentro da loja e em linha inteira no filtro Lojas',
      'Cadastro e vitrine de até 100 veículos ativos com até 12 fotos cada',
      'Banner de divulgação na página principal e na categoria Carro',
      'Ficha técnica completa + Tabela FIPE e Custo internos privados no painel',
      'Acesso à lista de aniversariantes seguidores (LGPD) e favoritos',
      'Participação em campanhas e feirões mensais da Kittanda',
    ],
    ctaText: 'Contratar R$ 150/mês',
  },
}

export const GENERAL_PLANS: PlanDefinition[] = [
  PLANS.bronze,
  PLANS.bronze_plus,
  PLANS.prata,
  PLANS.ouro,
]

export const VEHICLE_PLANS: PlanDefinition[] = [
  PLANS.auto_50,
  PLANS.auto_100,
]

export const ORDERED_PLANS: PlanDefinition[] = [
  PLANS.bronze,
  PLANS.bronze_plus,
  PLANS.prata,
  PLANS.ouro,
  PLANS.auto_50,
  PLANS.auto_100,
]

export function getPlan(planId?: string): PlanDefinition {
  let clean = (planId || 'bronze').toLowerCase().trim()
  if (clean === 'bronze_luz' || clean === 'bronzeluz') clean = 'bronze_plus'
  if (clean === 'bronze_gratuito' || clean === 'bronzegratuito' || clean === 'gratuito') clean = 'bronze'
  if (clean === 'carros_50' || clean === 'veiculos_50' || clean === 'loja_carros') clean = 'auto_50'
  if (clean === 'concessionaria' || clean === 'concessionaria_100' || clean === 'carros_100') clean = 'auto_100'
  return PLANS[clean as PlanId] || PLANS.bronze
}

export function getPlanProductLimit(planId?: string): number {
  return getPlan(planId).maxActiveProducts
}

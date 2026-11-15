import { FIPE_MARCAS } from '@/lib/fipeMarcas'

const LOWERCASE_WORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'na',
  'no',
  'nas',
  'nos',
  'com',
  'para',
  'por',
  'a',
  'o',
  'as',
  'os',
])

const SPECIAL_CASE_WORDS: Record<string, string> = {
  suv: 'SUV',
  gti: 'GTI',
  tsi: 'TSI',
  tdi: 'TDI',
  usb: 'USB',
  led: 'LED',
  hd: 'HD',
  fullhd: 'Full HD',
  '4k': '4K',
  tv: 'TV',
  pc: 'PC',
  pp: 'PP',
  gg: 'GG',
  xg: 'XG',
  xxg: 'XXG',
  bmw: 'BMW',
  byd: 'BYD',
  ram: 'RAM',
  ktm: 'KTM',
  caoa: 'CAOA',
  lg: 'LG',
  jbl: 'JBL',
  hp: 'HP',
  amd: 'AMD',
  iphone: 'iPhone',
  ipad: 'iPad',
  macbook: 'MacBook',
  airpods: 'AirPods',
  playstation: 'PlayStation',
  xbox: 'Xbox',
  xiaomi: 'Xiaomi',
  lamborghini: 'Lamborghini',
  chevrolet: 'Chevrolet',
  volkswagen: 'Volkswagen',
  mercedes: 'Mercedes',
  'mercedes-benz': 'Mercedes-Benz',
}

function formatToken(token: string, isFirst: boolean): string {
  if (!token) return ''
  const lower = token.toLowerCase()
  if (SPECIAL_CASE_WORDS[lower]) {
    return SPECIAL_CASE_WORDS[lower]
  }
  if (!isFirst && LOWERCASE_WORDS.has(lower)) {
    return lower
  }
  if (token.includes('-')) {
    return token
      .split('-')
      .map((part, idx) => formatToken(part, isFirst && idx === 0))
      .join('-')
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/**
 * Formata textos livres (títulos, marcas, categorias e subcategorias) em Title Case editorial.
 */
export function toTitleCase(text?: string | null): string {
  if (!text) return ''
  const normalized = String(text).trim().replace(/\s+/g, ' ')
  if (!normalized) return ''
  return normalized
    .split(' ')
    .map((word, index) => formatToken(word, index === 0))
    .join(' ')
}

const GENERAL_BRANDS = [
  'Adidas',
  'Apple',
  'Arezzo',
  'Asus',
  'Brastemp',
  'Calvin Klein',
  'Colcci',
  'Consul',
  'Dell',
  'Dudalina',
  'Electrolux',
  'Farm',
  'Fila',
  'Havaianas',
  'HP',
  'JBL',
  'Lacoste',
  'Lenovo',
  'LG',
  'Melissa',
  'Mizuno',
  'Motorola',
  'Nike',
  'Natura',
  'O Boticário',
  'Oakley',
  'Olympikus',
  'Philips',
  'Puma',
  'Reserva',
  'Samsung',
  'Santa Lolla',
  'Schutz',
  'Sony',
  'Tommy Hilfiger',
  'Tramontina',
  'Vans',
  'Xiaomi',
  'Zara',
]

const fipeBrandNames = Array.isArray(FIPE_MARCAS)
  ? FIPE_MARCAS.map((m: { nome?: string }) => toTitleCase(m?.nome || '')).filter(Boolean)
  : []

export const CURATED_BRANDS: string[] = Array.from(
  new Set([...GENERAL_BRANDS, ...fipeBrandNames])
).sort((a, b) => a.localeCompare(b, 'pt-BR'))

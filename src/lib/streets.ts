/**
 * Lista curada de principais ruas e avenidas comerciais e utilitários
 * de normalização/ordenação alfabética (A–Z) para o filtro "Por Rua".
 */

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const COMMERCIAL_STREETS: string[] = [
  'Av. Afonso Pena',
  'Rua Abrão Júlio Rahe',
  'Rua Alagoas',
  'Rua Amazonas',
  'Rua Antônio Maria Coelho',
  'Av. Bandeirantes',
  'Rua Bahia',
  'Rua Barão do Rio Branco',
  'Av. Bom Pastor',
  'Rua Brilhante',
  'Av. Calógeras',
  'Rua Ceará',
  'Av. Coronel Antonino',
  'Av. Costa e Silva',
  'Rua Cândido Mariano',
  'Rua Dom Aquino',
  'Av. Duque de Caxias',
  'Av. Eduardo Elias Zahran',
  'Av. Ernesto Geisel',
  'Rua Espírito Santo',
  'Rua Euclides da Cunha',
  'Av. Fábio Zahran',
  'Av. Fernando Corrêa da Costa',
  'Rua das Flores',
  'Av. Guaicurus',
  'Av. Gunter Hans',
  'Rua Heitor Laburú',
  'Av. Hiroshima',
  'Rua Hélio Castro Maia',
  'Av. Interlagos',
  'Rua Itacuruçá',
  'Rua Joaquim Murtinho',
  'Rua José Antônio',
  'Av. Júlio de Castilho',
  'Rua das Laranjeiras',
  'Rua Luís Alexandre de Oliveira',
  'Rua Maracaju',
  'Rua Marechal Rondon',
  'Av. Mascarenhas de Moraes',
  'Av. Mato Grosso',
  'Av. Nelly Martins',
  'Rua das Nações Unidas',
  'Rua Nove de Julho',
  'Rua Oscar Freire',
  'Rua Oswaldo Cruz',
  'Rua Padre João Crippa',
  'Av. Paulista',
  'Rua Pedro Celestino',
  'Rua Pernambuco',
  'Rua Piratininga',
  'Rua Quatorze de Julho',
  'Rua Quinze de Novembro',
  'Av. Rachid Neder',
  'Rua Rio Grande do Sul',
  'Rua Rui Barbosa',
  'Rua Santana',
  'Rua Sergipe',
  'Rua Spipe Calarge',
  'Av. Tamandaré',
  'Rua Treze de Maio',
  'Av. Três Barras',
  'Rua Uruguaiana',
  'Rua Vinte e Cinco de Março',
  'Rua Vitória',
  'Rua Voluntários da Pátria',
  'Rua Xavier de Toledo',
  'Rua Ypiranga',
  'Av. Zulamith Bitencourt',
]

const PREFIX_REGEX = /^(rua|r\.|r|avenida|av\.|av|alameda|al\.|al|travessa|tv\.|tv|praça|praca|pç\.|pc\.|estrada|est\.|rodovia|rod\.)\s+/i

export function stripStreetPrefix(street: string): string {
  return (street || '').trim().replace(PREFIX_REGEX, '').trim()
}

export function normalizeStreetForMatch(street?: string | null): string {
  if (!street) return ''
  return stripStreetPrefix(street)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ph/g, 'f')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getStreetInitialLetter(street: string): string {
  const clean = stripStreetPrefix(street)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
  const first = clean.charAt(0)
  return /^[A-Z]$/.test(first) ? first : '#'
}

export function streetsMatch(storeStreet?: string | null, filterStreet?: string | null): boolean {
  const a = normalizeStreetForMatch(storeStreet)
  const b = normalizeStreetForMatch(filterStreet)
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

export function mergeAndGroupStreetsByLetter(extraStreets: string[] = []): Record<string, string[]> {
  const uniqueMap = new Map<string, string>()

  for (const st of [...extraStreets, ...COMMERCIAL_STREETS]) {
    const trimmed = (st || '').trim()
    if (!trimmed) continue
    const norm = normalizeStreetForMatch(trimmed)
    if (!norm) continue
    if (!uniqueMap.has(norm)) {
      uniqueMap.set(norm, trimmed)
    }
  }

  const grouped: Record<string, string[]> = {}
  for (const letter of ALPHABET) {
    grouped[letter] = []
  }

  for (const streetName of uniqueMap.values()) {
    const letter = getStreetInitialLetter(streetName)
    if (grouped[letter]) {
      grouped[letter].push(streetName)
    }
  }

  for (const letter of ALPHABET) {
    grouped[letter].sort((a, b) =>
      stripStreetPrefix(a).localeCompare(stripStreetPrefix(b), 'pt-BR', { sensitivity: 'base' })
    )
  }

  return grouped
}

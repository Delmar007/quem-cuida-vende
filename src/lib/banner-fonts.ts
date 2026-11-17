export interface BannerFontItem {
  name: string
  category: 'caixa_alta' | 'caixa_baixa'
  styleHint: string
}

// 100 fontes focadas em títulos de impacto / Caixa Alta
export const UPPERCASE_FONTS: string[] = [
  'Bebas Neue', 'Anton', 'Oswald', 'Montserrat', 'Poppins', 'Raleway', 'Roboto Condensed',
  'Barlow Condensed', 'Teko', 'Russo One', 'Black Ops One', 'Bangers', 'Righteous',
  'Alfa Slab One', 'Archivo Black', 'Rubik Mono One', 'Ultra', 'Titan One', 'Bungee',
  'Staatliches', 'Fjalla One', 'Francois One', 'Passion One', 'Bowlby One SC', 'Changa One',
  'Concert One', 'Fugaz One', 'Graduate', 'Hammersmith One', 'Jockey One', 'Koulen',
  'Lalezar', 'Lilita One', 'Luckiest Guy', 'Modak', 'Monoton', 'Orbitron', 'Oxanium',
  'Paytone One', 'Permanent Marker', 'Play', 'Press Start 2P', 'Prompt', 'Quantico',
  'Rammetto One', 'Road Rage', 'Rowdies', 'Rubik', 'Saira Condensed', 'Secular One',
  'Seymour One', 'Shrikhand', 'Sigmar One', 'Six Caps', 'Sora', 'Space Grotesk',
  'Squada One', 'Syne', 'Syncopate', 'Teko', 'Tourney', 'Trade Winds', 'Unbounded',
  'Viga', 'Wallpoet', 'Yanone Kaffeesatz', 'Zilla Slab Highlight', 'Abril Fatface',
  'Acme', 'Alata', 'Aldrich', 'Alegreya Sans SC', 'Alexandria', 'Allerta Stencil',
  'Amatic SC', 'Antonio', 'Archivo', 'Arvo', 'Asap Condensed', 'Audiowide',
  'B612 Mono', 'Bahiana', 'Bahianita', 'Bai Jamjuree', 'Balsamiq Sans', 'Barrio',
  'Big Shoulders Display', 'Big Shoulders Stencil Display', 'Bitter', 'Black Han Sans',
  'Boogaloo', 'Bungee Inline', 'Bungee Shade', 'Cabin Condensed', 'Carter One', 'Coda',
  'Contrail One', 'Cormorant SC', 'Chakra Petch', 'Cinzel',
]

// 100 fontes focadas em leitura fluida, editorial e manuscrita / Caixa Baixa
export const LOWERCASE_FONTS: string[] = [
  'Inter', 'Open Sans', 'Lato', 'Roboto', 'Nunito', 'DM Sans', 'Plus Jakarta Sans',
  'Work Sans', 'Quicksand', 'Mulish', 'Manrope', 'Figtree', 'Outfit', 'Urbanist',
  'Josefin Sans', 'Karla', 'Rubik', 'Cabin', 'Source Sans 3', 'PT Sans',
  'Noto Sans', 'Merriweather', 'Playfair Display', 'Lora', 'Libre Baskerville',
  'Cormorant Garamond', 'Crimson Text', 'EB Garamond', 'Baskervville', 'Spectral',
  'Dancing Script', 'Pacifico', 'Caveat', 'Satisfy', 'Great Vibes', 'Sacramento',
  'Lobster', 'Courgette', 'Kaushan Script', 'Yellowtail', 'Cookie', 'Allura',
  'Alex Brush', 'Parisienne', 'Tangerine', 'Marck Script', 'Bad Script', 'Homemade Apple',
  'Indie Flower', 'Shadows Into Light', 'Patrick Hand', 'Kalam', 'Architects Daughter',
  'Gloria Hallelujah', 'Reenie Beanie', 'Nothing You Could Do', 'Covered By Your Grace',
  'Handlee', 'Neucha', 'Annie Use Your Telescope', 'Coming Soon', 'Crafty Girls',
  'Delius', 'Dekko', 'Gochi Hand', 'Just Another Hand', 'Leckerli One', 'Merienda',
  'Niconne', 'Norican', 'Oleo Script', 'Pangolin', 'Pinyon Script', 'Playball',
  'Rochester', 'Rouge Script', 'Short Stack', 'Sofia', 'Sriracha', 'Sue Ellen Francisco',
  'Vibur', 'Waiting for the Sunrise', 'Walter Turncoat', 'Zeyada', 'Comfortaa',
  'Varela Round', 'Fredoka', 'Baloo 2', 'Sniglet', 'Mali', 'Itim', 'Chilanka',
  'Nunito Sans', 'Hind', 'Heebo', 'Kanit', 'Lexend', 'Overpass', 'Signika', 'Titillium Web',
]

// Deduplicar garantindo exatamente 100 em cada lista
export const BANNER_FONTS_CAIXA_ALTA: BannerFontItem[] = Array.from(new Set(UPPERCASE_FONTS))
  .slice(0, 100)
  .map((name) => ({ name, category: 'caixa_alta', styleHint: 'Caixa Alta' }))

export const BANNER_FONTS_CAIXA_BAIXA: BannerFontItem[] = Array.from(new Set(LOWERCASE_FONTS))
  .slice(0, 100)
  .map((name) => ({ name, category: 'caixa_baixa', styleHint: 'Caixa Baixa' }))

const loadedFontFamilies = new Set<string>()

export function loadGoogleFontBatch(fontNames: string[]) {
  if (typeof document === 'undefined') return
  const toLoad = fontNames.filter((name) => name && !loadedFontFamilies.has(name))
  if (toLoad.length === 0) return

  // Carrega em lotes de até 25 fontes por tag <link> para não exceder limite de URL
  const chunkSize = 25
  for (let i = 0; i < toLoad.length; i += chunkSize) {
    const chunk = toLoad.slice(i, i + chunkSize)
    chunk.forEach((n) => loadedFontFamilies.add(n))
    const familiesParam = chunk
      .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;600;700`)
      .join('&')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${familiesParam}&display=swap`
    document.head.appendChild(link)
  }
}

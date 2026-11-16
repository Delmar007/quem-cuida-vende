export type BannerDirection =
  | 'top-to-bottom'
  | 'bottom-to-top'
  | 'left-to-right'
  | 'right-to-left'

export type GoldOrderMode = 'random' | 'arrival'

export type SiteBannerFrequency = 5 | 10

export interface SiteBannerItem {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  targetUrl: string
  frequency: SiteBannerFrequency
  isActive: boolean
  createdAt: string
}

export interface AdminBannerConfig {
  intervalSeconds: number
  direction: BannerDirection
  goldOrderMode: GoldOrderMode
  siteBanners: SiteBannerItem[]
  hideDemoCatalog?: boolean
  updatedAt?: string
}

export const DEFAULT_ADMIN_BANNER_CONFIG: AdminBannerConfig = {
  intervalSeconds: 7,
  direction: 'right-to-left',
  goldOrderMode: 'arrival',
  siteBanners: [],
  hideDemoCatalog: false,
}

export function normalizeBannerConfig(raw?: Partial<AdminBannerConfig> | null): AdminBannerConfig {
  const interval = Number(raw?.intervalSeconds)
  const clampedInterval = Number.isFinite(interval) ? Math.min(15, Math.max(5, Math.round(interval))) : 7

  const validDirections: BannerDirection[] = [
    'top-to-bottom',
    'bottom-to-top',
    'left-to-right',
    'right-to-left',
  ]
  const direction = validDirections.includes(raw?.direction as BannerDirection)
    ? (raw!.direction as BannerDirection)
    : 'right-to-left'

  const goldOrderMode: GoldOrderMode =
    raw?.goldOrderMode === 'random' ? 'random' : 'arrival'

  const siteBanners: SiteBannerItem[] = Array.isArray(raw?.siteBanners)
    ? raw!.siteBanners
        .filter((b) => b && typeof b.imageUrl === 'string' && b.imageUrl.trim().length > 0)
        .map((b) => ({
          id: String(b.id || `sb_${Date.now()}`),
          title: String(b.title || 'Banner do Site'),
          subtitle: b.subtitle ? String(b.subtitle) : '',
          imageUrl: String(b.imageUrl),
          targetUrl: String(b.targetUrl || '/'),
          frequency: Number(b.frequency) === 10 ? 10 : 5,
          isActive: b.isActive !== false,
          createdAt: String(b.createdAt || new Date().toISOString()),
        }))
    : []

  return {
    intervalSeconds: clampedInterval,
    direction,
    goldOrderMode,
    siteBanners,
    hideDemoCatalog: Boolean(raw?.hideDemoCatalog),
    updatedAt: raw?.updatedAt,
  }
}

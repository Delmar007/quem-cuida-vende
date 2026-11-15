'use server'

import { revalidatePath } from 'next/cache'
import {
  AdminBannerConfig,
  getAdminBannerConfigServer,
  saveAdminBannerConfigServer,
} from '@/lib/admin-banners-storage'

export async function verifyAdminPasswordAction(password: string): Promise<{ ok: boolean }> {
  const expected = process.env.ADMIN_PASSWORD || 'admin123'
  return { ok: password.trim() === expected }
}

export async function getAdminBannerConfigAction(): Promise<AdminBannerConfig> {
  return getAdminBannerConfigServer()
}

export async function saveAdminBannerConfigAction(
  config: AdminBannerConfig
): Promise<{ success: boolean; config: AdminBannerConfig }> {
  const saved = saveAdminBannerConfigServer(config)
  try {
    revalidatePath('/')
    revalidatePath('/admin')
  } catch {
    // ignore outside request context
  }
  return { success: true, config: saved }
}

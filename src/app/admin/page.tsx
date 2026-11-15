import React from 'react'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLocalStores } from '@/lib/stores-storage'
import { getAdminBannerConfigServer } from '@/lib/admin-banners-storage'
import AdminDashboardClient, {
  AdminGoldStoreSummary,
} from '@/components/admin/AdminDashboardClient'

export default async function AdminPage() {
  await connection()

  const initialConfig = getAdminBannerConfigServer()
  let goldStores: AdminGoldStoreSummary[] = []

  try {
    const supabase = await createClient()
    const { data: dbStores } = await supabase
      .from('stores')
      .select('id, name, slug, plan, large_banner_url, small_banner_url, created_at')
      .in('plan', ['ouro', 'auto_100'])
      .order('created_at', { ascending: true })

    if (dbStores && dbStores.length > 0) {
      goldStores = dbStores
    }
  } catch {
    // fallback local
  }

  if (goldStores.length === 0) {
    goldStores = getLocalStores()
      .filter((s) => ['ouro', 'auto_100'].includes((s.plan || '').toLowerCase()))
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        plan: s.plan,
        large_banner_url: s.large_banner_url,
        small_banner_url: s.small_banner_url,
        created_at: s.created_at,
      }))
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <AdminDashboardClient initialConfig={initialConfig} goldStores={goldStores} />
    </main>
  )
}

import { NextResponse } from 'next/server'
import { recordWhatsappClickServer } from '@/lib/whatsapp-clicks-storage'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const storeId = typeof body?.storeId === 'string' ? body.storeId.trim() : ''
    const productId = typeof body?.productId === 'string' ? body.productId.trim() : null

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
    }

    await recordWhatsappClickServer({ storeId, productId })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

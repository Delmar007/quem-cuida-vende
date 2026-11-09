import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET `/api/feed`
 * Returns a list of promotions from stores followed by the authenticated user.
 * Query params:
 *   - `cursor` (optional) – ISO timestamp of the last item from previous page for pagination.
 *   - `limit` (optional) – number of items to return (default 20, max 50).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50);
  const cursor = url.searchParams.get('cursor'); // ISO string or null

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // 1️⃣ Get the store IDs the user follows
  const { data: follows, error: followsError } = await supabase
    .from('user_follows')
    .select('store_id')
    .eq('user_id', user.id);

  if (followsError) {
    return NextResponse.json({ error: followsError.message }, { status: 500 });
  }

  const storeIds = follows?.map((f: any) => f.store_id) ?? [];
  if (storeIds.length === 0) {
    return NextResponse.json({ promotions: [] });
  }

  // 2️⃣ Query promotions from those stores, newest first
  let query = supabase
    .from('promotions')
    .select(`id, store_id, title, description, image_url, price_original, price_promotional, start_at, end_at, type, created_at, stores (name, logo_url)`)
    .in('store_id', storeIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    // Fetch items newer than cursor (cursor is ISO of last fetched item)
    query = query.gt('created_at', cursor);
  }

  const { data: promotions, error: promoError } = await query;
  if (promoError) {
    return NextResponse.json({ error: promoError.message }, { status: 500 });
  }

  return NextResponse.json({ promotions });
}

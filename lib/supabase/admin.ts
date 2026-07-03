// Service-role Supabase client — bypasses RLS. SERVER-ONLY.
// After the M8 RLS hardening, service-role is retained ONLY where the operation is
// genuinely privileged and no RLS policy can (or should) cover it:
//   - app/api/admin/upload/route.ts        — Storage upload (bypasses Storage RLS)
//   - app/api/admin/auth/signup            — auth session + profile provisioning
//   - app/api/admin/managers/**            — cross-profile user mgmt + auth.admin.deleteUser
//   - lib/search/indexer.ts                — reads search_source / writes search_index
//                                            (both service_role-only grants)
// All content CRUD (projects, items, brands, categories, tags, photos, home-settings)
// now runs through lib/supabase/server.ts (the cookie-bound RLS client), giving
// defense-in-depth: requireRole in the app AND has_role()-gated policies in the DB.
//
// Instantiated lazily: `next build` imports route modules during page-data
// collection, so constructing the client at import time would require
// SUPABASE_SERVICE_ROLE_KEY to be present at build. The key is only needed when
// a request is actually served, so we defer createClient to first use and keep
// the `supabaseAdmin.from(...)` call surface unchanged via a Proxy.
import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

let client: SupabaseClient<Database> | null = null

function getClient(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
  }
  return client
}

export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const c = getClient()
    const value = Reflect.get(c, prop, c)
    return typeof value === 'function' ? value.bind(c) : value
  },
})

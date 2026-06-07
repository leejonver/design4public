// Service-role Supabase client — bypasses RLS. SERVER-ONLY.
// renewal_requirements.md §3/§6-1: use is restricted to operations that genuinely need it
// (Storage uploads, master-only privileged writes after server-side role checks).
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

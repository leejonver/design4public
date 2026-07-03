// scripts/postprocess-types.mjs
// Re-applies the two customizations `supabase gen types` cannot emit, so
// `npm run gen:types` yields a committable lib/database.types.ts in one step:
//   1. profiles.role / profiles.status narrowed from `string` (plain text
//      columns, which gen:types widens) to the app enums.
//   2. Six enum alias exports appended — the single source of truth that
//      lib/admin-types.ts and the API routes import.
// Idempotent: gen:types overwrites the whole file, so this runs right after it.
// Preconditions: run gen:types against a fully-migrated local DB (supabase db
// reset first) so real columns like photos.ai_caption are already present.
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'lib/database.types.ts'
const ALIASES = `
export type UserRole = 'master' | 'admin' | 'content_manager'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ProjectStatus = 'draft' | 'published' | 'hidden'
export type ItemStatus = 'available' | 'discontinued' | 'hidden'
export type BrandStatus = 'visible' | 'hidden'
export type CategoryType = 'project' | 'item'
`

let src = readFileSync(FILE, 'utf8')

// (1) Narrow role/status ONLY inside the `profiles:` table block. Other tables
// (brands/items/projects) also expose a `status: string`, so a global replace
// would corrupt them — scope to the profiles block (opened at 6-space indent,
// closed by its matching 6-space `}`; the inner Row/Insert/Update braces are
// 8-space indented and do not match `\n {6}\}`).
const before = src
src = src.replace(/(^ {6}profiles: \{[\s\S]*?\n {6}\})/m, (block) =>
  block
    .replace(/role: string/g, 'role: UserRole')
    .replace(/role\?: string/g, 'role?: UserRole')
    .replace(/status: string/g, 'status: ApprovalStatus')
    .replace(/status\?: string/g, 'status?: ApprovalStatus'),
)
if (src === before && !src.includes('role: UserRole')) {
  console.error('[postprocess-types] profiles block not found — schema shape changed; aborting.')
  process.exit(1)
}

// (2) Append the enum aliases once (TS type aliases are hoisted, so forward
// references from the profiles block above are fine).
if (!src.includes('export type UserRole =')) {
  src = src.replace(/\s*$/, '\n') + ALIASES
}

writeFileSync(FILE, src)
console.log('[postprocess-types] applied profiles narrowing + enum aliases')

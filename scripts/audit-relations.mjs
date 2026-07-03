// Read-only relations audit: compares the legacy DIRECT project↔item model
// (project_items) against the DERIVED model (project → project_photos →
// photo_items → item), reports per-project retagging progress, and flags
// orphan/integrity issues. Works against any Postgres URL via DATABASE_URL
// (local E2E stack or, read-only, production). NEVER writes.
//
// Usage:
//   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
//     node scripts/audit-relations.mjs
//   (falls back to DATABASE_URL in .env.local when the env var is unset)
import { readFileSync } from 'node:fs'
import pg from 'pg'

export function pairKey(p) {
  return `${p.project_id}::${p.item_id}`
}

/** Direct pairs that have no derived counterpart (still need retagging). */
export function missingDerived(direct, derived) {
  const derivedKeys = new Set(derived.map(pairKey))
  return direct.filter((p) => !derivedKeys.has(pairKey(p)))
}

/** Per-project { total, covered, missing } counts of direct pairs vs derived. */
export function perProjectProgress(direct, derived) {
  const derivedKeys = new Set(derived.map(pairKey))
  const byProject = new Map()
  for (const p of direct) {
    const row = byProject.get(p.project_id) ?? { project_id: p.project_id, total: 0, covered: 0, missing: 0 }
    row.total += 1
    if (derivedKeys.has(pairKey(p))) row.covered += 1
    else row.missing += 1
    byProject.set(p.project_id, row)
  }
  return [...byProject.values()]
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    return readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((l) => l.startsWith('DATABASE_URL='))
      ?.slice('DATABASE_URL='.length)
      .replace(/^['"]|['"]$/g, '')
  } catch {
    return undefined
  }
}

async function main() {
  const url = resolveDatabaseUrl()
  if (!url) {
    console.error('DATABASE_URL not set (env or .env.local)')
    process.exit(1)
  }
  const isLocal = url.includes('127.0.0.1') || url.includes('localhost')
  const client = new pg.Client({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })
  await client.connect()
  try {
    const direct = (await client.query('select project_id, item_id from project_items')).rows
    const derived = (
      await client.query(
        'select distinct pp.project_id, pi.item_id from project_photos pp join photo_items pi on pi.photo_id = pp.photo_id',
      )
    ).rows

    const missing = missingDerived(direct, derived)
    const progress = perProjectProgress(direct, derived).sort((a, b) => b.missing - a.missing)

    const orphanPhotos = (
      await client.query(
        `select count(*)::int n from photos p
           where not exists (select 1 from project_photos pp where pp.photo_id = p.id)
             and not exists (select 1 from photo_items pi where pi.photo_id = p.id)`,
      )
    ).rows[0].n
    const brandlessItems = (
      await client.query('select count(*)::int n from items where brand_id is null')
    ).rows[0].n
    const publishedNoMain = (
      await client.query(
        `select count(*)::int n from projects pr
           where pr.status = 'published'
             and not exists (select 1 from project_photos pp where pp.project_id = pr.id and pp.is_main)`,
      )
    ).rows[0].n

    console.log('=== project↔item relation audit ===')
    console.log(`direct pairs (project_items):      ${direct.length}`)
    console.log(`derived pairs (photo→item):        ${derived.length}`)
    console.log(`direct WITHOUT derived (retag):    ${missing.length}`)
    console.log(`fully migrated (direct ⊆ derived): ${missing.length === 0 ? 'YES' : 'NO'}`)
    console.log('\n--- per-project retagging progress (worst first) ---')
    for (const r of progress) {
      console.log(`  ${r.project_id}  ${r.covered}/${r.total} covered  (${r.missing} to retag)`)
    }
    console.log('\n--- integrity checks ---')
    console.log(`orphan photos (no project & no item):     ${orphanPhotos}`)
    console.log(`items without a brand:                    ${brandlessItems}`)
    console.log(`published projects without a main photo:  ${publishedNoMain}`)
  } finally {
    await client.end()
  }
}

// Only hit the DB when run directly, so tests can import the pure helpers.
if (process.argv[1] && process.argv[1].endsWith('audit-relations.mjs')) {
  main().catch((e) => {
    console.error(e)
    process.exit(2)
  })
}

// Apply a SQL migration file to the database in DATABASE_URL, with before/after snapshots.
// Usage: node scripts/run-migration.mjs migrations/019_unify_image_model_and_constraints.sql
import { readFileSync } from 'node:fs'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/run-migration.mjs <path-to-sql>')
  process.exit(1)
}

const url = readFileSync('.env.local', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .replace(/^['"]|['"]$/g, '')

if (!url) {
  console.error('DATABASE_URL not found in .env.local')
  process.exit(1)
}

const SNAPSHOT = `select
  (select count(*) from projects) projects,
  (select count(*) from items) items,
  (select count(*) from brands) brands,
  (select count(*) from photos) photos,
  (select count(*) from tags) tags,
  (select count(*) from profiles) profiles,
  (select count(*) from project_photos) project_photos,
  (select count(*) from photo_items) photo_items,
  (select count(*) from project_items) project_items,
  (select count(*) from project_tags) project_tags,
  (select count(*) from item_tags) item_tags,
  (select count(*) from project_photos where is_main) proj_main,
  (select count(distinct project_id) from project_photos) proj_with_photos`

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

try {
  await client.connect()
  const before = (await client.query(SNAPSHOT)).rows[0]
  console.log('BEFORE:', JSON.stringify(before))

  const sql = readFileSync(file, 'utf8')
  console.log(`\napplying ${file} ...`)
  await client.query(sql)
  console.log('applied OK (committed)\n')

  const after = (await client.query(SNAPSHOT)).rows[0]
  console.log('AFTER :', JSON.stringify(after))
  await client.end()
} catch (e) {
  console.error('\nMIGRATION FAILED (transaction rolled back):', e.message)
  await client.end().catch(() => {})
  process.exit(2)
}

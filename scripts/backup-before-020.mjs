// Full restorable backup of everything migration 020 drops, taken BEFORE applying 020.
// - In-DB copies under schema `backup_020` (exact rows, instantly restorable).
// - View + function definitions dumped to migrations/backup_020_definitions.sql.
import { readFileSync, writeFileSync } from 'node:fs'
import pg from 'pg'

const url = readFileSync('.env.local', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .replace(/^['"]|['"]$/g, '')

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()

await c.query('CREATE SCHEMA IF NOT EXISTS backup_020')

const copies = [
  ['project_images', 'select * from public.project_images'],
  ['item_images', 'select * from public.item_images'],
  ['image_tags', 'select * from public.image_tags'],
  ['projects_cover', "select id, cover_image_url from public.projects where cover_image_url is not null"],
  ['items_image', "select id, image_url from public.items where image_url is not null"],
]

const report = {}
for (const [name, sel] of copies) {
  await c.query(`DROP TABLE IF EXISTS backup_020.${name}`)
  await c.query(`CREATE TABLE backup_020.${name} AS ${sel}`)
  const { rows } = await c.query(`select count(*) c from backup_020.${name}`)
  report[name] = Number(rows[0].c)
}

// dump view + function definitions to a file for off-DB safety
let defs = '-- Definitions backed up before migration 020 (for manual restore if ever needed).\n\n'
const vd = await c.query("select pg_get_viewdef('public.projects_with_details'::regclass, true) def")
  .catch(() => ({ rows: [] }))
if (vd.rows[0]?.def) {
  defs += '-- View: projects_with_details\nCREATE OR REPLACE VIEW public.projects_with_details AS\n' + vd.rows[0].def + '\n\n'
}
const fd = await c.query(
  "select pg_get_functiondef(oid) def from pg_proc where proname='create_project_with_relations' limit 1",
).catch(() => ({ rows: [] }))
if (fd.rows[0]?.def) {
  defs += '-- Function: create_project_with_relations\n' + fd.rows[0].def + ';\n'
}
writeFileSync('migrations/backup_020_definitions.sql', defs)

await c.end()
console.log('backup_020 row counts:', JSON.stringify(report))
console.log('definitions dumped to migrations/backup_020_definitions.sql')

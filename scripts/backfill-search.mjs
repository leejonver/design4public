// Backfill/refresh the search_index embeddings from search_source (spec §7).
// Env-driven, batched, resumable. Runs against ANY Postgres via DATABASE_URL
// (local E2E stack or, at the M7 gate, production). Requires OPENAI_API_KEY to
// generate embeddings; without it, rows are (re)written with a NULL embedding
// (trigram still works). Idempotent.
//
// Usage:
//   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
//   OPENAI_API_KEY=sk-... node scripts/backfill-search.mjs
//   Flags: --all  (re-embed every row, not just rows missing an embedding)
import { readFileSync } from 'node:fs'
import pg from 'pg'

const BATCH = 64
const MODEL = 'text-embedding-3-small'

function fromEnvFile(key) {
  try {
    return readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${key}=`))
      ?.slice(key.length + 1)
      .replace(/^['"]|['"]$/g, '')
  } catch {
    return undefined
  }
}

async function embedBatch(texts, apiKey) {
  if (!apiKey) return texts.map(() => null)
  const input = texts.map((t) => (t ?? '').replace(/\s+/g, ' ').trim() || ' ')
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, input }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return texts.map((_, i) => json.data[i]?.embedding ?? null)
}

async function main() {
  const url = process.env.DATABASE_URL || fromEnvFile('DATABASE_URL')
  const apiKey = process.env.OPENAI_API_KEY || fromEnvFile('OPENAI_API_KEY')
  const reembedAll = process.argv.includes('--all')
  if (!url) {
    console.error('DATABASE_URL not set (env or .env.local)')
    process.exit(1)
  }
  if (!apiKey) {
    console.warn('[backfill] OPENAI_API_KEY missing — writing rows with NULL embeddings.')
  }

  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    // Upsert every current search_source row into search_index (text/slug/image
    // fresh), leaving embedding untouched for existing rows. This also removes
    // no-longer-public rows so the index matches search_source exactly.
    await client.query(`
      delete from public.search_index si
      where not exists (
        select 1 from public.search_source ss
        where ss.entity_type = si.entity_type and ss.entity_id = si.entity_id
      );
    `)
    await client.query(`
      insert into public.search_index (entity_type, entity_id, slug, title, body, image_url, embedding)
      select entity_type, entity_id, slug, title, body, image_url, null
      from public.search_source
      on conflict (entity_type, entity_id) do update
        set slug = excluded.slug,
            title = excluded.title,
            body = excluded.body,
            image_url = excluded.image_url,
            updated_at = now();
    `)

    // Select rows needing an embedding.
    const where = reembedAll ? '' : 'where embedding is null'
    const { rows } = await client.query(
      `select id, title, body from public.search_index ${where} order by entity_type, id`,
    )
    console.log(`[backfill] ${rows.length} row(s) to embed (${reembedAll ? 'all' : 'missing only'}).`)

    let done = 0
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH)
      const embeddings = await embedBatch(
        chunk.map((r) => `${r.title}\n${r.body}`),
        apiKey,
      )
      // Resumable: each batch is committed before the next, so a crash resumes
      // from the first still-NULL row on the next run.
      for (let j = 0; j < chunk.length; j += 1) {
        const emb = embeddings[j]
        if (!emb) continue
        await client.query('update public.search_index set embedding = $1, updated_at = now() where id = $2', [
          JSON.stringify(emb),
          chunk[j].id,
        ])
      }
      done += chunk.length
      console.log(`[backfill] embedded ${done}/${rows.length}`)
    }
    console.log('[backfill] done.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('[backfill] failed:', err)
  process.exit(1)
})

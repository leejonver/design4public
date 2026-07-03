// Backfill photos.ai_caption with GPT-4o-mini vision descriptions (spec §7 image
// search). Env-driven, resumable, rate-limit-aware. Runs against ANY Postgres via
// DATABASE_URL (local E2E stack or, at the M7 gate, production). Requires
// OPENAI_API_KEY — without it there is nothing to generate, so it exits 0.
// Idempotent: only photos with a NULL ai_caption are processed unless --all.
//
// Run this BEFORE scripts/backfill-search.mjs --all so the re-embed sees the
// caption-enriched search_source body.
//
// Usage:
//   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
//   OPENAI_API_KEY=sk-... node scripts/backfill-captions.mjs
//   Flags: --all  (re-caption every photo, not just NULL ai_caption)
import { readFileSync } from 'node:fs'
import pg from 'pg'

const MODEL = 'gpt-4o-mini'
const PROMPT = [
  '이 인테리어/공간 사진을 한국어로 검색에 활용할 수 있게 묘사해줘.',
  '다음을 한 문단으로: 공간 유형(예: 오피스 라운지, 주방), 보이는 가구·조명·오브제,',
  '주요 마감재(우드/메탈/패브릭/석재 등), 색감, 전체 스타일(모던/미니멀/인더스트리얼 등).',
  '추측성 브랜드명은 넣지 말고 보이는 것만. 80~120자 이내, 마침표로 끝맺기.',
].join(' ')

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// OpenAI fetches image_url server-side, so localhost / *.local URLs (local
// Supabase storage) are unreachable — skip them to avoid billed dead calls.
function isPubliclyFetchable(url) {
  try {
    const host = new URL(url).hostname
    return !(
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local')
    )
  } catch {
    return false
  }
}

// Single-photo caption with retry/backoff on 429/5xx. Returns null on give-up so
// the row stays NULL and is retried on the next run (resumable).
async function describe(imageUrl, apiKey) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
    })
    if (res.ok) {
      const json = await res.json()
      const text = json.choices?.[0]?.message?.content
      return typeof text === 'string' && text.trim() ? text.trim() : null
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = 1000 * 2 ** attempt // 1s, 2s, 4s, 8s
      console.warn(`[captions] ${res.status} — backoff ${wait}ms`)
      await sleep(wait)
      continue
    }
    console.error(`[captions] OpenAI ${res.status}: ${await res.text().catch(() => '')}`)
    return null
  }
  return null
}

async function main() {
  const url = process.env.DATABASE_URL || fromEnvFile('DATABASE_URL')
  const apiKey = process.env.OPENAI_API_KEY || fromEnvFile('OPENAI_API_KEY')
  const recaptionAll = process.argv.includes('--all')
  if (!url) {
    console.error('DATABASE_URL not set (env or .env.local)')
    process.exit(1)
  }
  if (!apiKey) {
    console.warn('[captions] OPENAI_API_KEY missing — nothing to generate. Exiting.')
    return
  }

  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    const where = recaptionAll ? '' : 'where ai_caption is null'
    const { rows } = await client.query(
      `select id, image_url from public.photos ${where} order by created_at asc, id`,
    )
    console.log(`[captions] ${rows.length} photo(s) to caption (${recaptionAll ? 'all' : 'missing only'}).`)

    let done = 0
    let filled = 0
    let skippedLocal = 0
    for (const row of rows) {
      if (row.image_url && !isPubliclyFetchable(row.image_url)) {
        skippedLocal += 1
        continue
      }
      const caption = row.image_url ? await describe(row.image_url, apiKey) : null
      if (caption) {
        // Committed per-photo → a crash resumes from the first still-NULL row.
        await client.query(
          'update public.photos set ai_caption = $1, ai_caption_model = $2, updated_at = now() where id = $3',
          [caption, MODEL, row.id],
        )
        filled += 1
      }
      done += 1
      if (done % 10 === 0 || done === rows.length) {
        console.log(`[captions] processed ${done}/${rows.length} (captioned ${filled})`)
      }
      await sleep(200) // gentle pacing to stay under rate limits
    }
    console.log(`[captions] done, ${skippedLocal} skipped (non-public image URL). Now run: node scripts/backfill-search.mjs --all`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('[captions] failed:', err)
  process.exit(1)
})

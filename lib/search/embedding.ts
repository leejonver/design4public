// OpenAI text embeddings for hybrid search (spec §7). Graceful by contract:
// returns null (per input) whenever OPENAI_API_KEY is absent or the call fails,
// so the caller falls back to trigram-only search. No SDK dependency — a single
// fetch keeps the bundle lean and works in both Node routes and the mjs backfill.
export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIM = 1536

const ENDPOINT = 'https://api.openai.com/v1/embeddings'

/** Embed a batch. Result is index-aligned with `texts`; all-null on no-key/failure. */
export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  const key = process.env.OPENAI_API_KEY
  if (!key || texts.length === 0) return texts.map(() => null)

  // OpenAI rejects empty strings; collapse newlines and guarantee non-empty input.
  const input = texts.map((t) => (t ?? '').replace(/\s+/g, ' ').trim() || ' ')

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
      // Never let Next's Data Cache store this response: a cached transient
      // failure (429/5xx → null) would silently pin that exact query to
      // trigram-only with no revalidation window to self-heal.
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('[embedding] OpenAI error', res.status, await res.text().catch(() => ''))
      return texts.map(() => null)
    }
    const json = (await res.json()) as { data?: { embedding: number[] }[] }
    const data = json.data ?? []
    // OpenAI returns embeddings in input order; map defensively by index.
    return texts.map((_, i) => data[i]?.embedding ?? null)
  } catch (err) {
    console.error('[embedding] fetch failed', err)
    return texts.map(() => null)
  }
}

/** Embed a single string. null on no-key/failure. */
export async function embedText(text: string): Promise<number[] | null> {
  const [first] = await embedBatch([text])
  return first ?? null
}

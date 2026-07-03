// GPT-4o-mini vision → a Korean visual caption for a photo (spec §7 image search).
// OpenAI has NO image-embedding endpoint, so we bridge image→text here and let the
// existing text-embedding-3-small pipeline (lib/search/embedding.ts) vectorize the
// caption. Graceful by contract: returns null whenever OPENAI_API_KEY is absent or
// the call fails, so indexing falls back to the human-entered photo text. No SDK —
// a single fetch keeps the bundle lean and works in Node routes and the mjs backfill.
export const VISION_MODEL = 'gpt-4o-mini'

const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

// One-shot instruction: a compact Korean description optimized for search recall,
// not prose. Enumerates the search-relevant facets so captions are consistent.
const PROMPT = [
  '이 인테리어/공간 사진을 한국어로 검색에 활용할 수 있게 묘사해줘.',
  '다음을 한 문단으로: 공간 유형(예: 오피스 라운지, 주방), 보이는 가구·조명·오브제,',
  '주요 마감재(우드/메탈/패브릭/석재 등), 색감, 전체 스타일(모던/미니멀/인더스트리얼 등).',
  '추측성 브랜드명은 넣지 말고 보이는 것만. 80~120자 이내, 마침표로 끝맺기.',
].join(' ')

/** Describe a photo for search. null on no-key/failure. Never throws. */
export async function describePhoto(imageUrl: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key || !imageUrl) return null

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              // detail:'low' downsamples to a flat ~85-token image cost — plenty for
              // a scene/material caption and keeps the whole-library backfill cheap.
              { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
      // Same rationale as embedding.ts: never let Next's Data Cache pin a transient
      // failure — a cached null would leave the photo permanently un-captioned.
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('[vision] OpenAI error', res.status, await res.text().catch(() => ''))
      return null
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = json.choices?.[0]?.message?.content
    return typeof text === 'string' && text.trim() ? text.trim() : null
  } catch (err) {
    console.error('[vision] fetch failed', err)
    return null
  }
}

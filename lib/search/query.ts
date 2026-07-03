// Shared hybrid-search read path (spec §7). Used by both /api/search (the header
// dropdown's JSON endpoint) and the /search server page. Uses the public anon
// client; RLS allows SELECT on search_index and EXECUTE on hybrid_search.
// Degrades to empty groups on any failure — never a 500.
import { supabase } from '@/lib/supabase/public'
import { embedText } from './embedding'

export type EntityType = 'project' | 'item' | 'photo' | 'brand'

export type SearchHit = {
  entityType: EntityType
  entityId: string
  slug: string | null
  title: string
  imageUrl: string | null
  href: string
}

export type SearchGroups = Record<EntityType, SearchHit[]>

const emptyGroups = (): SearchGroups => ({ project: [], item: [], brand: [], photo: [] })

export function hrefFor(entityType: EntityType, slug: string | null, entityId: string): string {
  switch (entityType) {
    case 'project':
      return `/projects/${slug}`
    case 'item':
      return `/items/${slug}`
    case 'brand':
      return `/brands/${slug}`
    case 'photo':
      return `/photos/${entityId}` // photos have no slug — routed by id
  }
}

type RpcRow = {
  entity_type: EntityType
  entity_id: string
  slug: string | null
  title: string
  image_url: string | null
  score: number
}

export function groupHits(rows: RpcRow[]): SearchGroups {
  const groups = emptyGroups()
  for (const r of rows) {
    groups[r.entity_type].push({
      entityType: r.entity_type,
      entityId: r.entity_id,
      slug: r.slug,
      title: r.title,
      imageUrl: r.image_url,
      href: hrefFor(r.entity_type, r.slug, r.entity_id),
    })
  }
  return groups
}

export async function hybridSearch(q: string): Promise<SearchGroups> {
  const query = q.trim()
  if (!query) return emptyGroups()

  const embedding = await embedText(query)
  // Generated Args type marks query_embedding as `string` (optional) — it doesn't
  // express that the underlying vector param accepts SQL NULL. Cast narrowly;
  // the RPC itself treats a null query_embedding as "skip the vector branch".
  const { data, error } = await supabase.rpc('hybrid_search', {
    query_text: query,
    query_embedding: embedding ? JSON.stringify(embedding) : null,
    match_limit: 24,
  } as unknown as { query_text: string; query_embedding?: string; match_limit?: number })

  if (error) {
    console.error('[search] hybrid_search rpc failed', error)
    return emptyGroups()
  }
  return groupHits((data ?? []) as unknown as RpcRow[])
}

// Write-path search indexing (spec §7). Reads the search_source view (the single
// composition source of truth) and upserts search_index with an OpenAI embedding.
// SERVER-ONLY (service-role). Best-effort by contract: NEVER throws — a reindex
// failure must not fail the originating admin mutation (same rule as
// lib/revalidation.ts). The backfill script corrects any missed/failed rows.
import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { embedText } from './embedding'

export type IndexEntityType = 'project' | 'item' | 'photo' | 'brand'

/** Remove an entity from the index (deleted, unpublished, or hidden). Never throws. */
export async function deleteFromIndex(type: IndexEntityType, id: string): Promise<void> {
  try {
    await supabaseAdmin.from('search_index').delete().eq('entity_type', type).eq('entity_id', id)
  } catch (err) {
    console.error('[search] deleteFromIndex failed', type, id, err)
  }
}

/**
 * Rebuild one entity's index row from search_source. If the entity is no longer
 * public (search_source returns nothing — e.g. a project moved to draft), the
 * stale index row is removed instead. Never throws.
 */
export async function reindexEntity(type: IndexEntityType, id: string): Promise<void> {
  try {
    const { data: row, error } = await supabaseAdmin
      .from('search_source')
      .select('entity_type, entity_id, slug, title, body, image_url')
      .eq('entity_type', type)
      .eq('entity_id', id)
      .maybeSingle()
    if (error) throw error

    if (!row) {
      await deleteFromIndex(type, id)
      return
    }
    // search_source's generated view type marks every column nullable, but a
    // returned row always has these populated (spec §7's composition query).
    const data = row as {
      entity_type: IndexEntityType
      entity_id: string
      slug: string | null
      title: string
      body: string
      image_url: string | null
    }

    const embedding = await embedText(`${data.title}\n${data.body}`)
    const { error: upsertError } = await supabaseAdmin.from('search_index').upsert(
      {
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        slug: data.slug,
        title: data.title,
        body: data.body,
        image_url: data.image_url,
        // pgvector text form '[...]'; JSON.stringify(number[]) === that form.
        embedding: embedding ? JSON.stringify(embedding) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'entity_type,entity_id' },
    )
    if (upsertError) throw upsertError
  } catch (err) {
    console.error('[search] reindexEntity failed', type, id, err)
  }
}

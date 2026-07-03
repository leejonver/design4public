// Write-path helpers for the single image-asset model (photos + join tables).
// renewal_requirements.md §5: project/item images are photos linked via join tables with
// is_main/order. These helpers find-or-create the photo asset (dedup by URL) and replace the
// parent's links, enforcing the "max one is_main per parent" invariant.
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

type Db = SupabaseClient<Database>

export interface ImageInput {
  url: string
  alt?: string | null
  title?: string | null
  isMain?: boolean
  itemIds?: string[]
}

/** Accepts uploaded image descriptors (or bare URL strings) or existing photo ids. */
export type PhotoRef = string | ImageInput | { photoId: string; isMain?: boolean; itemIds?: string[] }

/** Find-or-create a photo by URL; updates title/alt when provided (so per-photo titles persist). */
async function ensurePhotoId(
  db: Db,
  url: string,
  alt?: string | null,
  title?: string | null,
): Promise<string> {
  const { data: existing } = await db
    .from('photos')
    .select('id')
    .eq('image_url', url)
    .limit(1)
    .maybeSingle()
  if (existing) {
    if (title !== undefined || alt !== undefined) {
      const patch: { title?: string | null; alt_text?: string | null } = {}
      if (title !== undefined) patch.title = title
      if (alt !== undefined) patch.alt_text = alt
      await db.from('photos').update(patch).eq('id', existing.id)
    }
    return existing.id
  }
  const { data, error } = await db
    .from('photos')
    .insert({ image_url: url, alt_text: alt ?? null, title: title ?? null })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function resolvePhotoIds(
  db: Db,
  refs: PhotoRef[],
): Promise<{ photoId: string; isMain: boolean; itemIds?: string[] }[]> {
  const out: { photoId: string; isMain: boolean; itemIds?: string[] }[] = []
  for (let i = 0; i < refs.length; i += 1) {
    const ref = refs[i]
    if (typeof ref === 'string') {
      out.push({ photoId: await ensurePhotoId(db, ref), isMain: i === 0 })
    } else if ('photoId' in ref) {
      out.push({ photoId: ref.photoId, isMain: ref.isMain ?? i === 0, itemIds: ref.itemIds })
    } else {
      out.push({
        photoId: await ensurePhotoId(db, ref.url, ref.alt, ref.title),
        isMain: ref.isMain ?? i === 0,
        itemIds: ref.itemIds,
      })
    }
  }
  // enforce a single main
  let mainSeen = false
  for (const r of out) {
    if (r.isMain && !mainSeen) mainSeen = true
    else r.isMain = false
  }
  if (!mainSeen && out.length) out[0].isMain = true
  return out
}

/** Replaces a project's photo links with `refs` (order = array index). */
export async function syncProjectPhotos(
  db: Db,
  projectId: string,
  refs: PhotoRef[],
): Promise<void> {
  await db.from('project_photos').delete().eq('project_id', projectId)
  const resolved = await resolvePhotoIds(db, refs ?? [])
  if (!resolved.length) return
  const rows = resolved.map((r, i) => ({
    project_id: projectId,
    photo_id: r.photoId,
    is_main: r.isMain,
    order: i,
  }))
  const { error } = await db
    .from('project_photos')
    .upsert(rows, { onConflict: 'project_id,photo_id' })
  if (error) throw error

  // Derived project↔item model (spec §7-1): persist per-photo item tags.
  // Only photos whose ref carried an explicit itemIds array are (re)synced —
  // legacy callers omit the field, leaving existing photo_items untouched.
  for (const r of resolved) {
    if (r.itemIds !== undefined) await syncPhotoItems(db, r.photoId, r.itemIds)
  }
}

/** Replaces an item's photo links with `refs` (order = array index). */
export async function syncItemPhotos(db: Db, itemId: string, refs: PhotoRef[]): Promise<void> {
  await db.from('photo_items').delete().eq('item_id', itemId)
  const resolved = await resolvePhotoIds(db, refs ?? [])
  if (!resolved.length) return
  const rows = resolved.map((r, i) => ({
    item_id: itemId,
    photo_id: r.photoId,
    is_main: r.isMain,
    order: i,
  }))
  const { error } = await db
    .from('photo_items')
    .upsert(rows, { onConflict: 'photo_id,item_id' })
  if (error) throw error
}

/** Replaces a parent's tag links in a join table. */
/** Replaces a parent's CATEGORY links (typed classification) by category id. */
export async function syncCategories(
  db: Db,
  table: 'project_categories' | 'item_categories',
  fk: 'project_id' | 'item_id',
  parentId: string,
  categoryIds: string[],
): Promise<void> {
  await db.from(table).delete().eq(fk, parentId)
  if (!categoryIds?.length) return
  const rows = categoryIds.map((category_id) => ({ [fk]: parentId, category_id }))
  const { error } = await db.from(table).insert(rows as never)
  if (error) throw error
}

/** Find-or-create a free tag by name (names are UNIQUE). */
async function ensureTagId(db: Db, name: string): Promise<string | null> {
  const n = name.trim()
  if (!n) return null
  const { data: existing } = await db
    .from('tags')
    .select('id')
    .eq('name', n)
    .limit(1)
    .maybeSingle()
  if (existing) return existing.id
  const { data, error } = await db.from('tags').insert({ name: n }).select('id').single()
  if (error) {
    // unique-name race: re-fetch the winner
    const { data: again } = await db
      .from('tags')
      .select('id')
      .eq('name', n)
      .limit(1)
      .maybeSingle()
    return again?.id ?? null
  }
  return data.id
}

/** Replaces a parent's FREE-TAG links. Accepts tag NAMES (created on use). */
export async function syncFreeTags(
  db: Db,
  table: 'project_tags' | 'item_tags' | 'photo_tags',
  fk: 'project_id' | 'item_id' | 'photo_id',
  parentId: string,
  tagNames: string[],
): Promise<void> {
  await db.from(table).delete().eq(fk, parentId)
  if (!tagNames?.length) return
  const unique = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))]
  const ids = (await Promise.all(unique.map((n) => ensureTagId(db, n)))).filter(Boolean) as string[]
  if (!ids.length) return
  const rows = ids.map((tag_id) => ({ [fk]: parentId, tag_id }))
  const { error } = await db.from(table).insert(rows as never)
  if (error) throw error
}

/** Replaces a project's connected items. */
export async function syncProjectItems(db: Db, projectId: string, itemIds: string[]): Promise<void> {
  await db.from('project_items').delete().eq('project_id', projectId)
  if (!itemIds?.length) return
  const rows = itemIds.map((item_id) => ({ project_id: projectId, item_id }))
  const { error } = await db.from('project_items').insert(rows)
  if (error) throw error
}

/** Replaces a photo's connected items. */
export async function syncPhotoItems(db: Db, photoId: string, itemIds: string[]): Promise<void> {
  await db.from('photo_items').delete().eq('photo_id', photoId)
  if (!itemIds?.length) return
  const rows = itemIds.map((item_id, i) => ({
    photo_id: photoId,
    item_id,
    is_main: false,
    order: i,
  }))
  const { error } = await db.from('photo_items').insert(rows)
  if (error) throw error
}

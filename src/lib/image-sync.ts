// Write-path helpers for the single image-asset model (photos + join tables).
// renewal_requirements.md §5: project/item images are photos linked via join tables with
// is_main/order. These helpers find-or-create the photo asset (dedup by URL) and replace the
// parent's links, enforcing the "max one is_main per parent" invariant.
import 'server-only'
import { supabaseAdmin } from './supabase-admin'

export interface ImageInput {
  url: string
  alt?: string | null
  isMain?: boolean
}

/** Accepts uploaded image descriptors (or bare URL strings) or existing photo ids. */
export type PhotoRef = string | ImageInput | { photoId: string; isMain?: boolean }

async function ensurePhotoId(url: string, alt?: string | null): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('photos')
    .select('id')
    .eq('image_url', url)
    .limit(1)
    .maybeSingle()
  if (existing) return existing.id
  const { data, error } = await supabaseAdmin
    .from('photos')
    .insert({ image_url: url, alt_text: alt ?? null })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function resolvePhotoIds(
  refs: PhotoRef[],
): Promise<{ photoId: string; isMain: boolean }[]> {
  const out: { photoId: string; isMain: boolean }[] = []
  for (let i = 0; i < refs.length; i += 1) {
    const ref = refs[i]
    if (typeof ref === 'string') {
      out.push({ photoId: await ensurePhotoId(ref), isMain: i === 0 })
    } else if ('photoId' in ref) {
      out.push({ photoId: ref.photoId, isMain: ref.isMain ?? i === 0 })
    } else {
      out.push({ photoId: await ensurePhotoId(ref.url, ref.alt), isMain: ref.isMain ?? i === 0 })
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
export async function syncProjectPhotos(projectId: string, refs: PhotoRef[]): Promise<void> {
  await supabaseAdmin.from('project_photos').delete().eq('project_id', projectId)
  const resolved = await resolvePhotoIds(refs ?? [])
  if (!resolved.length) return
  const rows = resolved.map((r, i) => ({
    project_id: projectId,
    photo_id: r.photoId,
    is_main: r.isMain,
    order: i,
  }))
  const { error } = await supabaseAdmin
    .from('project_photos')
    .upsert(rows, { onConflict: 'project_id,photo_id' })
  if (error) throw error
}

/** Replaces an item's photo links with `refs` (order = array index). */
export async function syncItemPhotos(itemId: string, refs: PhotoRef[]): Promise<void> {
  await supabaseAdmin.from('photo_items').delete().eq('item_id', itemId)
  const resolved = await resolvePhotoIds(refs ?? [])
  if (!resolved.length) return
  const rows = resolved.map((r, i) => ({
    item_id: itemId,
    photo_id: r.photoId,
    is_main: r.isMain,
    order: i,
  }))
  const { error } = await supabaseAdmin
    .from('photo_items')
    .upsert(rows, { onConflict: 'photo_id,item_id' })
  if (error) throw error
}

/** Replaces a parent's tag links in a join table. */
export async function syncTags(
  table: 'project_tags' | 'item_tags' | 'photo_tags' | 'brand_tags',
  fk: string,
  parentId: string,
  tagIds: string[],
): Promise<void> {
  await supabaseAdmin.from(table).delete().eq(fk, parentId)
  if (!tagIds?.length) return
  const rows = tagIds.map((tag_id) => ({ [fk]: parentId, tag_id }))
  // `table` is a union of join-table names, so the typed Insert can't be resolved statically.
  const { error } = await supabaseAdmin.from(table).insert(rows as never)
  if (error) throw error
}

/** Replaces a project's connected items. */
export async function syncProjectItems(projectId: string, itemIds: string[]): Promise<void> {
  await supabaseAdmin.from('project_items').delete().eq('project_id', projectId)
  if (!itemIds?.length) return
  const rows = itemIds.map((item_id) => ({ project_id: projectId, item_id }))
  const { error } = await supabaseAdmin.from('project_items').insert(rows)
  if (error) throw error
}

/** Replaces a photo's connected items. */
export async function syncPhotoItems(photoId: string, itemIds: string[]): Promise<void> {
  await supabaseAdmin.from('photo_items').delete().eq('photo_id', photoId)
  if (!itemIds?.length) return
  const rows = itemIds.map((item_id, i) => ({
    photo_id: photoId,
    item_id,
    is_main: false,
    order: i,
  }))
  const { error } = await supabaseAdmin.from('photo_items').insert(rows)
  if (error) throw error
}

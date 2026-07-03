import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
const anon = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })

// Fixtures created via service-role, cleaned up after. Never touches seed rows.
let draftProjectId = ''
let draftOnlyPhotoId = '' // in a draft project only → must be hidden from anon
let galleryPhotoId = ''   // in an item gallery → must stay visible to anon
let masterId = ''

test.beforeAll(async () => {
  const { data: proj, error: pe } = await admin
    .from('projects')
    .insert({ title: 'M8 RLS Draft', slug: `m8-rls-draft-${Date.now()}`, status: 'draft' })
    .select('id').single()
  if (pe) throw pe
  draftProjectId = proj.id

  const { data: p1, error: e1 } = await admin
    .from('photos').insert({ image_url: `https://example.com/m8-draft-${Date.now()}.jpg` })
    .select('id').single()
  if (e1) throw e1
  draftOnlyPhotoId = p1.id
  await admin.from('project_photos').insert({ project_id: draftProjectId, photo_id: draftOnlyPhotoId, order: 0 })

  // A photo that is ONLY in an item gallery (attach to any seeded item).
  const { data: item } = await admin.from('items').select('id').limit(1).single()
  const { data: p2, error: e2 } = await admin
    .from('photos').insert({ image_url: `https://example.com/m8-gallery-${Date.now()}.jpg` })
    .select('id').single()
  if (e2) throw e2
  galleryPhotoId = p2.id
  await admin.from('photo_items').insert({ photo_id: galleryPhotoId, item_id: item!.id, order: 0 })

  const { data: m } = await admin.from('profiles').select('id').eq('email', process.env.E2E_MASTER_EMAIL!).single()
  masterId = m!.id
})

test.afterAll(async () => {
  // project delete cascades project_photos; delete the photos + gallery link explicitly.
  await admin.from('projects').delete().eq('id', draftProjectId)
  await admin.from('photos').delete().in('id', [draftOnlyPhotoId, galleryPhotoId])
})

test('anon cannot INSERT a project via REST', async () => {
  const { error } = await anon.from('projects').insert({ title: 'x', slug: `x-${Date.now()}` })
  expect(error).not.toBeNull()
})

test('anon cannot read a draft project\'s project_photos', async () => {
  const { data } = await anon.from('project_photos').select('photo_id').eq('project_id', draftProjectId)
  expect(data ?? []).toHaveLength(0)
})

test('anon cannot read a draft-only photo', async () => {
  const { data } = await anon.from('photos').select('id').eq('id', draftOnlyPhotoId)
  expect(data ?? []).toHaveLength(0)
})

test('anon CAN still read an item-gallery photo (no over-blocking)', async () => {
  const { data } = await anon.from('photos').select('id').eq('id', galleryPhotoId)
  expect(data ?? []).toHaveLength(1)
})

test('content_manager cannot update another user\'s profile via REST', async () => {
  const cm = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: se } = await cm.auth.signInWithPassword({
    email: process.env.E2E_CM_EMAIL!, password: process.env.E2E_CM_PASSWORD!,
  })
  expect(se).toBeNull()
  const { data } = await cm.from('profiles').update({ name: 'hacked' }).eq('id', masterId).select('id')
  expect(data ?? []).toHaveLength(0) // RLS filters the target row → 0 updated
  const { data: check } = await admin.from('profiles').select('name').eq('id', masterId).single()
  expect(check!.name).not.toBe('hacked')
})

test('content_manager cannot read another user\'s profile via REST', async () => {
  const cm = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
  await cm.auth.signInWithPassword({
    email: process.env.E2E_CM_EMAIL!, password: process.env.E2E_CM_PASSWORD!,
  })
  const { data } = await cm.from('profiles').select('id').eq('id', masterId)
  expect(data ?? []).toHaveLength(0)
})

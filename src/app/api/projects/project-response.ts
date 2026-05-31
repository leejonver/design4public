type ProjectPhotoLink = {
  id?: string
  photoId?: string
  isMain?: boolean
  order?: number
}

const byOrder = (a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0)

export function buildProjectPhotoRows(projectId: string, photos: ProjectPhotoLink[] = []) {
  const hasMain = photos.some((photo) => photo.isMain)

  return photos
    .map((photo, index) => ({
      project_id: projectId,
      photo_id: photo.photoId ?? photo.id,
      is_main: photo.isMain ?? (!hasMain && index === 0),
      order: photo.order ?? index,
    }))
    .filter((row) => Boolean(row.photo_id))
}

export function transformProject(project: any) {
  const projectImages = [...(project.project_images ?? [])].sort(byOrder)
  const projectPhotos = [...(project.project_photos ?? [])].sort(byOrder)

  return {
    id: project.id,
    name: project.title,
    description: project.description || '',
    location: project.location || '',
    completionYear: project.year,
    area: project.area,
    images: projectImages.map((img: any, index: number) => ({
      id: img.id,
      url: img.image_url,
      alt: img.alt_text || project.title,
      isMain: img.is_main ?? index === 0,
    })),
    photos: projectPhotos
      .map((pp: any) => {
        const photo = pp.photos
        if (!photo) return null
        return {
          id: photo.id,
          imageUrl: photo.image_url,
          altText: photo.alt_text || '',
          title: photo.title || '',
          description: photo.description || '',
          isMain: pp.is_main ?? false,
          order: pp.order ?? 0,
        }
      })
      .filter(Boolean),
    tags: project.project_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
    connectedItems: project.project_items?.map((pi: any) => ({
      ...pi.items,
      brand: pi.items?.brands,
      images: pi.items?.image_url ? [{
        id: pi.items.id,
        url: pi.items.image_url,
        alt: pi.items.name,
        isMain: true,
      }] : [],
    })).filter(Boolean) || [],
    inquiryUrl: project.inquiry_url || '',
    status: project.status,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }
}

export const projectSelect = `
  *,
  project_images(*),
  project_photos(*, photos(*)),
  project_tags(
    tags(*)
  ),
  project_items(
    items(
      *,
      brands(*)
    )
  )
`

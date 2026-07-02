import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireRole, authErrorResponse } from '@/lib/auth'

// Route Segment Config - Vercel 제한 완화
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 최대 60초

export async function POST(request: NextRequest) {
  try {
    await requireRole('content_manager')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 체크 (10MB 제한)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 파일 정보 로깅
    console.log('File info:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // 파일 타입 체크 (MIME 타입 또는 확장자 기반)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileExtension = '.' + fileExt
    const isValidMimeType = allowedTypes.includes(file.type)
    const isValidExtension = allowedExtensions.includes(fileExtension)
    
    if (!isValidMimeType && !isValidExtension) {
      console.log('File type not allowed:', { type: file.type, extension: fileExtension })
      return NextResponse.json(
        { success: false, error: `지원되지 않는 파일 형식입니다. JPG, PNG, WebP, GIF만 업로드 가능합니다. (받은 타입: ${file.type}, 확장자: ${fileExtension})` },
        { status: 400 }
      )
    }

    // 고유한 파일명 생성
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}_${randomString}.${fileExt}`

    // Supabase Storage에 파일 업로드
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(`${folder}/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { success: false, error: `파일 업로드에 실패했습니다: ${error.message}` },
        { status: 500 }
      )
    }

    // 공개 URL 생성
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: data.path,
        fileName: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      },
      message: '파일이 성공적으로 업로드되었습니다.'
    })

  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') return authErrorResponse(error)
    console.error('Upload API error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

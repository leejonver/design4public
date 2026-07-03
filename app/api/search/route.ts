import { NextRequest, NextResponse } from 'next/server'
import { hybridSearch } from '@/lib/search/query'

// Node runtime: embedText uses the server-only OPENAI_API_KEY.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q') ?? ''
  const groups = await hybridSearch(q) // never throws; empty groups on any failure
  return NextResponse.json({ groups })
}

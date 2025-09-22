import { NextRequest, NextResponse } from 'next/server'
import { toolsApi } from '@/lib/supabase'

// 强制动态渲染
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'ranking'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const result = await toolsApi.getTools(page, limit, search, sortBy, sortOrder)

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page,
      limit
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tools' },
      { status: 500 }
    )
  }
}
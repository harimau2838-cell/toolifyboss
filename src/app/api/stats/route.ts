import { NextResponse } from 'next/server'
import { toolsApi } from '@/lib/supabase'

// 强制动态渲染
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await toolsApi.getStats()

    const response = NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })

    // 添加缓存控制头，防止缓存问题
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
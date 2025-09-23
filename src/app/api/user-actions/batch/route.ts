import { NextRequest, NextResponse } from 'next/server'
import { userActionsApi } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { tools, action_type } = await request.json()

    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tools array is required' },
        { status: 400 }
      )
    }

    if (!action_type || !['favorite', 'exclude'].includes(action_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // 批量添加操作
    const results = await Promise.allSettled(
      tools.map(tool =>
        userActionsApi.addAction(tool.tool_name, tool.tool_url, action_type as 'favorite' | 'exclude')
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      data: {
        total: tools.length,
        successful,
        failed
      }
    })
  } catch (error) {
    console.error('Batch action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform batch action' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { tool_names, action_type } = await request.json()

    if (!tool_names || !Array.isArray(tool_names) || tool_names.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tool names array is required' },
        { status: 400 }
      )
    }

    if (!action_type || !['favorite', 'exclude'].includes(action_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // 批量删除操作
    const results = await Promise.allSettled(
      tool_names.map(tool_name =>
        userActionsApi.removeAction(tool_name, action_type as 'favorite' | 'exclude')
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      data: {
        total: tool_names.length,
        successful,
        failed
      }
    })
  } catch (error) {
    console.error('Batch delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform batch delete' },
      { status: 500 }
    )
  }
}
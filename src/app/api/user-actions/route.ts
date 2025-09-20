import { NextRequest, NextResponse } from 'next/server'
import { userActionsApi } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tool_name, tool_url, action_type } = body

    if (!tool_name || !tool_url || !action_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['favorite', 'exclude'].includes(action_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action_type' },
        { status: 400 }
      )
    }

    const result = await userActionsApi.addAction(tool_name, tool_url, action_type)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add user action' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tool_name = searchParams.get('tool_name')
    const action_type = searchParams.get('action_type') as 'favorite' | 'exclude'

    if (!tool_name || !action_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    await userActionsApi.removeAction(tool_name, action_type)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove user action' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action_type = searchParams.get('action_type') as 'favorite' | 'exclude' | null

    const result = await userActionsApi.getUserActions(action_type || undefined)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user actions' },
      { status: 500 }
    )
  }
}
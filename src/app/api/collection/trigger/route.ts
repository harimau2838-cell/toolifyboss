import { NextRequest, NextResponse } from 'next/server'

// 手动触发GitHub Actions工作流
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { target_count } = body

    console.log('🎯 API收到触发请求:', body)
    console.log('📊 解析的target_count:', target_count)

    // GitHub Personal Access Token 需要在环境变量中配置
    const githubToken = process.env.REPO_TOKEN
    const repoOwner = 'harimau2838-cell'
    const repoName = 'toolifyboss'

    if (!githubToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub token not configured. Please add REPO_TOKEN to environment variables.'
        },
        { status: 400 }
      )
    }

    // 触发GitHub Actions工作流
    const workflowPayload = {
      ref: 'main',
      inputs: {
        target_count: target_count?.toString() || '3000'
      }
    }

    console.log('🚀 发送到GitHub的payload:', workflowPayload)

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/collect-data.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'toolify-monitor-app'
        },
        body: JSON.stringify(workflowPayload)
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('GitHub API Error:', errorData)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to trigger collection: ${response.status} ${response.statusText}`
        },
        { status: response.status }
      )
    }

    // 更新数据库中的采集状态
    const { supabase } = await import('@/lib/supabase')

    await supabase
      .from('system_settings')
      .upsert({
        setting_key: 'collection_status',
        setting_value: 'running',
        setting_type: 'string',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    await supabase
      .from('system_settings')
      .upsert({
        setting_key: 'last_collection_time',
        setting_value: new Date().toISOString(),
        setting_type: 'string',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    return NextResponse.json({
      success: true,
      message: 'Collection workflow triggered successfully',
      target_count: target_count || 3000
    })

  } catch (error) {
    console.error('Collection Trigger Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger collection' },
      { status: 500 }
    )
  }
}

// 获取当前采集状态
export async function GET() {
  try {
    const { supabase } = await import('@/lib/supabase')

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .in('setting_key', ['collection_status', 'last_collection_time', 'collection_target_count'])

    if (error) throw error

    const status: { [key: string]: any } = {}
    data.forEach(setting => {
      let value = setting.setting_value

      if (setting.setting_type === 'number') {
        value = parseInt(value)
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true'
      }

      status[setting.setting_key] = value
    })

    return NextResponse.json({
      success: true,
      data: {
        status: status.collection_status || 'idle',
        last_collection_time: status.last_collection_time || '',
        target_count: status.collection_target_count || 3000
      }
    })

  } catch (error) {
    console.error('Collection Status Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get collection status' },
      { status: 500 }
    )
  }
}

// 重置采集状态
export async function PATCH() {
  try {
    const { supabase } = await import('@/lib/supabase')

    await supabase
      .from('system_settings')
      .upsert({
        setting_key: 'collection_status',
        setting_value: 'idle',
        setting_type: 'string',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    return NextResponse.json({
      success: true,
      message: 'Collection status reset to idle'
    })

  } catch (error) {
    console.error('Collection Status Reset Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset collection status' },
      { status: 500 }
    )
  }
}
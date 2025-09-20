import { NextRequest, NextResponse } from 'next/server'

// 检查GitHub Actions工作流状态并更新数据库
export async function GET(request: NextRequest) {
  try {
    const githubToken = process.env.REPO_TOKEN
    const repoOwner = 'harimau2838-cell'
    const repoName = 'toolifyboss'

    if (!githubToken) {
      return NextResponse.json(
        { success: false, error: 'GitHub token not configured' },
        { status: 400 }
      )
    }

    // 获取最近的工作流运行
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/collect-data.yml/runs?per_page=1`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'toolify-monitor-app'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`)
    }

    const data = await response.json()
    const runs = data.workflow_runs

    if (runs.length === 0) {
      return NextResponse.json({
        success: true,
        status: 'no_runs',
        message: 'No workflow runs found'
      })
    }

    const latestRun = runs[0]
    const runStatus = latestRun.status // queued, in_progress, completed
    const runConclusion = latestRun.conclusion // success, failure, cancelled, null

    // 映射GitHub状态到我们的状态
    let collectionStatus = 'idle'
    if (runStatus === 'in_progress' || runStatus === 'queued') {
      collectionStatus = 'running'
    } else if (runStatus === 'completed') {
      if (runConclusion === 'success') {
        collectionStatus = 'completed'
      } else {
        collectionStatus = 'failed'
      }
    }

    // 更新数据库状态
    const { supabase } = await import('@/lib/supabase')

    await supabase
      .from('system_settings')
      .upsert({
        setting_key: 'collection_status',
        setting_value: collectionStatus,
        setting_type: 'string',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    return NextResponse.json({
      success: true,
      github_status: runStatus,
      github_conclusion: runConclusion,
      collection_status: collectionStatus,
      run_id: latestRun.id,
      created_at: latestRun.created_at,
      updated_at: latestRun.updated_at
    })

  } catch (error) {
    console.error('GitHub Status Check Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check GitHub workflow status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
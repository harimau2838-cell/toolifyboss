import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 检查环境变量
    const envCheck = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      repo_token: !!process.env.REPO_TOKEN,
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
    }

    // 测试Supabase连接
    let supabaseTest = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from('toolify_tools')
        .select('count', { count: 'exact', head: true })

      supabaseTest = {
        connected: !error,
        error: error?.message,
        toolsCount: data?.length || 0
      }
    } catch (err) {
      supabaseTest = {
        connected: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase: supabaseTest
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
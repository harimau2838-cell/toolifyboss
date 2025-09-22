import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库操作函数
export const toolsApi = {
  // 获取所有工具数据
  async getTools(page = 1, limit = 50, search = '', sortBy = 'ranking', sortOrder = 'asc') {
    let query = supabase
      .from('toolify_tools')
      .select('*')
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      query = query.or(`tool_name.ilike.%${search}%,description.ilike.%${search}%,tags.ilike.%${search}%`)
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data, error, count } = await query

    if (error) throw error

    return { data: data || [], total: count || 0 }
  },

  // 获取工具统计数据
  async getStats() {
    // 获取所有工具数据 - 简单可靠的方法
    const { data: tools, error: toolsError } = await supabase
      .from('toolify_tools')
      .select('id, created_at, collected_at')

    const { data: favorites, error: favoritesError } = await supabase
      .from('user_actions')
      .select('id')
      .eq('action_type', 'favorite')

    const { data: excluded, error: excludedError } = await supabase
      .from('user_actions')
      .select('id')
      .eq('action_type', 'exclude')

    if (toolsError || favoritesError || excludedError) {
      throw toolsError || favoritesError || excludedError
    }

    // 计算最近7天新增（更合理的指标）
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 获取不同采集批次的数据
    const uniqueBatches = [...new Set(tools?.map(tool => tool.collection_batch) || [])]

    let recentNew = 0
    if (uniqueBatches.length <= 1) {
      // 如果只有一个批次，说明是首次采集，显示0
      recentNew = 0
    } else {
      // 如果有多个批次，计算最近7天的数据
      recentNew = tools?.filter(tool =>
        new Date(tool.created_at!) >= sevenDaysAgo
      ).length || 0
    }

    // 获取最后采集时间 - 优先使用collected_at
    let lastCollection = ''
    if (tools && tools.length > 0) {
      const sortedTools = tools.sort((a, b) => {
        const timeA = new Date(a.collected_at || a.created_at || 0).getTime()
        const timeB = new Date(b.collected_at || b.created_at || 0).getTime()
        return timeB - timeA
      })
      lastCollection = sortedTools[0].collected_at || sortedTools[0].created_at || ''
    }

    console.log(`统计API调试: tools=${tools?.length}, batches=${uniqueBatches.length}, recentNew=${recentNew}`)

    return {
      total_tools: tools?.length || 0,
      monthly_new: recentNew,  // 实际上是"最近新增"，首次采集时为0
      favorites_count: favorites?.length || 0,
      excluded_count: excluded?.length || 0,
      last_collection: lastCollection
    }
  }
}

// 用户操作API
export const userActionsApi = {
  // 添加用户操作
  async addAction(tool_name: string, tool_url: string, action_type: 'favorite' | 'exclude') {
    const { data, error } = await supabase
      .from('user_actions')
      .upsert({
        tool_name,
        tool_url,
        action_type,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tool_name,action_type'
      })
      .select()

    if (error) throw error
    return data
  },

  // 删除用户操作
  async removeAction(tool_name: string, action_type: 'favorite' | 'exclude') {
    const { error } = await supabase
      .from('user_actions')
      .delete()
      .eq('tool_name', tool_name)
      .eq('action_type', action_type)

    if (error) throw error
  },

  // 获取用户操作
  async getUserActions(action_type?: 'favorite' | 'exclude') {
    let query = supabase.from('user_actions').select('*')

    if (action_type) {
      query = query.eq('action_type', action_type)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }
}
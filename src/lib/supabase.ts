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
    // 使用count查询获取精确计数，避免缓存问题
    const { count: toolsCount, error: toolsError } = await supabase
      .from('toolify_tools')
      .select('*', { count: 'exact', head: true })

    const { count: favoritesCount, error: favoritesError } = await supabase
      .from('user_actions')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'favorite')

    const { count: excludedCount, error: excludedError } = await supabase
      .from('user_actions')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'exclude')

    // 获取最新记录用于计算本月新增和最后采集时间
    const { data: recentTools, error: recentError } = await supabase
      .from('toolify_tools')
      .select('created_at, collected_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (toolsError || favoritesError || excludedError || recentError) {
      throw toolsError || favoritesError || excludedError || recentError
    }

    // 计算本月新增
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyNew = recentTools?.filter(tool =>
      new Date(tool.created_at!) >= thisMonth
    ).length || 0

    // 获取最后采集时间
    const lastCollection = recentTools?.[0]?.collected_at || recentTools?.[0]?.created_at || ''

    return {
      total_tools: toolsCount || 0,
      monthly_new: monthlyNew,
      favorites_count: favoritesCount || 0,
      excluded_count: excludedCount || 0,
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
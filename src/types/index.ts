export interface Tool {
  id?: string
  ranking: number
  tool_name: string
  tool_url: string
  monthly_visits: string
  growth: string
  growth_rate: string
  description: string
  tags: string
  collected_at?: string
  collection_batch?: string
  created_at?: string
  updated_at?: string
}

export interface UserAction {
  id?: string
  tool_name: string
  tool_url: string
  action_type: 'favorite' | 'exclude'
  created_at?: string
  updated_at?: string
}

export interface StatsData {
  total_tools: number
  monthly_new: number
  favorites_count: number
  excluded_count: number
  last_collection: string
}
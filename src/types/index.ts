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

export interface SystemSetting {
  id?: string
  setting_key: string
  setting_value: string
  setting_type: 'number' | 'boolean' | 'string' | 'json'
  description?: string
  created_at?: string
  updated_at?: string
}

export interface CollectionSettings {
  target_count: number
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  day_of_month: number
  hour: number
  max_scroll_attempts: number
  batch_size: number
  retry_attempts: number
}

export interface CollectionStatus {
  status: 'idle' | 'running' | 'completed' | 'failed'
  last_collection_time: string
  current_count?: number
  error_message?: string
}
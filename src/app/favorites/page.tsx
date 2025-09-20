'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, TrendingUp, Heart, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { userActionsApi } from '@/lib/supabase'
import { UserAction } from '@/types'

interface FavoriteTool extends UserAction {
  monthly_visits?: string
  growth?: string
  growth_rate?: string
  description?: string
  tags?: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteTool[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const favoriteActions = await userActionsApi.getUserActions('favorite')

      // 获取工具的详细信息
      const favoritesWithDetails = await Promise.all(
        favoriteActions.map(async (action) => {
          try {
            // 这里应该调用API获取工具详情，暂时使用模拟数据
            return {
              ...action,
              monthly_visits: '5.8B', // 模拟数据
              growth: '126.6M',
              growth_rate: '2.21%',
              description: '模拟工具描述',
              tags: 'AI, 聊天机器人'
            }
          } catch (error) {
            return action
          }
        })
      )

      setFavorites(favoritesWithDetails)
    } catch (error) {
      console.error('Failed to load favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (toolName: string) => {
    try {
      await userActionsApi.removeAction(toolName, 'favorite')
      setFavorites(prev => prev.filter(f => f.tool_name !== toolName))
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
  }

  const handleExportFavorites = () => {
    const exportData = favorites.map(tool => ({
      工具名称: tool.tool_name,
      工具链接: tool.tool_url,
      月访问量: tool.monthly_visits,
      增长: tool.growth,
      增长率: tool.growth_rate,
      描述: tool.description,
      标签: tool.tags,
      添加时间: new Date(tool.created_at!).toLocaleString('zh-CN')
    }))

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `toolify-favorites-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 模拟趋势数据
  const trendData = [
    { month: '1月', ChatGPT: 5.2, Claude: 1.1, Gemini: 6.8 },
    { month: '2月', ChatGPT: 5.5, Claude: 1.3, Gemini: 7.0 },
    { month: '3月', ChatGPT: 5.8, Claude: 1.5, Gemini: 7.2 },
    { month: '4月', ChatGPT: 5.8, Claude: 1.5, Gemini: 7.2 },
  ]

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-500" />
              <span>我的关注工具</span>
            </h1>
            <p className="text-gray-600">
              管理和分析你关注的AI工具趋势
            </p>
          </div>

          {favorites.length > 0 && (
            <Button onClick={handleExportFavorites} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>导出列表</span>
            </Button>
          )}
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有关注的工具</h3>
          <p className="text-gray-500 mb-4">
            在主页面点击工具的"关注"按钮来添加到你的关注列表
          </p>
          <Button asChild>
            <a href="/">浏览工具</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">关注总数</h3>
              <p className="text-2xl font-bold text-blue-600">{favorites.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">平均增长率</h3>
              <p className="text-2xl font-bold text-green-600">8.5%</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">总访问量</h3>
              <p className="text-2xl font-bold text-purple-600">12.1B</p>
            </div>
          </div>

          {/* 趋势图表 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">访问量趋势</h2>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value}B`, '访问量']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ChatGPT" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Claude" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Gemini" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 关注工具列表 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">关注的工具</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {favorites.map((tool) => (
                <div key={tool.tool_name} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <a
                          href={tool.tool_url}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="text-lg font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <span>{tool.tool_name}</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>

                      <p className="text-gray-600 mb-3">{tool.description}</p>

                      <div className="flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-500">月访问量: </span>
                          <span className="font-medium">{tool.monthly_visits}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">增长: </span>
                          <span className="font-medium">{tool.growth}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">增长率: </span>
                          <span className="font-medium text-green-600">{tool.growth_rate}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-3">
                        {tool.tags?.split(',').slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        添加时间: {new Date(tool.created_at!).toLocaleString('zh-CN')}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFavorite(tool.tool_name)}
                      className="ml-4"
                    >
                      取消关注
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
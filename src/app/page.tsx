'use client'

import { useState, useEffect } from 'react'
import { ToolsTable } from '@/components/tools-table'
import { StatsData } from '@/types'

export default function Home() {
  const [stats, setStats] = useState<StatsData>({
    total_tools: 0,
    monthly_new: 0,
    favorites_count: 0,
    excluded_count: 0,
    last_collection: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      // 添加时间戳防止缓存
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/stats?t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      const result = await response.json()

      console.log('API响应:', result) // 添加调试日志

      if (result.success) {
        setStats(result.data)
      } else {
        console.error('API返回错误:', result)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteUpdate = () => {
    // 刷新统计数据
    loadStats()
  }

  const handleExcludeUpdate = () => {
    // 刷新统计数据
    loadStats()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Toolify AI工具趋势监控
        </h1>
        <p className="text-gray-600">
          实时监控和分析热门AI工具数据，发现趋势机会
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">总工具数</h3>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : stats.total_tools.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">未操作</h3>
          <p className="text-2xl font-bold text-green-600">
            {loading ? '...' : stats.monthly_new.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">关注数量</h3>
          <p className="text-2xl font-bold text-blue-600">
            {loading ? '...' : stats.favorites_count.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">排除数量</h3>
          <p className="text-2xl font-bold text-red-600">
            {loading ? '...' : stats.excluded_count.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">AI工具排行榜</h2>
          {stats.last_collection && (
            <p className="text-sm text-gray-500 mt-1">
              最后更新: {new Date(stats.last_collection).toLocaleString('zh-CN')}
            </p>
          )}
        </div>

        <div className="p-6">
          <ToolsTable
            onFavorite={handleFavoriteUpdate}
            onExclude={handleExcludeUpdate}
          />
        </div>
      </div>
    </main>
  )
}
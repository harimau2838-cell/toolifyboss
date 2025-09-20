'use client'

import { useState, useEffect } from 'react'
import { Search, X, Trash2, RotateCcw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { userActionsApi } from '@/lib/supabase'
import { UserAction } from '@/types'

export default function ExcludedPage() {
  const [excluded, setExcluded] = useState<UserAction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  useEffect(() => {
    loadExcluded()
  }, [])

  const loadExcluded = async () => {
    try {
      setLoading(true)
      const excludedActions = await userActionsApi.getUserActions('exclude')
      setExcluded(excludedActions)
    } catch (error) {
      console.error('Failed to load excluded tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreTool = async (toolName: string) => {
    try {
      await userActionsApi.removeAction(toolName, 'exclude')
      setExcluded(prev => prev.filter(e => e.tool_name !== toolName))
      setSelectedTools(prev => prev.filter(name => name !== toolName))
    } catch (error) {
      console.error('Failed to restore tool:', error)
    }
  }

  const handleBatchRestore = async () => {
    try {
      await Promise.all(
        selectedTools.map(toolName =>
          userActionsApi.removeAction(toolName, 'exclude')
        )
      )
      setExcluded(prev => prev.filter(e => !selectedTools.includes(e.tool_name)))
      setSelectedTools([])
    } catch (error) {
      console.error('Failed to batch restore:', error)
    }
  }

  const handleSelectTool = (toolName: string) => {
    setSelectedTools(prev =>
      prev.includes(toolName)
        ? prev.filter(name => name !== toolName)
        : [...prev, toolName]
    )
  }

  const handleSelectAll = () => {
    if (selectedTools.length === filteredExcluded.length) {
      setSelectedTools([])
    } else {
      setSelectedTools(filteredExcluded.map(tool => tool.tool_name))
    }
  }

  const filteredExcluded = excluded.filter(tool =>
    tool.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.tool_url.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <X className="h-8 w-8 text-red-500" />
          <span>排除的工具</span>
        </h1>
        <p className="text-gray-600">
          管理被排除的AI工具，可以随时恢复显示
        </p>
      </div>

      {excluded.length === 0 ? (
        <div className="text-center py-12">
          <X className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有排除的工具</h3>
          <p className="text-gray-500 mb-4">
            在主页面点击工具的"排除"按钮来隐藏不感兴趣的工具
          </p>
          <Button asChild>
            <a href="/">浏览工具</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 统计和操作栏 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  共 {excluded.length} 个排除的工具
                </div>
                {selectedTools.length > 0 && (
                  <div className="text-sm text-blue-600">
                    已选择 {selectedTools.length} 个工具
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索工具名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {selectedTools.length > 0 && (
                  <Button
                    onClick={handleBatchRestore}
                    className="flex items-center space-x-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>批量恢复</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 工具列表 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">排除列表</h2>

              {filteredExcluded.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-sm"
                >
                  {selectedTools.length === filteredExcluded.length ? '取消全选' : '全选'}
                </Button>
              )}
            </div>

            {filteredExcluded.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? '没有找到匹配的工具' : '没有排除的工具'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredExcluded.map((tool) => (
                  <div key={tool.tool_name} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes(tool.tool_name)}
                        onChange={() => handleSelectTool(tool.tool_name)}
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <a
                            href={tool.tool_url}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="text-lg font-medium text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                          >
                            <span>{tool.tool_name}</span>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>

                        <p className="text-sm text-gray-500 mb-2">
                          {tool.tool_url}
                        </p>

                        <p className="text-xs text-gray-400">
                          排除时间: {new Date(tool.created_at!).toLocaleString('zh-CN')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreTool(tool.tool_name)}
                          className="flex items-center space-x-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>恢复</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 帮助说明 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  关于排除功能
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    排除的工具不会在主页面显示，但数据仍然保留在数据库中。
                    你可以随时恢复这些工具的显示。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
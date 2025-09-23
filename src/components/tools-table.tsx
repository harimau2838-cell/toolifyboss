'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { ArrowUpDown, ExternalLink, Heart, X, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tool } from '@/types'
import { toolsApi, userActionsApi } from '@/lib/supabase'

interface ToolsTableProps {
  onFavorite?: (tool: Tool) => void
  onExclude?: (tool: Tool) => void
}

export function ToolsTable({ onFavorite, onExclude }: ToolsTableProps) {
  const [data, setData] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [userActions, setUserActions] = useState<{favorites: string[], excluded: string[]}>({
    favorites: [],
    excluded: []
  })
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  // 加载数据
  useEffect(() => {
    loadData()
    loadUserActions()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // 循环分页获取所有数据，绕过PostgREST的1000条默认限制
      const { supabase } = await import('@/lib/supabase')

      let allData: Tool[] = []
      let batchOffset = 0
      const batchSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: batchData, error } = await supabase
          .from('toolify_tools')
          .select('*')
          .order('ranking', { ascending: true })
          .range(batchOffset, batchOffset + batchSize - 1)

        if (error) throw error

        if (batchData && batchData.length > 0) {
          allData = [...allData, ...batchData]
          batchOffset += batchSize

          // 如果返回的数据少于batchSize，说明已经是最后一批
          if (batchData.length < batchSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      console.log(`✅ 成功加载 ${allData.length} 条工具数据`)
      setData(allData)
    } catch (error) {
      console.error('Failed to load tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserActions = async () => {
    try {
      const favorites = await userActionsApi.getUserActions('favorite')
      const excluded = await userActionsApi.getUserActions('exclude')

      setUserActions({
        favorites: favorites.map(f => f.tool_name),
        excluded: excluded.map(e => e.tool_name)
      })
    } catch (error) {
      console.error('Failed to load user actions:', error)
    }
  }

  const handleFavorite = async (tool: Tool) => {
    try {
      const isFavorited = userActions.favorites.includes(tool.tool_name)

      if (isFavorited) {
        await userActionsApi.removeAction(tool.tool_name, 'favorite')
        setUserActions(prev => ({
          ...prev,
          favorites: prev.favorites.filter(name => name !== tool.tool_name)
        }))
      } else {
        await userActionsApi.addAction(tool.tool_name, tool.tool_url, 'favorite')
        setUserActions(prev => ({
          ...prev,
          favorites: [...prev.favorites, tool.tool_name]
        }))
      }

      onFavorite?.(tool)
    } catch (error) {
      console.error('Failed to update favorite:', error)
    }
  }

  const handleExclude = async (tool: Tool) => {
    try {
      const isExcluded = userActions.excluded.includes(tool.tool_name)

      if (isExcluded) {
        await userActionsApi.removeAction(tool.tool_name, 'exclude')
        setUserActions(prev => ({
          ...prev,
          excluded: prev.excluded.filter(name => name !== tool.tool_name)
        }))
      } else {
        await userActionsApi.addAction(tool.tool_name, tool.tool_url, 'exclude')
        setUserActions(prev => ({
          ...prev,
          excluded: [...prev.excluded, tool.tool_name]
        }))
      }

      onExclude?.(tool)
    } catch (error) {
      console.error('Failed to update exclude:', error)
    }
  }

  // 批量操作处理函数
  const handleBatchFavorite = async () => {
    if (selectedRows.size === 0) return

    try {
      setBatchLoading(true)
      const selectedTools = data.filter(tool => selectedRows.has(tool.id!))

      const response = await fetch('/api/user-actions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: selectedTools,
          action_type: 'favorite'
        })
      })

      const result = await response.json()

      if (result.success) {
        // 更新本地状态
        setUserActions(prev => ({
          ...prev,
          favorites: Array.from(new Set([...prev.favorites, ...selectedTools.map(t => t.tool_name)]))
        }))
        setSelectedRows(new Set())
        onFavorite?.(selectedTools[0]) // 触发统计更新
        alert(`成功添加 ${result.data.successful} 个关注`)
      }
    } catch (error) {
      console.error('Batch favorite failed:', error)
      alert('批量关注失败')
    } finally {
      setBatchLoading(false)
    }
  }

  const handleBatchExclude = async () => {
    if (selectedRows.size === 0) return

    try {
      setBatchLoading(true)
      const selectedTools = data.filter(tool => selectedRows.has(tool.id!))

      const response = await fetch('/api/user-actions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: selectedTools,
          action_type: 'exclude'
        })
      })

      const result = await response.json()

      if (result.success) {
        // 更新本地状态
        setUserActions(prev => ({
          ...prev,
          excluded: Array.from(new Set([...prev.excluded, ...selectedTools.map(t => t.tool_name)]))
        }))
        setSelectedRows(new Set())
        onExclude?.(selectedTools[0]) // 触发统计更新
        alert(`成功添加 ${result.data.successful} 个排除`)
      }
    } catch (error) {
      console.error('Batch exclude failed:', error)
      alert('批量排除失败')
    } finally {
      setBatchLoading(false)
    }
  }

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const columns: ColumnDef<Tool>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => {
          // 获取当前页的所有行
          const currentPageRows = table.getRowModel().rows
          const currentPageIds = currentPageRows.map(row => row.original.id!)
          const allCurrentPageSelected = currentPageIds.length > 0 &&
            currentPageIds.every(id => selectedRows.has(id))

          const handleToggle = () => {
            if (allCurrentPageSelected) {
              // 取消选择当前页所有行
              const newSet = new Set(selectedRows)
              currentPageIds.forEach(id => newSet.delete(id))
              setSelectedRows(newSet)
            } else {
              // 选择当前页所有行
              const newSet = new Set(selectedRows)
              currentPageIds.forEach(id => newSet.add(id))
              setSelectedRows(newSet)
            }
          }

          return (
            <input
              type="checkbox"
              checked={allCurrentPageSelected}
              onChange={handleToggle}
              className="w-4 h-4"
            />
          )
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedRows.has(row.original.id!)}
            onChange={() => toggleRowSelection(row.original.id!)}
            className="w-4 h-4"
          />
        ),
        size: 50,
      },
      {
        accessorKey: 'ranking',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              排名
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="text-center font-medium">{row.getValue('ranking')}</div>
        ),
        size: 80,
      },
      {
        accessorKey: 'tool_name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              工具名称
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const tool = row.original
          return (
            <div className="max-w-[200px]">
              <div className="flex items-center space-x-2">
                <a
                  href={tool.tool_url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span className="truncate">{tool.tool_name}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </div>
              <div className="text-sm text-gray-500 truncate mt-1">
                {tool.description}
              </div>
            </div>
          )
        },
        size: 250,
      },
      {
        accessorKey: 'monthly_visits',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              月访问量
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="text-center font-mono">
            {row.getValue('monthly_visits')}
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: 'growth',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              增长
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="text-center font-mono">
            {row.getValue('growth')}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'growth_rate',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2"
            >
              增长率
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const rate = row.getValue('growth_rate') as string
          const isPositive = rate && !rate.startsWith('-')
          return (
            <div className={`text-center font-mono ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {rate}
            </div>
          )
        },
        size: 100,
      },
      {
        accessorKey: 'tags',
        header: '标签',
        cell: ({ row }) => {
          const tags = (row.getValue('tags') as string)?.split(',').slice(0, 3) || []
          return (
            <div className="max-w-[200px]">
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded truncate"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )
        },
        size: 200,
      },
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => {
          const tool = row.original
          const isFavorited = userActions.favorites.includes(tool.tool_name)
          const isExcluded = userActions.excluded.includes(tool.tool_name)

          return (
            <div className="flex space-x-2">
              <Button
                variant={isFavorited ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFavorite(tool)}
                className="h-8"
              >
                <Heart className={`h-3 w-3 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? '已关注' : '关注'}
              </Button>
              <Button
                variant={isExcluded ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleExclude(tool)}
                className="h-8"
              >
                <X className="h-3 w-3" />
                {isExcluded ? '已排除' : '排除'}
              </Button>
            </div>
          )
        },
        size: 150,
      },
    ],
    [userActions, selectedRows, data]
  )

  // 过滤掉被排除的工具
  const filteredData = useMemo(() => {
    return data.filter(tool => !userActions.excluded.includes(tool.tool_name))
  }, [data, userActions.excluded])

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  })

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* 搜索栏和批量操作 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索工具名称、描述或标签..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-500">
            显示 {table.getFilteredRowModel().rows.length} 条工具
          </div>
        </div>

        {/* 批量操作按钮 */}
        {selectedRows.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">已选择 {selectedRows.size} 项</span>
            <Button
              onClick={handleBatchFavorite}
              disabled={batchLoading}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <Heart className="h-4 w-4" />
              批量关注
            </Button>
            <Button
              onClick={handleBatchExclude}
              disabled={batchLoading}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <X className="h-4 w-4" />
              批量排除
            </Button>
          </div>
        )}
      </div>

      {/* 表格 */}
      <div className="rounded-md border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-gray-50/50">
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="h-12 px-4 text-left align-middle font-medium text-gray-500"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-gray-50/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-4 align-top"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-500"
                  >
                    没有找到匹配的工具
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500">
          第 {table.getState().pagination.pageIndex + 1} 页，共{' '}
          {table.getPageCount()} 页
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
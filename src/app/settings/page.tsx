'use client'

import { useState, useEffect } from 'react'
import { Settings, Play, Pause, Save, RefreshCw, Clock, Database, Zap, Square, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CollectionSettings, CollectionStatus } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<CollectionSettings>({
    target_count: 3000,
    enabled: true,
    frequency: 'monthly',
    day_of_month: 2,
    hour: 2,
    max_scroll_attempts: 60,
    batch_size: 100,
    retry_attempts: 3
  })

  const [status, setStatus] = useState<CollectionStatus>({
    status: 'idle',
    last_collection_time: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    loadSettings()
    loadStatus()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const result = await response.json()

      if (result.success) {
        setSettings({
          target_count: result.data.collection_target_count || 3000,
          enabled: result.data.collection_enabled !== false,
          frequency: result.data.collection_frequency || 'monthly',
          day_of_month: result.data.collection_day_of_month || 2,
          hour: result.data.collection_hour || 2,
          max_scroll_attempts: result.data.max_scroll_attempts || 60,
          batch_size: result.data.batch_size || 100,
          retry_attempts: result.data.retry_attempts || 3
        })
      } else {
        console.error('Failed to load settings:', result)
        alert('加载设置失败：' + (result.details || result.error))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      alert('加载设置失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/collection/trigger')
      const result = await response.json()

      if (result.success) {
        setStatus({
          status: result.data.status,
          last_collection_time: result.data.last_collection_time
        })
      }
    } catch (error) {
      console.error('Failed to load status:', error)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            collection_target_count: settings.target_count,
            collection_enabled: settings.enabled,
            collection_frequency: settings.frequency,
            collection_day_of_month: settings.day_of_month,
            collection_hour: settings.hour,
            max_scroll_attempts: settings.max_scroll_attempts,
            batch_size: settings.batch_size,
            retry_attempts: settings.retry_attempts
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('设置保存成功！')
      } else {
        const errorMessage = result.details ? `${result.error}: ${result.details}` : result.error
        alert('保存失败：' + errorMessage)
        console.error('Settings save error:', result)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const triggerCollection = async () => {
    try {
      setTriggering(true)

      console.log('🎯 触发采集，当前设置:', settings)
      console.log('📊 发送的target_count:', settings.target_count)

      const response = await fetch('/api/collection/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_count: settings.target_count
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`采集任务已触发！目标采集 ${result.target_count} 条数据`)
        setStatus(prev => ({
          ...prev,
          status: 'running',
          last_collection_time: new Date().toISOString()
        }))
      } else {
        alert('触发失败：' + result.error)
      }
    } catch (error) {
      console.error('Failed to trigger collection:', error)
      alert('触发失败，请重试')
    } finally {
      setTriggering(false)
    }
  }

  const resetStatus = async () => {
    try {
      setResetting(true)

      const response = await fetch('/api/collection/trigger', {
        method: 'PATCH'
      })

      const result = await response.json()

      if (result.success) {
        alert('状态已重置为空闲')
        setStatus(prev => ({
          ...prev,
          status: 'idle'
        }))
      } else {
        alert('重置失败：' + result.error)
      }
    } catch (error) {
      console.error('Failed to reset status:', error)
      alert('重置失败，请重试')
    } finally {
      setResetting(false)
    }
  }

  const checkGitHubStatus = async () => {
    try {
      setChecking(true)

      const response = await fetch('/api/collection/status')
      const result = await response.json()

      if (result.success) {
        setStatus(prev => ({
          ...prev,
          status: result.collection_status
        }))

        if (result.collection_status !== 'running') {
          alert(`状态已更新: ${getStatusText(result.collection_status)}`)
        }
      } else {
        alert('检查状态失败：' + result.error)
      }
    } catch (error) {
      console.error('Failed to check GitHub status:', error)
      alert('检查状态失败，请重试')
    } finally {
      setChecking(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-yellow-600 bg-yellow-100'
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return '采集中'
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      default:
        return '空闲'
    }
  }

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
          <Settings className="h-8 w-8 text-blue-600" />
          <span>系统设置</span>
        </h1>
        <p className="text-gray-600">
          配置数据采集参数和定时任务设置
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 采集状态 */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">采集状态</h2>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">当前状态</span>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                  {status.status === 'running' && <RefreshCw className="h-4 w-4 mr-1 animate-spin" />}
                  {getStatusText(status.status)}
                </div>
              </div>

              {status.last_collection_time && (
                <div>
                  <span className="text-sm text-gray-500">最后采集</span>
                  <p className="text-sm font-medium">
                    {new Date(status.last_collection_time).toLocaleString('zh-CN')}
                  </p>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <Button
                  onClick={triggerCollection}
                  disabled={triggering || status.status === 'running'}
                  className="w-full flex items-center space-x-2"
                >
                  {triggering ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>{triggering ? '触发中...' : '立即采集'}</span>
                </Button>

                {status.status === 'running' && (
                  <>
                    <Button
                      onClick={checkGitHubStatus}
                      disabled={checking}
                      variant="outline"
                      className="w-full flex items-center space-x-2"
                    >
                      {checking ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>{checking ? '检查中...' : '检查实际状态'}</span>
                    </Button>

                    <Button
                      onClick={resetStatus}
                      disabled={resetting}
                      variant="outline"
                      className="w-full flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {resetting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      <span>{resetting ? '重置中...' : '强制重置状态'}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 设置表单 */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">采集配置</h2>
              </div>

              <Button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? '保存中...' : '保存设置'}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本设置 */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 border-b pb-2">基本设置</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    采集数量目标
                  </label>
                  <Input
                    type="number"
                    value={settings.target_count}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      target_count: parseInt(e.target.value) || 3000
                    }))}
                    min={100}
                    max={10000}
                    step={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    每次采集的工具数量 (100-10000)
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        enabled: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      启用定时采集
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    关闭后将不会自动执行采集任务
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    采集频率
                  </label>
                  <select
                    value={settings.frequency}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>

                {settings.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      每月执行日期
                    </label>
                    <Input
                      type="number"
                      value={settings.day_of_month}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        day_of_month: parseInt(e.target.value) || 2
                      }))}
                      min={1}
                      max={28}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      每月的第几天执行 (1-28)
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    执行时间 (UTC)
                  </label>
                  <Input
                    type="number"
                    value={settings.hour}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      hour: parseInt(e.target.value) || 2
                    }))}
                    min={0}
                    max={23}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    UTC时间 0-23点 (北京时间+8小时)
                  </p>
                </div>
              </div>

              {/* 高级设置 */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 border-b pb-2">高级设置</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大滚动次数
                  </label>
                  <Input
                    type="number"
                    value={settings.max_scroll_attempts}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      max_scroll_attempts: parseInt(e.target.value) || 60
                    }))}
                    min={10}
                    max={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    页面滚动加载的最大尝试次数
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    批量插入大小
                  </label>
                  <Input
                    type="number"
                    value={settings.batch_size}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      batch_size: parseInt(e.target.value) || 100
                    }))}
                    min={10}
                    max={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    数据库批量插入的记录数量
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    失败重试次数
                  </label>
                  <Input
                    type="number"
                    value={settings.retry_attempts}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      retry_attempts: parseInt(e.target.value) || 3
                    }))}
                    min={1}
                    max={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    采集失败时的重试次数
                  </p>
                </div>
              </div>
            </div>

            {/* 帮助信息 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    定时任务说明
                  </h4>
                  <div className="text-sm text-blue-700 mt-1">
                    <p>• 定时任务通过GitHub Actions执行，需要配置GitHub Token</p>
                    <p>• 手动触发会立即启动采集任务</p>
                    <p>• 建议采集数量设置为1000-5000之间以保证稳定性</p>
                    <p>• UTC时间2点 = 北京时间10点</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
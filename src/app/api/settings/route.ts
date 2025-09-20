import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 获取系统设置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    let query = supabase.from('system_settings').select('*')

    if (key) {
      query = query.eq('setting_key', key)
    }

    const { data, error } = await query

    if (error) throw error

    if (key && data.length === 1) {
      // 返回单个设置值
      const setting = data[0]
      let value = setting.setting_value

      // 根据类型转换值
      switch (setting.setting_type) {
        case 'number':
          value = parseInt(value)
          break
        case 'boolean':
          value = value === 'true'
          break
        case 'json':
          value = JSON.parse(value)
          break
      }

      return NextResponse.json({
        success: true,
        data: { [setting.setting_key]: value }
      })
    }

    // 返回所有设置
    const settings: { [key: string]: any } = {}
    data.forEach(setting => {
      let value = setting.setting_value

      switch (setting.setting_type) {
        case 'number':
          value = parseInt(value)
          break
        case 'boolean':
          value = value === 'true'
          break
        case 'json':
          value = JSON.parse(value)
          break
      }

      settings[setting.setting_key] = value
    })

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Settings API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// 更新系统设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data' },
        { status: 400 }
      )
    }

    const updates = []

    for (const [key, value] of Object.entries(settings)) {
      // 确定设置类型
      let settingType = 'string'
      let settingValue = String(value)

      if (typeof value === 'number') {
        settingType = 'number'
      } else if (typeof value === 'boolean') {
        settingType = 'boolean'
      } else if (typeof value === 'object') {
        settingType = 'json'
        settingValue = JSON.stringify(value)
      }

      updates.push({
        setting_key: key,
        setting_value: settingValue,
        setting_type: settingType,
        updated_at: new Date().toISOString()
      })
    }

    // 批量更新设置
    const { error } = await supabase
      .from('system_settings')
      .upsert(updates, {
        onConflict: 'setting_key',
        ignoreDuplicates: false
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Settings Update Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
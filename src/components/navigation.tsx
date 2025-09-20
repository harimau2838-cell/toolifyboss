'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, X, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/',
    label: '主页',
    icon: Home,
  },
  {
    href: '/favorites',
    label: '关注列表',
    icon: Heart,
  },
  {
    href: '/excluded',
    label: '排除列表',
    icon: X,
  },
  {
    href: '/settings',
    label: '系统设置',
    icon: Settings,
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">
                Toolify 监控
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            AI工具趋势监控系统
          </div>
        </div>

        {/* 移动端导航 */}
        <div className="md:hidden pb-4">
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navigation } from '@/components/navigation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Toolify AI工具趋势监控',
  description: '自动化监控和分析热门AI工具趋势',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Navigation />
        {children}
      </body>
    </html>
  )
}
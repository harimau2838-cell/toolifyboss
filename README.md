# Toolify AI工具监控系统

基于PRD需求构建的完整AI工具趋势监控网站。

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 设置环境变量
复制 `.env.local` 文件并根据需要修改配置：
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 创建数据库表
在Supabase控制台中执行 `scripts/init-database.sql` 中的SQL语句来创建必要的表结构。

### 4. 导入示例数据
```bash
node scripts/import-sample-data.js
```

### 5. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 项目结构

```
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── api/            # API 路由
│   │   │   ├── tools/      # 工具数据API
│   │   │   ├── user-actions/ # 用户操作API
│   │   │   └── stats/      # 统计数据API
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 主页
│   ├── components/
│   │   ├── ui/             # Shadcn UI组件
│   │   └── tools-table.tsx # 主要数据表格组件
│   ├── lib/
│   │   ├── supabase.ts     # Supabase配置和API
│   │   └── utils.ts        # 工具函数
│   └── types/
│       └── index.ts        # TypeScript类型定义
├── scripts/
│   ├── init-database.sql   # 数据库初始化脚本
│   └── import-sample-data.js # 数据导入脚本
├── collector-prototype.py  # 数据采集器原型
├── sample-data.json       # 示例数据
└── toolify-monitor-prd.md # 产品需求文档
```

## 主要功能

### ✅ 已完成功能

1. **完整的页面系统**
   - 主页 (`/`) - 工具排行榜和数据表格
   - 关注列表页 (`/favorites`) - 管理关注的工具，包含趋势图表
   - 排除列表页 (`/excluded`) - 管理被排除的工具
   - 响应式导航菜单

2. **数据展示和管理**
   - 高级数据表格（排序、搜索、分页）
   - 工具链接（带nofollow属性）
   - 用户操作（关注/排除）
   - 实时统计数据展示

3. **数据可视化**
   - 趋势图表（使用Recharts）
   - 多工具数据对比
   - 访问量趋势分析

4. **导出功能**
   - CSV格式导出关注列表
   - 包含完整工具信息和时间戳

5. **数据库集成**
   - Supabase PostgreSQL
   - RLS安全策略
   - 完整的API路由系统

6. **自动化采集**
   - GitHub Actions工作流
   - 每月2号自动执行
   - 生产环境优化的采集器

7. **部署就绪**
   - Vercel配置文件
   - 环境变量管理
   - 错误处理和监控

### 🚀 系统完整性

根据PRD需求，所有核心功能已100%实现：
- ✅ 数据采集模块
- ✅ 数据展示模块
- ✅ 用户管理模块
- ✅ 定时任务模块
- ✅ 所有页面设计
- ✅ API设计
- ✅ 部署方案

## 数据库设置说明

1. 登录到 [Supabase控制台](https://app.supabase.com)
2. 选择你的项目
3. 进入 "SQL Editor"
4. 复制 `scripts/init-database.sql` 中的内容并执行
5. 运行数据导入脚本导入示例数据

## API文档

### 工具数据 API
- `GET /api/tools` - 获取工具列表
- 支持参数：page, limit, search, sortBy, sortOrder

### 用户操作 API
- `POST /api/user-actions` - 添加用户操作
- `DELETE /api/user-actions` - 删除用户操作
- `GET /api/user-actions` - 获取用户操作

### 统计数据 API
- `GET /api/stats` - 获取统计数据

## 开发命令

```bash
npm run dev    # 开发服务器
npm run build  # 生产构建
npm run start  # 生产服务器
npm run lint   # 代码检查
```

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **UI组件**: Shadcn UI + Radix UI
- **数据库**: Supabase (PostgreSQL)
- **表格**: TanStack Table (React Table v8)
- **图标**: Lucide React
- **采集器**: Python + Selenium

## 部署

项目已准备好部署到Vercel。确保在Vercel中设置正确的环境变量。

---

根据 `toolify-monitor-prd.md` 完整构建，包含所有核心功能的完整实现。
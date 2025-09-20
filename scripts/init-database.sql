-- 创建工具数据表
CREATE TABLE IF NOT EXISTS toolify_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ranking INTEGER,
    tool_name VARCHAR(255) NOT NULL UNIQUE, -- 工具名称唯一，覆盖去重
    tool_url VARCHAR(500) NOT NULL,
    monthly_visits VARCHAR(100), -- 如: "5.8B"
    growth VARCHAR(100), -- 如: "126.6M"
    growth_rate VARCHAR(50), -- 如: "2.21%"
    description TEXT,
    tags TEXT, -- 工具标签
    collected_at TIMESTAMP DEFAULT NOW(),
    collection_batch VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建用户操作表
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name VARCHAR(255) NOT NULL,
    tool_url VARCHAR(500) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- 'favorite' | 'exclude'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tool_name, action_type) -- 防重复操作
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_toolify_tools_ranking ON toolify_tools(ranking);
CREATE INDEX IF NOT EXISTS idx_toolify_tools_tool_name ON toolify_tools(tool_name);
CREATE INDEX IF NOT EXISTS idx_toolify_tools_collected_at ON toolify_tools(collected_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_tool_name ON user_actions(tool_name);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);

-- 启用行级安全 (RLS)
ALTER TABLE toolify_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- 创建公共读取策略
CREATE POLICY "Enable read access for all users" ON toolify_tools
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON user_actions
    FOR SELECT USING (true);

-- 创建插入和更新策略
CREATE POLICY "Enable insert for all users" ON toolify_tools
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON toolify_tools
    FOR UPDATE USING (true);

CREATE POLICY "Enable insert for all users" ON user_actions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON user_actions
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON user_actions
    FOR DELETE USING (true);
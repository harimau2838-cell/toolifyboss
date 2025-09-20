-- 安全创建系统设置表（跳过已存在的策略）
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL, -- 'number', 'boolean', 'string', 'json'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认设置（如果不存在）
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('collection_target_count', '3000', 'number', '数据采集目标数量'),
('collection_enabled', 'true', 'boolean', '是否启用定时采集'),
('collection_frequency', 'monthly', 'string', '采集频率: daily, weekly, monthly'),
('collection_day_of_month', '2', 'number', '每月采集日期(1-28)'),
('collection_hour', '2', 'number', '采集时间(UTC小时,0-23)'),
('last_collection_time', '', 'string', '最后一次采集时间'),
('collection_status', 'idle', 'string', '采集状态: idle, running, completed, failed'),
('max_scroll_attempts', '60', 'number', '最大滚动尝试次数'),
('batch_size', '100', 'number', '数据库批量插入大小'),
('retry_attempts', '3', 'number', '失败重试次数')
ON CONFLICT (setting_key) DO NOTHING;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- 启用 RLS（如果未启用）
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）并重新创建
DROP POLICY IF EXISTS "Enable read access for all users" ON system_settings;
DROP POLICY IF EXISTS "Enable insert for all users" ON system_settings;
DROP POLICY IF EXISTS "Enable update for all users" ON system_settings;
DROP POLICY IF EXISTS "Enable delete for all users" ON system_settings;

-- 创建新策略
CREATE POLICY "Enable read access for all users" ON system_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON system_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON system_settings
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON system_settings
    FOR DELETE USING (true);
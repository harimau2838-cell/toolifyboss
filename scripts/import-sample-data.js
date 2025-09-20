const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 配置
const supabaseUrl = 'https://mylfpjdyqwqpoumdyibs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importSampleData() {
  try {
    // 读取示例数据
    const sampleDataPath = path.join(__dirname, '..', 'sample-data.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

    console.log(`🚀 开始导入 ${sampleData.length} 条示例数据...`);

    // 为每条数据添加时间戳和批次信息
    const toolsToInsert = sampleData.map(tool => ({
      ...tool,
      collected_at: new Date().toISOString(),
      collection_batch: `sample-${new Date().toISOString().split('T')[0]}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 批量插入数据（使用 upsert 避免重复）
    const batchSize = 50;
    for (let i = 0; i < toolsToInsert.length; i += batchSize) {
      const batch = toolsToInsert.slice(i, i + batchSize);

      console.log(`📊 正在导入第 ${i + 1} - ${Math.min(i + batchSize, toolsToInsert.length)} 条数据...`);

      const { data, error } = await supabase
        .from('toolify_tools')
        .upsert(batch, {
          onConflict: 'tool_name',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ 批次 ${i / batchSize + 1} 导入失败:`, error);
      } else {
        console.log(`✅ 批次 ${i / batchSize + 1} 导入成功`);
      }
    }

    // 验证导入结果
    const { data: tools, error: countError } = await supabase
      .from('toolify_tools')
      .select('id')
      .limit(1000);

    if (countError) {
      console.error('❌ 验证导入结果失败:', countError);
    } else {
      console.log(`🎉 导入完成！数据库中共有 ${tools.length} 条工具数据`);
    }

    // 显示前几条数据作为验证
    const { data: sampleTools, error: sampleError } = await supabase
      .from('toolify_tools')
      .select('ranking, tool_name, monthly_visits, growth_rate')
      .order('ranking', { ascending: true })
      .limit(5);

    if (!sampleError && sampleTools) {
      console.log('\n📋 前5条数据预览:');
      sampleTools.forEach(tool => {
        console.log(`${tool.ranking}. ${tool.tool_name} - 访问量: ${tool.monthly_visits} - 增长率: ${tool.growth_rate}`);
      });
    }

  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error);
  }
}

// 运行导入脚本
importSampleData();
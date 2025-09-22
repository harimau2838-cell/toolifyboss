#!/usr/bin/env python3
"""
快速测试版数据采集器 - 用于GitHub Actions调试
只采集少量数据进行连接和上传测试
"""

import os
import time
import json
import requests
from datetime import datetime

print("🚀 快速测试采集器启动...")

def test_environment():
    """测试环境和配置"""
    print("🔍 环境检查...")

    # 检查环境变量
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')
    target = os.getenv('INPUT_TARGET_COUNT', '5')

    print(f"   SUPABASE_URL: {'✅' if url else '❌'}")
    print(f"   SUPABASE_ANON_KEY: {'✅' if key else '❌'}")
    print(f"   TARGET_COUNT: {target}")

    if not url or not key:
        print("❌ 环境变量缺失")
        return False

    # 测试数据库连接
    try:
        headers = {
            'apikey': key.strip(),
            'Authorization': f'Bearer {key.strip()}',
            'Content-Type': 'application/json'
        }

        response = requests.get(f'{url.strip()}/rest/v1/toolify_tools?limit=1', headers=headers, timeout=10)

        if response.status_code == 200:
            print("✅ 数据库连接正常")
            return True
        else:
            print(f"❌ 数据库连接失败: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ 连接测试异常: {e}")
        return False

def create_mock_data(count=5):
    """创建模拟数据进行测试"""
    print(f"🎭 创建 {count} 条模拟测试数据...")

    mock_tools = []

    for i in range(count):
        tool_data = {
            "ranking": i + 1,
            "tool_name": f"QuickTest Tool {i+1} - {datetime.now().strftime('%H%M%S')}",
            "tool_url": f"https://example.com/tool-{i+1}",
            "monthly_visits": f"{(i+1)*10}K",
            "growth": f"{(i+1)*100}",
            "growth_rate": f"{(i+1)*2}.5%",
            "description": f"This is test tool number {i+1} for quick validation",
            "tags": f"test, quick, tool{i+1}",
            "collected_at": datetime.now().isoformat(),
            "collection_batch": f"quick-test-{datetime.now().strftime('%Y-%m-%d-%H%M')}"
        }
        mock_tools.append(tool_data)

    print("✅ 模拟数据创建完成")
    return mock_tools

def upload_test_data(tools_data):
    """上传测试数据"""
    print(f"📤 上传 {len(tools_data)} 条测试数据...")

    url = os.getenv('SUPABASE_URL').strip()
    key = os.getenv('SUPABASE_ANON_KEY').strip()

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    success_count = 0

    for i, tool in enumerate(tools_data):
        try:
            response = requests.post(
                f'{url}/rest/v1/toolify_tools',
                headers=headers,
                json=tool,
                timeout=15
            )

            if response.status_code in [200, 201]:
                success_count += 1
                print(f"   ✅ {i+1}/{len(tools_data)}: {tool['tool_name']}")
            else:
                print(f"   ❌ {i+1}/{len(tools_data)}: 失败 {response.status_code}")

        except Exception as e:
            print(f"   ❌ {i+1}/{len(tools_data)}: 异常 {e}")

    print(f"📊 上传完成: {success_count}/{len(tools_data)} 成功")
    return success_count > 0

def main():
    """主函数"""
    print("=" * 50)
    print("🧪 快速测试模式 - GitHub Actions调试")
    print("=" * 50)

    # 1. 环境测试
    if not test_environment():
        print("💥 环境测试失败")
        exit(1)

    # 2. 获取目标数量
    target_count = int(os.getenv('INPUT_TARGET_COUNT', '5'))
    target_count = min(target_count, 10)  # 最多测试10条

    print(f"🎯 快速测试目标: {target_count} 条数据")

    # 3. 创建测试数据
    test_data = create_mock_data(target_count)

    # 4. 保存备份
    backup_file = f"./quick-test-backup-{datetime.now().strftime('%Y%m%d-%H%M')}.json"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    print(f"💾 备份已保存: {backup_file}")

    # 5. 上传测试
    upload_success = upload_test_data(test_data)

    if upload_success:
        print("🎉 快速测试成功完成！")
        print("📋 这证明:")
        print("   ✅ 环境变量配置正确")
        print("   ✅ 数据库连接正常")
        print("   ✅ 数据上传功能可用")
        print("   ✅ GitHub Actions基础设施工作正常")
    else:
        print("💥 快速测试失败")
        exit(1)

if __name__ == "__main__":
    main()
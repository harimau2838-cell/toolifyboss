#!/usr/bin/env python3
"""
简化的上传测试脚本，用于调试数据库连接和上传问题
"""

import os
import requests
import json
from datetime import datetime

def test_supabase_connection():
    """测试Supabase连接"""
    print("🔍 测试Supabase数据库连接...")

    # 检查环境变量
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    print(f"📊 环境变量状态:")
    print(f"   SUPABASE_URL: {'✅ 已设置' if url else '❌ 未设置'}")
    print(f"   SUPABASE_ANON_KEY: {'✅ 已设置' if key else '❌ 未设置'}")

    if not url or not key:
        print("❌ 环境变量缺失")
        return False

    # 清理环境变量
    url = url.strip()
    key = key.strip()

    print(f"🔗 数据库URL: {url[:50]}...")
    print(f"🔑 API密钥长度: {len(key)} 字符")
    print(f"🔑 密钥开头: {key[:10]}...")
    print(f"🔑 密钥结尾: ...{key[-10:]}")

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 测试连接 - 获取表信息
        print("📡 测试数据库连接...")
        response = requests.get(f'{url}/rest/v1/toolify_tools?limit=1', headers=headers, timeout=10)

        print(f"📊 响应状态码: {response.status_code}")
        print(f"📋 响应头: {dict(response.headers)}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ 连接成功！表中有 {len(data)} 条数据")
            return True
        else:
            print(f"❌ 连接失败: {response.status_code}")
            print(f"📋 错误详情: {response.text}")
            return False

    except Exception as e:
        print(f"❌ 连接异常: {e}")
        return False

def test_single_insert():
    """测试单条数据插入"""
    print("\n🧪 测试单条数据插入...")

    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        print("❌ 环境变量缺失")
        return False

    headers = {
        'apikey': key.strip(),
        'Authorization': f'Bearer {key.strip()}',
        'Content-Type': 'application/json'
    }

    # 创建测试数据
    test_tool = {
        "ranking": 9999,
        "tool_name": f"Test Tool {datetime.now().strftime('%Y%m%d%H%M%S')}",
        "tool_url": "https://example.com/test-tool",
        "monthly_visits": "1.2K",
        "growth": "100",
        "growth_rate": "5.0%",
        "description": "This is a test tool for debugging upload issues",
        "tags": "test, debug",
        "collected_at": datetime.now().isoformat(),
        "collection_batch": f"debug-test-{datetime.now().strftime('%Y-%m-%d')}"
    }

    try:
        print(f"📤 插入测试数据: {test_tool['tool_name']}")
        response = requests.post(
            f'{url.strip()}/rest/v1/toolify_tools',
            headers=headers,
            json=test_tool,
            timeout=30
        )

        print(f"📊 插入响应状态码: {response.status_code}")

        if response.status_code in [200, 201]:
            print("✅ 单条数据插入成功！")
            return True
        else:
            print(f"❌ 插入失败: {response.status_code}")
            print(f"📋 错误详情: {response.text}")
            return False

    except Exception as e:
        print(f"❌ 插入异常: {e}")
        return False

def test_upsert():
    """测试UPSERT功能（处理重复数据）"""
    print("\n🔄 测试UPSERT功能...")

    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        print("❌ 环境变量缺失")
        return False

    headers = {
        'apikey': key.strip(),
        'Authorization': f'Bearer {key.strip()}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }

    # 创建可能重复的测试数据
    test_tool = {
        "ranking": 9998,
        "tool_name": "ChatGPT",  # 使用可能已存在的工具名
        "tool_url": "https://example.com/chatgpt-updated",
        "monthly_visits": "999.9B",
        "growth": "999999",
        "growth_rate": "999.99%",
        "description": "Updated description for testing UPSERT",
        "tags": "ai, chat, updated",
        "collected_at": datetime.now().isoformat(),
        "collection_batch": f"debug-upsert-{datetime.now().strftime('%Y-%m-%d')}"
    }

    try:
        print(f"🔄 UPSERT测试数据: {test_tool['tool_name']}")
        response = requests.post(
            f'{url.strip()}/rest/v1/toolify_tools',
            headers=headers,
            json=test_tool,
            timeout=30
        )

        print(f"📊 UPSERT响应状态码: {response.status_code}")

        if response.status_code in [200, 201]:
            print("✅ UPSERT成功！")
            return True
        elif response.status_code == 409:
            print("⚠️ 发现重复数据，这是预期的")
            # 尝试使用PUT方法更新
            print("🔄 尝试使用PUT方法更新...")
            put_response = requests.put(
                f'{url.strip()}/rest/v1/toolify_tools?tool_name=eq.{test_tool["tool_name"]}',
                headers=headers,
                json=test_tool,
                timeout=30
            )
            print(f"📊 PUT响应状态码: {put_response.status_code}")
            return put_response.status_code in [200, 204]
        else:
            print(f"❌ UPSERT失败: {response.status_code}")
            print(f"📋 错误详情: {response.text}")
            return False

    except Exception as e:
        print(f"❌ UPSERT异常: {e}")
        return False

def main():
    """主函数"""
    print("🔧 Supabase连接和上传调试工具")
    print("=" * 50)

    # 测试1: 数据库连接
    connection_ok = test_supabase_connection()

    if not connection_ok:
        print("💥 数据库连接失败，停止测试")
        return

    # 测试2: 单条数据插入
    insert_ok = test_single_insert()

    # 测试3: UPSERT功能
    upsert_ok = test_upsert()

    print("\n📊 测试结果总结:")
    print(f"   数据库连接: {'✅' if connection_ok else '❌'}")
    print(f"   单条插入: {'✅' if insert_ok else '❌'}")
    print(f"   UPSERT功能: {'✅' if upsert_ok else '❌'}")

    if connection_ok and insert_ok and upsert_ok:
        print("\n🎉 所有测试通过！数据库连接和上传功能正常")
    else:
        print("\n⚠️ 部分测试失败，需要进一步调试")

if __name__ == "__main__":
    main()
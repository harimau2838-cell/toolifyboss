#!/usr/bin/env python3
"""
测试API返回的统计数据
"""

import requests

def test_stats_api():
    """测试统计API"""
    print("测试/api/stats API...")

    try:
        # 测试统计API
        response = requests.get("https://toolifyaoss.vercel.app/api/stats", timeout=30)
        print(f"状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"API响应: {data}")

            if data.get('success'):
                stats = data.get('data', {})
                print(f"\n统计数据:")
                print(f"  总工具数: {stats.get('total_tools', 'N/A')}")
                print(f"  最近新增: {stats.get('monthly_new', 'N/A')}")
                print(f"  关注数量: {stats.get('favorites_count', 'N/A')}")
                print(f"  排除数量: {stats.get('excluded_count', 'N/A')}")
                print(f"  最后采集: {stats.get('last_collection', 'N/A')}")
                print(f"  时间戳: {data.get('timestamp', 'N/A')}")
            else:
                print(f"API返回错误: {data}")
        else:
            print(f"API请求失败: {response.text}")

    except Exception as e:
        print(f"测试API出错: {e}")

def test_direct_database():
    """直接测试数据库"""
    print("\n直接测试数据库...")

    url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 直接查询数据库
        response = requests.get(f'{url}/rest/v1/toolify_tools?select=id', headers=headers, timeout=30)

        if response.status_code == 200:
            data = response.json()
            print(f"数据库实际记录数: {len(data)}")

            if len(data) > 0:
                print("数据库还有数据，删除可能不完全")
                for i, record in enumerate(data[:5]):
                    print(f"  记录{i+1}: {record}")
            else:
                print("数据库确实为空")
        else:
            print(f"数据库查询失败: {response.status_code} {response.text}")

    except Exception as e:
        print(f"数据库测试出错: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("API和数据库一致性测试")
    print("=" * 50)

    test_stats_api()
    test_direct_database()

    print("\n测试完成")
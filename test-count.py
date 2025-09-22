#!/usr/bin/env python3
"""
测试Supabase count查询
"""

import requests

def test_count_query():
    """测试不同的count查询方法"""
    print("测试Supabase count查询...")

    url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 方法1: 普通查询获取所有数据计数
        print("\n方法1: 获取所有数据计数")
        normal_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=id',
            headers=headers,
            timeout=30
        )
        if normal_response.status_code == 200:
            data = normal_response.json()
            print(f"✓ 普通查询结果: {len(data)} 条记录")
        else:
            print(f"✗ 普通查询失败: {normal_response.status_code}")

        # 方法2: 使用count头查询
        print("\n方法2: 使用count头查询")
        count_headers = {**headers, 'Prefer': 'count=exact'}
        count_response = requests.head(
            f'{url}/rest/v1/toolify_tools',
            headers=count_headers,
            timeout=30
        )
        if count_response.status_code == 200:
            content_range = count_response.headers.get('content-range', '')
            print(f"✓ Content-Range头: {content_range}")
            if '/' in content_range:
                count = content_range.split('/')[-1]
                print(f"✓ count头查询结果: {count} 条记录")
        else:
            print(f"✗ count头查询失败: {count_response.status_code}")

        # 方法3: 使用GET查询+count头
        print("\n方法3: 使用GET查询+count头")
        get_count_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=id',
            headers=count_headers,
            timeout=30
        )
        if get_count_response.status_code == 200:
            data = get_count_response.json()
            content_range = get_count_response.headers.get('content-range', '')
            print(f"✓ 数据条数: {len(data)}")
            print(f"✓ Content-Range: {content_range}")
        else:
            print(f"✗ GET+count查询失败: {get_count_response.status_code}")

        # 方法4: 尝试不同的count语法
        print("\n方法4: 测试PostgREST count语法")
        try:
            # 尝试使用count函数
            func_response = requests.get(
                f'{url}/rest/v1/rpc/count_tools',  # 如果有这个函数的话
                headers=headers,
                timeout=30
            )
            print(f"RPC count函数: {func_response.status_code}")
        except:
            print("RPC count函数不存在")

    except Exception as e:
        print(f"测试过程出错: {e}")

if __name__ == "__main__":
    test_count_query()
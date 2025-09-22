#!/usr/bin/env python3
"""
检查数据库真实数量脚本
"""

import requests

def check_real_count():
    """检查数据库的真实记录数量"""
    print("检查数据库真实状态...")

    # 数据库连接信息
    url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 方法1: 获取所有记录来计数
        print("方法1: 获取所有记录...")
        all_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=id,tool_name,collected_at',
            headers=headers,
            timeout=30
        )

        if all_response.status_code == 200:
            all_records = all_response.json()
            print(f"✓ 实际记录数: {len(all_records)} 条")

            if all_records:
                print("\n最新的5条记录:")
                # 按时间排序显示最新的
                sorted_records = sorted(all_records, key=lambda x: x.get('collected_at', ''), reverse=True)
                for i, record in enumerate(sorted_records[:5]):
                    print(f"  {i+1}. {record.get('tool_name', 'N/A')} ({record.get('collected_at', 'N/A')[:19]})")

                print("\n最老的5条记录:")
                for i, record in enumerate(sorted_records[-5:]):
                    print(f"  {i+1}. {record.get('tool_name', 'N/A')} ({record.get('collected_at', 'N/A')[:19]})")

        else:
            print(f"✗ 获取记录失败: {all_response.status_code}")
            print(f"错误详情: {all_response.text}")

        # 方法2: 尝试使用count函数
        print(f"\n方法2: 使用count查询...")
        count_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=*&head=true',
            headers={**headers, 'Prefer': 'count=exact'},
            timeout=30
        )

        if count_response.status_code == 200:
            count_header = count_response.headers.get('content-range', '')
            if count_header:
                print(f"✓ Content-Range: {count_header}")
            else:
                print("✗ 未找到count信息")
        else:
            print(f"✗ Count查询失败: {count_response.status_code}")

        # 方法3: 检查今天的数据
        print(f"\n方法3: 检查今天的数据...")
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')

        today_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=*&collected_at=gte.{today}T00:00:00',
            headers=headers,
            timeout=30
        )

        if today_response.status_code == 200:
            today_records = today_response.json()
            print(f"✓ 今天采集的记录: {len(today_records)} 条")

            if today_records:
                print("今天采集的数据样本:")
                for i, record in enumerate(today_records[:3]):
                    print(f"  {i+1}. {record.get('tool_name', 'N/A')}")

        # 方法4: 检查不同批次的数据
        print(f"\n方法4: 检查数据批次...")
        batch_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=collection_batch&group=collection_batch',
            headers=headers,
            timeout=30
        )

        if batch_response.status_code == 200:
            batches = batch_response.json()
            print(f"✓ 发现 {len(batches)} 个采集批次:")
            for batch in batches:
                batch_name = batch.get('collection_batch', 'Unknown')
                print(f"  - {batch_name}")

    except Exception as e:
        print(f"检查过程出错: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("数据库真实状态检查")
    print("=" * 50)
    check_real_count()
    print("\n检查完成")
#!/usr/bin/env python3
import requests

url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

# 1. 检查总数
print("=== Database Check ===")
response = requests.get(f'{url}/rest/v1/toolify_tools?select=id,tool_name,collection_batch,created_at', headers=headers)
if response.status_code == 200:
    data = response.json()
    print(f"Total records: {len(data)}")

    if data:
        print("\nFirst 3 records:")
        for i, record in enumerate(data[:3]):
            print(f"  {i+1}. {record.get('tool_name', 'N/A')} | batch: {record.get('collection_batch', 'N/A')} | created: {record.get('created_at', 'N/A')[:19]}")

        # 检查批次
        batches = list(set([r.get('collection_batch') for r in data if r.get('collection_batch')]))
        print(f"\nUnique batches: {len(batches)}")
        for batch in batches:
            count = len([r for r in data if r.get('collection_batch') == batch])
            print(f"  {batch}: {count} records")
    else:
        print("No records found")
else:
    print(f"Failed to query database: {response.status_code}")

# 2. 模拟统计逻辑
print("\n=== Simulate Stats Logic ===")
if data:
    from datetime import datetime

    # 计算总数
    total = len(data)

    # 计算今日记录数
    now = datetime.now()
    today = datetime(now.year, now.month, now.day)

    today_records = 0
    for record in data:
        created_str = record.get('created_at', '')
        if created_str:
            # 解析日期字符串 (ISO format)
            created_dt = datetime.fromisoformat(created_str.replace('Z', '+00:00').replace('+00:00', ''))
            created_day = datetime(created_dt.year, created_dt.month, created_dt.day)
            if created_day == today:
                today_records += 1

    print(f"Simulated stats:")
    print(f"  Total tools: {total}")
    print(f"  Today records: {today_records}")

# 3. 检查API
print("\n=== API Check ===")
try:
    api_response = requests.get("https://toolifyaoss.vercel.app/api/stats")
    if api_response.status_code == 200:
        api_data = api_response.json()
        print(f"API response: {api_data}")
    else:
        print(f"API failed: {api_response.status_code}")
except Exception as e:
    print(f"API error: {e}")
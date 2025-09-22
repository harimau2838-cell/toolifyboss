#!/usr/bin/env python3
"""
直接清理数据库脚本
"""

import requests

def clear_database():
    """清除数据库中的测试数据"""
    print("Starting database cleanup...")

    # 直接设置连接信息
    url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

    print(f"Connecting to database: {url[:50]}...")

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 查看当前数据量
        print("Checking current data count...")
        count_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=*',
            headers=headers,
            timeout=30
        )

        if count_response.status_code == 200:
            data = count_response.json()
            current_count = len(data) if data else 0
            print(f"Current database has {current_count} records")
        else:
            print(f"Cannot get data count: {count_response.status_code}")
            print(f"Response: {count_response.text}")

        # 清除所有工具数据
        print("Deleting all tool data...")
        delete_response = requests.delete(
            f'{url}/rest/v1/toolify_tools?ranking=gte.1',
            headers=headers,
            timeout=60
        )

        print(f"Delete response status: {delete_response.status_code}")

        if delete_response.status_code in [200, 204]:
            print("Tool data cleanup completed")
        else:
            print(f"Tool data cleanup failed: {delete_response.status_code}")
            print(f"Error details: {delete_response.text}")

        # 清除用户操作数据
        print("Deleting all user action data...")
        user_delete_response = requests.delete(
            f'{url}/rest/v1/user_actions?action_type=in.(favorite,exclude)',
            headers=headers,
            timeout=60
        )

        print(f"User actions delete response status: {user_delete_response.status_code}")

        if user_delete_response.status_code in [200, 204]:
            print("User action data cleanup completed")
        else:
            print(f"User action data cleanup failed: {user_delete_response.status_code}")

        # 验证清理结果
        print("Verifying cleanup results...")
        verify_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=*',
            headers=headers,
            timeout=30
        )

        if verify_response.status_code == 200:
            data = verify_response.json()
            remaining_count = len(data) if data else 0
            print(f"After cleanup: {remaining_count} records remaining")

            if remaining_count == 0:
                print("SUCCESS: Database cleanup successful! All test data deleted")
                return True
            else:
                print(f"WARNING: Still have {remaining_count} records not deleted")
                return False
        else:
            print(f"Cannot verify cleanup results: {verify_response.status_code}")
            return False

    except Exception as e:
        print(f"Cleanup process error: {e}")
        import traceback
        print(f"Detailed error: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Database Cleanup Tool")
    print("=" * 50)

    success = clear_database()

    if success:
        print("Database cleanup task completed!")
    else:
        print("Database cleanup may not be fully successful")
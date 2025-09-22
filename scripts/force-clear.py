#!/usr/bin/env python3
"""
强制清理数据库脚本 - 分批删除
"""

import requests
import time

def force_clear_database():
    """强制清除数据库中的所有数据"""
    print("Starting force database cleanup...")

    url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 先获取所有数据的ID
        print("Getting all record IDs...")
        get_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=id',
            headers=headers,
            timeout=30
        )

        if get_response.status_code == 200:
            records = get_response.json()
            print(f"Found {len(records)} records to delete")

            # 分批删除
            batch_size = 50
            deleted_count = 0

            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                print(f"Deleting batch {i//batch_size + 1}: {len(batch)} records")

                for record in batch:
                    record_id = record['id']
                    try:
                        delete_response = requests.delete(
                            f'{url}/rest/v1/toolify_tools?id=eq.{record_id}',
                            headers=headers,
                            timeout=30
                        )

                        if delete_response.status_code in [200, 204]:
                            deleted_count += 1
                        else:
                            print(f"Failed to delete {record_id}: {delete_response.status_code}")

                    except Exception as e:
                        print(f"Error deleting {record_id}: {e}")

                print(f"Batch completed. Total deleted: {deleted_count}")
                time.sleep(1)  # 避免API限制

            print(f"Deletion completed. Total deleted: {deleted_count} out of {len(records)}")

        else:
            print(f"Failed to get records: {get_response.status_code}")
            print(f"Response: {get_response.text}")

        # 验证清理结果
        print("Verifying cleanup results...")
        verify_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=*',
            headers=headers,
            timeout=30
        )

        if verify_response.status_code == 200:
            remaining_data = verify_response.json()
            remaining_count = len(remaining_data) if remaining_data else 0
            print(f"After cleanup: {remaining_count} records remaining")

            if remaining_count == 0:
                print("SUCCESS: All data deleted!")
                return True
            else:
                print(f"WARNING: Still have {remaining_count} records")
                return False
        else:
            print(f"Cannot verify results: {verify_response.status_code}")
            return False

    except Exception as e:
        print(f"Force cleanup error: {e}")
        import traceback
        print(f"Detailed error: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Force Database Cleanup Tool")
    print("=" * 50)

    success = force_clear_database()

    if success:
        print("Force cleanup task completed!")
    else:
        print("Force cleanup may not be fully successful")
#!/usr/bin/env python3
"""
最终清理脚本
"""

import requests

def final_clear():
    """最终清理剩余数据"""
    print("Final cleanup of remaining data...")

    url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 获取所有剩余数据
        print("Getting all remaining records...")
        all_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=id,tool_name',
            headers=headers,
            timeout=30
        )

        if all_response.status_code == 200:
            all_records = all_response.json()
            print(f"Found {len(all_records)} remaining records")

            if all_records:
                print("Deleting remaining records one by one:")
                deleted_count = 0

                for record in all_records:
                    record_id = record['id']
                    tool_name = record.get('tool_name', 'Unknown')

                    try:
                        delete_response = requests.delete(
                            f'{url}/rest/v1/toolify_tools?id=eq.{record_id}',
                            headers=headers,
                            timeout=30
                        )

                        if delete_response.status_code in [200, 204]:
                            deleted_count += 1
                            print(f"  Deleted: {tool_name}")
                        else:
                            print(f"  Failed to delete {tool_name}: {delete_response.status_code}")

                    except Exception as e:
                        print(f"  Error deleting {tool_name}: {e}")

                print(f"Final deletion completed: {deleted_count}/{len(all_records)} deleted")
            else:
                print("No records found to delete")

        # 最终验证
        print("\nFinal verification...")
        verify_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=id',
            headers=headers,
            timeout=30
        )

        if verify_response.status_code == 200:
            remaining_records = verify_response.json()
            final_count = len(remaining_records) if remaining_records else 0
            print(f"Final count: {final_count} records remaining")

            if final_count == 0:
                print("SUCCESS: Database is now completely clean!")
                return True
            else:
                print(f"WARNING: Still have {final_count} records remaining")
                return False
        else:
            print(f"Cannot verify final status: {verify_response.status_code}")
            return False

    except Exception as e:
        print(f"Final cleanup error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Final Database Cleanup")
    print("=" * 50)

    success = final_clear()

    if success:
        print("Database is now ready for fresh data collection!")
    else:
        print("Some data may still remain in the database")
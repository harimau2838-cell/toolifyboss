#!/usr/bin/env python3
"""
检查数据库状态
"""

import requests

def check_database():
    """检查数据库状态"""
    print("Checking database status...")

    url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 检查工具数据
        print("Checking toolify_tools table...")
        tools_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=*&limit=5',
            headers=headers,
            timeout=30
        )

        if tools_response.status_code == 200:
            tools_data = tools_response.json()
            print(f"Tools table: {len(tools_data)} records (showing first 5)")
            if tools_data:
                for i, tool in enumerate(tools_data[:3]):
                    print(f"  {i+1}. {tool.get('tool_name', 'N/A')} (ID: {tool.get('id', 'N/A')})")
        else:
            print(f"Tools table error: {tools_response.status_code}")

        # 检查用户操作数据
        print("\nChecking user_actions table...")
        actions_response = requests.get(
            f'{url}/rest/v1/user_actions?select=*&limit=5',
            headers=headers,
            timeout=30
        )

        if actions_response.status_code == 200:
            actions_data = actions_response.json()
            print(f"User actions table: {len(actions_data)} records")
        else:
            print(f"User actions table error: {actions_response.status_code}")

        # 检查系统设置
        print("\nChecking system_settings table...")
        settings_response = requests.get(
            f'{url}/rest/v1/system_settings?select=*',
            headers=headers,
            timeout=30
        )

        if settings_response.status_code == 200:
            settings_data = settings_response.json()
            print(f"System settings table: {len(settings_data)} records")
            if settings_data:
                for setting in settings_data:
                    print(f"  {setting.get('setting_key', 'N/A')}: {setting.get('setting_value', 'N/A')}")
        else:
            print(f"System settings table error: {settings_response.status_code}")

    except Exception as e:
        print(f"Check database error: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("Database Status Check")
    print("=" * 50)
    check_database()
#!/usr/bin/env python3
"""
完全清理数据库脚本 - 手动运行版本
"""

import requests

def clear_all_data():
    """完全清理数据库中的所有数据"""
    print("开始完全清理数据库...")

    # 数据库连接信息
    url = "https://mylfpjdyqwqpoumdyibs.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bGZwamR5cXdxcG91bWR5aWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQwOTUsImV4cCI6MjA3MzkyMDA5NX0.KtbwRPEJbjAXtonT8Wwsbr8KnLqDtBQo2yTEENf3xss"

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 1. 查看清理前状态
        print("步骤1: 查看清理前状态...")
        count_response = requests.get(f'{url}/rest/v1/toolify_tools?select=id', headers=headers)

        if count_response.status_code == 200:
            current_records = count_response.json()
            print(f"发现 {len(current_records)} 条记录需要清理")

            if len(current_records) == 0:
                print("数据库已经是空的！")
                return True
        else:
            print(f"无法获取数据状态: {count_response.status_code}")
            return False

        # 2. 获取所有记录ID并逐个删除
        print("步骤2: 获取所有记录...")
        all_response = requests.get(f'{url}/rest/v1/toolify_tools?select=id,tool_name', headers=headers)

        if all_response.status_code == 200:
            all_records = all_response.json()
            print(f"准备删除 {len(all_records)} 条记录")

            success_count = 0
            for i, record in enumerate(all_records):
                record_id = record['id']
                tool_name = record.get('tool_name', 'Unknown')

                print(f"删除 {i+1}/{len(all_records)}: {tool_name[:30]}...")

                delete_response = requests.delete(
                    f'{url}/rest/v1/toolify_tools?id=eq.{record_id}',
                    headers=headers,
                    timeout=30
                )

                if delete_response.status_code in [200, 204]:
                    success_count += 1
                    print(f"  ✓ 删除成功")
                else:
                    print(f"  ✗ 删除失败: {delete_response.status_code}")

            print(f"删除操作完成: {success_count}/{len(all_records)} 成功")
        else:
            print(f"无法获取记录列表: {all_response.status_code}")

        # 3. 清理用户操作数据
        print("步骤3: 清理用户操作数据...")
        user_response = requests.get(f'{url}/rest/v1/user_actions?select=id', headers=headers)

        if user_response.status_code == 200:
            user_records = user_response.json()
            if len(user_records) > 0:
                print(f"发现 {len(user_records)} 条用户操作记录")

                for record in user_records:
                    requests.delete(
                        f'{url}/rest/v1/user_actions?id=eq.{record["id"]}',
                        headers=headers,
                        timeout=30
                    )
                print("用户操作数据清理完成")
            else:
                print("无用户操作数据需要清理")

        # 4. 最终验证
        print("步骤4: 最终验证...")
        verify_response = requests.get(f'{url}/rest/v1/toolify_tools?select=id', headers=headers)

        if verify_response.status_code == 200:
            remaining = verify_response.json()
            final_count = len(remaining)

            print(f"最终结果: 还剩 {final_count} 条记录")

            if final_count == 0:
                print("🎉 SUCCESS: 数据库完全清空!")
                return True
            else:
                print("⚠️  WARNING: 还有数据未删除")
                for record in remaining:
                    print(f"  剩余记录 ID: {record['id']}")
                return False
        else:
            print("无法验证最终结果")
            return False

    except Exception as e:
        print(f"清理过程出错: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("数据库完全清理工具")
    print("=" * 50)

    success = clear_all_data()

    if success:
        print("\n✅ 数据库清理完成! 可以开始新的测试了")
    else:
        print("\n❌ 数据库清理未完全成功，可能需要手动处理")

    print("\n运行完成，请检查上述输出结果")
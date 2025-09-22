#!/usr/bin/env python3
"""
简化数据库清理脚本
"""

import os
import requests

def clear_database():
    """清除数据库中的测试数据"""
    print("开始清理数据库...")

    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        print("错误: 环境变量缺失")
        return False

    url = url.strip()
    key = key.strip()

    print(f"连接数据库: {url[:50]}...")

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 查看当前数据量
        print("查询当前数据量...")
        count_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=count(*)',
            headers=headers,
            timeout=30
        )

        if count_response.status_code == 200:
            data = count_response.json()
            current_count = data[0]['count'] if data else 0
            print(f"当前数据库中有 {current_count} 条记录")
        else:
            print(f"无法获取数据量: {count_response.status_code}")

        # 清除所有工具数据
        print("删除所有工具数据...")
        delete_response = requests.delete(
            f'{url}/rest/v1/toolify_tools?id=neq.null',
            headers=headers,
            timeout=60
        )

        if delete_response.status_code in [200, 204]:
            print("工具数据清理完成")
        else:
            print(f"工具数据清理失败: {delete_response.status_code}")
            print(f"错误详情: {delete_response.text}")

        # 清除用户操作数据
        print("删除所有用户操作数据...")
        user_delete_response = requests.delete(
            f'{url}/rest/v1/user_actions?id=neq.null',
            headers=headers,
            timeout=60
        )

        if user_delete_response.status_code in [200, 204]:
            print("用户操作数据清理完成")
        else:
            print(f"用户操作数据清理失败: {user_delete_response.status_code}")

        # 验证清理结果
        print("验证清理结果...")
        verify_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=count(*)',
            headers=headers,
            timeout=30
        )

        if verify_response.status_code == 200:
            data = verify_response.json()
            remaining_count = data[0]['count'] if data else 0
            print(f"清理后剩余 {remaining_count} 条记录")

            if remaining_count == 0:
                print("SUCCESS: 数据库清理成功！所有测试数据已删除")
                return True
            else:
                print(f"WARNING: 还有 {remaining_count} 条记录未删除")
                return False
        else:
            print(f"无法验证清理结果: {verify_response.status_code}")
            return False

    except Exception as e:
        print(f"清理过程出错: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("数据库清理工具")
    print("=" * 50)

    success = clear_database()

    if success:
        print("数据库清理任务完成！")
    else:
        print("数据库清理可能未完全成功")
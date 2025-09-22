#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库清理脚本 - 删除测试数据
"""

import os
import sys
import requests
from datetime import datetime

# 设置Windows编码
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def clear_database():
    """清除数据库中的测试数据"""
    print("🗑️ 开始清理数据库...")

    # 检查环境变量
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        print("❌ 环境变量缺失")
        print("请设置 SUPABASE_URL 和 SUPABASE_ANON_KEY")
        return False

    # 清理环境变量
    url = url.strip()
    key = key.strip()

    print(f"🔗 连接数据库: {url[:50]}...")

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        # 1. 查看当前数据量
        print("📊 查询当前数据量...")
        count_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=count(*)',
            headers=headers,
            timeout=30
        )

        if count_response.status_code == 200:
            current_count = count_response.json()[0]['count'] if count_response.json() else 0
            print(f"📋 当前数据库中有 {current_count} 条记录")
        else:
            print(f"⚠️ 无法获取数据量: {count_response.status_code}")

        # 2. 清除所有数据
        print("🗑️ 删除所有工具数据...")
        delete_response = requests.delete(
            f'{url}/rest/v1/toolify_tools?id=neq.null',  # 删除所有记录
            headers=headers,
            timeout=60
        )

        if delete_response.status_code in [200, 204]:
            print("✅ 工具数据清理完成")
        else:
            print(f"❌ 工具数据清理失败: {delete_response.status_code} {delete_response.text}")

        # 3. 清除用户操作数据
        print("🗑️ 删除所有用户操作数据...")
        user_delete_response = requests.delete(
            f'{url}/rest/v1/user_actions?id=neq.null',  # 删除所有记录
            headers=headers,
            timeout=60
        )

        if user_delete_response.status_code in [200, 204]:
            print("✅ 用户操作数据清理完成")
        else:
            print(f"❌ 用户操作数据清理失败: {user_delete_response.status_code} {user_delete_response.text}")

        # 4. 验证清理结果
        print("🔍 验证清理结果...")
        verify_response = requests.get(
            f'{url}/rest/v1/toolify_tools?select=count(*)',
            headers=headers,
            timeout=30
        )

        if verify_response.status_code == 200:
            remaining_count = verify_response.json()[0]['count'] if verify_response.json() else 0
            print(f"📋 清理后剩余 {remaining_count} 条记录")

            if remaining_count == 0:
                print("🎉 数据库清理成功！所有测试数据已删除")
                return True
            else:
                print(f"⚠️ 还有 {remaining_count} 条记录未删除")
                return False
        else:
            print(f"❌ 无法验证清理结果: {verify_response.status_code}")
            return False

    except Exception as e:
        print(f"❌ 清理过程出错: {e}")
        return False

def show_database_stats():
    """显示数据库统计信息"""
    print("📊 数据库统计信息:")

    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        print("❌ 环境变量缺失")
        return

    headers = {
        'apikey': key.strip(),
        'Authorization': f'Bearer {key.strip()}',
        'Content-Type': 'application/json'
    }

    try:
        # 工具数据统计
        tools_response = requests.get(
            f'{url.strip()}/rest/v1/toolify_tools?select=count(*)',
            headers=headers,
            timeout=30
        )

        # 用户操作统计
        actions_response = requests.get(
            f'{url.strip()}/rest/v1/user_actions?select=count(*)',
            headers=headers,
            timeout=30
        )

        if tools_response.status_code == 200:
            tools_count = tools_response.json()[0]['count'] if tools_response.json() else 0
            print(f"   🔧 工具数据: {tools_count} 条")

        if actions_response.status_code == 200:
            actions_count = actions_response.json()[0]['count'] if actions_response.json() else 0
            print(f"   👤 用户操作: {actions_count} 条")

    except Exception as e:
        print(f"❌ 获取统计信息失败: {e}")

def main():
    """主函数"""
    print("=" * 50)
    print("🗑️ 数据库清理工具")
    print("=" * 50)

    # 显示清理前状态
    print("📋 清理前状态:")
    show_database_stats()
    print()

    # 执行清理
    success = clear_database()
    print()

    # 显示清理后状态
    print("📋 清理后状态:")
    show_database_stats()

    if success:
        print("\n🎉 数据库清理任务完成！")
    else:
        print("\n⚠️ 数据库清理可能未完全成功，请检查上述错误信息")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
生产环境Toolify数据采集器
"""
print("🚀 Python脚本开始执行...")
print("📦 开始导入模块...")

import os
print("✅ os 模块导入成功")
import time
print("✅ time 模块导入成功")
import json
print("✅ json 模块导入成功")
import requests
print("✅ requests 模块导入成功")
from datetime import datetime
print("✅ datetime 模块导入成功")

# 延迟导入Selenium相关模块，添加详细调试
try:
    print("📦 尝试导入selenium...")
    from selenium import webdriver
    print("✅ selenium webdriver 模块导入成功")
    from selenium.webdriver.common.by import By
    print("✅ selenium By 模块导入成功")
    from selenium.webdriver.support.ui import WebDriverWait
    print("✅ selenium WebDriverWait 模块导入成功")
    from selenium.webdriver.support import expected_conditions as EC
    print("✅ selenium expected_conditions 模块导入成功")
    from selenium.webdriver.chrome.service import Service
    print("✅ selenium Service 模块导入成功")
except Exception as e:
    print(f"❌ Selenium导入失败: {e}")
    exit(1)

try:
    print("📦 尝试导入webdriver_manager...")
    from webdriver_manager.chrome import ChromeDriverManager
    print("✅ webdriver_manager 模块导入成功")
except Exception as e:
    print(f"❌ webdriver_manager导入失败: {e}")
    exit(1)

print("🎯 所有模块导入完成，开始定义函数...")

def setup_driver():
    """设置Chrome浏览器 - 生产环境优化版本"""
    print("🔧 开始设置Chrome浏览器...")

    options = webdriver.ChromeOptions()

    # 生产环境Chrome设置
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-web-security")
    options.add_argument("--disable-features=VizDisplayCompositor")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--lang=zh-CN")

    # 反检测设置
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-extensions")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    # 更真实的用户代理
    user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    options.add_argument(f"--user-agent={user_agent}")

    print("✅ Chrome选项配置完成")

    try:
        # 尝试多种ChromeDriver安装方法
        driver_path = None

        try:
            # 方法1: 优先使用系统安装的ChromeDriver
            system_paths = ["/usr/local/bin/chromedriver", "/usr/bin/chromedriver"]
            for path in system_paths:
                if os.path.exists(path):
                    driver_path = path
                    print(f"📦 使用系统ChromeDriver: {driver_path}")
                    break

            if not driver_path:
                # 方法2: 使用webdriver-manager作为备选
                print("🔄 使用webdriver-manager下载ChromeDriver...")
                driver_path = ChromeDriverManager().install()
                print(f"📦 ChromeDriver路径: {driver_path}")

                # 确保有执行权限
                import stat
                current_permissions = os.stat(driver_path).st_mode
                os.chmod(driver_path, current_permissions | stat.S_IEXEC)
                print("✅ ChromeDriver权限已设置")

        except Exception as e:
            print(f"⚠️ ChromeDriver设置失败: {e}")
            driver_path = "chromedriver"  # 最后尝试PATH中的chromedriver

        print(f"🚗 启动Chrome浏览器，驱动路径: {driver_path}")
        service = Service(driver_path)
        driver = webdriver.Chrome(service=service, options=options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        print("✅ Chrome浏览器启动成功")
        return driver

    except Exception as e:
        print(f"❌ Chrome启动失败: {e}")
        print(f"🔍 错误类型: {type(e).__name__}")
        import traceback
        print(f"📋 详细错误: {traceback.format_exc()}")
        return None

def get_settings_from_db():
    """从数据库获取采集设置"""
    print("🏗️ get_settings_from_db 函数开始")
    try:
        print("🔍 获取环境变量...")
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')
        print(f"📊 环境变量状态: URL={bool(url)}, KEY={bool(key)}")

        if not url or not key:
            print("⚠️ 数据库配置缺失，使用默认设置")
            return {
                'target_count': 3000,
                'enabled': True,
                'max_scroll_attempts': 60,
                'batch_size': 100,
                'retry_attempts': 3
            }

        # 清理环境变量
        url = url.strip()
        key = key.strip()

        print(f"🔗 连接数据库: {url[:50]}...")
        print(f"🔑 密钥长度: {len(key)} 字符")

        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }

        response = requests.get(f'{url}/rest/v1/system_settings', headers=headers, timeout=30)

        if response.status_code == 200:
            settings_data = response.json()
            settings = {}

            for setting in settings_data:
                key_name = setting['setting_key']
                value = setting['setting_value']

                # 类型转换
                if setting['setting_type'] == 'number':
                    value = int(value)
                elif setting['setting_type'] == 'boolean':
                    value = value.lower() == 'true'

                settings[key_name] = value

            return {
                'target_count': settings.get('collection_target_count', 3000),
                'enabled': settings.get('collection_enabled', True),
                'max_scroll_attempts': settings.get('max_scroll_attempts', 60),
                'batch_size': settings.get('batch_size', 100),
                'retry_attempts': settings.get('retry_attempts', 3)
            }
        else:
            print(f"⚠️ 获取设置失败: {response.status_code}")
            return {
                'target_count': 3000,
                'enabled': True,
                'max_scroll_attempts': 60,
                'batch_size': 100,
                'retry_attempts': 3
            }
    except Exception as e:
        print(f"⚠️ 获取设置出错: {e}")
        return {
            'target_count': 3000,
            'enabled': True,
            'max_scroll_attempts': 60,
            'batch_size': 100,
            'retry_attempts': 3
        }

def collect_toolify_data(target_count=300, max_scroll_attempts=10):
    """采集Toolify数据 - 简化版"""
    print(f"🚀 开始采集最多 {target_count} 条工具数据...")

    driver = setup_driver()
    if not driver:
        print("❌ 浏览器启动失败")
        return []

    tools_data = []

    try:
        url = "https://www.toolify.ai/zh/Best-trending-AI-Tools"
        print(f"📱 正在访问: {url}")

        driver.get(url)
        print("⏳ 等待页面完全加载...")
        time.sleep(8)

        # 检查页面是否正确加载
        page_title = driver.title
        print(f"📄 页面标题: {page_title}")

        # 简化的数据采集 - 只采集当前页面的数据
        print("🔍 开始数据采集...")

        for attempt in range(max_scroll_attempts):
            try:
                print(f"📊 第{attempt + 1}次尝试采集数据...")

                current_rows = driver.find_elements(By.CSS_SELECTOR, "tr.el-table__row")
                print(f"🔍 发现 {len(current_rows)} 行数据")

                if not current_rows:
                    print("⚠️ 未找到数据行，尝试滚动...")
                    driver.execute_script("window.scrollBy(0, 1000);")
                    time.sleep(3)
                    continue

                # 提取数据
                initial_count = len(tools_data)
                for i in range(len(tools_data), min(len(current_rows), target_count)):
                    try:
                        row = current_rows[i]

                        # 提取工具数据
                        tool_link = row.find_element(By.CSS_SELECTOR, ".go-tool")
                        tool_name = tool_link.text.strip()
                        tool_url = tool_link.get_attribute("href")

                        cells = row.find_elements(By.TAG_NAME, "td")

                        tool_data = {
                            "ranking": i + 1,
                            "tool_name": tool_name,
                            "tool_url": f"https://www.toolify.ai{tool_url}" if tool_url.startswith("/") else tool_url,
                            "monthly_visits": cells[2].find_element(By.TAG_NAME, "span").text.strip() if len(cells) > 2 else "",
                            "growth": cells[3].find_element(By.TAG_NAME, "span").text.strip() if len(cells) > 3 else "",
                            "growth_rate": cells[4].find_element(By.TAG_NAME, "span").text.strip() if len(cells) > 4 else "",
                            "description": cells[5].find_element(By.TAG_NAME, "p").text.strip() if len(cells) > 5 else "",
                            "tags": cells[6].find_element(By.TAG_NAME, "p").text.strip() if len(cells) > 6 else "",
                            "collected_at": datetime.now().isoformat(),
                            "collection_batch": f"github-actions-{datetime.now().strftime('%Y-%m-%d')}"
                        }

                        tools_data.append(tool_data)

                        if len(tools_data) % 20 == 0:
                            print(f"📊 已采集 {len(tools_data)} 条数据...")

                    except Exception as e:
                        print(f"❌ 提取第{i+1}行数据失败: {e}")

                # 检查是否达到目标
                if len(tools_data) >= target_count:
                    print(f"🎉 已达到目标数量 {target_count} 条！")
                    break

                # 如果没有新数据，尝试滚动
                if len(tools_data) == initial_count:
                    print("🔄 滚动页面加载更多数据...")
                    driver.execute_script("window.scrollBy(0, 2000);")
                    time.sleep(4)

            except Exception as e:
                print(f"❌ 采集过程出错: {e}")
                break

        print(f"✅ 采集完成！共获取 {len(tools_data)} 条数据")

        # 输出采集数据样本用于调试
        if tools_data:
            print("📋 采集数据样本（前3条）:")
            for i, tool in enumerate(tools_data[:3]):
                print(f"   {i+1}. {tool.get('tool_name', 'N/A')} - {tool.get('monthly_visits', 'N/A')}")

        return tools_data[:target_count]

    except Exception as e:
        print(f"❌ 采集过程出错: {e}")
        import traceback
        print(f"📋 详细错误: {traceback.format_exc()}")
        return tools_data

    finally:
        print("🔚 关闭浏览器...")
        try:
            driver.quit()
        except:
            pass

def upload_to_supabase(tools_data):
    """上传数据到Supabase - 简化版"""
    if not tools_data:
        print("❌ 没有数据需要上传")
        return False

    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        print("❌ Supabase配置缺失")
        return False

    # 清理环境变量
    url = url.strip()
    key = key.strip()

    print(f"📤 准备上传 {len(tools_data)} 条数据...")

    # 验证数据格式
    print("🔍 验证数据格式...")
    for i, tool in enumerate(tools_data[:3]):  # 检查前3条
        required_fields = ['tool_name', 'tool_url', 'ranking']
        missing_fields = [field for field in required_fields if not tool.get(field)]
        if missing_fields:
            print(f"⚠️ 第{i+1}条数据缺少字段: {missing_fields}")
        else:
            print(f"✅ 第{i+1}条数据格式正确: {tool['tool_name']}")

    # 测试连接
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    try:
        print("🔍 测试数据库连接...")
        test_response = requests.get(f'{url}/rest/v1/toolify_tools?limit=1', headers=headers, timeout=10)

        if test_response.status_code != 200:
            print(f"❌ 数据库连接失败: {test_response.text}")
            return False
        else:
            print("✅ 数据库连接正常")
    except Exception as e:
        print(f"❌ 数据库连接异常: {e}")
        return False

    # 逐条上传，增加重试机制
    print(f"🚀 开始逐条上传 {len(tools_data)} 条数据...")
    success_count = 0

    for i, tool in enumerate(tools_data):
        if i % 50 == 0:
            print(f"📊 开始处理第 {i+1} 条数据: {tool.get('tool_name', 'Unknown')[:30]}...")

        if i == 0:
            print(f"🔍 首条数据详情: {tool}")  # 显示第一条数据的完整内容
        max_retries = 3
        retry_count = 0

        while retry_count < max_retries:
            try:
                response = requests.post(
                    f'{url}/rest/v1/toolify_tools',
                    headers=headers,
                    json=tool,
                    timeout=45  # 增加超时时间
                )

                if response.status_code in [200, 201]:
                    success_count += 1
                    if (i + 1) % 25 == 0:  # 更频繁的进度报告
                        print(f"📊 已处理 {i + 1}/{len(tools_data)} 条数据...")
                    break  # 成功，退出重试循环

                elif response.status_code == 409:
                    # 重复数据，尝试更新
                    try:
                        update_response = requests.patch(
                            f'{url}/rest/v1/toolify_tools?tool_name=eq.{tool["tool_name"]}',
                            headers=headers,
                            json=tool,
                            timeout=45
                        )
                        if update_response.status_code in [200, 204]:
                            success_count += 1
                        break  # 无论成功失败，都退出重试
                    except:
                        break

                elif response.status_code in [502, 503, 504]:
                    # 服务器错误，等待后重试
                    retry_count += 1
                    if retry_count < max_retries:
                        wait_time = retry_count * 2  # 指数退避
                        print(f"⚠️ 服务器错误 {response.status_code}，{wait_time}秒后重试 ({retry_count}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        print(f"❌ 重试失败 {tool['tool_name']}: {response.status_code}")
                        break

                else:
                    print(f"❌ 上传失败 {tool['tool_name']}: {response.status_code}")
                    break

            except requests.exceptions.Timeout:
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = retry_count * 2
                    print(f"⚠️ 请求超时，{wait_time}秒后重试 ({retry_count}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ 超时失败 {tool.get('tool_name', 'Unknown')}")
                    break

            except Exception as e:
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = retry_count * 2
                    print(f"⚠️ 网络异常，{wait_time}秒后重试 ({retry_count}/{max_retries}): {e}")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ 处理异常 {tool.get('tool_name', 'Unknown')}: {e}")
                    break

        # 每上传10条数据后暂停一下，避免过快请求
        if (i + 1) % 10 == 0:
            time.sleep(1)

    print(f"📊 上传完成: {success_count}/{len(tools_data)} 成功")
    return success_count > 0

def main():
    """主函数"""
    print("🔥 main函数开始执行")
    print("=" * 50)
    print("🎯 Toolify生产环境数据采集")
    print("=" * 50)

    # 检查手动触发参数
    manual_target = os.getenv('INPUT_TARGET_COUNT')
    if manual_target:
        target_count = int(manual_target)
        print(f"🎯 手动触发，目标数量: {target_count}")
    else:
        target_count = 300
        print(f"🎯 默认目标数量: {target_count}")

    # 限制最大数量避免超时 - 提高限制以支持更多数据采集
    target_count = min(target_count, 1000)  # 提高到1000条
    max_scroll_attempts = min(target_count // 10, 50)  # 增加滚动次数，每10条数据1次滚动，最多50次

    print(f"🎯 最终采集目标: {target_count} 条")
    print(f"🔄 最大滚动次数: {max_scroll_attempts}")

    # 采集数据
    tools_data = collect_toolify_data(
        target_count=target_count,
        max_scroll_attempts=max_scroll_attempts
    )

    if not tools_data:
        print("💥 采集失败，没有获取到数据")
        exit(1)

    # 保存本地备份
    backup_file = f"./toolify-backup-{datetime.now().strftime('%Y-%m-%d')}.json"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(tools_data, f, ensure_ascii=False, indent=2)
    print(f"💾 本地备份已保存: {backup_file}")

    # 上传到Supabase
    upload_success = upload_to_supabase(tools_data)

    if upload_success:
        print("🎉 数据采集和上传任务完成！")
    else:
        print("💥 数据上传失败")
        exit(1)

if __name__ == "__main__":
    print("🎬 进入main函数...")
    main()
    print("🏁 main函数执行完成")
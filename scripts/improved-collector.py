#!/usr/bin/env python3
"""
改进的数据采集器 - 优化滚动策略
"""

import os
import time
import json
import requests
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def setup_driver():
    """设置Chrome浏览器"""
    print("🔧 设置Chrome浏览器...")

    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--lang=zh-CN")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    user_agent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    options.add_argument(f"--user-agent={user_agent}")

    try:
        # 优先使用系统ChromeDriver
        system_paths = ["/usr/local/bin/chromedriver", "/usr/bin/chromedriver"]
        driver_path = None

        for path in system_paths:
            if os.path.exists(path):
                driver_path = path
                break

        if not driver_path:
            driver_path = ChromeDriverManager().install()

        service = Service(driver_path)
        driver = webdriver.Chrome(service=service, options=options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        print("✅ Chrome浏览器启动成功")
        return driver

    except Exception as e:
        print(f"❌ Chrome启动失败: {e}")
        return None

def improved_collect_data(target_count=300):
    """改进的数据采集方法"""
    print(f"🚀 开始改进采集，目标: {target_count} 条")

    driver = setup_driver()
    if not driver:
        return []

    tools_data = []
    seen_tools = set()  # 记录已采集的工具名，避免重复

    try:
        url = "https://www.toolify.ai/zh/Best-trending-AI-Tools"
        print(f"📱 访问: {url}")

        driver.get(url)
        time.sleep(8)  # 等待页面加载

        print(f"📄 页面标题: {driver.title}")

        # 改进的滚动和采集策略
        max_attempts = 30  # 增加尝试次数
        no_new_data_count = 0
        last_height = 0

        for attempt in range(max_attempts):
            print(f"\n📊 第{attempt + 1}次采集尝试...")

            # 获取当前页面的所有数据行
            try:
                current_rows = driver.find_elements(By.CSS_SELECTOR, "tr.el-table__row")
                print(f"🔍 当前页面显示 {len(current_rows)} 行数据")

                if not current_rows:
                    print("⚠️ 未找到数据行")
                    break

                # 提取新数据
                new_data_count = 0
                for i, row in enumerate(current_rows):
                    if len(tools_data) >= target_count:
                        break

                    try:
                        # 提取工具信息
                        tool_link = row.find_element(By.CSS_SELECTOR, ".go-tool")
                        tool_name = tool_link.text.strip()

                        # 检查是否已采集过
                        if tool_name in seen_tools:
                            continue

                        tool_url = tool_link.get_attribute("href")
                        cells = row.find_elements(By.TAG_NAME, "td")

                        tool_data = {
                            "ranking": len(tools_data) + 1,
                            "tool_name": tool_name,
                            "tool_url": f"https://www.toolify.ai{tool_url}" if tool_url.startswith("/") else tool_url,
                            "monthly_visits": cells[2].find_element(By.TAG_NAME, "span").text.strip() if len(cells) > 2 else "",
                            "growth": cells[3].find_element(By.TAG_NAME, "span").text.strip() if len(cells) > 3 else "",
                            "growth_rate": cells[4].find_element(By.TAG_NAME, "span").text.strip() if len(cells) > 4 else "",
                            "description": cells[5].find_element(By.TAG_NAME, "p").text.strip() if len(cells) > 5 else "",
                            "tags": cells[6].find_element(By.TAG_NAME, "p").text.strip() if len(cells) > 6 else "",
                            "collected_at": datetime.now().isoformat(),
                            "collection_batch": f"improved-{datetime.now().strftime('%Y-%m-%d')}"
                        }

                        tools_data.append(tool_data)
                        seen_tools.add(tool_name)
                        new_data_count += 1

                        if len(tools_data) % 25 == 0:
                            print(f"   📈 已采集 {len(tools_data)} 条数据...")

                    except Exception as e:
                        print(f"   ❌ 提取第{i+1}行失败: {e}")

                print(f"✅ 本次新增 {new_data_count} 条数据，总计 {len(tools_data)} 条")

                # 检查是否达到目标
                if len(tools_data) >= target_count:
                    print(f"🎉 达到目标数量 {target_count} 条！")
                    break

                # 检查是否有新数据
                if new_data_count == 0:
                    no_new_data_count += 1
                    print(f"⚠️ 本次无新数据 (连续{no_new_data_count}次)")

                    if no_new_data_count >= 5:
                        print("🛑 连续多次无新数据，可能已达网站数据上限")
                        break
                else:
                    no_new_data_count = 0

                # 改进的滚动策略
                print("🔄 执行智能滚动...")

                # 获取当前页面高度
                current_height = driver.execute_script("return document.body.scrollHeight")

                if attempt % 4 == 0:
                    # 滚动到页面底部
                    print("   📜 滚动到页面底部")
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                elif attempt % 4 == 1:
                    # 大幅向下滚动
                    print("   📜 大幅向下滚动")
                    driver.execute_script("window.scrollBy(0, 3000);")
                elif attempt % 4 == 2:
                    # 滚动到底部再稍微回滚
                    print("   📜 滚动到底部后回滚")
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1)
                    driver.execute_script("window.scrollBy(0, -300);")
                else:
                    # 模拟用户缓慢滚动
                    print("   📜 模拟缓慢滚动")
                    for _ in range(3):
                        driver.execute_script("window.scrollBy(0, 1000);")
                        time.sleep(1)

                # 等待内容加载
                time.sleep(5)

                # 检查页面高度是否有变化
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height > current_height:
                    print(f"   📏 页面高度增加: {current_height} -> {new_height}")
                    last_height = new_height
                else:
                    print(f"   📏 页面高度未变化: {new_height}")

            except Exception as e:
                print(f"❌ 采集过程出错: {e}")
                break

        print(f"\n✅ 改进采集完成！共获取 {len(tools_data)} 条独特数据")

        # 输出统计信息
        if tools_data:
            print("📊 采集统计:")
            print(f"   🎯 目标数量: {target_count}")
            print(f"   ✅ 实际采集: {len(tools_data)}")
            print(f"   📈 完成率: {len(tools_data)/target_count*100:.1f}%")

            print("\n📋 采集数据样本（前5条）:")
            for i, tool in enumerate(tools_data[:5]):
                print(f"   {i+1}. {tool.get('tool_name', 'N/A')} - {tool.get('monthly_visits', 'N/A')}")

        return tools_data

    except Exception as e:
        print(f"❌ 改进采集出错: {e}")
        import traceback
        print(f"📋 详细错误: {traceback.format_exc()}")
        return tools_data

    finally:
        print("🔚 关闭浏览器...")
        try:
            driver.quit()
        except:
            pass

def main():
    """主函数"""
    print("=" * 60)
    print("🔧 改进版Toolify数据采集器")
    print("=" * 60)

    # 获取目标数量
    target_count = int(os.getenv('INPUT_TARGET_COUNT', '300'))
    print(f"🎯 采集目标: {target_count} 条")

    # 执行改进采集
    tools_data = improved_collect_data(target_count)

    if not tools_data:
        print("💥 改进采集失败，没有获取到数据")
        return

    # 保存备份
    backup_file = f"./improved-backup-{datetime.now().strftime('%Y-%m-%d-%H%M')}.json"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(tools_data, f, ensure_ascii=False, indent=2)
    print(f"💾 本地备份已保存: {backup_file}")

    print("🎉 改进采集任务完成！")

if __name__ == "__main__":
    main()
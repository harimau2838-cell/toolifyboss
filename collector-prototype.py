#!/usr/bin/env python3
"""
使用Selenium测试Toolify采集
基于KeywordTrend项目的配置
"""

import time
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def setup_driver():
    """设置Chrome浏览器 - 基于KeywordTrend配置"""
    options = webdriver.ChromeOptions()
    
    # 使用你的Chrome路径
    options.binary_location = r"C:\Users\Administrator\AppData\Local\Google\Chrome\Bin\chrome.exe"
    
    # 启用无头模式测试
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--lang=zh-CN")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-extensions")
    options.add_argument("--window-size=1366,768")
    options.add_argument("--disable-web-security")
    options.add_argument("--allow-running-insecure-content")
    
    # 更真实的用户代理
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    options.add_argument(f"--user-agent={user_agent}")
    
    # 禁用自动化检测
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        # 执行脚本隐藏webdriver属性
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return driver
    except Exception as e:
        print(f"❌ Chrome启动失败: {e}")
        return None

def test_toolify_access():
    """测试Toolify页面访问"""
    print("🚀 开始测试Toolify页面访问...")
    
    driver = setup_driver()
    if not driver:
        return False
    
    try:
        url = "https://www.toolify.ai/zh/Best-trending-AI-Tools"
        print(f"📱 正在访问: {url}")
        
        driver.get(url)
        
        # 等待页面加载
        print("⏳ 等待页面加载...")
        time.sleep(5)
        
        # 检查页面标题
        title = driver.title
        print(f"📄 页面标题: {title}")
        
        # 直接跳过安全检查，因为用户看不到
        print("⏳ 页面加载完成，开始数据采集...")
        
        # 尝试查找表格行
        print("🔍 查找AI工具表格...")
        
        try:
            # 等待表格加载
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "tr.el-table__row"))
            )
            
            rows = driver.find_elements(By.CSS_SELECTOR, "tr.el-table__row")
            print(f"✅ 找到 {len(rows)} 行数据")
            
            # 采集200条数据测试
            tools_data = []
            target_count = 200
            
            print(f"🎯 目标采集 {target_count} 条数据...")
            
            # 持续滚动直到获取足够数据
            scroll_attempts = 0
            max_scroll_attempts = 20  # 最多滚动20次
            
            while len(tools_data) < target_count and scroll_attempts < max_scroll_attempts:
                current_rows = driver.find_elements(By.CSS_SELECTOR, "tr.el-table__row")
                print(f"🔍 第{scroll_attempts + 1}次检查，当前页面有 {len(current_rows)} 行数据")
                
                # 提取新的行数据
                for i in range(len(tools_data), min(len(current_rows), target_count)):
                    try:
                        row = current_rows[i]
                        
                        # 提取工具名称和链接
                        tool_link = row.find_element(By.CSS_SELECTOR, ".go-tool")
                        tool_name = tool_link.text.strip()
                        tool_url = tool_link.get_attribute("href")
                        
                        # 提取其他数据
                        cells = row.find_elements(By.TAG_NAME, "td")
                        
                        monthly_visits = ""
                        growth = ""
                        growth_rate = ""
                        description = ""
                        tags = ""
                        
                        try:
                            if len(cells) > 2:
                                monthly_visits = cells[2].find_element(By.TAG_NAME, "span").text.strip()
                            if len(cells) > 3:
                                growth = cells[3].find_element(By.TAG_NAME, "span").text.strip()
                            if len(cells) > 4:
                                growth_rate = cells[4].find_element(By.TAG_NAME, "span").text.strip()
                            if len(cells) > 5:
                                description = cells[5].find_element(By.TAG_NAME, "p").text.strip()
                            if len(cells) > 6:
                                tags = cells[6].find_element(By.TAG_NAME, "p").text.strip()
                        except:
                            pass
                        
                        tool_data = {
                            "ranking": i + 1,
                            "tool_name": tool_name,
                            "tool_url": f"https://www.toolify.ai{tool_url}" if tool_url.startswith("/") else tool_url,
                            "monthly_visits": monthly_visits,
                            "growth": growth,
                            "growth_rate": growth_rate,
                            "description": description,
                            "tags": tags
                        }
                        
                        tools_data.append(tool_data)
                        
                        # 每20条显示一次进度
                        if len(tools_data) % 20 == 0:
                            print(f"📊 已采集 {len(tools_data)} 条数据...")
                        
                        # 显示前3条的详细信息
                        if len(tools_data) <= 3:
                            print(f"\n--- 工具 {len(tools_data)} ---")
                            print(f"名称: {tool_name}")
                            print(f"链接: {tool_data['tool_url']}")
                            print(f"月访问量: {monthly_visits}")
                            print(f"增长: {growth}")
                            print(f"增长率: {growth_rate}")
                            print(f"描述: {description[:50]}...")
                        
                    except Exception as e:
                        print(f"❌ 提取第{i+1}行数据失败: {e}")
                
                # 如果已经采集到足够数据，退出循环
                if len(tools_data) >= target_count:
                    print(f"🎉 已达到目标数量 {target_count} 条！")
                    break
                
                # 大幅度滚动加载更多数据
                print(f"🔄 滚动加载更多数据... (第{scroll_attempts + 1}次)")
                
                # 多种滚动方式
                if scroll_attempts % 3 == 0:
                    # 滚动到页面底部
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                elif scroll_attempts % 3 == 1:
                    # 大幅度向下滚动
                    driver.execute_script("window.scrollBy(0, 2000);")
                else:
                    # 滚动到最底部并稍微回滚
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1)
                    driver.execute_script("window.scrollBy(0, -100);")
                
                # 等待更长时间让内容加载
                time.sleep(5)
                
                # 检查是否有新数据加载
                new_rows = driver.find_elements(By.CSS_SELECTOR, "tr.el-table__row")
                if len(new_rows) <= len(current_rows):
                    print(f"⚠️ 滚动后没有新数据，当前仍为 {len(new_rows)} 行")
                    scroll_attempts += 1
                    if scroll_attempts >= 3:  # 连续3次没有新数据就停止
                        print("🛑 连续多次滚动无新数据，停止采集")
                        break
                else:
                    print(f"✅ 滚动成功！数据从 {len(current_rows)} 行增加到 {len(new_rows)} 行")
                    scroll_attempts = 0  # 重置计数器
                
                scroll_attempts += 1
            
            # 保存测试数据
            with open("toolify-test-data.json", "w", encoding="utf-8") as f:
                json.dump(tools_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n💾 测试数据已保存到 toolify-test-data.json")
            print(f"✅ 采集测试成功！共提取 {len(tools_data)} 条数据")
            
            # 显示统计信息
            print(f"\n📊 采集统计:")
            print(f"- 目标数量: {target_count}")
            print(f"- 实际采集: {len(tools_data)}")
            print(f"- 完成率: {len(tools_data)/target_count*100:.1f}%")
            
            # 显示最后几条数据的简要信息
            if len(tools_data) > 3:
                print(f"\n📋 最后3条数据预览:")
                for i, tool in enumerate(tools_data[-3:], len(tools_data)-2):
                    print(f"{i}. {tool['tool_name']} - {tool['monthly_visits']}")
            
            return True
            
        except Exception as e:
            print(f"❌ 查找表格失败: {e}")
            print("🔍 页面可能需要更长时间加载或有其他问题")
            
            # 保存页面截图用于调试
            driver.save_screenshot("toolify-page-screenshot.png")
            print("📸 页面截图已保存到 toolify-page-screenshot.png")
            
            return False
    
    except Exception as e:
        print(f"❌ 访问失败: {e}")
        return False
    
    finally:
        print("🔚 关闭浏览器...")
        driver.quit()

def main():
    """主函数"""
    print("🎯 Toolify采集可行性测试")
    print("=" * 40)
    
    success = test_toolify_access()
    
    if success:
        print("\n🎉 测试成功！")
        print("📋 结论: Toolify网站可以正常采集")
        print("💡 建议: 可以继续开发完整的采集器")
    else:
        print("\n💥 测试失败！")
        print("📋 可能的原因:")
        print("- 网站有反爬虫保护")
        print("- 需要人工验证")
        print("- 页面结构发生变化")
        print("- 网络连接问题")

if __name__ == "__main__":
    main()
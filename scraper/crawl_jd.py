#!/usr/bin/env python3
"""
crawl_jd.py — 京东爬虫主脚本
用法: python crawl_jd.py --category laptop --keyword "游戏本" --max 20
"""

import argparse
import json
import time
import sys
import os

# 添加当前目录到 path，方便 parse_jd 作为模块引用
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("❌ Playwright 未安装，请先运行: pip install playwright && playwright install")
    sys.exit(1)

from parse_jd import parse_product_page


def jd_search_url(category: str, keyword: str, page: int = 1) -> str:
    """
    构造京东搜索 URL
    """
    # 京东搜索接口
    base = "https://search.jd.com/Search"
    params = f"?keyword={keyword}&enc=utf-8&wq={keyword}&page={page}"
    if category == "laptop":
        params += "&cat=670,671,672"
    elif category == "monitor":
        params += "&cat=670,677,1105"
    elif category == "desktop":
        params += "&cat=670,695,702"
    return base + params


def crawl_jd(category: str, keyword: str, max_products: int = 20) -> list:
    """
    使用 Playwright 抓取京东搜索结果页
    """
    results = []
    page_size = 30
    pages_needed = min(3, (max_products + page_size - 1) // page_size)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 800},
        )

        for page_num in range(1, pages_needed + 1):
            if len(results) >= max_products:
                break

            print(f"📄 正在抓取第 {page_num} 页 (关键词: {keyword})...")
            url = jd_search_url(category, keyword, page_num)
            page = context.new_page()

            try:
                page.goto(url, timeout=30000, wait_until='networkidle')
                # 下拉滚动以触发懒加载
                page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.6)")
                time.sleep(2)
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(1)
                page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.8)")
                time.sleep(1)

                # 提取商品列表元素
                items = page.query_selector_all('.gl-item')
                print(f"   找到 {len(items)} 个商品")

                for item in items:
                    if len(results) >= max_products:
                        break

                    try:
                        # 商品名称
                        name_el = item.query_selector('.p-name em, .p-name a')
                        name = name_el.inner_text().strip() if name_el else ''

                        # 价格
                        price_el = item.query_selector('.p-price i, .p-price strong i')
                        price_text = price_el.inner_text().strip() if price_el else '0'
                        price = float(price_text) if price_text.replace('.', '').isdigit() else 0

                        # 商品链接
                        link_el = item.query_selector('.p-name a')
                        href = link_el.get_attribute('href') if link_el else ''
                        detail_url = 'https:' + href if href.startswith('//') else ('https:' + href if href.startswith('/') else href)

                        # 图片
                        img_el = item.query_selector('img[data-sku], .p-img img')
                        img_src = img_el.get_attribute('src') or img_el.get_attribute('data-lazyload') or '' if img_el else ''
                        if img_src.startswith('//'):
                            img_src = 'https:' + img_src

                        product = {
                            "name": name[:200] if name else '',
                            "brand": None,  # 待详情页补全
                            "category": category,
                            "price": price,
                            "cpu": None,
                            "gpu": None,
                            "ram": None,
                            "storage": None,
                            "screen_size": None,
                            "image_url": img_src if img_src else None,
                            "source_url": detail_url if detail_url else None,
                            "source": "jd"
                        }
                        results.append(product)
                    except Exception as e:
                        print(f"   ⚠️ 解析商品失败: {e}")
                        continue

                print(f"   当前累计: {len(results)} 个商品")

            except Exception as e:
                print(f"   ❌ 页面加载失败: {e}")
            finally:
                page.close()
                time.sleep(3)  # 避免频率过高

        browser.close()

    return results[:max_products]


def main():
    parser = argparse.ArgumentParser(description='京东爬虫 - 按品类和关键词抓取商品')
    parser.add_argument('--category', '-c', default='laptop',
                        choices=['laptop', 'monitor', 'desktop'],
                        help='商品品类')
    parser.add_argument('--keyword', '-k', default='',
                        help='搜索关键词（默认用品类名）')
    parser.add_argument('--max', '-m', type=int, default=20,
                        help='最大抓取数量，默认 20')
    parser.add_argument('--output', '-o', default='',
                        help='输出 JSON 文件路径（可选）')

    args = parser.parse_args()
    keyword = args.keyword or args.category

    print(f"🚀 开始抓取京东 | 品类: {args.category} | 关键词: {keyword} | 数量上限: {args.max}")
    print("=" * 60)

    products = crawl_jd(args.category, keyword, args.max)

    print(f"\n✅ 共抓取 {len(products)} 个商品")

    output_path = args.output
    if not output_path:
        output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'jd_results.json')

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"💾 结果已保存到: {output_path}")
    print("\n📋 预览（前 3 条）:")
    for p in products[:3]:
        print(f"  - {p['name']} | ¥{p['price']} | {p['source_url']}")


if __name__ == '__main__':
    main()

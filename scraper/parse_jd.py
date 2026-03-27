"""
parse_jd.py — 京东商品详情页字段解析
从 HTML 中提取结构化产品信息，输出 JSON
"""

import re
import json
from bs4 import BeautifulSoup


def parse_product_page(html: str, url: str = "") -> dict:
    """
    解析京东商品页 HTML，返回结构化产品字典
    """
    soup = BeautifulSoup(html, 'lxml')
    data = {
        "name": None,
        "brand": None,
        "price": None,
        "cpu": None,
        "gpu": None,
        "ram": None,
        "storage": None,
        "screen_size": None,
        "image_url": None,
        "source_url": url,
        "source": "jd"
    }

    # ── 商品名称 ──
    title_tag = soup.find('title')
    if title_tag:
        raw = title_tag.get_text(strip=True)
        data["name"] = raw.split('-')[0].split('_')[0].split('|')[0].strip()

    # 也尝试从 h1 或 .p-title 读取
    if not data["name"]:
        h1 = soup.find('h1')
        if h1:
            data["name"] = h1.get_text(strip=True)

    # ── 价格 ──
    price_match = re.search(r'"price":"?([\d.]+)"?', html)
    if price_match:
        data["price"] = float(price_match.group(1))
    else:
        price_tag = soup.select_one('.price J-p-*, #page头的价格')
        if price_tag:
            m = re.search(r'[\d.]+', price_tag.get_text())
            if m: data["price"] = float(m.group())

    # ── 图片 ──
    img_tag = soup.select_one('#spec-img, .product-img img, img[id="spec-img"]')
    if img_tag:
        data["image_url"] = img_tag.get('src') or img_tag.get('data-lazyload') or img_tag.get('data-src')

    # ── 品牌 ──
    BRANDS = [
        'Apple', '联想', '戴尔', '华为', '华硕', '惠普', '小米', 'ThinkPad',
        'ROG', '宏碁', 'Acer', '荣耀', '三星', 'Samsung', '机械革命', '神舟',
        '微软', 'Surface', 'LG', '微星', 'MSI'
    ]
    page_text = soup.get_text()
    for brand in BRANDS:
        if brand.lower() in page_text.lower():
            data["brand"] = brand
            break

    # ── CPU / GPU / RAM / Storage / 屏幕 ──
    param_map = {
        "cpu": ["处理器", "CPU", "cpu"],
        "gpu": ["显卡", "GPU", "显示卡"],
        "ram": ["内存", "RAM", "运行内存"],
        "storage": ["硬盘", "存储", "SSD", "固态"],
        "screen_size": ["屏幕", "显示器尺寸", "屏幕尺寸"]
    }

    keywords_map = {
        "cpu": ['i9-', 'i7-', 'i5-', 'i3-', 'M3', 'M2', 'M1', 'Ryzen 7', 'Ryzen 5', 'Ryzen 9', 'Apple M'],
        "gpu": ['RTX 4090', 'RTX 4080', 'RTX 4070', 'RTX 4060', 'RTX 4050',
                'RTX 3080', 'RTX 3070', 'RTX 3060', 'GTX 1660', 'Iris Xe', 'M3 Pro', 'M2 Pro', 'Radeon'],
        "ram": ['64GB', '32GB', '16GB', '8GB'],
        "storage": ['2TB', '1TB', '512GB', '256GB'],
    }

    for key, patterns in keywords_map.items():
        for p in patterns:
            if p.lower() in page_text.lower():
                data[key] = p
                break

    # 屏幕尺寸（英寸）
    screen_match = re.search(r'(\d{2}\.?\d*)\s*(英寸|寸|inch)', page_text, re.I)
    if screen_match:
        data["screen_size"] = float(screen_match.group(1))

    return data


def main():
    import sys
    if len(sys.argv) < 2:
        print("Usage: python parse_jd.py <html_file_or_url>")
        sys.exit(1)

    source = sys.argv[1]

    if source.startswith('http'):
        import requests
        resp = requests.get(source, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }, timeout=15)
        html = resp.text
    else:
        with open(source, 'r', encoding='utf-8') as f:
            html = f.read()

    result = parse_product_page(html, source if source.startswith('http') else '')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

# Roadmap Backend API

Node.js + Express + SQLite 产品数据服务

## 快速启动

```bash
# 1. 进入 backend 目录
cd /Users/caoxy/Roadmap/backend

# 2. 安装依赖（如尚未安装）
npm install

# 3. 初始化数据库（首次）
node db/init.js

# 4. 导入样例数据（首次）
node scripts/seed.js

# 5. 启动服务
node server.js
```

服务地址: `http://localhost:3001`

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/products` | 产品列表（支持筛选参数） |
| `GET` | `/api/products/brands` | 品牌列表 |
| `GET` | `/api/products/:id` | 产品详情 |
| `POST` | `/api/products` | 添加产品 |
| `PUT` | `/api/products/:id` | 更新产品 |
| `DELETE` | `/api/products/:id` | 删除产品 |
| `GET` | `/api/products/check-duplicate` | 重复检测 |
| `POST` | `/api/links/parse` | 解析京东/淘宝/天猫商品链接 |

## 筛选参数示例

```
GET /api/products?brands=Apple,Dell&category=laptop&cpu=i7&ram=16GB
```

## 添加产品

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Air M3",
    "brand": "Apple",
    "category": "laptop",
    "price": 9999,
    "cpu": "Apple M3",
    "ram": "8GB",
    "storage": "256GB SSD",
    "screen_size": 13.6,
    "source": "manual"
  }'
```

## 解析商品链接

```bash
curl -X POST http://localhost:3001/api/links/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://item.jd.com/100012043894.html"}'
```

## 数据库

- 路径: `/Users/caoxy/Roadmap/data/products.db`
- 初始化: `node db/init.js`
- 重建: 删除 `products.db` 后重新 `node db/init.js`

# Roadmap 产品可视化平台 — 开发计划

## 1. 项目概述

**目标：** 打造一个以二维坐标轴为核心的产品 roadmap 可视化网站，聚焦电脑品类（笔记本/显示器/台式机），支持品牌/参数筛选、链接添加新品、数据自动抓取更新。

**核心价值：** 直观对比产品在"性能-价格"坐标系中的位置，快速找到适合自己的产品。

---

## 2. 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (HTML/CSS/JS)                    │
│         ECharts 可视化 + 品牌/参数筛选 + 交互            │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼──────────────────────────────────┐
│              Node.js API 服务 (Express)                  │
│     产品列表 / 筛选 / 添加 / 详情 / 链接解析             │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              SQLite 数据库 (better-sqlite3)              │
│              products.db — 产品数据存储                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│          Python 爬虫脚本 (独立运行)                      │
│     Playwright 操控浏览器 / 京东商品页抓取               │
│     抓取结果写入 JSON → Node.js 导入到 SQLite           │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 目录结构

```
~/caoxy/Roadmap/
├── SPEC.md                    # 本文档
├── README.md
│
├── frontend/                   # 前端
│   ├── index.html             # 主页面（Roadmap 可视化）
│   ├── product.html           # 产品详情页
│   ├── styles/
│   │   └── main.css
│   └── scripts/
│       ├── app.js             # 主逻辑：ECharts + 筛选 + 交互
│       ├── api.js             # 调用后端 API
│       └── components/
│           ├── BrandFilter.js   # 品牌筛选组件
│           ├── ParamFilter.js   # 参数筛选组件
│           ├── ScatterPlot.js   # 散点图组件
│           └── ProductCard.js   # 悬浮卡片组件
│
├── backend/                    # Node.js API 服务
│   ├── server.js              # Express 入口
│   ├── routes/
│   │   ├── products.js       # 产品相关路由
│   │   └── scraper.js        # 爬虫控制路由
│   ├── services/
│   │   ├── productService.js # 产品业务逻辑
│   │   ├── linkParser.js     # 链接解析（京东/淘宝/天猫）
│   │   └── scraperService.js # 触发 Python 爬虫
│   ├── db/
│   │   ├── schema.sql        # 数据库表结构
│   │   └── init.js            # 数据库初始化
│   └── package.json
│
├── scraper/                    # Python 爬虫（独立）
│   ├── crawl_jd.py            # 京东爬虫主脚本
│   ├── parse_jd.js            # 京东页面解析
│   └── requirements.txt       # Python 依赖
│
├── data/                       # 数据文件
│   ├── products.json          # 爬虫抓取的原始数据
│   └── products.db            # SQLite 数据库（gitignore）
│
└── scripts/
    ├── import.js               # 把 JSON 导入 SQLite
    └── init_db.sh              # 初始化数据库脚本
```

---

## 4. 数据库 Schema

```sql
CREATE TABLE products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,           -- 产品全称
    brand        TEXT NOT NULL,            -- 品牌
    category     TEXT NOT NULL,            -- 类别: laptop / monitor / desktop
    price        REAL NOT NULL,            -- 价格（元）

    -- 性能指标（用于 X 轴定位）
    performance_score REAL,                -- 综合性能评分（0-100，可计算）

    -- 关键参数
    cpu          TEXT,                     -- CPU 型号
    gpu          TEXT,                     -- 显卡型号
    ram          TEXT,                     -- 内存大小
    storage      TEXT,                     -- 硬盘容量
    screen_size  REAL,                     -- 屏幕尺寸（英寸）

    -- 拓展信息
    image_url    TEXT,                     -- 产品图片 URL
    source_url   TEXT,                     -- 原始商品页链接
    source       TEXT,                     -- 来源平台: jd / taobao / tmall
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brand ON products(brand);
CREATE INDEX idx_category ON products(category);
CREATE INDEX idx_cpu ON products(cpu);
CREATE INDEX idx_gpu ON products(gpu);
CREATE INDEX idx_ram ON products(ram);
CREATE INDEX idx_storage ON products(storage);
CREATE INDEX idx_screen_size ON products(screen_size);
```

**性能评分规则（初始版本）：**
- 规则打分：CPU 权重 40% + GPU 权重 30% + RAM 权重 20% + 硬盘速度 10%
- 参照系：取数据库中最高分 = 100 分，其他等比换算
- 后续可接入 Benchmark 工具做精确评分

---

## 5. API 接口设计

### 产品相关

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/products` | 获取产品列表（支持筛选参数） |
| `GET` | `/api/products/:id` | 获取单个产品详情 |
| `POST` | `/api/products` | 添加新产品 |
| `PUT` | `/api/products/:id` | 更新产品信息 |
| `DELETE` | `/api/products/:id` | 删除产品 |
| `GET` | `/api/products/brands` | 获取所有品牌列表 |
| `GET` | `/api/products/check-duplicate` | 检查产品是否重复 |

**`GET /api/products` 筛选参数：**

```
?brands=Apple,Dell          # 品牌多选
&category=laptop            # 类别
&cpu=Intel i7              # CPU 模糊匹配
&gpu=RTX 4060              # 显卡模糊匹配
&ram=16GB                  # 内存
&storage=512GB             # 硬盘
&screen_size=15.6          # 屏幕尺寸
```

### 链接解析

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/links/parse` | 解析外部商品链接，返回商品信息 |

```json
// POST /api/links/parse
// Body: { "url": "https://item.jd.com/xxx.html" }
// Response:
{
  "success": true,
  "data": {
    "name": "...",
    "brand": "...",
    "price": 5999,
    "cpu": "...",
    "gpu": "...",
    "ram": "...",
    "storage": "...",
    "screen_size": 15.6,
    "image_url": "...",
    "source_url": "https://item.jd.com/xxx.html",
    "source": "jd"
  }
}
```

### 爬虫控制

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/scraper/crawl` | 触发爬虫抓取（指定品类/关键词） |
| `GET` | `/api/scraper/status` | 查看爬虫运行状态 |

---

## 6. 前端页面设计

### 主页面 (index.html) — Roadmap 可视化

```
┌─────────────────────────────────────────────────────┐
│  🔍 粘贴商品链接添加新品                              │
├─────────────────────────────────────────────────────┤
│ [品牌筛选按钮] [品牌筛选按钮] [品牌筛选按钮] ...        │
├─────────────────────────────────────────────────────┤
│ 参数筛选: CPU ▾ | 内存 ▾ | 硬盘 ▾ | 显卡 ▾ | 屏幕 ▾ │
├─────────────────────────────────────────────────────┤
│                                                      │
│                      Y 轴（价格）                     │
│                         ↑                            │
│                         │   [产品点]                  │
│                    [产品点] │       [产品点]           │
│                         │            [产品点]        │
│                         │  [产品点]                  │
│         ─────────────────────────────────→ X轴       │
│                       (性能)                          │
│                                                      │
└─────────────────────────────────────────────────────┘

悬浮卡片（Hover）：
┌──────────────────┐
│ [图片]            │
│ 产品名称           │
│ ¥ 价格             │
│ CPU: xxx | 内存:  │
│ 显卡: xxx         │
└──────────────────┘
```

### 详情页面 (product.html)

```
┌─────────────────────────────────────────────────────┐
│ ← 返回 Roadmap                                      │
├───────────────┬─────────────────────────────────────┤
│               │  产品名称                            │
│   [产品大图]   │  品牌 | 类别 | 价格                 │
│               │                                     │
│               │  核心参数                           │
│               │  CPU: xxx                           │
│               │  显卡: xxx                           │
│               │  内存: xxx                           │
│               │  硬盘: xxx                           │
│               │  屏幕: xxx                           │
│               │                                     │
│               │  [性能评分条] 85/100                │
│               │  [来源链接] [编辑] [删除]           │
└───────────────┴─────────────────────────────────────┘
```

---

## 7. 开发里程碑

### Phase 1 — 基础框架 ✅ 规划完成
- [x] 项目结构设计
- [x] 数据库 Schema
- [x] API 接口设计

### Phase 2 — 后端核心
- [ ] 初始化 Node.js 项目，搭 Express 服务
- [ ] 初始化 SQLite 数据库，建表
- [ ] 实现 `/api/products` CRUD 接口
- [ ] 实现 `/api/products/brands` 接口
- [ ] 实现 `/api/links/parse` 链接解析

### Phase 3 — 前端核心
- [ ] 搭建 HTML/CSS 基础页面
- [ ] 集成 ECharts 散点图
- [ ] 实现品牌筛选栏（多选）
- [ ] 实现参数筛选下拉
- [ ] 实现悬浮卡片交互
- [ ] 实现点击跳转详情页

### Phase 4 — 添加产品功能
- [ ] 链接输入框 UI
- [ ] 调用 `/api/links/parse` 获取商品信息
- [ ] 重复检测逻辑（调用 `/api/products/check-duplicate`）
- [ ] 确认添加预览界面
- [ ] 新品添加到数据库

### Phase 5 — 爬虫（可选先行）
- [ ] Python + Playwright 环境安装
- [ ] 京东搜索页抓取（品类/关键词）
- [ ] 京东商品详情页字段提取
- [ ] 数据导出为 JSON
- [ ] Node.js 导入脚本

### Phase 6 — 完善与部署
- [ ] 产品详情页完整开发
- [ ] 性能评分计算逻辑
- [ ] 数据备份/导入导出
- [ ] Vercel 部署适配

---

## 8. 性能评分初步方案

初始版本用规则打分，避免依赖外部 Benchmark：

```javascript
function calcPerformance(product) {
  const cpuScore = scoreCPU(product.cpu);   // 查表
  const gpuScore = scoreGPU(product.gpu);  // 查表
  const ramScore = scoreRAM(product.ram);  // GB 数值归一化
  const diskScore = scoreStorage(product.storage);

  return Math.round(cpuScore * 0.4 + gpuScore * 0.3 + ramScore * 0.2 + diskScore * 0.1);
}
```

CPU/GPU 查表：取市场主流型号，手动维护一个分数表（可在数据库中存储）。

---

## 9. 依赖清单

### Node.js (backend)
```json
{
  "express": "^4.x",
  "better-sqlite3": "^9.x",
  "cors": "^2.x",
  "node-fetch": "^3.x"
}
```

### Python (scraper)
```
playwright
beautifulsoup4
requests
lxml
```

---

## 10. 风险与注意事项

1. **京东反爬** — Playwright 操控真实浏览器可规避基础反爬，但抓取频率需控制
2. **链接解析稳定性** — 京东/淘宝页面结构可能变动，需预留解析失败的处理
3. **性能评分精度** — 规则打分不如真实 Benchmark，后续可引入 Cinebench/3DMark 数据
4. **数据规模** — 几百个产品 SQLite 完全hold住，无需过早优化

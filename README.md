# PC-Roadmap
HP 产品可视化平台 - Roadmap 产品路线图可视化分析

## 功能特性

- 📊 **散点图可视化**：按产品系列（X轴）和价格（Y轴）展示所有产品
- 🏷️ **品牌筛选**：支持多品牌快速筛选
- 🔍 **参数筛选**：CPU类型、型号、内存、硬盘、显卡、屏幕尺寸
- ➕ **链接添加**：支持京东/淘宝/天猫商品链接添加新产品

## 技术栈

- **前端**：HTML5 + CSS3 + JavaScript (ES6+) + ECharts 5.4.3
- **后端**：Node.js + Express + SQLite
- **数据来源**：HP 产品数据库

## 快速启动

### 后端启动
```bash
cd backend
npm install
npm start
# API 运行在 http://localhost:3001
```

### 前端启动
```bash
cd frontend
# Python 方式
python3 -m http.server 8080
# 或 Node.js 方式
npx serve .
# 访问 http://localhost:8080
```

### 局域网访问
前端启动后，通过 `http://<服务器IP>:8080` 访问

## 项目结构

```
PC-Roadmap/
├── frontend/          # 前端静态页面
│   ├── index.html     # 主页面
│   ├── styles/        # 样式文件
│   └── scripts/       # JavaScript 模块
├── backend/           # Node.js 后端
│   ├── server.js      # 主服务
│   ├── combined_server.js
│   ├── routes/        # API 路由
│   ├── services/      # 业务逻辑
│   └── db/            # 数据库
├── scraper/           # 数据爬虫
├── data/              # SQLite 数据库
└── SPEC.md            # 详细设计文档
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 获取产品列表 |
| GET | `/api/products/:id` | 获取产品详情 |
| POST | `/api/products` | 添加产品 |
| DELETE | `/api/products/:id` | 删除产品 |
| GET | `/api/products/brands` | 获取品牌列表 |
| POST | `/api/links/parse` | 解析商品链接 |

## 许可证

MIT License

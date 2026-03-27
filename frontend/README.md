# Frontend - Roadmap 产品可视化平台

## 如何本地预览

### 方式一：使用任意静态服务器

由于本项目为纯静态前端，需要通过 HTTP 服务访问：

```bash
# 1. 进入前端目录
cd /Users/caoxy/Roadmap/frontend

# 2. 使用 Python 启动简单服务器
python3 -m http.server 8080

# 或使用 Node.js (npx)
npx serve .

# 或使用 PHP
php -S localhost:8080
```

然后访问: http://localhost:8080

### 方式二：使用 VS Code Live Server 插件

在 VS Code 中安装 "Live Server" 插件，然后右键点击 `index.html` → "Open with Live Server"

### 方式三：直接用浏览器打开（不推荐）

部分浏览器安全限制可能导致 API 请求失败，建议使用上述方式。

---

## 前提条件

1. **后端服务必须运行** - 前端依赖 Node.js 后端 API（默认 http://localhost:3000）
2. 确保后端已初始化数据库并运行

---

## 页面结构

```
frontend/
├── index.html          # 主页面（散点图可视化）
├── product.html        # 产品详情页
├── styles/
│   └── main.css        # 全局样式
└── scripts/
    ├── app.js          # 主应用逻辑
    ├── api.js          # API 调用封装
    └── components/
        ├── BrandFilter.js   # 品牌筛选组件
        ├── ParamFilter.js   # 参数筛选组件
        ├── ScatterPlot.js    # ECharts 散点图
        └── ProductCard.js    # 悬浮卡片组件
```

---

## 页面说明

### index.html - 主页面

**功能：**
- 品牌多选筛选（按钮式，选中状态高亮）
- 参数筛选（CPU/内存/硬盘/显卡/屏幕尺寸 下拉选择）
- ECharts 散点图可视化（X轴=性能评分，Y轴=价格）
- 链接输入添加产品功能
- Hover 卡片显示产品预览

**交互流程：**
1. 页面加载 → 调用 `/api/products` 获取产品列表
2. 调用 `/api/products/brands` 获取品牌列表
3. 用户筛选 → 实时更新散点图
4. Hover 散点 → 显示产品卡片
5. Click 散点 → 跳转产品详情页
6. 输入链接 → 调用 `/api/links/parse` 解析 → 检测重复 → 确认添加

### product.html - 产品详情页

**功能：**
- 从 URL 参数 `?id=xxx` 获取产品 ID
- 调用 `/api/products/:id` 获取产品信息
- 性能评分进度条可视化
- 来源链接跳转
- 删除产品

---

## 组件说明

### BrandFilter.js
- 从 `/api/products/brands` 获取品牌列表
- 支持多选叠加筛选
- 选中状态通过 `.active` CSS class 标记
- 筛选变更触发回调通知

### ParamFilter.js
- CPU/内存/硬盘/显卡/屏幕尺寸 下拉筛选
- 自动从产品数据中提取可选值
- 支持清空筛选

### ScatterPlot.js
- 基于 ECharts 5.x
- X 轴：performance_score（性能评分）
- Y 轴：price（价格，元）
- 按品牌着色（颜色映射见代码）
- Hover 显示 tooltip
- Click 跳转详情页

### ProductCard.js
- 跟随鼠标的悬浮卡片
- 显示：产品名、价格、品牌|类别、CPU|内存、显卡
- 边界检测，防止超出视口

### ProductCard.js
- 调用 `/api/links/parse` 解析商品链接
- 调用 `/api/products/check-duplicate` 检测重复
- 重复时提示并可跳转详情页
- 不重复时显示确认预览弹窗
- 确认后调用 `/api/products` 添加

---

## API 端点（前端调用）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 获取产品列表（支持筛选参数） |
| GET | `/api/products/:id` | 获取单个产品详情 |
| POST | `/api/products` | 添加新产品 |
| DELETE | `/api/products/:id` | 删除产品 |
| GET | `/api/products/brands` | 获取所有品牌列表 |
| POST | `/api/products/check-duplicate` | 检查产品是否重复 |
| POST | `/api/links/parse` | 解析商品链接 |

---

## 技术栈

- **HTML5 / CSS3** - 页面结构与样式
- **JavaScript (ES6+)** - 组件化开发
- **ECharts 5.4.3** - 散点图可视化
- **Fetch API** - HTTP 请求

---

## 注意事项

1. API 地址默认 `http://localhost:3000`，可根据环境修改 `api.js` 中的 `API_BASE`
2. 链接解析功能需要后端实现对应接口
3. 建议在 Chrome/Firefox 现代浏览器中使用

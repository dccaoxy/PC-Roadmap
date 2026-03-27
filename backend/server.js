const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { chromium } = require('playwright');

// 初始化数据库
const db = require('./db/init');

const app = express();
app.use(cors());
app.use(express.json());

// ─── 工具函数 ────────────────────────────────────────────────

function normalize(str) {
  return str ? str.toLowerCase().trim() : '';
}

function matches(needle, haystack) {
  if (!needle || !haystack) return true;
  return normalize(haystack).includes(normalize(needle));
}

// ─── GET /api/products ───────────────────────────────────────

app.get('/api/products', (req, res) => {
  try {
    const { brands, category, cpu, gpu, ram, storage, screen_size } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (brands) {
      const brandList = brands.split(',').map(b => normalize(b));
      const placeholders = brandList.map(() => '?').join(',');
      sql += ` AND LOWER(brand) IN (${placeholders})`;
      params.push(...brandList);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (cpu) {
      sql += ' AND LOWER(cpu) LIKE ?';
      params.push(`%${normalize(cpu)}%`);
    }
    if (gpu) {
      sql += ' AND LOWER(gpu) LIKE ?';
      params.push(`%${normalize(gpu)}%`);
    }
    if (ram) {
      sql += ' AND LOWER(ram) LIKE ?';
      params.push(`%${normalize(ram)}%`);
    }
    if (storage) {
      sql += ' AND LOWER(storage) LIKE ?';
      params.push(`%${normalize(storage)}%`);
    }
    if (screen_size) {
      sql += ' AND screen_size = ?';
      params.push(parseFloat(screen_size));
    }

    sql += ' ORDER BY id DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/products/brands ───────────────────────────────

app.get('/api/products/brands', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand').all();
    res.json({ success: true, data: rows.map(r => r.brand) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/products/check-duplicate ─────────────────────
// 注意：必须放在 /:id 路由之前，否则 "check-duplicate" 会被当作 id 参数

app.get('/api/products/check-duplicate', (req, res) => {
  try {
    const { name, brand, cpu, gpu, ram } = req.query;
    if (!name) return res.status(400).json({ success: false, error: 'name is required' });

    let sql = 'SELECT * FROM products WHERE LOWER(name) = LOWER(?)';
    const params = [name];

    if (brand) { sql += ' AND LOWER(brand) = LOWER(?)'; params.push(brand); }
    if (cpu) { sql += ' AND LOWER(cpu) = LOWER(?)'; params.push(cpu); }
    if (gpu) { sql += ' AND LOWER(gpu) = LOWER(?)'; params.push(gpu); }

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, duplicate: rows.length > 0, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/products/:id ──────────────────────────────────

app.get('/api/products/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/products ─────────────────────────────────────

app.post('/api/products', (req, res) => {
  try {
    const { name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source } = req.body;

    if (!name || !brand || !category || price == null) {
      return res.status(400).json({ success: false, error: 'name, brand, category, price are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, brand, category, price, performance_score || null, cpu || null, gpu || null, ram || null, storage || null, screen_size || null, image_url || null, source_url || null, source || 'manual');

    const newRow = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newRow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/products/:id ──────────────────────────────────

app.put('/api/products/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    const { name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source } = req.body;

    const stmt = db.prepare(`
      UPDATE products SET
        name = ?, brand = ?, category = ?, price = ?, performance_score = ?,
        cpu = ?, gpu = ?, ram = ?, storage = ?, screen_size = ?,
        image_url = ?, source_url = ?, source = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      name ?? existing.name,
      brand ?? existing.brand,
      category ?? existing.category,
      price ?? existing.price,
      performance_score ?? existing.performance_score,
      cpu ?? existing.cpu,
      gpu ?? existing.gpu,
      ram ?? existing.ram,
      storage ?? existing.storage,
      screen_size ?? existing.screen_size,
      image_url ?? existing.image_url,
      source_url ?? existing.source_url,
      source ?? existing.source,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/products/:id ───────────────────────────────

app.delete('/api/products/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Deleted', data: existing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/links/parse ──────────────────────────────────

app.post('/api/links/parse', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url is required' });

    const parsed = parseUrl(url);

    if (!parsed) {
      return res.json({ success: false, error: 'Unsupported URL. Only jd.com, taobao.com, tmall.com are supported.' });
    }

    // 使用 Playwright 渲染页面（处理 JS 动态加载的内容）
    const text = await fetchWithPlaywright(url);
    const data = extractProductData(text, parsed.source);

    if (!data.name) {
      return res.json({ success: false, error: 'Failed to parse product info from page.' });
    }

    res.json({
      success: true,
      data: {
        name: data.name,
        brand: data.brand || null,
        price: data.price || null,
        cpu: data.cpu || null,
        gpu: data.gpu || null,
        ram: data.ram || null,
        storage: data.storage || null,
        screen_size: data.screen_size || null,
        image_url: data.image_url || null,
        source_url: url,
        source: parsed.source
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function parseUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host.includes('jd.com')) return { source: 'jd' };
    if (host.includes('taobao.com')) return { source: 'taobao' };
    if (host.includes('tmall.com')) return { source: 'tmall' };
    return null;
  } catch {
    return null;
  }
}

async function fetchWithPlaywright(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // 等待主要内容加载（京东/淘宝有懒加载）
    await page.waitForTimeout(2000);
    return await page.content();
  } catch (err) {
    console.error('Playwright fetch error:', err.message);
    return '';
  } finally {
    if (browser) await browser.close();
  }
}

function extractProductData(html, source) {
  const data = {};

  // 基础标题提取
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) data.name = decodeHTMLEntities(titleMatch[1].split('_')[0].split('-')[0].trim());

  // 价格提取
  const pricePatterns = [
    /"price":"?([\d.]+)"?/,
    /price.*?[:＝]\s*[\d.]+/i,
    /¥\s*([\d,]+)/
  ];
  for (const p of pricePatterns) {
    const m = html.match(p);
    if (m) { data.price = parseFloat(m[1].replace(',', '')); break; }
  }

  // 图片
  const imgMatch = html.match(/"image":"([^"]+)"/) || html.match(/<img[^>]+id="main-image"[^>]+src="([^"]+)"/i);
  if (imgMatch) data.image_url = imgMatch[1];

  // 品牌（从常见品牌列表匹配）
  const brandPatterns = ['Apple', '联想', '戴尔', '华为', '华硕', '惠普', '小米', 'ThinkPad', 'ROG', 'MacBook'];
  for (const b of brandPatterns) {
    if (html.includes(b)) { data.brand = b; break; }
  }

  // CPU/GPU/RAM/Storage 关键字匹配
  const cpuKw = ['i9-', 'i7-', 'i5-', 'M3', 'M2', 'Ryzen 7', 'Ryzen 5', 'i3-', 'Apple M'];
  const gpuKw = ['RTX 4090', 'RTX 4080', 'RTX 4070', 'RTX 4060', 'RTX 4050', 'RTX 3080', 'RTX 3070', 'M3 Pro', 'M2 Pro', 'Iris Xe', 'Radeon'];
  const ramKw = ['32GB', '16GB', '8GB', '64GB'];
  const storageKw = ['2TB', '1TB', '512GB', '256GB', '1TB SSD', '512GB SSD'];

  for (const kw of cpuKw) { if (html.includes(kw)) { data.cpu = kw; break; } }
  for (const kw of gpuKw) { if (html.includes(kw)) { data.gpu = kw; break; } }
  for (const kw of ramKw) { if (html.includes(kw)) { data.ram = kw; break; } }
  for (const kw of storageKw) { if (html.includes(kw)) { data.storage = kw; break; } }

  // 屏幕尺寸
  const screenMatch = html.match(/(\d+\.?\d*)\s*(英寸|寸|inch)/i);
  if (screenMatch) data.screen_size = parseFloat(screenMatch[1]);

  return data;
}

function decodeHTMLEntities(str) {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// ─── 健康检查 & 启动 ─────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend API running on http://localhost:${PORT}`);
});

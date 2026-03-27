const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db/init');

const app = express();
app.use(cors());
app.use(express.json());

// ─── API Routes (must be before static, or use specific paths) ────
const db2 = require('better-sqlite3')(path.join(__dirname, '../data/products.db'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/products', (req, res) => {
  const { brands, category, cpu, gpu, ram, storage, screen_size, tags } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (brands) { sql += ' AND brand IN (' + brands.split(',').map(() => '?').join(',') + ')'; params.push(...brands.split(',')); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (cpu) { sql += ' AND cpu LIKE ?'; params.push('%' + cpu + '%'); }
  if (gpu) { sql += ' AND gpu LIKE ?'; params.push('%' + gpu + '%'); }
  if (ram) { sql += ' AND ram LIKE ?'; params.push('%' + ram + '%'); }
  if (storage) { sql += ' AND storage LIKE ?'; params.push('%' + storage + '%'); }
  if (screen_size) { sql += ' AND screen_size = ?'; params.push(parseFloat(screen_size)); }
  if (tags) { sql += ' AND tag IN (' + tags.split(',').map(() => '?').join(',') + ')'; params.push(...tags.split(',')); }
  const rows = db2.prepare(sql).all(...params);
  res.json({ success: true, data: rows });
});

app.get('/api/products/brands', (req, res) => {
  const rows = db2.prepare('SELECT DISTINCT brand FROM products ORDER BY brand').all();
  res.json({ success: true, data: rows.map(r => r.brand) });
});

app.get('/api/products/:id', (req, res) => {
  const row = db2.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: row });
});

app.post('/api/products', (req, res) => {
  const { name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source } = req.body;
  const stmt = db2.prepare(`INSERT INTO products (name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const result = stmt.run(name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source);
  const newRow = db2.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: newRow });
});

app.put('/api/products/:id', (req, res) => {
  const fields = Object.keys(req.body).filter(k => k !== 'id');
  const sets = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => req.body[f]);
  db2.prepare(`UPDATE products SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, req.params.id);
  const row = db2.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: row });
});

app.delete('/api/products/:id', (req, res) => {
  db2.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/products/check-duplicate', (req, res) => {
  const { name, brand, cpu } = req.query;
  if (!name || !brand || !cpu) return res.json({ success: true, duplicate: false, data: null });
  const row = db2.prepare('SELECT * FROM products WHERE name=? AND brand=? AND cpu=?').get(name, brand, cpu);
  res.json({ success: true, duplicate: !!row, data: row || null });
});

// ─── Link Parser ────
const { chromium } = require('playwright');

function parseUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host.includes('jd.com')) return { source: 'jd' };
    if (host.includes('taobao.com')) return { source: 'taobao' };
    if (host.includes('tmall.com')) return { source: 'tmall' };
    return null;
  } catch { return null; }
}

async function fetchWithPlaywright(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
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
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) data.name = titleMatch[1].split('_')[0].split('-')[0].trim();
  const pricePatterns = [/"price":"?([\d.]+)"?/, /price.*?[:＝]\s*[\d.]+/i, /¥\s*([\d,]+)/];
  for (const p of pricePatterns) { const m = html.match(p); if (m) { data.price = parseFloat(m[1].replace(',', '')); break; } }
  return data;
}

app.post('/api/links/parse', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url is required' });
    const parsed = parseUrl(url);
    if (!parsed) return res.json({ success: false, error: 'Unsupported URL. Only jd.com, taobao.com, tmall.com are supported.' });
    const text = await fetchWithPlaywright(url);
    const data = extractProductData(text, parsed.source);
    if (!data.name) return res.json({ success: false, error: 'Failed to parse product info from page.' });
    res.json({
      success: true,
      data: { name: data.name, brand: null, price: data.price || null, cpu: null, gpu: null, ram: null, storage: null, screen_size: null, image_url: null, source_url: url, source: parsed.source }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Static Files ────
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// ─── SPA Fallback (catch-all non-API routes) ────
app.use((req, res, next) => {
  // API routes already handled above, this catches everything else
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Roadmap server running at http://0.0.0.0:${PORT}`);
  console.log(`   API: http://0.0.0.0:${PORT}/api/`);
  console.log(`   Frontend: http://0.0.0.0:${PORT}/`);
});

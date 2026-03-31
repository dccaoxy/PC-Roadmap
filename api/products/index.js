/**
 * GET /api/products - 获取产品列表
 * POST /api/products - 添加产品
 */
const client = require('../_lib/db');

function normalize(str) {
  return str ? str.toLowerCase().trim() : '';
}

module.exports = async (req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - 获取产品列表
    if (req.method === 'GET') {
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

      const result = await client.execute(sql, params);
      return res.status(200).json({ success: true, data: result.rows });
    }

    // POST - 添加产品
    if (req.method === 'POST') {
      const { name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source } = req.body;

      if (!name || !brand || !category || price == null) {
        return res.status(400).json({ success: false, error: 'name, brand, category, price are required' });
      }

      const sql = `
        INSERT INTO products (name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await client.execute(sql, [
        name, brand, category, price, performance_score || null, cpu || null, gpu || null, ram || null, storage || null, screen_size || null, image_url || null, source_url || null, source || 'manual'
      ]);

      const newRow = await client.execute('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
      return res.status(201).json({ success: true, data: newRow.rows[0] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

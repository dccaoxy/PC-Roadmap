/**
 * GET /api/products/:id
 * PUT /api/products/:id
 * DELETE /api/products/:id
 */
const client = require('../_lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID is required' });
  }

  try {
    // GET - 获取单个产品
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM products WHERE id = ?', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }
      return res.status(200).json({ success: true, data: result.rows[0] });
    }

    // PUT - 更新产品
    if (req.method === 'PUT') {
      const existing = await client.execute('SELECT * FROM products WHERE id = ?', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }

      const { name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source } = req.body;
      const old = existing.rows[0];

      const sql = `
        UPDATE products SET
          name = ?, brand = ?, category = ?, price = ?, performance_score = ?,
          cpu = ?, gpu = ?, ram = ?, storage = ?, screen_size = ?,
          image_url = ?, source_url = ?, source = ?
        WHERE id = ?
      `;

      await client.execute(sql, [
        name ?? old.name,
        brand ?? old.brand,
        category ?? old.category,
        price ?? old.price,
        performance_score ?? old.performance_score,
        cpu ?? old.cpu,
        gpu ?? old.gpu,
        ram ?? old.ram,
        storage ?? old.storage,
        screen_size ?? old.screen_size,
        image_url ?? old.image_url,
        source_url ?? old.source_url,
        source ?? old.source,
        id
      ]);

      const updated = await client.execute('SELECT * FROM products WHERE id = ?', [id]);
      return res.status(200).json({ success: true, data: updated.rows[0] });
    }

    // DELETE - 删除产品
    if (req.method === 'DELETE') {
      const existing = await client.execute('SELECT * FROM products WHERE id = ?', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }

      await client.execute('DELETE FROM products WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: 'Deleted', data: existing.rows[0] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

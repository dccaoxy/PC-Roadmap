/**
 * scripts/seed.js — 导入样例数据到数据库
 * 用法: node scripts/seed.js
 */

const db = require('../db/init');
const path = require('path');
const fs = require('fs');

const seedFile = path.join(__dirname, '..', '..', 'data', 'seed_products.json');
const seeds = JSON.parse(fs.readFileSync(seedFile, 'utf8'));

const insert = db.prepare(`
  INSERT INTO products (name, brand, category, price, performance_score, cpu, gpu, ram, storage, screen_size, image_url, source_url, source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
const insertMany = db.transaction((items) => {
  for (const item of items) {
    insert.run(
      item.name, item.brand, item.category, item.price,
      item.performance_score || null,
      item.cpu || null, item.gpu || null, item.ram || null,
      item.storage || null, item.screen_size || null,
      item.image_url || null, item.source_url || null,
      item.source || 'manual'
    );
    count++;
  }
});

insertMany(seeds);
console.log(`✅ 已导入 ${count} 条样例数据`);

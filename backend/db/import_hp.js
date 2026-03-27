/**
 * 导入 HP 产品数据到 Roadmap 数据库
 * CSV: /Users/caoxy/caoxy/Data_analysis/data/hp_products_full.csv
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const DB_PATH = '/Users/caoxy/Roadmap/data/products.db';
const CSV_PATH = '/Users/caoxy/caoxy/Data_analysis/data/hp_products_full.csv';

// 从 display 字段提取屏幕尺寸（非贪婪匹配）
function extractScreenSize(display) {
  if (!display) return null;
  // 匹配第一个数字（带可选小数点），遇到非数字字符即停止
  const m = display.match(/\d+\.?\d*/);
  if (m) return parseFloat(m[0]);
  return null;
}

// 判断类别
function inferCategory(modelName, family) {
  const text = (modelName + ' ' + (family || '')).toLowerCase();
  if (text.includes('omen') || text.includes('desktop') || text.includes('台式')) return 'desktop';
  if (text.includes('monitor') || text.includes('显示器')) return 'monitor';
  return 'laptop';
}

// 标准化内存
function normalizeRam(memory) {
  if (!memory) return null;
  return memory.replace(/LPDDR\d+/, 'LPDDR').replace(/DDR\d+/, 'DDR').replace(/(\d+)G\b/, '$1GB');
}

async function importCSV() {
  const db = new Database(DB_PATH);
  
  // 读取 CSV 文件内容
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  
  // 使用 csv-parse 正确解析（处理引号和转义）
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });

  console.log('CSV Headers:', Object.keys(records[0]).join(', '));
  console.log('Total records:', records.length);

  const insert = db.prepare(`
    INSERT INTO products (
      name, brand, category, price, performance_score,
      cpu, gpu, ram, storage, screen_size,
      image_url, source_url, source, created_at, updated_at,
      family, series, pn, color, os, wifi, warranty, keyboard,
      features, config_original, storage_capacity, memory_capacity
    ) VALUES (
      @name, @brand, @category, @price, @performance_score,
      @cpu, @gpu, @ram, @storage, @screen_size,
      @image_url, @source_url, @source, datetime('now'), datetime('now'),
      @family, @series, @pn, @color, @os, @wifi, @warranty, @keyboard,
      @features, @config_original, @storage_capacity, @memory_capacity
    )
  `);

  let count = 0;
  let skipped = 0;

  for (const row of records) {
    const screenSize = extractScreenSize(row['display']);
    const category = inferCategory(row['model_name'], row['family']);

    try {
      insert.run({
        name: row['model_name'] || null,
        brand: 'HP',
        category: category,
        price: parseFloat(row['price']) || 0,
        performance_score: null,
        cpu: row['cpu'] || null,
        gpu: row['gpu'] || null,
        ram: normalizeRam(row['memory']) || null,
        storage: row['storage'] || null,
        screen_size: screenSize,
        image_url: null,
        source_url: null,
        source: 'manual',
        family: row['family'] || null,
        series: row['series'] || null,
        pn: row['pn'] || null,
        color: row['color'] || null,
        os: row['os'] || null,
        wifi: row['wifi'] || null,
        warranty: row['warranty'] || null,
        keyboard: row['keyboard'] || null,
        features: row['features'] || null,
        config_original: row['config_original'] || null,
        storage_capacity: row['storage_capacity'] || null,
        memory_capacity: row['memory_capacity'] || null
      });
      count++;
    } catch(e) {
      skipped++;
      console.error('Insert error:', e.message.substring(0, 100), '- Model:', row['model_name']);
    }
  }

  db.close();
  console.log(`\n✅ 导入完成：${count} 条成功，${skipped} 条跳过`);
}

importCSV().catch(console.error);

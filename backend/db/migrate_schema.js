const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = '/Users/caoxy/Roadmap/data/products.db';
const db = new Database(dbPath);

console.log('🔄 重建 products 表，添加所有字段...\n');

// 创建新表（包含 HP CSV 所有字段）
db.exec(`
  DROP TABLE IF EXISTS products_new;
  
  CREATE TABLE products_new (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    name                 TEXT NOT NULL,
    brand                TEXT NOT NULL DEFAULT 'HP',
    category             TEXT NOT NULL DEFAULT 'laptop',
    price                REAL NOT NULL,
    performance_score    REAL,
    
    -- HP CSV 标准字段
    cpu                  TEXT,
    gpu                  TEXT,
    ram                  TEXT,
    storage              TEXT,
    screen_size          REAL,
    image_url            TEXT,
    source_url           TEXT,
    source               TEXT DEFAULT 'manual',
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- HP CSV 额外字段（全部保留）
    family               TEXT,
    series               TEXT,
    pn                   TEXT,
    color                TEXT,
    os                   TEXT,
    wifi                 TEXT,
    warranty             TEXT,
    keyboard             TEXT,
    features             TEXT,
    config_original      TEXT,
    storage_capacity     TEXT,
    memory_capacity      TEXT
  );
`);

console.log('✅ 新表结构创建完成');

// 清空旧数据（如果有的话）
db.exec('DELETE FROM products');
console.log('🗑️ 旧数据已清空');

db.close();
console.log('\n✅ 数据库 schema 更新完成');

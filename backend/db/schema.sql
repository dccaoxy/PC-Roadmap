CREATE TABLE IF NOT EXISTS products (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    brand            TEXT NOT NULL,
    category         TEXT NOT NULL CHECK (category IN ('laptop', 'monitor', 'desktop')),
    price            REAL NOT NULL,
    performance_score REAL,
    cpu              TEXT,
    gpu              TEXT,
    ram              TEXT,
    storage          TEXT,
    screen_size      REAL,
    image_url        TEXT,
    source_url       TEXT,
    source           TEXT CHECK (source IN ('jd', 'taobao', 'tmall', 'manual')),
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_cpu ON products(cpu);
CREATE INDEX IF NOT EXISTS idx_gpu ON products(gpu);
CREATE INDEX IF NOT EXISTS idx_ram ON products(ram);
CREATE INDEX IF NOT EXISTS idx_storage ON products(storage);
CREATE INDEX IF NOT EXISTS idx_screen_size ON products(screen_size);

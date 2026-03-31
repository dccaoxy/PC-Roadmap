/**
 * Vercel Serverless API - 数据库配置
 * 使用 Turso (SQLite 云端数据库)
 */
const { createClient } = require('@libsql/client');

// 创建 Turso 客户端
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

module.exports = client;

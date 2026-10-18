// 資料存取層（刻意保留注入與 N+1 問題，供 sql-review 練習抓錯）
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getUser(id) {
  // 刻意示範：字串拼接 → SQL 注入
  const { rows } = await pool.query('SELECT * FROM users WHERE id = ' + id);
  return rows[0];
}

async function getOrdersWithItems(userId) {
  const { rows: orders } = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1', [userId]);
  // 刻意示範：迴圈內逐筆查詢 → N+1
  for (const order of orders) {
    const { rows } = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = rows;
  }
  return orders;
}

async function searchProducts(keyword) {
  // 刻意示範：樣板字串拼接 + 前導萬用字元
  const { rows } = await pool.query(
    `SELECT * FROM products WHERE name LIKE '%${keyword}%'`);
  return rows;
}

module.exports = { getUser, getOrdersWithItems, searchProducts };

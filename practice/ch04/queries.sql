-- 第 04 章練習用 schema 與查詢（刻意埋問題給 sql-review 抓）
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL,
  qty INT NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Q1：依 email 找使用者（email 無索引）
SELECT * FROM users WHERE email = 'a@example.com';

-- Q2：某使用者最近訂單（user_id、created_at 無索引，無 LIMIT）
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC;

-- Q3：訂單明細（order_id 無索引；應用層對每筆訂單各跑一次 → N+1）
SELECT * FROM order_items WHERE order_id = 1001;

-- Q4：商品模糊搜尋（前導萬用字元）
SELECT * FROM products WHERE name LIKE '%phone%';

-- Q5：狀態統計
SELECT status, COUNT(*) FROM orders GROUP BY status;

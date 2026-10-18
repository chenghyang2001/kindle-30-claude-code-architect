# SQL 審查報告：queries.sql（含 src/db.js）

## 結論
🔴 2 項 / 🟡 5 項 / 🟢 3 項

目前的 schema 只有主鍵，**完全沒有 `CREATE INDEX`**。另外要注意，PostgreSQL 不會替外鍵欄位自動建索引。

## 問題清單

### 🔴 [注入] src/db.js:8 `getUser`
- **問題**：`id` 直接拼進 SQL 字串，它來自 `req.params.id`（`server.js:10`），也就是使用者可以直接控制的網址參數。
  - 請求 `/users/1 OR 1=1` 會回傳任意一個使用者的資料。
  - `pg` 在沒有傳參數時會走 simple query protocol，這種模式允許一次執行多條 SQL。所以 `/users/1;DROP TABLE orders` 也真的會被執行。
- **修正**：
  ```js
  const userId = Number.parseInt(id, 10);
  if (!Number.isInteger(userId)) throw new Error('無效的 id');
  const { rows } = await pool.query(
    'SELECT id, email, name FROM users WHERE id = $1', [userId]);
  ```

### 🔴 [注入] src/db.js:27 `searchProducts`
- **問題**：用樣板字串把 `keyword` 塞進 SQL，`?q=' OR '1'='1` 就能繞過條件；同樣也能接上多條 SQL 一起執行。
- **修正**：改用參數化查詢，同時跳脫 LIKE 的特殊字元 `%`、`_`：
  ```js
  const escaped = keyword.replace(/[\\%_]/g, '\\$&');
  const { rows } = await pool.query(
    'SELECT id, name, price FROM products WHERE name ILIKE $1 LIMIT 50',
    [`%${escaped}%`]);
  ```

### 🟡 [N+1] src/db.js:16-20 `getOrdersWithItems`
- **問題**：每筆訂單都另外查一次明細。某個使用者有 100 筆訂單，就要跑 101 次查詢。這是 queries.sql 的 Q3（第 35 行）在應用層造成的問題。
- **修正**：改成一次撈齊，再在記憶體裡分組：
  ```js
  const ids = orders.map(o => o.id);
  const { rows: items } = await pool.query(
    'SELECT order_id, product_id, qty FROM order_items WHERE order_id = ANY($1)', [ids]);
  const byOrder = Map.groupBy(items, i => i.order_id);
  for (const o of orders) o.items = byOrder.get(o.id) ?? [];
  ```
  也可以用 `JOIN` 搭配 `json_agg`，讓一條 SQL 就回傳巢狀結果。

### 🟡 [索引] queries.sql:29 Q1：`users.email` 沒有索引
- **修正**：email 本來就應該唯一，建唯一索引可以順便防止重複：
  ```sql
  CREATE UNIQUE INDEX idx_users_email ON users(email);
  ```

### 🟡 [索引] queries.sql:32 Q2：`orders.user_id` 和 `created_at` 沒有索引
- **修正**：建複合索引，可以同時處理 WHERE 篩選和 ORDER BY 排序，不必另外排序：
  ```sql
  CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
  ```

### 🟡 [索引] queries.sql:35 Q3：`order_items.order_id` 沒有索引
- **修正**：這也是外鍵欄位，沒有索引的話，刪除訂單時也會做全表掃描：
  ```sql
  CREATE INDEX idx_order_items_order_id ON order_items(order_id);
  ```

### 🟡 [前導萬用字元] queries.sql:38 Q4、src/db.js:27
- **問題**：`LIKE '%phone%'` 開頭是 `%`，一般 B-tree 索引用不上，只能整張表掃過。
- **修正**：改用 pg_trgm 建 GIN 索引，`LIKE` 和 `ILIKE` 都能用到：
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
  ```

### 🟢 [SELECT *] queries.sql:29/32/35/38，以及 src/db.js:8/14/18/27
- **問題**：取回了不需要的欄位。`getUser` 會把整筆 user 原樣透過 API 回傳出去，以後表裡如果加了 `password_hash` 之類的欄位，就會直接外洩。
- **修正**：明確列出要的欄位，例如 `SELECT id, email, name ...`。

### 🟢 [無 LIMIT] queries.sql:32 Q2、src/db.js:14、src/db.js:27
- **問題**：使用者的訂單和搜尋結果都沒有上限，資料量大時會一次回傳太多。
- **修正**：加上 `LIMIT $2 OFFSET $3` 做分頁，或用 `created_at < $cursor` 做游標分頁。

### 🟢 [Schema] queries.sql:4 `users.email` 沒有 UNIQUE 限制
- **修正**：建上面那個唯一索引就一併解決。

## 建議新增的索引
```sql
CREATE UNIQUE INDEX idx_users_email          ON users(email);
CREATE INDEX idx_orders_user_created         ON orders(user_id, created_at DESC);
CREATE INDEX idx_order_items_order_id        ON order_items(order_id);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm          ON products USING gin (name gin_trgm_ops);
```

Q5（`GROUP BY status`）沒有列為問題：`status` 只有幾種值，建索引效益很低。如果表變得很大、又常查這個統計，再考慮用物化視圖或另外維護計數表。

這次只做審查，沒有改任何檔案。要套用修正的話，告訴我即可。
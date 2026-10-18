# 架構摘要：k30-ch04-practice

## 一句話總覽
這是一個 Node.js + Express 的示範用 REST API。它從 PostgreSQL 讀取使用者、訂單和商品資料，是第 04 章的練習題，程式裡故意留了 SQL 注入和 N+1 問題，給 `sql-review` 抓。

## 目錄結構
```
k30-ch04-practice/
├── CLAUDE.md          # 專案規則（快速 demo 模式、免三 agent 流程）
├── queries.sql        # 資料表 schema（users / orders / order_items / products）＋ 5 條示範查詢
├── src/
│   ├── server.js      # 進入點：Express HTTP 路由
│   └── db.js          # 資料存取層（pg 連線池）
└── .claude/
    └── skills/        # 專案內的 skill（explain-codebase 等）
```
> 沒有 `package.json`，所以沒有宣告相依套件、npm scripts 和 `main` 欄位。進入點從程式碼判斷是 `src/server.js`。

## 模組職責
| 檔案 | 職責 | 依賴 |
| --- | --- | --- |
| `src/server.js` | 建立 Express app、掛上 JSON body parser、定義 3 條 GET 路由，並監聽 `PORT`（預設 3000） | `express`、`./db` |
| `src/db.js` | 建立 `pg.Pool`，對外提供 `getUser`、`getOrdersWithItems`、`searchProducts` 三個函式 | `pg`、環境變數 `DATABASE_URL` |
| `queries.sql` | 定義 4 張資料表和 5 條示範查詢（Q1–Q5），應用程式不會在執行時載入它 | PostgreSQL |

## 請求資料流
```
Client
  │
  ├─ GET /users/:id ──────────► server.js ─► db.getUser(id)
  │                                            └─ SELECT * FROM users WHERE id = <字串拼接>
  │                              ◄─ 200 user / 404 找不到使用者 / 500
  │
  ├─ GET /users/:id/orders ───► server.js ─► db.getOrdersWithItems(userId)
  │                                            ├─ SELECT * FROM orders WHERE user_id = $1   (1 次)
  │                                            └─ 迴圈每筆訂單：SELECT * FROM order_items WHERE order_id = $1   (N 次)
  │                              ◄─ 200 orders[]（每筆含 items）/ 500
  │
  └─ GET /search?q=… ─────────► server.js ─► db.searchProducts(q ?? '')
                                               └─ SELECT * FROM products WHERE name LIKE '%<樣板字串拼接>%'
                                 ◄─ 200 products[] / 500
                                                    │
                                                    ▼
                                         PostgreSQL（經 pg.Pool）
```

資料表關聯：`users 1─N orders 1─N order_items N─1 products`。其中 `order_items.product_id` 沒有設 FK。

## 外部相依
| 類型 | 項目 | 說明 |
| --- | --- | --- |
| npm 套件 | `express` | HTTP 框架（沒有 package.json，版本不明） |
| npm 套件 | `pg` | PostgreSQL 用戶端（`Pool`） |
| 資料庫 | PostgreSQL | 用 `SERIAL`、`TIMESTAMPTZ` 這類 PG 語法 |
| 環境變數 | `DATABASE_URL` | 資料庫連線字串，**程式不檢查是否存在** |
| 環境變數 | `PORT` | 監聽埠，預設 `3000` |

## 觀察到的風險
以下只描述問題，沒有修改程式。

1. **SQL 注入（嚴重）**：`src/db.js:8` 的 `getUser` 用 `+` 把 `id` 直接拼進 SQL，`/users/1 OR 1=1` 這類輸入就能改變查詢內容。
2. **SQL 注入（嚴重）**：`src/db.js:27` 的 `searchProducts` 用樣板字串把 `keyword` 拼進 `LIKE`，`/search?q=' ; DROP TABLE …` 這類攻擊可以直接打進資料庫。
3. **N+1 查詢**：`src/db.js:16-20` 會對每筆訂單各查一次 `order_items`，訂單越多往返次數越多。應該改成一次 `WHERE order_id = ANY($1)`，或用 JOIN。
4. **缺少索引**：`users.email`、`orders.user_id`、`orders.created_at`、`order_items.order_id` 都沒有索引（對應 `queries.sql` 的 Q1–Q3）。資料量一大就會全表掃描。
5. **前導萬用字元**：`LIKE '%x%'` 用不到 B-tree 索引（Q4 和 `searchProducts`）。要全文搜尋的話，可以考慮 `pg_trgm` 或 full-text search。
6. **沒有 LIMIT 和分頁**：`/users/:id/orders`、`/search` 和 Q2 都會一次回傳全部資料，結果集可能非常大。
7. **用了 `SELECT *`**：可能把不必要的欄位（例如 `email`）也回傳給前端，而且 schema 一改，API 輸出就跟著變。
8. **沒有驗證輸入**：`:id` 沒有檢查是不是正整數，`q` 也沒有限制長度或字元。
9. **沒有檢查環境變數**：沒設 `DATABASE_URL` 時，伺服器照樣啟動，要等第一個請求進來才會出錯。
10. **Schema 約束不足**：`users.email` 沒有 `UNIQUE`，`order_items.product_id` 沒有 FK 指向 `products`，`qty` 也沒有 `CHECK (qty > 0)`。
11. **缺專案基本檔**：沒有 `package.json`、`.gitignore`、`.env.example`，相依版本和啟動方式都沒有記錄。
12. **沒有認證**：任何人都能查任何使用者的資料和訂單（IDOR）。
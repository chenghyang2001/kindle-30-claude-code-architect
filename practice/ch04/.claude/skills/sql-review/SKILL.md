---
name: sql-review
description: 審查 SQL 檔案或程式碼中的 SQL，檢查 SQL 注入、缺少索引、N+1 查詢、SELECT *、無 LIMIT 等問題並給修正建議。當使用者說「審查 SQL」「SQL review」「檢查這段查詢」「這個 query 有沒有問題」「看 .sql 檔」時使用。不用於：設計新 schema、實際執行 SQL。
---

# SQL 審查

## 檢查清單

| 類別 | 要找什麼 | 嚴重度 |
| --- | --- | --- |
| SQL 注入 | 字串拼接／樣板字串組 SQL（`'... ' + id`、`${id}`） | 🔴 高 |
| 索引 | `WHERE`／`JOIN`／`ORDER BY` 欄位沒有對應 `CREATE INDEX` | 🟡 中 |
| N+1 | 迴圈內逐筆查詢，可改 `IN (...)` 或 `JOIN` | 🟡 中 |
| 前導萬用字元 | `LIKE '%xxx'` 無法用索引 | 🟡 中 |
| SELECT * | 取回不需要的欄位 | 🟢 低 |
| 無 LIMIT | 可能回傳大量資料 | 🟢 低 |

## 步驟

1. 讀取目標 `.sql` 檔；若同專案有呼叫它的程式碼（如 `db.js`），一併讀以判斷參數怎麼帶入。
2. 收集 schema 中所有 `CREATE TABLE` 與 `CREATE INDEX`，建立「已有索引」清單。
3. 逐條查詢套用檢查清單，記下行號。
4. 每個問題附「修正後寫法」。
5. 依下方格式輸出，依嚴重度由高到低排序。

## 輸出格式

```markdown
# SQL 審查報告：<檔名>

## 結論
🔴 x 項 / 🟡 y 項 / 🟢 z 項

## 問題清單
### 🔴 [注入] <檔案>:<行號>
- 問題：
- 修正：（附 SQL 或程式碼）

## 建議新增的索引
```

## 範例

輸入：`SELECT * FROM orders WHERE user_id = ` + userId

輸出：

```markdown
### 🔴 [注入] src/db.js:12
- 問題：userId 直接拼接進 SQL，可被注入 `1 OR 1=1`
- 修正：`db.query('SELECT id, total FROM orders WHERE user_id = $1', [userId])`

### 🟡 [索引] orders.user_id 無索引
- 修正：`CREATE INDEX idx_orders_user_id ON orders(user_id);`
```

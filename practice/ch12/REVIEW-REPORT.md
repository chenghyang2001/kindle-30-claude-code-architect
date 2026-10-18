# src/ 程式碼審查報告

**審查範圍**：`src/api.js`、`src/utils.js`
**審查方式**：security-reviewer、performance-reviewer、test-coverage-reviewer 三個子代理平行審查。以下是三份報告的彙整，我沒有逐行複核。

## 一、摘要

| 面向 | Critical | High | Medium | Low | 合計 |
|---|:-:|:-:|:-:|:-:|:-:|
| 安全性 | 3 | 2 | 2 | 2 | **9** |
| 效能 | 0 | 3 | 2 | 2 | **7** |
| 測試覆蓋 | 2 | 5 | 2 | 2 | **11** |
| **總計** | **5** | **10** | **6** | **6** | **27** |

`api.js:2` 的 `require("./db")` 找不到對應檔案（`src/db.js` 不存在），所以 db 層沒有審查。直接載入 `api.js` 會丟出 `MODULE_NOT_FOUND`。

### 最嚴重 Top 5

| # | 嚴重度 | 位置 | 問題 |
|:-:|---|---|---|
| 1 | Critical | `api.js:6` | `getUserByName` 把 `name` 直接拼進 SQL，有 SQL 注入（`' OR '1'='1` 可撈出全部使用者） |
| 2 | Critical | `api.js:12` | `searchOrders` 的 `keyword` 用模板字串插進 LIKE，可以用 UNION 讀取其他資料表 |
| 3 | Critical | `api.js:12` | `ORDER BY ${sortBy}` 的欄位名由使用者決定，參數化查詢擋不住，可做盲注 |
| 4 | High | `utils.js:22` | `readUserFile` 有路徑穿越，`../../.env` 可讀到上傳目錄以外的機密檔 |
| 5 | High | `utils.js:8` | `loadLog` 有路徑穿越，`path.join` 會正規化 `..`，可跳出 logs 目錄 |

`fireAndForget`（`utils.js:26-27`）的 Promise rejection 沒有處理，安全性和測試兩份報告都提到。在 Node 15 以上，一次 rejection 就會讓整個程序結束，雖然不在 Top 5，也建議優先處理。

## 二、安全性審查（security-reviewer）

| 嚴重度 | 位置 | 問題 | 修正建議 |
|---|---|---|---|
| Critical | `api.js:6` | `name` 字串拼接進 SQL | `db.query("... WHERE name = ?", [name])` |
| Critical | `api.js:12` | `keyword` 插進 LIKE 條件 | 改用 `LIKE ?`，參數傳 `` `%${keyword}%` ``，並跳脫 `%` 和 `_` |
| Critical | `api.js:12` | `ORDER BY ${sortBy}` 可被注入 | 欄位白名單（如 `{id:'id', date:'created_at'}`），不在名單內就回 400 |
| High | `utils.js:22` | `readUserFile` 路徑穿越 | `path.resolve(UPLOAD_DIR, p)` 後確認以 `UPLOAD_DIR + path.sep` 開頭；拒絕絕對路徑和 null byte |
| High | `utils.js:8` | `loadLog` 路徑穿越（`countErrors` 也走同一條路） | 同上，或只接受 `^[\w.-]+\.log$` 格式的檔名 |
| Medium | `api.js:42` | `res.status(500).send(err.stack)` 把 stack trace 回給前端 | 錯誤細節只寫進伺服器 log，回應改成 `{error:"Internal server error"}` |
| Medium | `api.js:39` | `req.query.name` 沒驗證型別和長度（`?name[]=a` 會變成陣列） | 用 Zod 驗證必填字串和長度上限，不合格回 400 |
| Low | `utils.js:16-17` | `JSON.parse` 沒有 try/catch，`config.settings` 沒防 null | 包 try/catch，改用 `config?.settings?.timeout` |
| Low | `utils.js:27` | 只有 `.then`、沒有 `.catch`，rejection 會讓程序終止 | 加 `.catch(err => logger.error(...))` |

沒有發現硬編碼的金鑰或憑證，也沒有 XSS 輸出點。

## 三、效能審查（performance-reviewer）

| 嚴重度 | 位置 | 問題 | 修正建議 |
|---|---|---|---|
| High | `utils.js:31-38` | `countErrors` 在迴圈裡逐檔用 `readFileSync` 同步讀，會卡住 event loop，所有請求都停住 | 改用 `createReadStream` + `readline`；多個檔用 `Promise.all` 同時讀並限制同時數量 |
| High | `utils.js:7-11` | `loadLog` 整檔讀進記憶體再 `split`，尖峰約檔案大小的 2 倍，大檔可能 OOM | 改用串流逐行處理，記憶體降為 O(單行) |
| High | `api.js:17-26` | `findCommonUsers` 兩層迴圈加 `includes`，O(n·m·k)；兩份各 1 萬筆約 1 億次比對 | listB 的 id 建成 `Set`，再用一個 `Set` 去重，降為 O(n+m) |
| Medium | `api.js:30-34` | `dedupeOrders` 在 `filter` 裡呼叫 `findIndex`，O(n²) | 用 `Set` 或 `Map` 單次過濾，降為 O(n) |
| Medium | `api.js:12` | 開頭有萬用字元的 `LIKE '%…%'` 一定全表掃描；`SELECT *` 沒有 `LIMIT`；排序欄位可能沒有索引 | 加分頁；只取需要的欄位；`sortBy` 限定在有索引的欄位；改用全文索引 |
| Low | `api.js:6` | `SELECT *` 沒有 `LIMIT`，`name` 可能沒有索引 | 為 `name` 建索引，加 `LIMIT` |
| Low | `utils.js:22` | `readUserFile` 用 `readFileSync` 同步讀取 | 改用 `fs.promises.readFile`；大檔用串流 `pipe` 回傳 |

## 四、測試覆蓋審查（test-coverage-reviewer）

**現況**：覆蓋率約 0%。專案裡沒有任何測試檔，也沒有 `package.json` 和 jest、vitest 等設定。10 個匯出函式全部沒有測試。

| 嚴重度 | 函式 | 建議測試案例 |
|---|---|---|
| Critical | `fireAndForget`（`utils.js:26`） | 正常：resolve 後印出 "done"；錯誤：reject 時斷言不產生 unhandledRejection（目前會失敗）；邊界：task 不是函式 |
| Critical | `handleGetUser`（`api.js:37`） | 正常：mock db 回傳資料，`res.json` 參數正確；錯誤：db reject 時回 500，且內容不含 stack；邊界：缺 `name` 或空字串時應回 400 |
| High | `parseConfig`（`utils.js:15`） | 正常：回傳 30；錯誤：`"not json"` 丟 SyntaxError；邊界：`'{}'` 會丟 TypeError，以及 null 輸入 |
| High | `loadLog`（`utils.js:6`） | 正常：`"a\nb"` 得到 `["a","b"]`；錯誤：檔案不存在丟 ENOENT；邊界：空檔、CRLF 換行殘留 `\r` |
| High | `readUserFile`（`utils.js:21`） | 正常：讀合法檔案；錯誤：ENOENT；邊界：`../../etc/passwd` 應被拒絕、空字串會丟 EISDIR、結果依 cwd 而變 |
| High | `getUserByName`（`api.js:5`） | 正常：回傳值原樣傳出；錯誤：db reject；邊界：`O'Brien` 會產生不合法的 SQL、`undefined` 會被拼成字串 'undefined' |
| High | `searchOrders`（`api.js:11`） | 正常：斷言組出的 SQL；錯誤：db reject；邊界：keyword 含 `%_'`、sortBy 是 undefined 時組出 `ORDER BY undefined` |
| Medium | `countErrors`（`utils.js:31`） | 正常：3 行含 ERROR 時回傳 3；邊界：空陣列、小寫 error、同一行兩個 ERROR 只算 1；錯誤：一個檔案不存在就整批中斷 |
| Medium | `findCommonUsers`（`api.js:17`） | 正常：取交集；邊界：id 相同但物件參照不同時 `includes` 判斷不出來，會回傳重複結果（實際的邏輯錯誤）、id 型別不同（1 對 "1"）；錯誤：傳入 null |
| Low | `dedupeOrders`（`api.js:30`） | 正常：保留第一次出現的那筆；邊界：沒有 id 的元素全被當成重複，最後只剩一筆；錯誤：傳入 null |
| Low | 模組層級（`api.js:2`） | 補 `db.js` 或用 `jest.mock("./db")`，再加一個載入冒煙測試 |

## 五、建議修正優先順序

1. **P0：SQL 注入**（`api.js:6`、`:12`）。改用參數化查詢，`sortBy` 改用白名單。這是目前最容易被利用的漏洞。
2. **P0：路徑穿越**（`utils.js:8`、`:22`）。`resolve` 之後檢查路徑前綴，避免機密檔被讀出。
3. **P1：讓程序不會被一次錯誤打掛**。`fireAndForget` 加 `.catch`；`parseConfig` 加 try/catch 和 optional chaining。
4. **P1：錯誤回應與輸入驗證**。不再回傳 `err.stack`；`req.query.name` 用 Zod 驗證，不合格回 400。
5. **P1：建立測試基礎**。新增 `package.json` 和 jest，補 `db.js` 或 mock，先為 P0 和 P1 的修正寫回歸測試（注入、穿越、rejection、500 回應）。
6. **P2：阻塞 I/O 與記憶體**。`loadLog`、`countErrors`、`readUserFile` 改成非同步或串流讀取。
7. **P2：演算法複雜度**。`findCommonUsers`、`dedupeOrders` 改用 `Set`，順便修掉 `findCommonUsers` 回傳重複結果的問題。
8. **P3：查詢最佳化**。加 `LIMIT` 或分頁、只取需要的欄位、為 `name` 建索引、關鍵字改用全文索引。
9. **P3：補齊其餘函式的邊界測試**（CRLF、空陣列、id 型別不同等）。
---
name: write-tests
description: 為本專案的 Todo API 撰寫 node:test 測試（happy / edge / error 三類）。使用時機：補測試、寫測試、新端點需要測試、提升覆蓋率。
---

# 撰寫測試

## 工具與慣例

- 只用內建 `node:test` + `node:assert/strict`，**不安裝** vitest / jest。
- 檔案放 `test/*.test.ts`，import 要帶 `.ts` 副檔名。
- 每個測試用 `test/helpers.ts` 的 `startServer()` 開獨立 server（埠 0），`afterEach` 關閉；測試之間不共享資料。
- 送 JSON 用 `sendJson(base, path, body, method)`；body 傳字串時會原樣送出（用來測壞掉的 JSON）。

## 每個端點至少三類

| 類別 | 要測什麼 |
| --- | --- |
| happy | 標準輸入 → 正確狀態碼與回應內容，並用 GET 確認狀態真的改變 |
| edge | 邊界值（剛好 200 字 / 201 字）、前後空白、中文與 emoji、空陣列、重複操作 |
| error | 400（缺欄位、型別錯、壞 JSON、非法 id）、404（不存在 id）、必要時 405 / 413 |

## 寫法

- 用 `describe("PATCH /todos/:id", ...)` 分組，測試名稱用繁體中文描述行為。
- 多個相似錯誤輸入用表格 + 迴圈產生測試（參考 `test/todos.test.ts` 的 `badBodies`）。
- 斷言錯誤回應時同時檢查 `status` 與 `error` 欄位是字串。

## 完成條件

- `npm test` 全綠，回報新增測試數與總 pass 數。

## 本專案例外

本專案是 Kindle 書籍教學 demo（kindle-drill 快速模式），豁免全域「程式碼三 agent 鐵律」：主 Claude 直接寫檔，不派 code-writer／code-qa／code-reviewer；不需詢問複雜度，也不需詢問是否使用快速模式（已選快速模式）。
所有選擇題一律採用推薦選項、不要停下來問使用者；不可修改全域 `~/.claude/settings.json`，設定一律寫在本專案的 `.claude/settings.local.json`。

## 專案說明

《Claude Code Architect》第 20 章全棧案例演練：零依賴的 TypeScript 待辦事項 REST API。

- 執行環境：Node.js ≥ 22.18（直接執行 `.ts`，靠 Node 內建型別剝除，不用 tsc / tsx）
- HTTP：`node:http`；測試：`node:test` + `node:assert/strict`
- 資料：記憶體內 `TodoStore`，重啟即清空

## 目錄結構

```
src/
  store.ts      資料層（TodoStore）
  validate.ts   輸入驗證（回傳 Result，不丟例外）
  app.ts        路由表 + HttpError + createApp()
  server.ts     進入點（PORT 環境變數，預設 3000）
test/
  helpers.ts    startServer() / sendJson()
  *.test.ts     node:test 測試
.claude/
  skills/       api-endpoint、write-tests
  agents/       code-reviewer、test-runner
  hooks/        block-env.mjs（PreToolUse）、post-edit-test.mjs（PostToolUse）
  settings.local.json  hooks 與權限設定
```

## 指令

- `npm start` — 啟動 API
- `npm test` — 跑全部測試（必須全綠才算完成）

## 慣例

- import 一律帶 `.ts` 副檔名；只用 erasable 語法（禁用 enum、namespace、建構子參數屬性）
- 新增端點：照 `api-endpoint` skill；寫測試：照 `write-tests` skill
- 錯誤一律 `throw new HttpError(status, 繁中訊息)`，回應格式 `{ "error": "..." }`
- 狀態碼：201 建立、204 刪除、400 輸入錯誤、404 找不到、405 方法不支援、413 body 過大、500 內部錯誤（不洩漏細節）
- 不可讀寫 `.env`（hook 會擋）；不新增 npm 依賴
- 註解與訊息用繁體中文

---
name: api-endpoint
description: 在本專案的 Todo API 新增或修改 HTTP 端點（路由、驗證、錯誤碼、測試）的標準步驟。使用時機：新增端點、加路由、加 PATCH/PUT/GET/DELETE、修改 API 行為。
---

# 新增 API 端點

照順序做，每步完成再進下一步。

## 1. 先定規格（寫在回覆裡，不另建檔）

- 方法 + 路徑，例：`PATCH /todos/:id`
- 請求內容欄位、型別、限制
- 成功狀態碼與回應形狀
- 所有錯誤情境與狀態碼：`400` 輸入不合法、`404` 找不到資源、`405` 方法不支援、`413` body 過大

## 2. 資料層：`src/store.ts`

- 在 `TodoStore` 加方法；找不到資源回傳 `undefined` 或 `false`，**不要**在 store 丟 HTTP 錯誤。

## 3. 驗證：`src/validate.ts`

- 新增 `validateXxxBody(body: unknown): Result<T>`，不丟例外。
- 能重用就重用（`validateTitle`、`parseId`），title 規則（trim、非空、≤ 200 字）必須一致。
- 拒絕未知欄位或型別錯誤的欄位；至少要有一個可更新欄位時，空物件回 400。

## 4. 路由：`src/app.ts`

- 在 `createApp` 的 `routes` 陣列加一列 `[方法, 正規式, handler]`。
- id 一律用 `requireId(rawId)`；body 一律用 `await readJson(req)`。
- 錯誤一律 `throw new HttpError(status, 訊息)`，不要自己 `res.end`。
- 只使用 erasable TypeScript 語法（不可用 enum、namespace、建構子參數屬性），因為 Node 直接剝除型別執行。

## 5. 測試

- 呼叫 `write-tests` skill 的規則，在 `test/` 補 happy / edge / error 三類案例。

## 6. 驗收

- 跑 `npm test`，必須全綠（含既有測試）。
- 回報：改了哪些檔案、新增幾個測試、`npm test` 的 pass/fail 數字。

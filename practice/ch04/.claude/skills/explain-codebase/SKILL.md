---
name: explain-codebase
description: 唯讀分析目前專案的程式碼，產出架構摘要（目錄結構、模組職責、資料流、外部相依、潛在問題）。當使用者說「解釋這個 codebase」「架構摘要」「這專案怎麼運作」「explain codebase」「幫我看懂這個專案」時使用。只讀不寫，不修改任何檔案。
allowed-tools: Read, Grep, Glob
---

# Codebase 架構解說（唯讀）

本 skill 透過 `allowed-tools` 限定只能使用 Read、Grep、Glob，**不寫檔、不執行指令**。
架構摘要直接以文字回覆，由呼叫者決定是否存檔。

## 步驟

1. 用 `Glob` 列出原始碼檔（`**/*.{js,ts,py,sql}`），排除 `node_modules`、`.git`。
2. 找進入點：`package.json` 的 `main`/`scripts`、`server.*`、`index.*`、`main.*`。
3. 用 `Read` 逐一讀主要檔案，記下每個模組的職責與它 `require`/`import` 了誰。
4. 用 `Grep` 搜 `require(`、`import `、`app.get|post`、`query(` 等，畫出模組相依與請求資料流。
5. 列出外部相依（套件、資料庫、環境變數）。
6. 記下觀察到的風險（只描述，不修）。

## 輸出格式

```markdown
# 架構摘要：<專案名>

## 一句話總覽
## 目錄結構
## 模組職責
| 檔案 | 職責 | 依賴 |
## 請求資料流
（文字或 ASCII 流程圖）
## 外部相依
## 觀察到的風險
```

## 範例

輸入：「用 explain-codebase 說明這個專案」

輸出（節錄）：

```markdown
## 模組職責
| 檔案 | 職責 | 依賴 |
| src/server.js | HTTP 路由 | src/db.js |
| src/db.js | 資料存取 | pg |

## 請求資料流
Client → server.js (GET /users/:id) → db.getUser() → PostgreSQL
```

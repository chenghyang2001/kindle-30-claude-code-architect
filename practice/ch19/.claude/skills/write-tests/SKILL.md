---
name: write-tests
description: 為本專案 JavaScript 模組撰寫 node:test 單元測試（零依賴），並在測試失敗時定位並修正原始碼 bug。當使用者要求「寫測試」「補測試」「write tests」「用測試抓 bug」時使用。
---

# write-tests

## 慣例
- 測試框架：Node 內建 `node:test` + `node:assert/strict`，**不安裝任何套件**。
- 檔案位置：`test/<模組名>.test.js`；執行 `npm test`（= `node --test`）。
- 每個函式至少三類案例：正常（happy）、邊界（空陣列 / 0 / 門檻值）、錯誤（非法輸入應 throw）。

## 流程（TDD 修 bug）
1. 讀原始碼，先依「規格／註解」寫出**預期行為**的測試（不要遷就現有實作）。
2. 跑 `npm test`，記錄紅燈。
3. 最小改動修正原始碼，再跑一次直到全綠。
4. 回報：新增幾個測試、修了哪一行、紅→綠的證據。

## 範本
```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fn } = require('../src/module');

test('正常案例', () => { assert.equal(fn(1), 2); });
test('錯誤案例', () => { assert.throws(() => fn(-1), RangeError); });
```

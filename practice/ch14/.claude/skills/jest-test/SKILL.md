---
name: jest-test
description: 撰寫 JavaScript 單元測試的規範（AAA 結構、describe/it 命名、happy/edge/error 三類案例、mock 原則）。替 .js 檔寫測試、補測試、檢查測試品質時使用。本專案實際以 node:test（node --test）執行，不安裝 jest。
---

# jest-test：JavaScript 測試撰寫規範

> ⚠️ 本專案**不安裝 jest**。規範沿用 jest 風格，但實際執行改用 Node 內建的 `node:test` + `node:assert/strict`：
>
> ```js
> const { describe, it, mock } = require('node:test');
> const assert = require('node:assert/strict');
> ```
>
> 執行指令：`node --test`（自動找 `test/**/*.test.js`）或 `node --test test/xxx.test.js`。
>
> jest → node:test 對照：`expect(a).toBe(b)` → `assert.equal(a, b)`；`toEqual` → `assert.deepEqual`；`toThrow` → `assert.throws`；`jest.fn()` → `mock.fn()`。

## 1. 檔案位置與命名

- 被測檔 `src/foo.js` → 測試檔 `test/foo.test.js`
- 一個被測檔對應一個測試檔

## 2. describe / it 命名

- `describe('<函式名>')`：一個函式一個 describe 區塊
- `it('should <預期行為> when <條件>')`：讀起來像一句規格
  - 好：`it('should return false when email has no @')`
  - 壞：`it('test 1')`、`it('works')`

## 3. AAA 結構（每個 it 都要）

```js
it('should accept password with exactly 8 chars', () => {
  // Arrange：準備輸入
  const password = 'Abcdef1!';
  // Act：呼叫被測函式
  const result = isStrongPassword(password);
  // Assert：只驗證一件事
  assert.equal(result, true);
});
```

- 三段用空行或註解分開
- 一個 it 只驗一個行為（Assert 可多行，但只針對同一行為）

## 4. 三類案例（每個函式都要涵蓋）

| 類別 | 內容 | 範例 |
| --- | --- | --- |
| happy | 標準合法輸入 → 預期輸出 | 正常 email 回傳 true |
| edge | **邊界值**：剛好等於最小/最大長度、空字串、只差一個字元 | 密碼剛好 8 字元、7 字元 |
| error | 非法型別或缺參數 → 拋錯或回傳 false（依函式契約） | `null`、`123`、`undefined` |

> 邊界值一定要測「剛好在界線上」與「界線外一格」兩側，off-by-one bug 最常藏在這裡。

## 5. Mock 原則

- **純函式不 mock**：直接呼叫、直接斷言
- 只 mock 外部依賴（網路、檔案系統、時間、亂數），用 `mock.fn()` / `mock.method()`
- 不 mock 被測模組自己的內部函式（那等於沒測）
- 每個測試結束後 `mock.restoreAll()`，避免測試互相污染

## 6. 測試失敗時

- 先判斷是**測試寫錯**還是**被測程式有 bug**：對照函式的文件／註解中的規格
- 若是程式 bug：修正被測程式（最小改動），在回報中寫明 bug 位置與修法
- 不可為了讓測試變綠而改掉正確的斷言

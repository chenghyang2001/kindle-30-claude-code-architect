---
name: commit-message
description: 依 git diff 產生繁體中文 commit message（格式：動詞 + 簡短說明，加條列細節）。當使用者要求「產生 commit 訊息」「寫 commit message」「幫我想 commit」時使用。只產生訊息文字，不執行 git commit。
---

# commit-message

## 步驟
1. 執行 `git status --short` 與 `git diff`（含 `git diff --cached`）了解變更。
2. 歸類變更：新增／修復／重構／更新／移除。
3. 依下列格式輸出，**不要**執行 `git commit`（交給人類或主流程決定）。

## 格式
```
<動詞><簡短說明（≤ 40 字）>

- 細節 1（為什麼改，而非改了什麼）
- 細節 2
```

## 範例
```
修復 calcSubtotal 漏算第一個品項

- 迴圈起點由 1 改為 0，避免訂單總額偏低
- 新增 node:test 測試覆蓋小計、折扣、運費門檻
```

---
name: pr-description
description: 根據目前分支的 git diff 與 commit 紀錄，產生結構化的 Pull Request 描述（摘要／變更／測試／風險）。當使用者說「寫 PR 描述」「產生 PR description」「幫我寫 PR 說明」「PR body」「準備開 PR」時使用。不用於：實際建立 PR、程式碼審查。
---

# PR 描述產生器

## 步驟

1. 執行 `git log --oneline <base>..HEAD` 取得本分支的 commit 清單（base 預設 `main`，不存在則用 `master`）。
2. 執行 `git diff --stat <base>...HEAD` 了解改動範圍，再對主要檔案看 `git diff` 細節。
3. 歸納「為什麼要改」（動機）與「改了什麼」（依模組分組，不逐行列）。
4. 找出測試相關改動（`test`、`spec`、`__tests__`）；沒有就明說「無自動化測試」並列手動驗證方式。
5. 評估風險：資料庫 schema、對外 API、設定檔、相依套件版本變動都要列出。
6. 依下方「輸出格式」產出，不要加格式以外的段落。

## 輸出格式

```markdown
## 摘要
<1–3 句：這個 PR 解決什麼問題>

## 變更
- <模組/檔案>：<改了什麼、為什麼>

## 測試
- [ ] <自動化測試或手動驗證步驟>

## 風險
- <風險項目>（影響：低/中/高；緩解方式：...）
```

## 範例

輸入：分支 `feature/login-rate-limit`，新增 `src/middleware/rateLimit.js` 並修改 `src/server.js`。

輸出：

```markdown
## 摘要
登入端點加上每 IP 每分鐘 5 次的速率限制，阻擋暴力破解。

## 變更
- src/middleware/rateLimit.js：新增記憶體型速率限制中介層
- src/server.js：在 POST /login 掛上 rateLimit

## 測試
- [ ] 連續 6 次登入失敗，第 6 次回 429

## 風險
- 記憶體型計數在多實例部署時不共享（影響：中；緩解：後續改 Redis）
```

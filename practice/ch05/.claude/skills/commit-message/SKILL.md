---
name: commit-message
description: 依 git diff --staged 產生 Conventional Commits 格式的 commit 訊息（type(scope): subject ≤ 50 字元 + 說明 why 的 body）。當使用者要 commit message、commit 訊息、提交說明、"give me a commit message"、"write a commit message"、"what should I commit this as"，或準備 commit 已 staged 的改動時使用。不用於：實際執行 git commit 以外的 git 操作、PR 描述、changelog。
---

# Commit Message 產生器

## 步驟

1. 執行 `git diff --staged --stat` 與 `git diff --staged` 讀取已 staged 的改動。
   - 若沒有任何 staged 改動：回覆「目前沒有 staged 的改動，請先 `git add`」並停止，不要自己 add。
2. 判斷 **type**（只能擇一）：
   - `feat` 新功能｜`fix` 修 bug｜`docs` 只改文件｜`style` 格式不影響邏輯
   - `refactor` 重構｜`test` 測試｜`chore` 雜項/設定/建置｜`perf` 效能
3. 判斷 **scope**：取最主要被改動的模組、目錄或檔名（小寫、簡短）；跨太多區域可省略 scope。
4. 寫 **subject**：
   - 祈使語氣、開頭小寫、結尾不加句號
   - `type(scope): subject` 整行 **≤ 50 字元**（寫完自己數一次，超過就縮短）
5. 寫 **body**（與 subject 空一行）：
   - 說明 **為什麼** 要做這個改動（動機、解決什麼問題），不是逐行重述 diff
   - 每行 ≤ 72 字元，1～3 行即可
6. 若有破壞性變更，在 body 後加 `BREAKING CHANGE: ...`。

## 輸出格式

只輸出一個程式碼區塊，內容就是可直接貼進 `git commit -F` 的訊息，區塊外最多附一行字元數說明：

```
type(scope): subject

why 的說明……
```

## 範例

輸入：staged 新增 `src/auth/login.ts`，加入密碼錯誤 5 次鎖帳號的邏輯。

```
feat(auth): lock account after 5 failed logins

Brute-force attempts were unbounded. Locking after repeated
failures limits password guessing without affecting normal users.
```

輸入：staged 只修改 `README.md` 的安裝指令。

```
docs(readme): fix npm install command

The documented command referenced a removed package name,
so new contributors could not complete setup.
```

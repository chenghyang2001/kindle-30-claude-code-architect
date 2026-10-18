---
name: slack-update
description: 把今天的 git log 整理成一則可直接貼到 Slack 的進度更新（已完成／進行中／卡關）。當使用者說 Slack 進度、slack update、站會更新、standup update、今日進度回報、"write my slack update"、"summarize today's work for slack" 時使用。只產生文字，絕不實際發送到 Slack。
---

# Slack 進度更新

## 步驟

1. 取得今天的提交：`git log --since=midnight --no-merges --pretty=format:"%h %s%n%b"`。
   - 今天沒有提交：在「已完成」寫「今天尚無 commit」。
2. 取得進行中的工作：`git status --short`（已 staged / 未 staged / 未追蹤的檔案）。
3. 分類：
   - **已完成**：今天的 commit，依 Conventional Commits type 轉成白話（feat→新增、fix→修正、docs→文件…），一個 commit 一行，附短 hash。
   - **進行中**：`git status` 中尚未 commit 的改動，用檔名推測在做什麼。沒有就寫「無」。
   - **卡關**：commit 訊息或 body 中出現 WIP、TODO、blocked、revert、卡 等字眼的項目；沒有就寫「無」。不要捏造卡關。
4. 用繁體中文、口語簡潔，整則不超過 15 行。

## 輸出格式（Slack mrkdwn）

```
*📅 今日進度（YYYY-MM-DD）*

*✅ 已完成*
• 新增 commit-message skill（`abc1234`）

*🚧 進行中*
• 撰寫 NOTES.md

*⛔ 卡關*
• 無
```

最後加一行提醒：「（僅產生文字，未發送到 Slack）」。

## 規則

- 不呼叫任何 Slack API / MCP / webhook。
- 只依據 git 實際資料，不加入 git 看不到的事項。

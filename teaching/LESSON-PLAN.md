# K30 快速演練課表

依據：NotebookLM 筆記本 `ff7d6837…`（整本書 PDF）回答的「各章讀者實際動手操作」，原文在 `teaching/ask/`（2026-10-18 查詢）。
書上沒有隨書程式碼或 GitHub 範例，檔案內容都印在書裡；練習時由 Claude 依 `teaching/ask/` 的重點自行寫出。

每段提示詞前面都要加：「全自動執行：不要問我任何問題、不要用選擇題，所有選擇一律採用你的推薦，直接做完並回報」。

## 共通限制（每章都適用，本書特別重要）

- 本書大量把 skill／agent／hook 放在全域 `~/.claude/`。**一律改放專案層**：`./.claude/skills/`、`./.claude/agents/`、`./.claude/settings.json`、`./.claude/hooks/`。絕不寫入、修改、刪除全域 `~/.claude/` 底下任何檔案。
- **絕不執行** `/logout`、`/login`、`/upgrade`、`/install-github-app`、`/statusline`、`/doctor`。
- `claude mcp add`、`claude plugin install` 一律 `--scope project`（或 `local`）。
- 不建 GitHub repo、不 push、不部署。
- 新建的 skill／agent 同一 session 可能還沒載入：驗證時用 `claude -p`（先清 `CLAUDE*` 環境變數）開新 session 觸發。
- 每章產出 `NOTES.md`：做了什麼、驗證結果、和書上做法的差異。完成後 git add＋commit。

## 各章提示詞

| 章 | 主題 | 要練習視窗做的事 |
| --- | --- | --- |
| 01 | 進化成 AI 工程師 | 寫 `FRICTION.md`：列出 5 個「每次都要重複提醒 Claude」的開發摩擦，各對應該用 Skill／Subagent／Hook 哪一種解決，理由一句 |
| 02 | 底層架構 | 建一個示範專案（`CLAUDE.md`＋空的 `.claude/skills`、`.claude/agents`、`.claude/settings.json`），執行書上的「解構診斷」：`ls -la .claude` 等檢查，寫 `ANATOMY.md` 說明全域與專案層的優先順序（只讀全域、不改） |
| 03 | 三大支柱 | 在專案層各做一個最小範例：skill `pr-review`、agent `security-auditor`、PreToolUse hook（改到 `auth/` 底下檔案時 exit 2 擋下），用 `claude -p` 各觸發一次驗證 |
| 04 | SKILL.md 解剖 | 專案層建 `pr-description`、`explain-codebase`（allowed-tools: Read, Grep, Glob）、`sql-review` 三個 skill，用 `claude -p` 觸發 explain-codebase 產出架構摘要 |
| 05 | 第一個技能 | 專案層建 `commit-message` skill（書上七步驟）與 `slack-update` skill；做一次 staged 變更，用 `claude -p "give me a commit message for this"` 驗證 |
| 06 | 描述工程 | 建 `explain-error` skill，description 用四段式；寫 3 個應觸發、2 個不應觸發的 prompt，各用 `claude -p` 實跑並把結果記成表格 |
| 07 | 多檔案技能 | 建 `scaffold-react`（SKILL.md＋references/＋assets/ 四個模板），讓它產生一個 `Button` 元件，檢查產出檔案齊全（不必安裝 React） |
| 08 | 組合與衝突 | 對前幾章的 skill 做一次 audit：修 pr-description／pr-review 邊界用語；建 `refactor-helper`（結尾接棒 commit-message）與 meta-skill `release-prep`；寫 `.claude/skills/README.md` |
| 09 | 十個核心技能 | 專案層一次建書上 10 個 skill（commit-message … changelog-entry），挑 3 個用 `claude -p` 實際觸發 |
| 10 | 子代理基礎 | 專案層建 `code-reviewer` agent（tools: Read, Grep, Glob；model: sonnet），放一支有問題的小程式，用 `claude -p "@code-reviewer review app.py"` 驗證 |
| 11 | 設計有效子代理 | 建 `security-auditor`（最小工具權限）等書上範例，寫 `DESIGN.md` 說明「能力越少越強」；觸發一次審查 |
| 12 | 平行子代理 | 準備一個有多個問題的小專案，用一次 `claude -p` 要求平行派 3 個子代理（安全／效能／測試）後彙整，記錄三種模式（Orchestrator／Pipeline／Map-Reduce）的適用時機 |
| 13 | 八位專家 | 專案層 `.claude/agents/` 建書上 8 個 agent 定義；挑 2 個實際派工驗證 |
| 14 | 子代理＋技能 | 做「測試組合」：test-writer agent＋jest-test skill，對一支 JS 函式產生測試並用 `node --test` 或 vitest 跑通 |
| 15 | Hooks 基礎（isolated） | 專案 settings：PostToolUse 寫檔後自動格式化（用 prettier 或 python 腳本）、PreToolUse 擋 `.env`（exit 2）；`claude -p` 觸發驗證 |
| 16 | Hook 設計模式（isolated） | 各做一個 Gate／Guard／Pipeline 範例，外加一個 `"async": true` 的背景 hook；驗證並寫 `PATTERNS.md` |
| 17 | 五大安全掛鉤（isolated） | `.claude/hooks/` 寫 block-dangerous／protect-files／block-secrets／block-force-push／confirm-deploy 五支腳本＋設定；用 `claude -p` 或直接餵 JSON 給腳本，每支至少驗一次「被擋」 |
| 18 | Hook 鏈（isolated） | 同一事件串 3 個 hook、跨 SessionStart→PostToolUse→Stop 的事件管線寫 log，`claude -p` 跑一次後檢查 log 順序 |
| 19 | 三支柱整合 | 建完整專案層 `.claude/`（skills＋agents＋hooks），寫 `ARCHITECTURE.md` 決策表，做一次組合演練並 commit 整個 `.claude/` |
| 20 | 全棧案例 | Node/TypeScript 小專案（API＋測試），配上書上的 CLAUDE.md、專案 skills、agents、hooks；`npm test` 通過 |
| 21 | 一人創業者 | 書上放全域的技能庫與 hooks 管線，改放本練習專案；寫 `SOLO-SETUP.md` 說明若要搬到全域該怎麼做（不實際搬） |
| 22 | 分發與市集 | 把前面的設定打包成本機 plugin＋marketplace，`claude plugin install --scope project` 實測後移除；寫季度稽核清單。完成後比對全域 settings 與 plugins 目錄沒有殘留 |

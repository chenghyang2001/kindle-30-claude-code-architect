# 第 09 章演練筆記：十個核心技能（快速模式）

日期：2026-10-18　Claude Code 2.1.302　Node v24.13.1

## 做了什麼

1. 在 `./.claude/skills/` 建 10 個 skill：commit-message、pr-description、code-review、explain-error、write-tests、refactor-helper、api-docs、sql-review、debug-helper、changelog-entry。每個 SKILL.md 精簡，frontmatter description 寫明「觸發詞／不適用／改用哪個」。
2. 素材：`src/cart.js` 的 `cartTotal()`，刻意漏乘 `qty`（`total += item.price`）。兩個 commit：`新增專案骨架與 CLAUDE.md`、`新增購物車加總函式 cartTotal`。
3. 用 `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p ... --output-format stream-json --verbose` 開新 session 實測 3 個 skill，並用 `--allowedTools` / `--disallowedTools` 限制寫檔與 commit。
4. 一覽表見 `SKILLS-INDEX.md`。

## 三次實測結果

| # | Skill | 權限 | 有呼叫 Skill 工具？ | 結果 |
|---|-------|------|--------------------|------|
| 1 | write-tests | 只允許寫 `test/**`、跑 `node` | ✅ `Skill(write-tests)` | 寫出 `test/cart.test.js`（5 測：正常 2／邊界 2／錯誤 1），`node --test` 3 過 2 敗；正確指出 `src/cart.js` 漏乘 qty，未改原始碼 |
| 2 | explain-error | 禁 Write/Edit/Bash | ✅ `Skill(explain-error)` | 第一次 **我這邊**擷取錯誤的 grep 失敗（Node 24 預設 spec 格式沒有 `not ok`），送出空錯誤；模型仍自行讀檔推算。修正一輪改用 `--test-reporter=tap` 擷取後重跑：正確解讀 `150 !== 350`、指到 `cart.js:14`、附修法，未改檔 |
| 3 | changelog-entry | 只允許 `git log/describe/tag` | ✅ `Skill(changelog-entry)` | 偵測無 tag → 用全部 2 筆 commit，輸出 `## [Unreleased]` 的 Added 區塊，未寫檔 |

驗證方式：解析 stream-json 中 `tool_use` 事件，三次第一個工具呼叫都是 `Skill`。原始紀錄存在 session scratchpad（run1/run2/run2b/run3.jsonl），未入版控。

## 觀察

- 使用者 prompt 明確點名 skill 時，模型第一步就呼叫 Skill 工具；write-tests 的「依註解推斷正確行為、不遷就實作」這條指示有效，所以測試能抓到 bug。
- 測試 session 回報「存檔時有格式化 hook 改了排版」——那是使用者全域 hook，非本專案設定。
- `test/cart.test.js` 保留 2 個失敗測試，作為 bug 的證據；`src/cart.js` 的 bug 刻意不修。

## 與書上做法的差異

- 依指示固定這 10 個 skill 名稱，未逐條比對書上清單。
- 書上多半在互動 session 用自然語言觸發；這裡改用 `claude -p` ＋ stream-json 驗證，並在 prompt 中**直接點名** skill，所以只驗證「會被呼叫、照流程做」，沒驗證「純靠 description 自動匹配」的準確度。
- 只實測 3 個，其餘 7 個未跑。
- 快速模式：未經 QA／code review。

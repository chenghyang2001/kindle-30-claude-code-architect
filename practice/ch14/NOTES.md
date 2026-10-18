# 第 14 章演練：子代理＋技能（測試組合）

《Claude Code Architect》第 14 章快速演練。日期：2026-10-18。Claude Code 2.1.302、Node v24.13.1。

## 做了什麼

| 檔案 | 角色 |
| --- | --- |
| `.claude/skills/jest-test/SKILL.md` | **技能**：測試撰寫規範（AAA、`describe`/`it('should … when …')` 命名、happy/edge/error 三類、mock 原則、失敗時區分測試錯或程式 bug）。註明不裝 jest，改用 `node:test`，並附 jest→node:test 對照表 |
| `.claude/agents/test-writer.md` | **子代理**：`tools: Read, Write, Bash`、`skills: [jest-test]`；系統提示另加保險：「若 context 看不到 skill，先 Read SKILL.md」 |
| `src/validate.js` | 被測程式：`isValidEmail`、`isStrongPassword`，刻意埋 off-by-one bug（`password.length <= 8`，但規格寫「至少 8 字元，8 字元也要通過」） |
| `test/validate.test.js` | test-writer 產出的測試（33 個） |
| `package.json` | `npm test` → `node --test` |

## 驗證方式

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "請使用 test-writer 子代理，為 src/validate.js 撰寫測試……不要執行任何 git 指令" \
  --output-format stream-json --verbose --permission-mode bypassPermissions --disallowedTools "Bash(git:*)"
```

這次驗證本來就要寫檔（測試檔＋修 bug），所以只禁 git，不禁寫檔。

## 實測結果（只跑一次，一次成功）

- init 事件：`agents` 清單含 `test-writer`、`skills` 清單含 `jest-test` → 專案層兩者都被載入
- 工具呼叫順序（stream-json）：主 session `Agent(subagent_type=test-writer)` → 子代理 `Read validate.js` → `Read package.json` → `Write test/validate.test.js` → `Bash node --test` → `Bash sed 修 bug` → 主 session 重跑 `node --test`
- **第一次執行：32 pass / 1 fail**，失敗的正是「should return true when 密碼剛好 8 字元」→ 抓到埋的 bug
- 子代理判斷是程式 bug（對照 JSDoc 規格）而非測試錯，把 `<= 8` 改成 `< 8` 並加註解
- **最終：33 pass / 0 fail**；本 session 再獨立跑 `node --test` 也是 33/33
- 測試分佈：isValidEmail 18（happy 2 / edge 11 / error 5）、isStrongPassword 15（happy 2 / edge 9 / error 4）
- 成本 約 US$1.15，主 session 3 turns
- 附帶發現（子代理主動回報，未處理）：email 前後空白會被 `trim()` 後視為合法；密碼長度用 `string.length`，emoji 算 2 字元

### `skills:` 欄位是否真的生效？

有。證據：子代理**完全沒有 Read `SKILL.md`**（系統提示的備援指令沒被觸發），但產出的測試 33 個 `it` 全部有 `// Arrange / Act / Assert` 註解、依 happy/edge/error 分段、命名照 `should … when …`、用 `node:test` + `node:assert/strict`，且第 4 節「邊界值兩側都要測」也照做（7/8/64/65 字元）。這些細節只存在於 SKILL.md，可見 skill 內容是在啟動時直接注入子代理 context。

## 「agent 帶 skill」的組合價值

- **分工清楚**：agent 管「誰來做、能用什麼工具、做到什麼程度（跑到全綠）」；skill 管「怎麼做才合格（規範）」
- **可重用**：同一份 `jest-test` 規範可以給 test-writer、code-reviewer、主 session 共用，改規範只改一處
- **預載 vs 自動觸發**：一般 skill 靠 description 被模型「想到才用」；放進 agent 的 `skills:` 是**確定載入**，子代理一啟動就帶著規範，不必賭模型會不會去讀
- **context 乾淨**：規範只進子代理的 context，不佔主 session
- **效果**：埋的邊界 bug 被抓到，正因 skill 明文要求「剛好在界線上」也要測

## 和書上做法的差異

| 項目 | 書上 | 本次 |
| --- | --- | --- |
| 測試框架 | jest（`npm i -D jest`、`expect().toBe()`） | Node 內建 `node:test`，不裝任何套件；SKILL.md 附對照表 |
| 執行指令 | `npx jest` | `node --test`（`npm test` 也指向它） |
| skill 載入 | agent frontmatter `skills:` | 同樣用 `skills: [jest-test]`，並在系統提示加「讀不到就 Read SKILL.md」備援（實測沒用到） |
| 驗證方式 | 互動 session 裡叫 agent | `claude -p` 開乾淨 session + stream-json 看工具呼叫，禁止 git |
| 修 bug | — | 子代理自行修 `src/validate.js`（一行），主 session 重跑確認 |

## 快速模式說明

本次為 kindle-drill 快速模式：未走 QA／code-reviewer，只跑一次端對端驗證。已知未處理：email 空白與 emoji 長度行為未定義規格。

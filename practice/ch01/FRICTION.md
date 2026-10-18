# FRICTION.md — 每次都要重複提醒 Claude 的 5 個開發摩擦

> 《Claude Code Architect》第 01 章「進化成 AI 工程師」演練
> 核心觀念：**同一件事提醒第二次，就該把它「升級」成 Claude Code 的擴充機制**，而不是繼續靠嘴巴講。

## 判斷準則（先看這個）

| 問自己 | 答案是「是」→ 用 |
| --- | --- |
| 這是「怎麼做」的知識或流程，Claude 照著做就會對？ | **Skill** |
| 這件事會塞爆主對話 context，或需要另一個角度（例如審查者）？ | **Subagent** |
| 這件事**絕對不能**被忘記或繞過，失手一次就出事？ | **Hook** |

---

## 摩擦 1：commit message 格式每次都要講

- **情境**：每次 commit 都要提醒「用繁體中文、格式是『動詞 + 簡短說明』、動詞只能用 新增／修復／重構／更新／移除」，Claude 還是偶爾寫成英文 `fix: xxx`。
- **解法**：**Skill**（`.claude/skills/commit-message/SKILL.md`）
- **理由**：這是「格式知識＋撰寫流程」，寫成 Skill 後 Claude 在要 commit 時自動載入範例與規則，不必每次重講。
- **補強（選配）**：若團隊要求 100% 合規，可再加一個 `PreToolUse` Hook 檢查 `git commit -m` 的訊息開頭，不合規就擋下。

## 摩擦 2：某些資料夾絕對不能動（例如 `migrations/`、`vendor/`、`.env`）

- **情境**：已經說過「`db/migrations/` 已上線的檔案不准改、`vendor/` 是第三方程式碼」，Claude 修 bug 時還是順手改了。
- **解法**：**Hook**（`PreToolUse`，matcher：`Edit|Write`）
- **理由**：「禁止」需要確定性的強制力，Hook 由 harness 執行、比對路徑後直接 exit 2 擋下，不依賴 Claude 記不記得。

## 摩擦 3：PR 描述格式每次都要重貼範本

- **情境**：每開一個 PR 都要提醒「要有『變更摘要／為什麼改／測試方式／風險與回滾』四段，並附上相關 issue 編號」。
- **解法**：**Skill**（`.claude/skills/pr-description/SKILL.md`）
- **理由**：PR 描述是「範本＋撰寫步驟」（先讀 `git diff main...HEAD`、再依四段填寫），正是 Skill 擅長的可重用流程知識。

## 摩擦 4：改完程式碼要提醒「請先自我審查安全性與邊界案例」

- **情境**：Claude 寫完功能常說「完成了」，要我再追問「SQL 有沒有參數化？空值呢？錯誤處理呢？」，而且同一個 context 自己審自己，容易「我寫的當然對」。
- **解法**：**Subagent**（`.claude/agents/code-reviewer.md`，只給 Read／Grep／Glob 工具）
- **理由**：審查需要獨立 context 與對抗立場，Subagent 不帶寫碼時的偏見，大量讀檔也不會汙染主對話。

## 摩擦 5：每次改完都要提醒「跑一下 formatter / lint」

- **情境**：Claude 改完 `.py` / `.ts` 檔就停了，要我說「記得跑 ruff format / prettier」，忘了講就會讓 CI 紅燈。
- **解法**：**Hook**（`PostToolUse`，matcher：`Edit|Write`，對被改的檔案跑 formatter）
- **理由**：每次寫檔後都要做、沒有判斷空間的機械動作，交給 Hook 確定性地自動執行，比提醒 Claude 可靠且省 token。

---

## 總結：三者的分工

| 機制 | 本質 | 何時觸發 | 強制力 | 適合放什麼 | 本演練對應摩擦 |
| --- | --- | --- | --- | --- | --- |
| **Skill** | 知識／流程（可重用的 SOP） | Claude 依 description 判斷相關時自動載入，或 `/skill-name` 手動 | 軟性（Claude 參考後照做） | 格式規範、範本、多步驟操作流程 | 1 commit 格式、3 PR 描述 |
| **Subagent** | 獨立 context 的專家 | 主 Claude 派工（或依 description 自動委派） | 中（受限工具＋專屬 system prompt） | 審查、研究、大量讀檔、需要不同立場的任務 | 4 安全／邊界審查 |
| **Hook** | 確定性強制（harness 執行的腳本） | 固定生命週期事件（PreToolUse／PostToolUse／Stop…） | 硬性（exit 2 可直接擋下） | 禁止事項、每次必做的機械步驟、稽核紀錄 | 2 禁改資料夾、5 自動 format |

**一句話記憶**：Skill 教 Claude「**怎麼做**」、Subagent 讓 Claude「**找專家做**」、Hook 保證「**一定會做／一定不能做**」。

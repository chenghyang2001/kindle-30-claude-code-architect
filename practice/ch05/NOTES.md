# 第 05 章「第一個技能」演練筆記

> 快速 demo 模式，未經 QA／審查。只在本機 commit，未 push。

## 做了什麼

| 檔案 | 用途 |
| --- | --- |
| `.claude/skills/commit-message/SKILL.md` | 依 `git diff --staged` 產生 Conventional Commits 訊息 |
| `.claude/skills/slack-update/SKILL.md` | 把今天的 git log 整理成 Slack 進度更新（不發送） |
| `greet.py` | 給 commit-message 測試用的小檔案（含 `__main__` 冒煙測試） |
| `.gitignore` | 排除 hook 產生的 `.claude/session-state.md` 等雜檔 |

全部放在專案層 `./.claude/`，沒有碰全域 `~/.claude/`。

## 七步驟各步怎麼做（以 commit-message 為主，slack-update 同法）

1. **找出重複任務**：每次 commit 都要看 diff、想 type、控制標題長度、補 why；每天站會也要把 git log 改寫成進度。這兩件事重複、規則固定，適合做成 skill。
2. **定義觸發**：commit-message 在「要 commit 訊息／準備 commit 已 staged 改動」時觸發；slack-update 在「Slack 進度／standup／今日進度回報」時觸發。也寫了「不用於」的情況（PR 描述、changelog），避免誤觸發。
3. **寫 description**：把觸發詞（中英文都放，含 `give me a commit message`）、做什麼、不做什麼都寫進 frontmatter 的 `description`，因為模型只靠這段決定要不要載入 skill。
4. **寫指令步驟**：編號步驟：讀 `git diff --staged` → 沒有 staged 就停 → 判斷 type（列出 8 種）→ 判斷 scope → 寫 subject（≤ 50 字元、寫完自己數一次）→ 寫 body（講 why）→ BREAKING CHANGE。
5. **定輸出格式**：只輸出一個程式碼區塊，可直接 `git commit -F`。slack-update 用 Slack mrkdwn 三段（✅ 已完成／🚧 進行中／⛔ 卡關），結尾註明未發送。
6. **加範例**：commit-message 放兩個範例（feat、docs）；slack-update 範例直接內嵌在輸出格式裡。
7. **測試迭代**：用 `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "..."` 開新 session 實測（見下方）。兩個 skill 第一次就觸發，所以沒有再改版。

## 實測 1：commit-message

指令：`claude -p "give me a commit message for this"`（staged：新增 `greet.py`）

- stream-json 紀錄中出現 `{"name":"Skill","input":{"skill":"commit-message"}}` → **有觸發**
- 子 session 接著執行 `git diff --staged --stat && git diff --staged`，照 SKILL 步驟走
- 輸出：

```
feat(greet): 新增問候函式，空名字時改稱訪客

提供 Kindle 第 5 章 commit-message skill 演練用的最小範例檔。
名字為空白或 None 時改用「訪客」，避免印出「哈囉，！」。
另附 __main__ 冒煙測試，直接執行就能驗證行為。
```

- 格式檢查：`type(scope): subject` ✅、標題 29 字元（≤ 50）✅、body 說明原因 ✅
- 這則訊息就是 commit `dc51e34` 的內容（第 4 步完成）

## 實測 2：slack-update

指令：`claude -p "幫我把今天的工作整理成 slack update，只要產生文字，不要 commit 也不要發送"`

- 紀錄中出現 `{"name":"Skill","input":{"skill":"slack-update"}}` → **有觸發**
- 輸出：

```
*📅 今日進度（2026-10-18）*

*✅ 已完成*
• 新增專案用的 commit-message 和 slack-update 兩個 skill（`10bf83d`）
• 新增問候函式，名字空白時改稱「訪客」，附冒煙測試（`dc51e34`）

*🚧 進行中*
• 新增 .gitignore（還沒 commit）

*⛔ 卡關*
• 無
```

（只產生了文字，沒有發到 Slack）

## 和書上做法的差異

1. **subject 是中文**：書上範例是英文 subject。使用者全域規則要求 commit 一律繁體中文，子 session 保留 `type(scope):` 格式、內容改中文。字元數仍在 50 以內。
2. **commit 由子 session 完成**：原計畫是拿到訊息後我自己 commit。但全域 Stop hook 偵測到未提交的改動，子 session 就直接用 skill 產生的訊息 commit 了。結果和第 4 步要求一致（用 skill 產生的訊息 commit），只是執行者不同。所以第二次測試在 prompt 裡明講「不要 commit」，並只開放 `git log`／`git status` 工具。
3. **先做了一個 setup commit**：repo 原本沒有任何 commit，為了讓 slack-update 有「今天的 git log」可讀，先把兩個 skill commit 成 `10bf83d`。
4. **用 stream-json 驗證觸發**：書上看回覆內容判斷；這裡加 `--output-format stream-json --verbose`，直接在紀錄中找 `Skill` 工具呼叫，證據更明確。
5. **工具權限限縮**：測試時用 `--allowedTools` 只開放 git 讀取類指令與 Skill，降低子 session 亂改檔案的風險。

## 已知沒處理的風險

- slack-update 的「卡關」只靠關鍵字（WIP／TODO／blocked…）判斷，沒寫在 commit 裡的卡關抓不到。
- commit-message 的 50 字元限制靠模型自己數，中英混排時可能估不準。

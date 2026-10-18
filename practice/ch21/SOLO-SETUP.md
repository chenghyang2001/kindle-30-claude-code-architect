# SOLO-SETUP：一人公司 Claude Code 設定（專案層版本）

> 《Claude Code Architect》第 21 章「一人創業者」演練。書上放全域 `~/.claude/`，本演練全部放在本專案 `./.claude/`。

## 1. 整體架構

```
k30-ch21-practice/
├── TODO.md                     ← 今日待辦（SessionStart hook 讀這裡）
├── .claude/
│   ├── settings.json           ← hooks 管線設定（專案層，可進版控）
│   ├── skills/                 ← 一人公司技能庫
│   │   ├── landing-copy/SKILL.md
│   │   ├── customer-reply/SKILL.md
│   │   ├── weekly-report/SKILL.md
│   │   ├── invoice-check/SKILL.md
│   │   └── launch-checklist/SKILL.md
│   └── hooks/                  ← hook 腳本（Node.js，Windows／macOS／Linux 都能跑）
│       ├── session-start-todo.js
│       ├── post-tool-log.js
│       └── stop-uncommitted.js
└── logs/tool-writes.log        ← PostToolUse 寫檔紀錄（已 gitignore）
```

```
session 開始 ──► SessionStart ──► 印出 TODO.md 未完成項目（注入成 context）
   │
   ├─ 使用者：「回這封客訴」 ──► Claude 依 description 挑 skill ──► customer-reply
   │
   ├─ 工具 Write / Edit ──► PostToolUse ──► logs/tool-writes.log 追加一行
   │
session 回合結束 ──► Stop ──► git status 有變更就提醒（exit 0，不阻擋）
```

## 2. 技能庫

| Skill | 用途 | 典型觸發句 | 是否寫檔 |
| --- | --- | --- | --- |
| `landing-copy` | 產品登陸頁文案：主標、副標、3 利益點、CTA、FAQ | 「幫我寫這個產品的登陸頁文案」 | 否 |
| `customer-reply` | 判斷客戶來信的意圖＋情緒，產出 150 字內可直接寄出的回覆 | 「回覆這封客戶來信」 | 否 |
| `weekly-report` | 讀 git log＋TODO.md＋使用者給的數字，產出週報 | 「產生本週週報」 | 否 |
| `invoice-check` | 核對發票／收款 CSV：重複、金額異常、逾期、缺統編 | 「幫我對 10 月的帳」 | 否（只讀） |
| `launch-checklist` | 上線前勾選清單：金流、法務頁、SEO、監控、備份、回滾 | 「要上線了，幫我檢查」 | 否 |

每個 description 都寫了「觸發」和「不觸發」，避免 skill 之間互搶（例如 customer-reply 和 landing-copy）。

## 3. Hooks 管線

| 事件 | 腳本 | 行為 | 失敗時 |
| --- | --- | --- | --- |
| `SessionStart` | `session-start-todo.js` | 列出 TODO.md 中 `- [ ]` 的項目 | 沒有 TODO.md 就印一行提示，不擋啟動 |
| `PostToolUse`（matcher `Write\|Edit`） | `post-tool-log.js` | 追加「時間、工具、檔案路徑」到 `logs/tool-writes.log` | 錯誤寫到 stderr，exit 0 |
| `Stop` | `stop-uncommitted.js` | `git status --porcelain` 有變更就回傳 `systemMessage` 提醒 | 一律 exit 0，只提醒不擋 |

腳本路徑一律用 `$CLAUDE_PROJECT_DIR`，並把 Git Bash 的 `/c/...` 轉成 `C:/...`，所以不含寫死的使用者路徑。

## 4. 若要搬到全域 `~/.claude/`（只寫步驟，本演練沒有實際搬）

### 4.1 風險

| 風險 | 說明 | 對策 |
| --- | --- | --- |
| 覆蓋既有同名 skill | `~/.claude/skills/` 若已有 `weekly-report` 之類的資料夾，直接複製會蓋掉原版 | 搬之前先列出同名清單；同名就改名（例如 `solo-weekly-report`）或手動合併 |
| hook 影響所有專案 | 全域 SessionStart／Stop 會在**每個**專案執行：沒有 TODO.md 的專案每次都多一行訊息，每個專案結束時都會跑一次 git status | 腳本內加條件（例如只在有 `TODO.md` 或 `.solo` 標記檔的專案執行） |
| 合併 settings.json 出錯 | 全域 settings.json 通常已有其他 hooks／權限設定，整檔覆蓋會讓既有 hook 全部消失 | 只把 `hooks` 陣列**追加**進去，不要整檔覆蓋；改完用 `node -e "JSON.parse(...)"` 檢查 JSON 格式 |
| 路徑變數改變 | 全域 hook 裡的 `$CLAUDE_PROJECT_DIR` 指向「當下的專案」，不是腳本所在位置 | 腳本路徑改成 `~/.claude/hooks/...`；資料（TODO.md、logs）仍以專案目錄為準 |
| 專案層與全域重複 | 搬完沒刪專案層的話，同一個 hook 會執行兩次、skill 會出現兩份 | 搬完後刪掉專案層的那份，或只保留其中一層 |

### 4.2 步驟

```bash
# 0) 備份（可回滾的前提）
TS=$(date +%Y%m%d-%H%M%S)
cp -r "$HOME/.claude/skills"        "$HOME/.claude/skills.bak-$TS"
cp    "$HOME/.claude/settings.json" "$HOME/.claude/settings.json.bak-$TS"

# 1) 檢查同名 skill
for s in landing-copy customer-reply weekly-report invoice-check launch-checklist; do
  [ -e "$HOME/.claude/skills/$s" ] && echo "同名衝突：$s"
done

# 2) 沒有衝突才複製（cp -n 不覆蓋既有檔案）
cp -rn .claude/skills/* "$HOME/.claude/skills/"
mkdir -p "$HOME/.claude/hooks/solo" && cp -n .claude/hooks/*.js "$HOME/.claude/hooks/solo/"

# 3) 手動把 hooks 區段追加進 ~/.claude/settings.json，
#    command 改成 node "$HOME/.claude/hooks/solo/xxx.js"
# 4) 檢查 JSON 格式，再開一個新 session 確認 hook 有執行
node -e "JSON.parse(require('fs').readFileSync(process.env.HOME+'/.claude/settings.json','utf8'))" && echo JSON OK
```

### 4.3 回滾

```bash
rm -rf "$HOME/.claude/skills" && mv "$HOME/.claude/skills.bak-$TS" "$HOME/.claude/skills"
mv "$HOME/.claude/settings.json.bak-$TS" "$HOME/.claude/settings.json"
rm -rf "$HOME/.claude/hooks/solo"
```

如果 `~/.claude` 本身有 git 版控，更簡單的做法是搬之前先 commit 一次，有問題就 `git restore`。

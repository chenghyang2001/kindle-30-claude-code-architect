# Claude Code 底層架構解剖（第 02 章演練）

## 1. 兩層目錄結構

### 全域層 `~/.claude/`（使用者層，所有專案共用）

| 路徑 | 用途 |
| --- | --- |
| `settings.json` | 使用者層設定（permissions、hooks、env、statusLine、plugins…） |
| `settings.local.json` | 本機額外設定（不同步） |
| `CLAUDE.md` | 全域記憶／指示，每個 session 都會載入 |
| `skills/<名稱>/SKILL.md` | 個人 skill |
| `agents/<名稱>.md` | 個人 subagent |
| `commands/*.md` | 舊式 slash command（功能已併入 skills） |
| `hooks/` | hook 腳本（實際掛載寫在 settings.json 的 `hooks`） |
| `plugins/` | 已安裝的 plugin 與 marketplace 快取 |
| `projects/<轉義路徑>/` | 每個專案的對話紀錄與 auto memory |
| `output-styles/`、`plans/`、`todos`/`tasks/`… | 輸出風格、計畫模式、任務等執行期資料 |
| `.credentials.json` | 登入憑證（**機密，不讀不印**） |

另外 `~/.claude.json`（家目錄下、不在 `.claude/` 內）存 OAuth 狀態、使用者層 MCP 設定、各專案信任狀態等。

### 專案層 `./.claude/`（跟著 repo 走）

| 路徑 | 用途 | 進版控？ |
| --- | --- | --- |
| `./CLAUDE.md` | 專案記憶／指示 | 是 |
| `.claude/settings.json` | 團隊共用專案設定 | 是 |
| `.claude/settings.local.json` | 個人本機覆寫 | 否（自動 gitignore） |
| `.claude/skills/` | 專案 skill | 是 |
| `.claude/agents/` | 專案 subagent | 是 |
| `.mcp.json` | 專案範圍 MCP server（`claude mcp add --scope project`） | 是 |

## 2. 設定優先順序（高 → 低）

```
managed（企業政策） > CLI 參數 > local（.claude/settings.local.json） > project（.claude/settings.json） > user（~/.claude/settings.json）
```

- 純量值（如 `theme`、`model`）：高層蓋掉低層。
- 陣列／權限規則：各層**合併**，不是整份取代；`deny` 永遠優先於 `allow`。
- managed 設定在 Windows 的位置是 `C:\Program Files\ClaudeCode\managed-settings.json`，使用者無法覆寫。

## 3. Skills／Agents 同名時誰優先？

兩者的規則**方向相反**，是本章最容易記錯的地方：

| 類型 | 優先順序（高 → 低） | 結論 |
| --- | --- | --- |
| Skills | managed（enterprise） > 個人 `~/.claude/skills` > 專案 `.claude/skills` | **個人蓋專案** |
| Subagents | managed > CLI `--agents` > 專案 `.claude/agents` > 個人 `~/.claude/agents` > plugin | **專案蓋個人** |

補充：

- plugin 的 skill 會帶命名空間（`plugin名:skill名`），不會和上面衝突。
- skill 與舊式 command 同名時，skill 優先。

## 4. 診斷指令與輸出摘要（2026-10-18）

```bash
ls -la .claude
```

```
drwxr-xr-x agents/
-rw-r--r-- settings.json   (3 bytes，內容 {})
drwxr-xr-x skills/
```

（演練前 `.claude` 不存在；skills/、agents/ 內只放 `.gitkeep` 讓 git 追蹤空目錄。）

```bash
ls ~/.claude          # 只讀，未讀取機密檔內容
```

- 子目錄共 **48** 個，主要有：`agents`、`skills`、`commands`、`hooks`、`plugins`、`projects`、`instructions`、`memory`、`output-styles`、`plans`、`tasks`、`teams`、`sessions`、`session-env`、`shell-snapshots`、`file-history`、`backups`、`cache`、`logs`…
- 數量：`skills/` 266 項、`agents/` 125 項、`commands/` 32 項、`hooks/` 42 項。
- `settings.json` 只列頂層 key（未印內容）：`env`、`hooks`、`permissions`、`enabledPlugins`、`extraKnownMarketplaces`、`statusLine`、`skillOverrides`、`theme` 等 20 個。
- managed 層：`C:\Program Files\ClaudeCode\` 不存在 → 本機沒有企業政策設定。

### 各層現況對照

| 層 | 本機現況 |
| --- | --- |
| managed | 無 |
| CLI 參數 | 本次未使用 |
| local | 專案無 `.claude/settings.local.json` |
| project | `.claude/settings.json` = `{}`（空，不影響任何行為） |
| user | `~/.claude/settings.json` 有完整設定（hooks、permissions、plugins…）→ **實際生效的幾乎全來自這層** |

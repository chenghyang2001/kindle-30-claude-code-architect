# K30 第 22 章「分發與市集」演練筆記

> 快速 demo 模式：未經 QA／審查。Claude Code 2.1.302，Windows 10 + Git Bash，2026-10-18。

## 做了什麼

| 步驟 | 內容 | 結果 |
| --- | --- | --- |
| 1 打包 plugin | `plugins/k30-toolkit/`：`.claude-plugin/plugin.json`、`skills/commit-message`、`skills/code-review`、`agents/security-auditor.md`、`hooks/hooks.json` + `hooks/block-env.js` | `claude plugin validate` 通過 |
| 2 本機 marketplace | `.claude-plugin/marketplace.json`，名稱 `k30-local`，source `./plugins/k30-toolkit` | `claude plugin validate .` 通過 |
| 3 備份 | `backup/*-before.txt`（plugin list、marketplace list、全域 plugins 目錄與 json 的 SHA256） | 完成 |
| 4 安裝 | `marketplace add ./ --scope project` → `install k30-toolkit@k30-local --scope project` | 成功，list 顯示 `Scope: project`、enabled |
| 4 驗證 | `claude -p`（清 CLAUDE* 環境變數、stream-json、禁 Write/Edit/Bash） | 見下方 |
| 5 移除 | `uninstall … --scope project` → `marketplace remove k30-local --scope project` | 成功，list 與安裝前完全相同 |
| 6 稽核清單 | `AUDIT-CHECKLIST.md` | 完成 |

## 驗證結果

- **skill 可見**：init 事件列出 `k30-toolkit:commit-message`、`k30-toolkit:code-review`（plugin 的 skill 會加 `plugin名:` 前綴，和內建 `code-review` 不衝突）。
- **agent 可見**：`k30-toolkit:security-auditor`。
- **hook 單元測試**：直接把 JSON 餵給 `block-env.js`：`.env`、`.env.local` → exit 2（擋下）；`.env.example`、`app.py` → exit 0（放行）。
- **hook 在 session 內實測：沒有觀察到**。測試 session 讀 `.env` 與 `docs/.env.k30` 都被**全域 `permissions.deny` 先擋下**（訊息：`File is in a directory that is denied by your permission settings.`），權限檢查比 plugin hook 早，hook 沒機會執行。照快速模式只重測一輪就收尾。
  - 想看 hook 實際出手，需要在沒有 `.env` deny 規則的環境測；本機全域規則屬於使用者設定，不可修改。
- 主 session 也被同一條 deny 規則擋下建立 `.env` 測試檔，所以沒建任何 `.env`。
- 原始紀錄：`backup/verify-stream.jsonl`、`backup/verify-hook-retry.jsonl`。

## 全域 `~/.claude/plugins/` 被寫了什麼

即使用 `--scope project`，CLI 仍會寫全域檔案（本次主 session 沒有自己寫任何全域檔，都是 CLI 寫的）：

| 位置 | 安裝後 | 移除後 |
| --- | --- | --- |
| `known_marketplaces.json` | 新增 `k30-local` 項目（含本機絕對路徑） | 已移除，`grep k30` 0 筆 |
| `installed_plugins.json` | 新增 `k30-toolkit@k30-local`（scope project、projectPath） | 已移除，SHA256 與安裝前相同 |
| `cache/k30-local/k30-toolkit/0.1.0/` | 複製一份完整 plugin | **仍在**，CLI 加了 `.orphaned_at` 標記，等它自動清理 |

- `known_marketplaces.json` 的 SHA256 和安裝前不同，但差異是 `claude-plugins-official`、`claude-code-plugins` 兩個官方 marketplace 在測試期間自動刷新 `lastUpdated`，與 k30 無關。
- **殘留**：`~/.claude/plugins/cache/k30-local/`。依本演練限制不刪全域檔案。要手動清理可執行：
  `rm -rf ~/.claude/plugins/cache/k30-local`
- 專案 `.claude/settings.json`：安裝時 CLI 寫入 `extraKnownMarketplaces`（**含絕對路徑**）與 `enabledPlugins`；移除後只剩空物件，已刪除此檔。

## 和書上做法的差異

1. **plugin 放 `plugins/k30-toolkit/` 而不是 `./.claude/`**：plugin 本身是要分發的套件，要有獨立根目錄；`.claude/` 是本專案的設定區。安裝後的生效紀錄才寫在 `./.claude/settings.json`（project scope）。
2. **`marketplace add` 有 `--scope project`**：寫進專案 settings 的 `extraKnownMarketplaces`，但全域 `known_marketplaces.json` 和 cache 仍會被寫（見上表）——「project scope」只代表宣告位置，不代表完全不碰全域。
3. **hook 用 Node 腳本**：`${CLAUDE_PLUGIN_ROOT}` 定位腳本、exit 2 擋下；JSON 解析失敗時刻意放行，避免 hook 壞掉卡死所有工具。
4. **plugin 元件名有命名空間**：`k30-toolkit:code-review`，可和內建 `/code-review` 共存。
5. **權限 deny 先於 hook**：使用者已有 `.env` deny 規則時，plugin 的 `.env` hook 是第二道防線，平常不會觸發。

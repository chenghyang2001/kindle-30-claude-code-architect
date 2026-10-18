# Plugin / 設定季度稽核清單

每季（1、4、7、10 月第一週）跑一次。每項打勾或寫下處置。

## 1. 盤點

- [ ] `claude plugin list` 輸出存檔到 `audit/YYYY-Qn/plugin-list.txt`
- [ ] `claude plugin marketplace list` 輸出存檔
- [ ] 列出各 scope 的 skill：`~/.claude/skills/`、`./.claude/skills/`、各 plugin 的 `skills/`
- [ ] 列出各 scope 的 agent：`~/.claude/agents/`、`./.claude/agents/`、各 plugin 的 `agents/`
- [ ] 列出所有 hook：`settings.json` / `settings.local.json` 的 `hooks` 區段，以及各 plugin 的 `hooks/hooks.json`
- [ ] 用 `claude plugin details <name>` 看每個 plugin 的元件數與 token 成本
- [ ] 檢查有無同名衝突（例：內建 `code-review` 與 `k30-toolkit:code-review`）

## 2. 未使用項目

- [ ] 近 90 天沒被觸發的 skill／agent（翻 session transcript 搜名稱）→ 停用或移除
- [ ] 已停用（disabled）超過一季的 plugin → 移除
- [ ] 不再使用的 marketplace → `claude plugin marketplace remove`
- [ ] `~/.claude/plugins/cache/` 中標了 `.orphaned_at` 的舊版本 → 確認已被清掉

## 3. 權限

- [ ] 每個 agent 的 `tools:` 是否最小化（唯讀用途只給 Read / Grep / Glob）
- [ ] `permissions.allow` 有沒有過寬的萬用規則（如 `Bash(*)`）
- [ ] `permissions.deny` 仍涵蓋 `.env*`、`credentials.json`、金鑰目錄
- [ ] project scope 安裝的 plugin 沒有意外出現在 user scope

## 4. 版本

- [ ] 每個 plugin 的 `version` 與 marketplace.json 一致
- [ ] 有改內容就升版號（semver：修 bug 升 patch、加功能升 minor、破壞相容升 major）
- [ ] `claude plugin marketplace update` 後，檢查上游 changelog 有無破壞性變更
- [ ] Claude Code 本體版本（`claude --version`）記錄在稽核紀錄

## 5. 安全檢查

- [ ] `claude plugin validate <path>` 全部通過
- [ ] hook 指令只呼叫 plugin 內的腳本（`${CLAUDE_PLUGIN_ROOT}`），不 `curl | sh`、不下載遠端程式
- [ ] hook 腳本解析失敗時的行為已確認（放行或擋下，要刻意選擇）
- [ ] skill／agent 內文沒有硬編碼 token、API key、使用者絕對路徑
- [ ] 第三方 marketplace 來源仍可信（repo 擁有者沒換、沒被封存）
- [ ] 擋 `.env` 的 hook 實測一次（直接餵 JSON 給腳本，確認 exit 2）

## 6. 紀錄

- [ ] 結果寫入 `audit/YYYY-Qn/report.md`：移除了什麼、改了什麼權限、下季待辦

# 第 17 章「五大安全掛鉤」快速演練筆記

## 做了什麼

| 檔案 | 觸發（matcher） | 行為 |
|---|---|---|
| `.claude/hooks/block_dangerous.py` | Bash | 指令含 `rm -rf /`（含 `~`、`/*`、`$HOME`、`rm -r -f /`）、`mkfs`、`dd if=`、fork bomb `:(){`、`chmod -R 777` → exit 2 擋下 |
| `.claude/hooks/protect_files.py` | Write\|Edit\|MultiEdit | 目標在 `.git/` 內、`package-lock.json`／`yarn.lock`／`pnpm-lock.yaml`／`.env`、`*.pem`／`*.key`／`*.p12` → exit 2 |
| `.claude/hooks/block_secrets.py` | Write\|Edit\|MultiEdit | 內容含 AWS Access Key ID（AKIA 開頭）、PEM 私鑰開頭、password 等號後接硬編碼字面值 → exit 2（取自環境變數則放行） |
| `.claude/hooks/block_force_push.py` | Bash | `git push --force`、`-f`（含 `-fu` 這類短旗標叢集）、`+refspec` → exit 2；`--force-with-lease` 放行 |
| `.claude/hooks/confirm_deploy.py` | Bash | 含 `deploy`、`vercel ... --prod`、`kubectl apply` → stdout 輸出 JSON `permissionDecision: "ask"`，exit 0 |

- 註冊在專案 `.claude/settings.json` 的 `hooks.PreToolUse`，指令用 `python "$CLAUDE_PROJECT_DIR/.claude/hooks/xxx.py"`，每支 timeout 10 秒。
- 本視窗以 `--setting-sources project,local` 啟動，未動到全域 `~/.claude/`。
- `tests/run_hooks.py`：用 subprocess 直接餵 JSON 給每支腳本，判定 exit 2＝block、JSON ask＝ask、其餘＝allow。

## 驗證結果

### 1. 單元測試（`PYTHONUTF8=1 python tests/run_hooks.py`）

| 腳本 | 輸入 | 預期 | 實際 | 結果 |
|---|---|---|---|---|
| block_dangerous.py | `rm -rf /` | block | block | ✅ |
| block_dangerous.py | `echo 'rm -rf /'` | block | block | ✅ |
| block_dangerous.py | `sudo rm -fr ~` | block | block | ✅ |
| block_dangerous.py | `mkfs.ext4 /dev/sda1` | block | block | ✅ |
| block_dangerous.py | `dd if=/dev/zero of=/dev/sda` | block | block | ✅ |
| block_dangerous.py | `:(){ :\|:& };:` | block | block | ✅ |
| block_dangerous.py | `chmod -R 777 /var` | block | block | ✅ |
| block_dangerous.py | `rm -rf ./build` | allow | allow | ✅ |
| block_dangerous.py | `ls -la /` | allow | allow | ✅ |
| protect_files.py | `Write .git/config` | block | block | ✅ |
| protect_files.py | `Edit package-lock.json` | block | block | ✅ |
| protect_files.py | `Write certs/server.pem` | block | block | ✅ |
| protect_files.py | `Write src/app.py` | allow | allow | ✅ |
| protect_files.py | `Write .github/ci.yml` | allow | allow | ✅ |
| block_secrets.py | `Write 含 AWS key` | block | block | ✅ |
| block_secrets.py | `Write 含私鑰` | block | block | ✅ |
| block_secrets.py | `Edit 硬編碼 password` | block | block | ✅ |
| block_secrets.py | `password 取自環境變數` | allow | allow | ✅ |
| block_secrets.py | `一般程式碼` | allow | allow | ✅ |
| block_force_push.py | `git push --force` | block | block | ✅ |
| block_force_push.py | `git push -f` | block | block | ✅ |
| block_force_push.py | `git push origin +main` | block | block | ✅ |
| block_force_push.py | `--force-with-lease` | allow | allow | ✅ |
| block_force_push.py | `git push -u origin feat` | allow | allow | ✅ |
| confirm_deploy.py | `npm run deploy` | ask | ask | ✅ |
| confirm_deploy.py | `vercel --prod` | ask | ask | ✅ |
| confirm_deploy.py | `kubectl apply -f k8s.yaml` | ask | ask | ✅ |
| confirm_deploy.py | `kubectl get pods` | allow | allow | ✅ |
| confirm_deploy.py | `vercel (preview)` | allow | allow | ✅ |

共 29 案，通過 29，失敗 0。

### 2. 端對端實測（`claude -p --setting-sources project,local --output-format stream-json`）

- 測試 session：先清掉 `CLAUDE*` 環境變數、只允許 `Bash(echo:*)`、禁用 Write/Edit/MultiEdit/NotebookEdit、`--max-turns 4`。
- 請它執行乾跑字串 `echo 'rm -rf /'`：就算沒被擋也只會印出文字，不會真的刪東西。
- **第一輪：沒擋住** ❌。正規式要求 `/` 後面接空白、行尾或 `;&|`，但這裡後面是單引號 `'`，所以沒命中，echo 照常印出字串。
- **修正**：結尾也接受 `'`、`"`、反引號、`)`，並把 `echo 'rm -rf /'` 加進單元測試（29/29 通過）。
- **第二輪：成功擋下** ✅。stream-json 的 tool_result 為 `is_error=true`，內容：
  `PreToolUse:Bash hook error: [python "$CLAUDE_PROJECT_DIR/.claude/hooks/block_dangerous.py"]: [block_dangerous] 已攔截危險指令（rm -rf 指向根目錄／家目錄）：echo 'rm -rf /'`
  模型照指示沒有重試、沒有換方法。
- **意外的額外驗證**：settings.json 建好後，主 session（本視窗）的 hook 也即時生效。我用 Bash heredoc 寫 NOTES.md 時，內容含該字串，被 block_dangerous 擋下，只好改用 Write 工具寫檔。
- 其餘四支只做單元測試，沒有逐支跑 claude -p（快速模式：每項驗證只跑一次）。

## 和書上做法的差異

> 本次手邊沒有書本原文可逐行對照，以下以本章主題（五支 PreToolUse 安全掛鉤）的典型寫法為基準比較。

1. **擋法**：四支「擋」的腳本用 exit code 2 加 stderr（最簡單、相容性最好）；只有 confirm_deploy 用 JSON `hookSpecificOutput.permissionDecision = "ask"`。若想讓擋下理由更結構化，也可以統一改成輸出 `permissionDecision: "deny"` 的 JSON。
2. **字串比對，不懂語意**：hook 只看指令文字，所以 `echo 'rm -rf /'` 這種無害字串也會被擋（寧可誤擋），連寫筆記的 heredoc 都會中。反過來，用變數拼接（例如把 `/` 存進變數再 rm）仍可能繞過。hook 是一道防線，不能取代 permissions deny 規則與沙箱。
3. **rm 規則收窄**：只擋目標是 `/`、`/*`、`~`、`$HOME` 的情況，`rm -rf ./build` 放行，避免日常清理被誤擋。
4. **force push 多擋 `+refspec`** 與 `-fu` 這類短旗標叢集；用 shlex 斷詞並以 `;`、`&&`、`||`、`|` 切段，避免 `--force-with-lease` 被當成 `--force` 子字串誤判。
5. **block_secrets 涵蓋 MultiEdit**（`edits[].new_string`），且 password 取自 `os.environ`／`getenv`／`process.env`／`${VAR}` 時放行。
6. **Windows 細節**：hook 讀 stdin 一律用 `sys.stdin.buffer` 再以 UTF-8 解碼，避開 cp950；測試檔內的機密樣本用字串拼接產生，免得寫檔時被自己的 block_secrets 擋下（本筆記也刻意不寫出會命中的字面值）。
7. 依使用者指示，設定寫在專案 `.claude/settings.json`（專案 CLAUDE.md 原本建議放 `settings.local.json`；兩者都是專案層，不影響全域）。

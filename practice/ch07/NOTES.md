# 第 07 章演練：多檔案技能（scaffold-react）

> 快速 demo 模式，未經 QA／審查。

## 做了什麼
- `.claude/skills/scaffold-react/`（專案層，未動全域 `~/.claude/`）
  - `SKILL.md`：觸發條件 + 步驟（確認名稱 → 按需讀規範 → 複製模板 → 替換 `{{Name}}` → 自我檢查）
  - `references/conventions.md`：命名、資料夾結構、props 型別、測試規範
  - `assets/`：`Component.tsx.tpl`、`Component.test.tsx.tpl`、`Component.module.css.tpl`、`index.ts.tpl`
- 用新 session 觸發 skill，產出 `src/components/Button/` 四個檔案。

## 為什麼模板放 assets、規範放 references
| 目錄 | 內容 | 何時進 context |
| --- | --- | --- |
| `SKILL.md` | 觸發條件與步驟 | skill 觸發時才載入（description 平時常駐） |
| `references/` | 給 Claude「讀懂」的規範文件 | 只在需要判斷時才 Read（漸進式揭露） |
| `assets/` | 給 Claude「複製」的原料 | 不需要理解，可直接 `sed` 替換複製，內容甚至不必進 context |

把四個模板和規範都塞進 SKILL.md，每次觸發都要付全部 token；拆開後，簡單情境只付 SKILL.md 的成本。

## 驗證結果
1. 觸發：`env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "用 scaffold-react 建一個 Button 元件..." --output-format stream-json --verbose`（禁止 `git`）
   - 工具呼叫順序：`Skill(scaffold-react)` → `Bash`（ls 目錄 + cat 模板）→ `Bash`（mkdir + sed 替換寫檔），共 5 turns，result=success。
   - **沒有 Read `references/conventions.md`**：stream 中 conventions.md 只出現在 SKILL.md 內文裡 → 漸進式揭露如預期生效。
2. node 檢查：`node -e "..."` 輸出 `PASS 4 files, no {{Name}}`。
3. 沒有裝 React，所以 `Button.test.tsx` 沒有實際執行。

## 和書上做法的差異
- 書上大致是 Claude 逐檔 Read 模板再 Write；實測的 Claude 選擇用 `sed` 一次替換，模板內容只為了確認而 cat 過一次，更省 token。
- 只驗證一次「簡單情境」；沒有測「名稱格式需轉換（如 user-card）」時是否會主動讀 references。
- 測試 session 回報夾帶了「快速模式」字樣，是因為全域 CLAUDE.md 規則被一起載入，非 skill 本身行為。

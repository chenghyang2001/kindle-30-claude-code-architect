# 第 08 章「組合與衝突」演練筆記

> 快速 demo 模式：未經 QA／審查流程，每個驗證只跑一次。

## 做了什麼

| 步驟 | 產出 |
| --- | --- |
| 1. 重建前幾章 skill | `.claude/skills/{pr-review,pr-description,commit-message}/SKILL.md` |
| 2. Skill audit | 改寫 pr-review／pr-description 的 description，各加「Not for：…請改用 X」 |
| 3. 技能接棒 | `refactor-helper`：重構完最後一步提示「接著用 commit-message」 |
| 4. Meta-skill | `release-prep`：pr-review → commit-message → pr-description，review 不過就停 |
| 5. 文件 | `.claude/skills/README.md`（總表＋mermaid 接棒圖） |
| 6. 觸發驗證 | `claude -p` 跑兩個容易衝突的 prompt（見下） |

## Audit 發現

原版兩個 description：

- pr-review：「處理 Pull Request。看 PR、整理 PR 內容…Use when the user mentions a PR」
- pr-description：「處理 Pull Request 的內容。整理 PR、說明 PR…Use when the user mentions a PR」

衝突點：

1. 開頭都是「處理 PR」，名詞相同、動詞模糊。
2. 「整理 PR」兩邊都有。
3. 觸發條件一字不差（mentions a PR）。

修正方式：用**動詞**切分——pr-review 只認「審查／檢查／有沒有問題／bug」，pr-description 只認「寫／產生／說明／標題」；兩邊互相用 Not for 指向對方。

## 驗證結果

指令（清掉 CLAUDE* 環境變數、stream-json、禁止寫檔與 commit）：

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "<prompt>" \
  --output-format stream-json --verbose --max-turns 8 \
  --disallowedTools "Write" "Edit" "NotebookEdit" "Bash(git commit:*)" "Bash(git push:*)" "Bash(git add:*)"
```

| Prompt | 預期 | 實際第一個工具呼叫 | 結果 |
| --- | --- | --- | --- |
| 幫我看這個 PR 有沒有問題 | pr-review | `Skill {"skill":"pr-review"}` → 2 次唯讀 Bash | ✅ 輸出問題表格 |
| 幫我寫 PR 說明 | pr-description | `Skill {"skill":"pr-description"}` → 3 次唯讀 Bash | ✅ 輸出 Markdown PR 說明，未建 PR |

- 兩次各約 US$0.79、5～6 turns。
- 全域也有 `code-review`、`ultra-review` 等相近 skill，但都沒被選中，專案層描述夠具體。
- 兩個測試 session 都沒寫檔、沒 commit。唯一新增的 `.claude/session-state.md` 是全域 Stop hook 自動產生，已加入 `.gitignore`。

### 順手修正（未重測）

pr-review 測試時自己抓到一個問題：repo 只有 master，`git diff master...HEAD` 是空的。已在 pr-review／pr-description 補上「目前就在 base 分支時改用 `git show HEAD`」。依快速模式規則沒有重跑。

## 和書上做法的差異

- 書上的前幾章 skill 是逐章累積；本資料夾是新的，所以三個基礎 skill 用精簡版重建，並刻意把 pr-review／pr-description 原版寫成重疊描述，讓 audit 有東西可改（第一個 commit 前就已修正，原版只記錄在本筆記）。
- 觸發驗證用 `claude -p` + stream-json 看 `Skill` 工具呼叫，而不是互動式 session 目測。
- release-prep 只寫流程說明，沒有實際跑一次完整發版流程（沒有 remote，也規定不 push）。
- 未測：refactor-helper 的接棒提示、release-prep 的觸發與串接、與 commit-message 的邊界衝突。

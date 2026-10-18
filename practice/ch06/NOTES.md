# 第 06 章「描述工程」演練筆記

## 做了什麼

1. 建立專案層 skill：`.claude/skills/explain-error/SKILL.md`，description 採四段式 What／When／Not for／Output；本文規定固定四段輸出（錯誤摘要／根本原因／修正步驟／預防建議）。
2. 寫 5 個測試 prompt（3 應觸發、2 不應觸發），放在 `tests/trigger/`。N2 是故意設計的干擾題：含「錯誤處理」字眼，但沒有貼錯誤輸出。
3. 用 `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p ... --output-format stream-json` 實跑，從 `Skill` 工具呼叫判定是否觸發。
4. 改了 2 次 description、共跑 4 輪，結果記在 `TRIGGER-TEST.md`。

## 驗證結果

| 版本 | 符合數 | 問題 |
| --- | --- | --- |
| v1 | 2/5 | 3 個應觸發全部漏觸發 |
| v2 | 3/5 | 純 stack trace（P1、P2）仍漏觸發 |
| v3 | 5/5（跑兩次都是） | 無 |

全程沒有誤觸發，問題都是漏觸發。

## 學到的事

- **漏觸發比誤觸發常見**：模型覺得自己能直接答的事（解釋錯誤正是如此），就不會去呼叫 skill。description 要用命令語氣，說清楚「必須先呼叫」。
- **Not for 會反過來吃掉 When**：v1 排除了「多輪追查的除錯」，結果貼了指向專案檔案的 stack trace 都被歸到這一類。排除條件要用可觀察的特徵（「訊息裡有沒有錯誤輸出」），不要用主觀判斷（「長時間除錯」）。
- **要寫清楚呼叫時機**：模型的習慣是先 Glob／讀檔。寫明「第一個動作、先於讀檔」才擋得住。
- **觸發判定要客觀**：看 stream-json 裡的 `Skill` tool_use，比請模型「最後一行註明用了哪個 skill」可靠，也不會因為多加一句指示而影響觸發。

## 和書上做法的差異

- 書上建議在 prompt 後要求模型註明用了哪個 skill，或從輸出格式判斷；這裡改用 `--output-format stream-json` 直接抓 `Skill` 工具呼叫，輸出格式只當輔助。
- 書上的四段式 description 偏描述語氣；實測要加上命令語氣與呼叫順序（v3）才會穩定觸發。
- 額外加了 `--disallowedTools Write Edit NotebookEdit Bash`。第 1 輪有個測試 session 真的寫檔並 commit 進 repo，已撤銷。
- 測試環境帶著使用者的全域 CLAUDE.md 與上百個全域 skill，比書上的乾淨環境競爭更多；在這種環境下達到 5/5，可信度比較高。
- 樣本只有 5 題、每版 1～2 次，只能算冒煙測試，不是統計上可靠的觸發率。

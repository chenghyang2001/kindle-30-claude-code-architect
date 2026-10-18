# explain-error 觸發測試

## 測試方法

- 每個 prompt 用 `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "<prompt>" --output-format stream-json --verbose` 開新 session 在本專案目錄執行（5 個平行跑）。
- **判定是否觸發**：解析 stream-json，看有沒有 `tool_use` 名稱為 `Skill`、`input.skill = "explain-error"`。這比請模型「最後一行自己註明」更客觀，也不會干擾觸發判斷。
- **輔助判定**：輸出是否出現 SKILL.md 規定的「🔍 根本原因」四段格式。
- 第 2 輪起加上 `--disallowedTools Write Edit NotebookEdit Bash`，避免測試 session 改動專案（原因見下方「插曲」）。
- 重跑：`bash tests/trigger/run.sh <標籤>`；prompt 原文在 `tests/trigger/P1~P3.txt`、`N1~N2.txt`。

## 測試 prompt

| ID | prompt 摘要 | 預期 |
| --- | --- | --- |
| P1 | React 白畫面 + `TypeError: Cannot read properties of undefined (reading 'map')` 三層 stack trace | 觸發 |
| P2 | Python `Traceback ... KeyError: 'database'`（只貼 traceback，沒有任何說明文字） | 觸發 |
| P3 | 「npm start 一直噴 `Error: Cannot find module 'express'`，這是什麼意思？要怎麼修？」 | 觸發 |
| N1 | 「幫我寫一個 Python 排序函式，可以依指定欄位排序 dict 清單。」 | 不觸發 |
| N2 | 「幫我在這個函式加上完整的錯誤處理（try/except）」＋ 3 行程式碼（含「錯誤」字眼但沒有錯誤輸出，故意設計的干擾題） | 不觸發 |

## 結果

### 第 1 輪：description v1（書上四段式的直白寫法）

| ID | 預期 | 實際 | 是否符合 |
| --- | --- | --- | --- |
| P1 | 觸發 | 未觸發（先跑 Bash 找 List.js，再自己回答） | ❌ 漏觸發 |
| P2 | 觸發 | 未觸發（先跑 Bash 找 app.py，再自己回答） | ❌ 漏觸發 |
| P3 | 觸發 | 未觸發（先跑 Bash 看 package.json，再自己回答） | ❌ 漏觸發 |
| N1 | 不觸發 | 未觸發 | ✅ |
| N2 | 不觸發 | 未觸發 | ✅ |

**2/5 符合**。init 訊息確認 `explain-error` 有被載入，但模型判斷「這我自己就能答」，直接回答。

### 第 2 輪：description v2（When 改為命令句「必須先呼叫本 skill，即使看起來很簡單」）

| ID | 預期 | 實際 | 是否符合 |
| --- | --- | --- | --- |
| P1 | 觸發 | 未觸發（先 Glob `src/**` 找檔，再自己回答） | ❌ 漏觸發 |
| P2 | 觸發 | 未觸發（先 Glob 找 .py／設定檔，再自己回答） | ❌ 漏觸發 |
| P3 | 觸發 | **觸發**，輸出四段格式 | ✅ |
| N1 | 不觸發 | 未觸發 | ✅ |
| N2 | 不觸發 | 未觸發 | ✅ |

**3/5 符合**。有明確提問句（P3）的已經觸發；純 stack trace 且指向專案檔案的（P1、P2）仍被當成「先去讀檔的除錯任務」。研判 v1／v2 的 Not for 寫了「需要多輪追查的除錯」，正好跟這兩題撞在一起。

### 第 3 輪：description v3（指定「第一個動作、先於搜尋或讀檔」，並收窄 Not for）

| ID | 預期 | 實際 | 是否符合 |
| --- | --- | --- | --- |
| P1 | 觸發 | 觸發，四段格式 | ✅ |
| P2 | 觸發 | 觸發，四段格式 | ✅ |
| P3 | 觸發 | 觸發，四段格式 | ✅ |
| N1 | 不觸發 | 未觸發 | ✅ |
| N2 | 不觸發 | 未觸發 | ✅ |

**5/5 符合**。再跑一次 v3（標籤 v3b）同樣 5/5，結果穩定。

## description 前後差異（v1 → v3）

| 段落 | v1 | v3 | 為什麼改 |
| --- | --- | --- | --- |
| When | 「使用者貼上錯誤輸出……時使用」（描述語氣） | 「只要訊息中**貼了實際的錯誤輸出**……就**必須**在回答前、**也在搜尋或讀取任何檔案之前**先呼叫本 skill（第一個動作），即使看起來很簡單、或 stack trace 指向專案裡的檔案也一樣」 | 描述語氣會被模型解讀成「可用可不用」；而且模型習慣先讀檔，要明說呼叫順序 |
| 關鍵字 | 無 `Cannot find module` | 加入 `Cannot find module` 與具體格式範例（`Traceback (most recent call last)`、`XxxError: ...`） | 讓觸發條件對應到看得見的文字特徵 |
| Not for | 「……需要實際執行與多輪追查的長時間除錯」 | 改成「訊息中**沒有貼出任何實際錯誤輸出**的請求」，並明列「幫我加上錯誤處理／try-except」 | 原本的排除條件跟「stack trace 指向檔案」重疊，造成漏觸發；改用「有沒有錯誤輸出」這條清楚的界線 |
| Output | 不變 | 不變 | — |

完整舊版保存在 `tests/trigger/SKILL.v1.md`、`SKILL.v2.md`。

## 插曲：測試 session 的副作用

第 1 輪 N1（寫排序函式）的測試 session 在 bypass 權限下真的寫了 `sort_dicts.py`，還自己 `git commit` 進本 repo。已撤銷該 commit 並刪除檔案（備份在 scratchpad），第 2 輪起改用 `--disallowedTools` 禁止寫檔與 Bash。教訓：用 `claude -p` 做觸發測試時，要先關掉會改動環境的工具。

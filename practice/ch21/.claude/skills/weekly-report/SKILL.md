---
name: weekly-report
description: 一人公司週報：從 git log、TODO.md 與使用者提供的數字（營收、訂單、客服件數）彙整本週成果、指標、下週計畫與風險。觸發：週報、weekly report、本週總結、這週做了什麼、weekly-report。不觸發：帳務核對（用 invoice-check）、上線檢查（用 launch-checklist）。
---

# weekly-report（週報）

## 資料來源（依序讀，讀不到就略過並註明）
1. `git log --since="7 days ago" --oneline`
2. 專案根目錄 `TODO.md`（已勾選 = 完成、未勾選 = 進行中）
3. 使用者對話中提供的數字

## 輸出格式
```
# 週報（YYYY-MM-DD ～ YYYY-MM-DD）
## 本週成果（3~5 點）
## 關鍵指標（表格：指標｜本週｜備註）
## 下週計畫（3 點）
## 風險／卡關
```

## 規則
- 繁體中文，總長 300 字內；沒有資料的指標寫「—」，不捏造數字
- 預設只輸出到對話，不寫檔

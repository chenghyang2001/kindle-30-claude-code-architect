---
name: changelog-entry
description: 依 git log（上次 tag 或指定範圍以來的 commit）產生 Keep a Changelog 格式的 CHANGELOG 條目（Added／Changed／Fixed／Removed）。觸發：寫 changelog、更新 CHANGELOG、版本變更紀錄、release notes。不適用：單一 commit 訊息（用 commit-message）、PR 描述（用 pr-description）。
---
# changelog-entry
1. 執行 `git describe --tags --abbrev=0` 找上次 tag；沒有就用全部歷史 `git log --oneline`。
2. 依 commit 動詞分類：新增→Added、修復→Fixed、重構/更新→Changed、移除→Removed。
3. 輸出：
   ```
   ## [Unreleased] - YYYY-MM-DD
   ### Added
   - ...
   ```
4. 預設只輸出到對話；使用者要求才寫入 CHANGELOG.md 頂端。

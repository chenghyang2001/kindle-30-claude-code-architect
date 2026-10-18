# K30 演練交接

## 原機器結果

本書沒有在其他機器演練過，沒有可比對的原機器結果。每章的差異以「和書上原做法的差異」記錄。

## 快速模式進度表

| 章 | 完成日 | 實際耗時 | 和書上做法的差異 |
| --- | --- | --- | --- |
| 01 | 2026-10-18 | 2 分 | 書上只是概念討論；改寫成 FRICTION.md 五項摩擦對應表，未建任何設定 |
| 02 | 2026-10-18 | 3 分 | 建示範結構＋解構診斷寫 ANATOMY.md；全域只讀；managed 層本機沒有，僅文件說明 |
| 03 | 2026-10-18 | 3 分 | skill／agent／hook 都放專案層；claude -p 三次驗證（hook exit 2 擋下 auth/）；hook 只攔 Write/Edit，Bash 仍可繞過 |
| 04 | 2026-10-18 | 5 分 | 三個 skill 放專案層；實測 allowed-tools 只是預先核准、不會擋寫檔（書上當成限制），要擋需 permissions.deny |
| 05 | 2026-10-18 | 4 分 | commit-message／slack-update 放專案層；subject 依全域規則改繁中；測試子 session 被全域 Stop hook 觸發自行 commit |
| 06 | 2026-10-18 | 14 分 | 四段式 description 經 3 版迭代（v1 Not for 蓋掉 When）；用 stream-json 判觸發；全域上百 skill 競爭比書上嚴苛；耗時超出預估 |
| 07 | 2026-10-18 | 3 分 | scaffold-react 多檔案 skill 放專案層；未裝 React，以 node -e 檢查四檔齊全；實測未讀 references（漸進式揭露生效） |
| 08 | 2026-10-18 | 5 分 | 重建 skill 並劃清 pr-review／pr-description 邊界、refactor-helper 接棒、meta-skill release-prep；只實測兩個衝突 prompt |

---
name: api-docs
description: 依原始碼的匯出函式／HTTP 端點產生 API 文件（簽名、參數、回傳、錯誤、範例），輸出 Markdown。觸發：寫 API 文件、產生文件、document this API、JSDoc。不適用：版本變更紀錄（用 changelog-entry）、PR 說明（用 pr-description）。
---
# api-docs
1. 找出所有 export 或路由定義。
2. 每個項目輸出：`### 名稱`、簽名、參數表、回傳值、可能錯誤、使用範例。
3. 預設輸出到對話；使用者指定路徑才寫檔（如 `docs/api.md`）。

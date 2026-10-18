---
name: scaffold-react
description: 依團隊規範建立新的 React + TypeScript 元件骨架（元件、測試、CSS Module、index 匯出共四個檔案）。當使用者說「用 scaffold-react 建 X 元件」「新增 React 元件」「scaffold component」「建立元件骨架」時觸發。不觸發：修改既有元件、非 React 專案。
---

# scaffold-react：React 元件骨架產生器

## 何時使用
使用者要求「建立一個新的 React 元件」時。元件名稱由使用者提供（例：Button、UserCard）。

## 步驟
1. **確認元件名稱**：必須是 PascalCase（如 `Button`）。若使用者給 `user-card`，轉成 `UserCard`。
2. **（按需）讀規範**：只有在以下情況才讀 `references/conventions.md`：
   - 名稱格式有疑慮、要決定輸出路徑、或使用者要求額外 props／測試細節。
   - 單純「照模板建一個元件」時**不必讀**，模板本身已符合規範（漸進式揭露，省 context）。
3. **複製模板**：從 `assets/` 讀取四個模板：
   - `Component.tsx.tpl` → `{{Name}}.tsx`
   - `Component.test.tsx.tpl` → `{{Name}}.test.tsx`
   - `Component.module.css.tpl` → `{{Name}}.module.css`
   - `index.ts.tpl` → `index.ts`
4. **替換佔位符**：把所有 `{{Name}}` 換成元件名稱，寫入 `src/components/{{Name}}/`。
5. **自我檢查**：確認四個檔案都存在，且內容不殘留 `{{Name}}`。
6. 回報產出的檔案路徑清單。

## 注意
- 不要安裝套件、不要改 package.json。
- 目錄已存在時不要覆蓋，先告知使用者。

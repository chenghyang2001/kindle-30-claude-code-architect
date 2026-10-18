# React 元件規範

## 命名
- 元件名稱與檔名一律 PascalCase：`Button.tsx`、`UserCard.tsx`。
- CSS Module：`<Name>.module.css`，class 用 camelCase（`.root`、`.primaryButton`）。
- 測試檔：`<Name>.test.tsx`，與元件放同一資料夾。

## 資料夾結構
```
src/components/<Name>/
├── <Name>.tsx          # 元件本體
├── <Name>.test.tsx     # 測試
├── <Name>.module.css   # 樣式
└── index.ts            # 對外匯出（barrel）
```
外部一律從 `src/components/<Name>` 匯入，不直接 import `<Name>.tsx`。

## Props 型別
- 以 `export interface <Name>Props` 宣告，不用 `any`。
- 支援 `className?: string` 與 `children?: React.ReactNode`。
- 元件用具名匯出的函式元件（`export function <Name>`），不用 default export。

## 測試規範
- 使用 Vitest/Jest + @testing-library/react。
- 至少一個「能渲染 children」的測試；用 `screen.getByText` 查詢，不用 snapshot。

# 前端開發說明

## 技術選型

新版前端採用：

```text
React + TypeScript + Vite
```

前端專案放在：

```text
frontend/
```

舊的 Express/Handlebars 前端暫時保留，不再繼續擴充。新版 React 前端會直接串接 Python/FastAPI 後端。

## 目錄

```text
frontend/
  src/
    api/
      dxf.ts
    components/
      EditorCanvas.tsx
    editor/
      buildScaffold.ts
      editorState.ts
    models/
      scaffold.ts
    App.tsx
    main.tsx
    styles.css
```

## 啟動

先啟動後端：

```bash
python -B -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

再啟動前端：

```bash
cd frontend
npm install
npm run dev
```

前端位置：

```text
http://127.0.0.1:5173
```

## 功能範圍

目前 React 前端初版包含：

- 基本尺寸輸入。
- 初始格線建立。
- 工具模式：
  - 選取
  - 高度
  - 樓梯
  - 錨點
  - 橫桿
  - 斜撐
- 快捷鍵：
  - `V/H/S/A/R/B`
  - `Shift + 點擊`
  - `Enter` / `Space`
  - `Ctrl + Z`
  - `Ctrl + Y`
  - `Delete`
  - `Esc`
- SVG 編輯畫布。
- 將目前狀態轉成 scaffold model。
- 呼叫 FastAPI `/api/dxf/export` 匯出 DXF。

## 驗證狀態

目前已完成：

```bash
npm run build
```

結果：React + TypeScript + Vite production build 通過。

開發伺服器已確認可回應：

```text
http://127.0.0.1:5173
```

## 注意事項

目前前端直接呼叫：

```text
http://127.0.0.1:8000
```

如果後端位置不同，可以設定：

```text
VITE_API_BASE_URL
```

例如：

```bash
set VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

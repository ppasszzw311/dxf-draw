# 後端開發說明

## 目的

新版後端先以 Python 建立獨立 DXF 產生服務。此階段先保留原本 Node/Express 專案，不直接移除既有路由，避免一次重構範圍過大。

目前後端目標：

- 使用 Pydantic 定義 scaffold model。
- 使用 `ezdxf` 產生 DXF。
- 使用 FastAPI 提供驗證與匯出 API。
- 匯出檔案放在既有 `public/dxfFile/`，方便先和原專案共存。

## 目錄

```text
backend/
  app/
    main.py
    models.py
    dxf_renderer.py
    file_naming.py
  scripts/
    export_example.py
requirements-backend.txt
```

## API

### 健康檢查

```text
GET /health
```

### 驗證 scaffold model

```text
POST /api/scaffold/validate
```

Request body 支援兩種格式。

直接傳 scaffold model：

```json
{
  "fileName": "dxfTest",
  "base": {},
  "role": {},
  "fiveViewGrid": {},
  "height": [],
  "stair": [],
  "anchor": []
}
```

或沿用舊前端格式，將 scaffold model 放在 `data` 字串：

```json
{
  "data": "{\"fileName\":\"dxfTest\"}"
}
```

### 匯出 DXF

```text
POST /api/dxf/export
```

Request body 支援三種格式。

新版格式：

```json
{
  "scaffold": {},
  "outputName": null
}
```

直接傳 scaffold model，並可加上 `outputName`：

```json
{
  "fileName": "dxfTest",
  "base": {},
  "role": {},
  "fiveViewGrid": {},
  "height": [],
  "stair": [],
  "anchor": [],
  "outputName": "manual_test.dxf"
}
```

舊前端格式：

```json
{
  "data": "{\"fileName\":\"dxfTest\"}",
  "outputName": "manual_test.dxf"
}
```

`outputName` 可省略。省略時系統會使用：

```text
export_{caseName}_{timestamp}_{sequence}.dxf
```

## 執行範例匯出

```bash
python -m backend.scripts.export_example
```

此指令會讀取：

```text
lib/example.json
```

並輸出 DXF 到：

```text
public/dxfFile/
```

## 執行 API 契約測試

```bash
python -m backend.scripts.test_api_contracts
```

此測試會確認：

- `/health`
- `/api/scaffold/validate`
- `/api/dxf/export`
- 直接 scaffold body
- `{ scaffold: ... }`
- `{ data: "JSON string" }`

測試輸出會放在 ignored 的 `backend/.cache/api_contracts/`。

## 啟動開發伺服器

```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```

API 文件：

```text
http://localhost:8000/docs
```

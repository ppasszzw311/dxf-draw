# DXF Draw Project Overview

## 專案目的

這個專案是一個 Node.js + Express 的 Web 工具，用來讓使用者在瀏覽器中建立格架/鷹架類型的結構配置，並輸出 DXF 檔供 CAD 軟體使用。

目前的核心流程已經存在：

1. 使用者輸入基本尺寸與格數。
2. 前端用 SVG 呈現平面格線與五視圖。
3. 使用者在畫面上標記高度、樓梯、錨點、橫桿、斜撐等資訊。
4. 前端整理出 JSON 資料。
5. 後端接收 JSON，使用 `dxf-writer` 產生 `.dxf`。
6. 瀏覽器導向產出的 DXF 檔案下載路徑。

這份文件整理目前專案結構與可見的調整方向，方便後續重新設計解決方案。

## 技術組成

- Runtime: Node.js
- Server: Express
- View engine: Express Handlebars
- Frontend drawing: SVG + 原生 JavaScript
- HTTP client: axios
- UI: Bootstrap 4 + jQuery
- DXF output: `dxf-writer`
- Upload handling: `multer`

## 主要目錄

```text
dxf-draw/
├─ app.js
├─ package.json
├─ package-lock.json
├─ fix.md
├─ default_2023714_1.dxf
├─ lib/
│  ├─ handlers.js
│  ├─ dxfprocess.js
│  └─ example.json
├─ public/
│  ├─ javascript/
│  │  ├─ svgSet.js
│  │  ├─ svgSetting.js
│  │  └─ svg04.js
│  ├─ stylesheet/
│  │  └─ svgSet.css
│  ├─ dxfFile/
│  ├─ uploads/
│  └─ unnamed.png
└─ views/
   ├─ layouts/
   │  └─ main.hbs
   ├─ start.handlebars
   ├─ build.handlebars
   ├─ stepMake.handlebars
   └─ newPage.handlebars
```

## 目前路由

定義在 `app.js`。

| Method | Path | 用途 |
| --- | --- | --- |
| GET | `/` | 進入主要頁面，目前 render `start` |
| GET | `/step` | render `stepMake` |
| GET | `/built` | render `build` |
| GET | `/newpage` | render `newPage` |
| GET | `/step01` | render step01，但目前沒有對應 template |
| POST | `/step02` | render step02，但目前沒有對應 template |
| POST | `/step03` | render step03，但目前沒有對應 template |
| POST | `/step04` | render step04，但目前沒有對應 template |
| POST | `/convert` | 嘗試把 SVG path 轉 DXF，但目前缺少必要 import，疑似未完成 |
| POST | `/upload_files` | 上傳檔案到 `public/uploads` |
| POST | `/api` | 接收前端 JSON，產出 DXF |

## 資料流程

### 1. 前端建立資料

主要邏輯在 `public/javascript/svgSet.js`。

前端維護一個主要資料物件：

```js
scaffoldArray = {
  base: {
    long,
    width,
    height,
    coordX,
    coordY,
    coordZ,
    scaling
  },
  fiveViewGrid: {
    topView: [],
    leftSideView: [],
    rightSideView: [],
    frontView: [],
    rearView: []
  },
  role: {
    acnchor,
    rung
  },
  height: [],
  baseGrid: [],
  grid: [],
  stair: [],
  anchor: [],
  rung: [],
  bracing: [],
  description: {}
}
```

重要概念：

- `base`: 基本尺寸與格數。
- `baseGrid`: 依照 X/Y/Z 格數展開出的 3D 格子資料。
- `fiveViewGrid`: 五視圖用的格子資料。
- `height`: 每個位置的高度標記。
- `stair`: 樓梯位置。
- `anchor`: 錨點位置。
- `role.rung`: 橫桿規則。

### 2. 前端繪製 SVG

前端會根據使用者輸入建立格線，並把資料畫在 SVG 上。

主要功能包含：

- 建立基礎格線。
- 修改每格長寬。
- 設定局部高度。
- 選擇樓梯位置。
- 選擇或新增錨點。
- 建立五視圖。
- 顯示橫桿、斜撐等輔助線。
- 支援 SVG 平移、縮放、座標讀取。

SVG 操作分散在：

- `public/javascript/svgSet.js`
- `public/javascript/svgSetting.js`
- `public/javascript/svg04.js`

### 3. 前端送出 JSON

完成後會呼叫：

```js
axios.post('/api', {
  data: JSON.stringify(data)
})
```

送出的資料由 `getNewJson()` 組出：

```js
{
  fileName,
  base,
  role,
  fiveViewGrid,
  height,
  stair,
  anchor
}
```

### 4. 後端產出 DXF

主要邏輯在 `lib/handlers.js`。

`uploadResult()` 會：

1. 讀取 `req.body.data`。
2. 解析 JSON。
3. 用 `fileName + 日期 + 序號` 組成輸出檔名。
4. 呼叫 `makenewDraw(data, newFileName)`。
5. 回傳 `{ result: true, fileName }`。

`makenewDraw()` 會：

1. 初始化全域狀態。
2. 建立 `new Drawing()`。
3. 設定單位為 meters。
4. 讀取 `fiveViewGrid`、`rung`、`anchor`、`height`、`stair`。
5. 呼叫 `buildFiveViewFrid()` 繪製 DXF。
6. 寫入 `public/dxfFile/{filename}.dxf`。

### 5. DXF 內容

後端目前會產出：

- Top view
- Left side view
- Front view
- Right side view
- Rear view
- 基準線/尺寸線
- 矩形格框
- 高度文字
- 樓梯
- 錨點
- 斜撐
- 橫桿

主要繪圖函式：

| Function | 用途 |
| --- | --- |
| `buildFiveViewFrid()` | 五視圖總繪製流程 |
| `makRectangle()` | 繪製平面矩形 |
| `makRectangleZIndex()` | 繪製立面矩形與設備區域 |
| `makRectText()` | 上視圖高度文字 |
| `makStairTop()` | 上視圖樓梯 |
| `makStair()` | 立面樓梯 |
| `makAnchorPoint()` | 錨點 |
| `makDiagonalBraces()` | 斜撐 |
| `makRung()` | 橫桿 |
| `getrungValue()` | 橫桿高度規則 |

## 範例資料

`lib/example.json` 是目前最接近後端預期格式的資料範例。

它包含：

- `fileName`
- `base`
- `role`
- `fiveViewGrid`
- `height`
- `stair`
- `anchor`

後續如果要重構，建議先把這個資料格式正式定義成 schema，避免前後端各自猜資料結構。

## 目前可見問題

### 1. 中文文字與註解亂碼

多數中文註解、HTML 文案、CSS font-family 已經變成亂碼。這會讓維護難度非常高，也會影響畫面可讀性。

建議：

- 先確認原始編碼是否曾經是 Big5/CP950。
- 嘗試還原成 UTF-8。
- 若無法還原，至少重新整理使用者看得到的 UI 文案與核心註解。

### 2. 前端單檔過大

`public/javascript/svgSet.js` 同時負責：

- 狀態管理
- 表單讀取
- SVG 繪圖
- 滑鼠互動
- 五視圖生成
- 選取工具
- API 呼叫
- 上傳

這會讓後續修改很容易互相影響。

建議拆分：

```text
public/javascript/
├─ state.js
├─ grid-model.js
├─ svg-renderer.js
├─ five-view-builder.js
├─ tools/
│  ├─ select-tool.js
│  ├─ stair-tool.js
│  └─ anchor-tool.js
├─ api.js
└─ main.js
```

### 3. 後端 DXF 邏輯與 request handler 混在一起

`lib/handlers.js` 同時包含 Express handler 和 DXF 產生邏輯。

建議拆成：

```text
lib/
├─ handlers.js
├─ dxf/
│  ├─ build-dxf.js
│  ├─ five-view-layout.js
│  ├─ draw-grid.js
│  ├─ draw-stair.js
│  ├─ draw-anchor.js
│  ├─ draw-bracing.js
│  └─ draw-rung.js
└─ schema/
   └─ scaffold-schema.js
```

### 4. 使用很多全域變數

後端有不少全域狀態，例如：

- `mData`
- `startLeft`
- `startFront`
- `startRight`
- `startRear`
- `startTop`
- `rungRule`
- `anchorArray`
- `topHighArray`
- `stairArray`

如果未來同時多人請求，這種設計會有資料互相污染的風險。

建議：

- 每次 request 都建立獨立 context。
- 把目前全域變數改成 function 參數或局部物件。

例如：

```js
const context = {
  data,
  layout,
  drawing,
  rules
}
```

### 5. 缺少資料驗證

目前 `/api` 直接 `JSON.parse(req.body.data)`，沒有驗證資料欄位是否完整。

建議加入：

- JSON schema 驗證。
- 基本尺寸範圍檢查。
- grid item 欄位檢查。
- 錯誤訊息回傳。

### 6. `/convert` 路由疑似未完成

`app.js` 內的 `/convert` 使用了：

- `JSDOM`
- `Drawing.DXFDocument`
- `Drawing.makePathData`

但目前沒有正確 import，且 `dxf-writer` API 可能也不是這樣使用。這段看起來像早期測試 SVG path 轉 DXF 的實驗功能。

建議：

- 若不再使用，移除。
- 若要保留，獨立成清楚的 SVG-to-DXF 模組並補測試。

### 7. 上傳功能目前不完整

`multer` 設定寫成：

```js
const upload = multer({ dist: "uploads/" });
```

但 `multer` 正常應該是 `dest` 或使用 memory storage/storage engine。現在實際寫檔是靠 `file.buffer`，因此需要確認目前是否真的能正常上傳。

建議：

- 明確改成 `multer.memoryStorage()`。
- 限制副檔名與大小。
- 避免直接使用原始檔名覆蓋檔案。

### 8. 沒有測試

目前沒有看到測試檔。DXF 生成邏輯很適合補單元測試，至少驗證輸入 JSON 能產出合法 DXF 字串與必要 layer/entity。

建議優先測：

- `example.json` 可以成功產出 DXF。
- 樓梯/錨點/橫桿規則是否被正確轉換。
- 不同 X/Y/Z 尺寸是否會產出合理五視圖。

## 建議的調整方向

### 第一階段：整理現況，降低維護成本

1. 新增正式 README 或使用本文件作為基礎。
2. 還原或重寫 UI 中文文案。
3. 移除未使用或壞掉的路由。
4. 把 DXF 產生邏輯從 `handlers.js` 拆出。
5. 把前端大檔拆成狀態、繪圖、工具、API 幾個模組。

### 第二階段：穩定資料模型

1. 定義 scaffold JSON schema。
2. 前後端共用或同步資料格式。
3. 補資料驗證與錯誤回傳。
4. 用 `lib/example.json` 建立基本測試案例。

### 第三階段：重新設計解決方案

目前專案是「前端建立 SVG 與資料，後端再重畫 DXF」。後續可以評估兩種方向。

#### 方案 A：保留前後端分工

前端只負責互動與預覽，後端負責正式 DXF。

優點：

- DXF 產出集中在後端，比較容易控管。
- 可以加測試與版本控管。
- 未來可做批次產圖。

缺點：

- 前端 SVG 和後端 DXF 可能產生邏輯重複。
- 必須維護一份穩定的中介資料模型。

#### 方案 B：建立共同幾何模型

前端與後端都不直接各自推算圖形，而是先建立一份共同的 geometry/layout model。

```text
User input
  -> Scaffold model
  -> Five-view layout model
  -> SVG renderer
  -> DXF renderer
```

優點：

- SVG 預覽與 DXF 輸出比較容易一致。
- 後續新增 PDF、PNG、不同圖框格式會比較容易。
- 可測試 layout model，不必每次都測 UI。

缺點：

- 初期重構成本較高。
- 需要先定義清楚資料模型。

就目前狀況，建議走方案 B，但可以分階段做，不需要一次全部重寫。

## 優先處理清單

建議優先順序：

1. 修正/重寫亂碼文案。
2. 整理 `example.json`，定義正式輸入格式。
3. 把 `handlers.js` 的 DXF 產生邏輯拆成純函式。
4. 為 `example.json` 補一個產生 DXF 的測試或 CLI。
5. 清理未完成路由，例如 `/convert`、`/step01` 到 `/step04`。
6. 重構前端 `svgSet.js`，先拆出資料模型與 SVG renderer。
7. 補錯誤處理與上傳限制。

## 啟動方式

目前 `package.json` 沒有定義 `scripts`，但可以直接用 Node 執行：

```bash
node app.js
```

預設服務位置：

```text
http://localhost:3000
```

建議後續在 `package.json` 補上：

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

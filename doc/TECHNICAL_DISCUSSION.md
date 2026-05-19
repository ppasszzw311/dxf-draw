# Technical Discussion

## 背景

這份文件整理目前針對新版解決方案的技術討論。專案原本已經有基本流程，可以從前端建立鷹架格線、標記元件，並由後端產生 DXF。後續重點不是單純修補現有程式，而是重新整理成更適合長期維護、雲端部署、CAD 相容與高效率編輯的架構。

目前討論出的核心需求：

1. 產出的 DXF 要能在 CAD 工具中繼續修改。
2. 優先保證 LibreCAD 可以看得到中文字。
3. 操作流程需要支援鍵盤快捷鍵，降低重複點擊。
4. 後端技術不一定沿用 Node.js，可以評估 Python 或 C#。

## CAD 相容性目標

這個專案的目的不是只輸出一張看起來像 CAD 圖的圖片，而是要把原本需要在 AutoCAD 或其他 CAD 軟體中手工完成的鷹架設計稿，轉成可再編輯的 DXF。

因此 DXF 輸出應該盡量使用 CAD 原生實體：

- `LINE`
- `LWPOLYLINE`
- `POLYLINE`
- `CIRCLE`
- `TEXT`
- `MTEXT`，但要避免複雜格式碼
- `LAYER`
- `BLOCK` / `INSERT`，適合重複元件
- `DIMENSION`，若後續需要正式尺寸標註

不建議把前端 SVG path 直接轉 DXF 作為主要方案。SVG 適合做前端預覽，但 DXF 應該從一份結構化的鷹架資料模型產生，這樣產出的 CAD 物件才會乾淨、可分層、可編輯。

建議架構：

```text
User Input / Editor Action
  -> Scaffold Model
  -> Five View Layout Model
  -> SVG Renderer
  -> DXF Renderer
```

SVG 和 DXF 應該共用同一份 layout model，避免前端畫一套、後端再用另一套邏輯重畫。

## 鷹架單元方向與視圖語意

鷹架是用來包覆施工中的建築物，因此單元尺寸的長、寬、高不能只當成抽象 X/Y/Z。系統需要保留「哪一個面是沿建築物立面展開」的語意。

目前討論的方向：

```text
base.long    沿建築物立面方向
base.width   往外伸出/離建築物深度方向
base.height  垂直高度方向
```

以 `180 x 90 x 210` 的單元為例：

- 正視圖應主要看到 `180 x 210`。
- 平面圖應主要看到 `180 x 90`。
- 側視圖應呈現側向深度與高度的關係，重構時需對照原始程式既有邏輯確認。

這會影響 layout engine 的設計。後續不應只用泛用 grid projection 推圖，而應有明確的 view mapping：

```text
frontView: long x height
topView: long x width
sideView: width x height
```

若原始程式在側視圖或左右/前後視圖排列上已有特殊處理，重構時應先寫成測試案例，避免視圖方向改錯。

## 暫存稿、版本與匯出紀錄

設計稿會被多次編輯，因此系統需要區分「編輯中的暫存資料」與「已匯出的 DXF 檔案」。

建議資料概念：

```text
DesignDraft
  代表目前設計稿主體

DesignVersion
  代表每次儲存的 scaffold model 版本

ExportRecord
  代表每次匯出的 DXF 檔案
```

匯出 DXF 前，資料應視為 draft/version；匯出後才建立 export record。這樣可以避免使用者混淆「目前正在編輯的版本」與「已交付或已下載的 DXF」。

建議命名方向：

```text
draft_{caseName}_{timestamp}
export_{caseName}_{timestamp}_{sequence}.dxf
```

若後續使用資料庫，檔案名稱可以只作為顯示與下載用途，實際關聯以 ID 管理。

## 中文字與 LibreCAD 相容策略

### 問題說明

DXF 可以保存 Unicode 中文字，但「看不看得到」以及「顯示是否一致」取決於開啟 DXF 的軟體與該環境可用的字型。

在 Linux 雲端部署時，主機通常不應該負責把中文字渲染成 DXF 圖形。比較好的做法是：

1. DXF 保留文字實體。
2. 在 DXF 中定義 text style。
3. 讓 CAD 編輯器使用對應字型顯示文字。

如果把中文字轉成線段或外框，顯示一致性會提高，但文字會失去可編輯性，DXF 也會變大。這不適合作為主要輸出，除非是 fallback layer。

### LibreCAD 優先目標

目前目標是至少保證 LibreCAD 可以看得到中文字。因此需要配合 LibreCAD 的字型機制。

LibreCAD 主要使用 `.lff` 字型格式。相較於只指定 Windows TTF 字型，對 LibreCAD 來說更穩的方向是使用 LibreCAD 可識別的 LFF 字型。

建議建立一個 `LibreCAD compatibility profile`：

```text
DXF version: R2007 / AC1021 優先測試；若需要 R2000/R2004，必須另外驗證中文 escaping
Text entity: TEXT 優先
MText usage: 僅用簡單純文字，避免複雜控制碼
Text style: CJK_TEXT
Font file: unicode.lff 或 azomix.lff
Encoding: Unicode
Layer: TEXT
```

### 建議作法

1. DXF 中使用 `TEXT` / 簡單 `MTEXT`。
2. 定義固定 text style，例如 `CJK_TEXT`。
3. 指定 LibreCAD 可用的 `.lff` 字型，例如 `unicode.lff` 或 `azomix.lff`。
4. 將字型檔與專案部署或安裝說明一起管理。
5. 避免高度依賴字寬排版，盡量用插入點與對齊方式控制文字位置。
6. 對於必要的關鍵標註，可考慮額外產生文字外框 fallback layer。

可選雙層策略：

```text
Layer: TEXT_EDITABLE
  -> TEXT / MTEXT，可編輯

Layer: TEXT_OUTLINE_FALLBACK
  -> 中文轉線段/外框，預設關閉，用於顯示 fallback
```

### 需要驗證的最小測試

在正式重構前，應先建立一個最小 DXF 測試檔，內容包含常用中文：

```text
施工架平面圖
立面圖
錨定點
樓梯
高度 1.8m
```

驗證項目：

- LibreCAD 是否正常顯示中文字。
- 文字是否可選取與編輯。
- text style 是否正確套用。
- 在缺少字型時的 fallback 行為。
- AutoCAD 或其他 CAD 軟體開啟時是否仍可接受。

## 編輯操作與快捷鍵

目前前端高度依賴滑鼠事件，後續若功能增加，操作會變得繁瑣，也會讓程式難以維護。

建議改成 CAD-like 的工具模式：

```text
select
height
stair
anchor
rung
bracing
pan
```

前端應該有明確的 editor state：

```js
{
  activeTool: 'select',
  selectedItems: [],
  hoveredItem: null,
  commandHistory: [],
  currentDraft: null
}
```

滑鼠和鍵盤事件都交給目前 active tool 處理：

```js
activeTool.onMouseDown(event, editorState)
activeTool.onMouseMove(event, editorState)
activeTool.onMouseUp(event, editorState)
activeTool.onKeyDown(event, editorState)
```

建議快捷鍵：

| 快捷鍵 | 功能 |
| --- | --- |
| `V` | 選取模式 |
| `H` | 設定高度 |
| `S` | 樓梯模式 |
| `A` | 錨點模式 |
| `R` | 橫桿模式 |
| `B` | 斜撐模式 |
| `Delete` | 刪除選取 |
| `Esc` | 取消目前操作 |
| `Ctrl+Z` | 復原 |
| `Ctrl+Y` | 重做 |
| `Enter` / `Space` | 確認目前操作 |
| `Shift + Drag` | 框選 |
| `Alt + Drag` | 平移視圖 |

若未來要做復原/重做，建議用 command pattern：

```js
{
  type: 'ADD_ANCHOR',
  payload: { id: '1_2_3' },
  undoPayload: {}
}
```

這樣可以把每個操作記錄成可重播與可撤銷的命令。

## 後端技術選型：Python vs C#

### Python

建議技術組合：

```text
Backend: FastAPI
DXF: ezdxf
Data model: Pydantic
Schema: JSON Schema
Deployment: Linux container
```

優點：

- `ezdxf` 對 DXF 產生與操作成熟。
- 適合做「鷹架模型 -> 五視圖 layout -> DXF」的純圖面產生服務。
- 開發速度快，容易先做 prototype。
- Linux 雲端部署簡單。
- 幾何處理、資料驗證、測試都方便。

限制：

- 若要直接開發 AutoCAD plugin，不是最佳選擇。
- 中文顯示問題仍需要靠 DXF text style 與 LibreCAD 字型策略解決。

### C# / .NET

適合條件：

- 未來需要 AutoCAD plugin。
- 需要和 AutoCAD .NET API 深度整合。
- 團隊或公司內部主要使用 .NET。
- 需要 Windows 桌面工具或企業內部系統整合。

優點：

- 型別系統與大型專案維護性佳。
- 若要做 AutoCAD 內部插件，C# 很適合。
- .NET 也可以部署在 Linux。

限制：

- 如果只是產生 DXF，開發成本通常比 Python 高。
- 免費且成熟的 DXF library 需要仔細評估。
- 在不直接串 AutoCAD API 的情境下，C# 優勢沒有 Python 明顯。

### 目前建議

以目前需求來看，建議優先採用：

```text
Frontend: TypeScript + SVG/Canvas editor
Backend: Python FastAPI
DXF Renderer: ezdxf
Model validation: Pydantic / JSON Schema
Primary CAD compatibility target: LibreCAD
Secondary target: AutoCAD / other DXF editors
```

但保留一個決策點：

如果未來需求變成「在 AutoCAD 內一鍵生成、更新、同步圖面」，再評估 C# / AutoCAD .NET API。

## 建議下一步

建議先不要直接重寫完整系統，而是做一個小型技術驗證。

### Prototype 1: DXF renderer

目標：

- 用現有 `lib/example.json` 或新的簡化 JSON 作為輸入。
- 使用 Python + ezdxf 產出 DXF。
- 套用 LibreCAD text style。
- 實測 LibreCAD 中文顯示。

目前若無法安裝 LibreCAD，可以先使用自動驗證腳本檢查 DXF 結構、圖層、文字 style 與中文文字是否保留。GUI 開檔測試仍然需要在後續有 LibreCAD 環境時補做。

驗證內容：

- layer 是否清楚。
- 線段、圓、文字是否可編輯。
- 中文是否正常顯示。
- 比例與位置是否合理。
- 產出 DXF 是否能被 AutoCAD 或其他工具接受。

### Prototype 2: Editor state

目標：

- 不急著重做 UI。
- 先建立工具模式與快捷鍵機制。
- 用最小 SVG grid 測試 select / height / stair / anchor。

驗證內容：

- 工具模式是否容易擴充。
- 快捷鍵是否降低操作負擔。
- command history 是否可支援 undo / redo。

目前已建立 `prototype/editor_state_core.js`、`prototype/editor_state_demo.html` 與 `prototype/validate_editor_state.mjs`。命令列驗證已確認選取、多選、工具快捷鍵、高度/錨點套用、復原、重做與刪除標記可以正常運作。

驗證指令：

```bash
node prototype/validate_editor_state.mjs
```

驗證結果：

```text
Editor state validation: OK
```

## 初步決策

目前傾向：

1. 保留「前端編輯、後端產 DXF」的分工。
2. 將 SVG 視為預覽 renderer，不作為 DXF 的主要資料來源。
3. 將 DXF 產出改為從 scaffold/layout model 產生。
4. 後端優先評估 Python + ezdxf。
5. 中文以 LibreCAD LFF 字型為主要相容策略。
6. 前端後續改成工具模式與快捷鍵操作。

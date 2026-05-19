# 編輯器狀態 Prototype

## 目的

這個 prototype 用來驗證新版前端編輯器的互動架構。它不處理完整畫面設計，也不直接產生 DXF，而是先確認以下能力：

- 工具模式切換。
- 鍵盤快捷鍵。
- 單選與多選。
- 對選取格子套用高度、樓梯、錨點、橫桿、斜撐。
- 復原與重做。
- 將滑鼠事件與狀態變更邏輯分離。

## 檔案

```text
prototype/
  editor_state_core.js
  editor_state_demo.html
  editor_state_demo.js
  editor_state_demo_standalone.js
  validate_editor_state.mjs
```

## 執行自動驗證

```bash
node prototype/validate_editor_state.mjs
```

預期結果：

```text
Editor state validation: OK
```

## 開啟 Demo

這是一個靜態頁面，可以直接用瀏覽器開啟：

```text
prototype/editor_state_demo.html
```

目前 demo 頁面使用 `editor_state_demo_standalone.js`，避免瀏覽器在 `file://` 模式下封鎖 ES module。`editor_state_core.js` 仍保留給命令列驗證與後續正式模組化使用。

## 快捷鍵

| 快捷鍵 | 功能 |
| --- | --- |
| `V` | 選取 |
| `H` | 高度 |
| `S` | 樓梯 |
| `A` | 錨點 |
| `R` | 橫桿 |
| `B` | 斜撐 |
| `Shift + 點擊` | 多選 |
| `Enter` / `Space` | 套用目前工具 |
| `Ctrl + Z` | 復原 |
| `Ctrl + Y` | 重做 |
| `Delete` | 清除選取格子的標記 |
| `Esc` | 取消目前操作 |

## 架構重點

核心狀態集中在 `editor_state_core.js`：

```js
{
  activeTool,
  selectedIds,
  hoveredId,
  cells,
  history,
  future,
  messages
}
```

瀏覽器事件不直接修改 SVG，而是先轉成狀態變更：

```text
keydown / click
  -> editor_state_core
  -> new editor state
  -> render SVG
```

這樣未來可以比較容易加入：

- 框選。
- 拖曳平移。
- 批次編輯。
- 指令面板。
- 更完整的 undo / redo。
- 與 scaffold model 的資料轉換。

## 目前驗證結果

目前命令列驗證已確認：

- 初始格線建立正常。
- 選取與多選正常。
- 快捷鍵可切換工具。
- 高度與錨點工具可以套用到多選格子。
- `Ctrl + Z` 可以復原。
- `Ctrl + Y` 可以重做。
- `Delete` 可以清除選取格子的標記。

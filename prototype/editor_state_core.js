export const TOOLS = Object.freeze({
  SELECT: "select",
  HEIGHT: "height",
  STAIR: "stair",
  ANCHOR: "anchor",
  RUNG: "rung",
  BRACING: "bracing",
});

export const TOOL_SHORTCUTS = Object.freeze({
  v: TOOLS.SELECT,
  h: TOOLS.HEIGHT,
  s: TOOLS.STAIR,
  a: TOOLS.ANCHOR,
  r: TOOLS.RUNG,
  b: TOOLS.BRACING,
});

export function createInitialEditorState(options = {}) {
  const columns = options.columns ?? 6;
  const rows = options.rows ?? 4;
  const cells = [];

  for (let y = 1; y <= rows; y += 1) {
    for (let x = 1; x <= columns; x += 1) {
      cells.push({
        id: `${x}_${y}_1`,
        x,
        y,
        height: 1,
        stair: false,
        anchor: false,
        rung: false,
        bracing: false,
      });
    }
  }

  return {
    activeTool: TOOLS.SELECT,
    selectedIds: [],
    hoveredId: null,
    cells,
    history: [],
    future: [],
    messages: ["V 選取，H 高度，S 樓梯，A 錨點，R 橫桿，B 斜撐"],
  };
}

export function handleKey(editorState, event) {
  const key = normalizeKey(event.key);

  if (event.ctrlKey && key === "z") {
    return undo(editorState);
  }
  if (event.ctrlKey && key === "y") {
    return redo(editorState);
  }
  if (key === "escape") {
    return clearSelection(setActiveTool(editorState, TOOLS.SELECT));
  }
  if (key === "delete" || key === "backspace") {
    return applyCommand(editorState, {
      type: "CLEAR_SELECTED_MARKS",
      label: "清除選取格子的標記",
      ids: editorState.selectedIds,
    });
  }
  if (TOOL_SHORTCUTS[key]) {
    return setActiveTool(editorState, TOOL_SHORTCUTS[key]);
  }
  if ((key === "enter" || key === " ") && editorState.selectedIds.length > 0) {
    return applyToolToSelection(editorState);
  }

  return editorState;
}

export function handleCellClick(editorState, cellId, event = {}) {
  if (editorState.activeTool === TOOLS.SELECT) {
    return selectCell(editorState, cellId, event.shiftKey === true);
  }

  const selectedIds = editorState.selectedIds.includes(cellId)
    ? editorState.selectedIds
    : [cellId];

  return applyToolToSelection({
    ...editorState,
    selectedIds,
  });
}

export function setHoveredCell(editorState, cellId) {
  return {
    ...editorState,
    hoveredId: cellId,
  };
}

export function setActiveTool(editorState, tool) {
  if (!Object.values(TOOLS).includes(tool)) {
    return editorState;
  }

  return {
    ...editorState,
    activeTool: tool,
    messages: [`目前工具：${toolLabel(tool)}`, ...editorState.messages].slice(0, 6),
  };
}

export function selectCell(editorState, cellId, additive = false) {
  const exists = editorState.cells.some((cell) => cell.id === cellId);
  if (!exists) {
    return editorState;
  }

  let selectedIds;
  if (additive) {
    selectedIds = editorState.selectedIds.includes(cellId)
      ? editorState.selectedIds.filter((id) => id !== cellId)
      : [...editorState.selectedIds, cellId];
  } else {
    selectedIds = [cellId];
  }

  return {
    ...editorState,
    selectedIds,
    messages: [`已選取 ${selectedIds.length} 格`, ...editorState.messages].slice(0, 6),
  };
}

export function clearSelection(editorState) {
  return {
    ...editorState,
    selectedIds: [],
    hoveredId: null,
    messages: ["已取消目前操作", ...editorState.messages].slice(0, 6),
  };
}

export function applyToolToSelection(editorState) {
  const ids = editorState.selectedIds;
  if (ids.length === 0) {
    return {
      ...editorState,
      messages: ["請先選取格子", ...editorState.messages].slice(0, 6),
    };
  }

  switch (editorState.activeTool) {
    case TOOLS.HEIGHT:
      return applyCommand(editorState, {
        type: "INCREASE_HEIGHT",
        label: "增加高度",
        ids,
        amount: 1,
      });
    case TOOLS.STAIR:
      return applyCommand(editorState, {
        type: "TOGGLE_FLAG",
        label: "切換樓梯",
        ids,
        field: "stair",
      });
    case TOOLS.ANCHOR:
      return applyCommand(editorState, {
        type: "TOGGLE_FLAG",
        label: "切換錨點",
        ids,
        field: "anchor",
      });
    case TOOLS.RUNG:
      return applyCommand(editorState, {
        type: "TOGGLE_FLAG",
        label: "切換橫桿",
        ids,
        field: "rung",
      });
    case TOOLS.BRACING:
      return applyCommand(editorState, {
        type: "TOGGLE_FLAG",
        label: "切換斜撐",
        ids,
        field: "bracing",
      });
    default:
      return editorState;
  }
}

export function applyCommand(editorState, command) {
  if (!command.ids || command.ids.length === 0) {
    return editorState;
  }

  const before = snapshotCells(editorState.cells, command.ids);
  const cells = editorState.cells.map((cell) => applyCommandToCell(cell, command));
  const after = snapshotCells(cells, command.ids);

  if (JSON.stringify(before) === JSON.stringify(after)) {
    return editorState;
  }

  const historyItem = {
    label: command.label,
    before,
    after,
  };

  return {
    ...editorState,
    cells,
    history: [...editorState.history, historyItem],
    future: [],
    messages: [`已執行：${command.label}`, ...editorState.messages].slice(0, 6),
  };
}

export function undo(editorState) {
  const historyItem = editorState.history.at(-1);
  if (!historyItem) {
    return {
      ...editorState,
      messages: ["沒有可復原的操作", ...editorState.messages].slice(0, 6),
    };
  }

  return {
    ...editorState,
    cells: restoreCells(editorState.cells, historyItem.before),
    history: editorState.history.slice(0, -1),
    future: [historyItem, ...editorState.future],
    messages: [`已復原：${historyItem.label}`, ...editorState.messages].slice(0, 6),
  };
}

export function redo(editorState) {
  const historyItem = editorState.future[0];
  if (!historyItem) {
    return {
      ...editorState,
      messages: ["沒有可重做的操作", ...editorState.messages].slice(0, 6),
    };
  }

  return {
    ...editorState,
    cells: restoreCells(editorState.cells, historyItem.after),
    history: [...editorState.history, historyItem],
    future: editorState.future.slice(1),
    messages: [`已重做：${historyItem.label}`, ...editorState.messages].slice(0, 6),
  };
}

export function summarizeEditorState(editorState) {
  return {
    activeTool: editorState.activeTool,
    selectedCount: editorState.selectedIds.length,
    marked: editorState.cells.reduce(
      (summary, cell) => {
        summary.height += cell.height > 1 ? 1 : 0;
        summary.stair += cell.stair ? 1 : 0;
        summary.anchor += cell.anchor ? 1 : 0;
        summary.rung += cell.rung ? 1 : 0;
        summary.bracing += cell.bracing ? 1 : 0;
        return summary;
      },
      { height: 0, stair: 0, anchor: 0, rung: 0, bracing: 0 },
    ),
    historyCount: editorState.history.length,
    futureCount: editorState.future.length,
  };
}

export function toolLabel(tool) {
  const labels = {
    [TOOLS.SELECT]: "選取",
    [TOOLS.HEIGHT]: "高度",
    [TOOLS.STAIR]: "樓梯",
    [TOOLS.ANCHOR]: "錨點",
    [TOOLS.RUNG]: "橫桿",
    [TOOLS.BRACING]: "斜撐",
  };
  return labels[tool] ?? tool;
}

function applyCommandToCell(cell, command) {
  if (!command.ids.includes(cell.id)) {
    return cell;
  }

  if (command.type === "INCREASE_HEIGHT") {
    return {
      ...cell,
      height: cell.height + command.amount,
    };
  }

  if (command.type === "TOGGLE_FLAG") {
    return {
      ...cell,
      [command.field]: !cell[command.field],
    };
  }

  if (command.type === "CLEAR_SELECTED_MARKS") {
    return {
      ...cell,
      height: 1,
      stair: false,
      anchor: false,
      rung: false,
      bracing: false,
    };
  }

  return cell;
}

function snapshotCells(cells, ids) {
  const idSet = new Set(ids);
  return cells.filter((cell) => idSet.has(cell.id)).map((cell) => ({ ...cell }));
}

function restoreCells(cells, snapshots) {
  const snapshotMap = new Map(snapshots.map((cell) => [cell.id, cell]));
  return cells.map((cell) => (snapshotMap.has(cell.id) ? { ...snapshotMap.get(cell.id) } : cell));
}

function normalizeKey(key) {
  return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
}

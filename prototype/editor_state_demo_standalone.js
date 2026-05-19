const TOOLS = Object.freeze({
  SELECT: "select",
  HEIGHT: "height",
  STAIR: "stair",
  ANCHOR: "anchor",
  RUNG: "rung",
  BRACING: "bracing",
});

const TOOL_SHORTCUTS = Object.freeze({
  v: TOOLS.SELECT,
  h: TOOLS.HEIGHT,
  s: TOOLS.STAIR,
  a: TOOLS.ANCHOR,
  r: TOOLS.RUNG,
  b: TOOLS.BRACING,
});

const CELL_SIZE = 78;
const CELL_GAP = 4;

let editorState = createInitialEditorState({ columns: 7, rows: 5 });

const svg = document.querySelector("#editorSvg");
const status = document.querySelector("#status");
const messageList = document.querySelector("#messageList");
const toolButtons = document.querySelectorAll("[data-tool]");

render();

document.addEventListener("keydown", (event) => {
  const previousState = editorState;
  editorState = handleKey(editorState, event);
  if (previousState !== editorState) {
    event.preventDefault();
    render();
  }
});

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    editorState = setActiveTool(editorState, button.dataset.tool);
    render();
  });
});

svg.addEventListener("click", (event) => {
  const cell = event.target.closest("[data-cell-id]");
  if (!cell) {
    return;
  }
  editorState = handleCellClick(editorState, cell.dataset.cellId, {
    shiftKey: event.shiftKey,
  });
  render();
});

svg.addEventListener("mousemove", (event) => {
  const cell = event.target.closest("[data-cell-id]");
  const nextHoveredId = cell ? cell.dataset.cellId : null;
  if (editorState.hoveredId !== nextHoveredId) {
    editorState = setHoveredCell(editorState, nextHoveredId);
    render();
  }
});

function createInitialEditorState(options = {}) {
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

function handleKey(state, event) {
  const key = event.key.toLowerCase();

  if (event.ctrlKey && key === "z") {
    return undo(state);
  }
  if (event.ctrlKey && key === "y") {
    return redo(state);
  }
  if (key === "escape") {
    return clearSelection(setActiveTool(state, TOOLS.SELECT));
  }
  if (key === "delete" || key === "backspace") {
    return applyCommand(state, {
      type: "CLEAR_SELECTED_MARKS",
      label: "清除選取格子的標記",
      ids: state.selectedIds,
    });
  }
  if (TOOL_SHORTCUTS[key]) {
    return setActiveTool(state, TOOL_SHORTCUTS[key]);
  }
  if ((key === "enter" || key === " ") && state.selectedIds.length > 0) {
    return applyToolToSelection(state);
  }

  return state;
}

function handleCellClick(state, cellId, event = {}) {
  if (state.activeTool === TOOLS.SELECT) {
    return selectCell(state, cellId, event.shiftKey === true);
  }

  const selectedIds = state.selectedIds.includes(cellId)
    ? state.selectedIds
    : [cellId];

  return applyToolToSelection({
    ...state,
    selectedIds,
  });
}

function setHoveredCell(state, cellId) {
  return {
    ...state,
    hoveredId: cellId,
  };
}

function setActiveTool(state, tool) {
  if (!Object.values(TOOLS).includes(tool)) {
    return state;
  }

  return {
    ...state,
    activeTool: tool,
    messages: [`目前工具：${toolLabel(tool)}`, ...state.messages].slice(0, 6),
  };
}

function selectCell(state, cellId, additive = false) {
  const exists = state.cells.some((cell) => cell.id === cellId);
  if (!exists) {
    return state;
  }

  let selectedIds;
  if (additive) {
    selectedIds = state.selectedIds.includes(cellId)
      ? state.selectedIds.filter((id) => id !== cellId)
      : [...state.selectedIds, cellId];
  } else {
    selectedIds = [cellId];
  }

  return {
    ...state,
    selectedIds,
    messages: [`已選取 ${selectedIds.length} 格`, ...state.messages].slice(0, 6),
  };
}

function clearSelection(state) {
  return {
    ...state,
    selectedIds: [],
    hoveredId: null,
    messages: ["已取消目前操作", ...state.messages].slice(0, 6),
  };
}

function applyToolToSelection(state) {
  const ids = state.selectedIds;
  if (ids.length === 0) {
    return {
      ...state,
      messages: ["請先選取格子", ...state.messages].slice(0, 6),
    };
  }

  switch (state.activeTool) {
    case TOOLS.HEIGHT:
      return applyCommand(state, {
        type: "INCREASE_HEIGHT",
        label: "增加高度",
        ids,
        amount: 1,
      });
    case TOOLS.STAIR:
      return applyCommand(state, {
        type: "TOGGLE_FLAG",
        label: "切換樓梯",
        ids,
        field: "stair",
      });
    case TOOLS.ANCHOR:
      return applyCommand(state, {
        type: "TOGGLE_FLAG",
        label: "切換錨點",
        ids,
        field: "anchor",
      });
    case TOOLS.RUNG:
      return applyCommand(state, {
        type: "TOGGLE_FLAG",
        label: "切換橫桿",
        ids,
        field: "rung",
      });
    case TOOLS.BRACING:
      return applyCommand(state, {
        type: "TOGGLE_FLAG",
        label: "切換斜撐",
        ids,
        field: "bracing",
      });
    default:
      return state;
  }
}

function applyCommand(state, command) {
  if (!command.ids || command.ids.length === 0) {
    return state;
  }

  const before = snapshotCells(state.cells, command.ids);
  const cells = state.cells.map((cell) => applyCommandToCell(cell, command));
  const after = snapshotCells(cells, command.ids);

  if (JSON.stringify(before) === JSON.stringify(after)) {
    return state;
  }

  const historyItem = {
    label: command.label,
    before,
    after,
  };

  return {
    ...state,
    cells,
    history: [...state.history, historyItem],
    future: [],
    messages: [`已執行：${command.label}`, ...state.messages].slice(0, 6),
  };
}

function undo(state) {
  const historyItem = state.history.at(-1);
  if (!historyItem) {
    return {
      ...state,
      messages: ["沒有可復原的操作", ...state.messages].slice(0, 6),
    };
  }

  return {
    ...state,
    cells: restoreCells(state.cells, historyItem.before),
    history: state.history.slice(0, -1),
    future: [historyItem, ...state.future],
    messages: [`已復原：${historyItem.label}`, ...state.messages].slice(0, 6),
  };
}

function redo(state) {
  const historyItem = state.future[0];
  if (!historyItem) {
    return {
      ...state,
      messages: ["沒有可重做的操作", ...state.messages].slice(0, 6),
    };
  }

  return {
    ...state,
    cells: restoreCells(state.cells, historyItem.after),
    history: [...state.history, historyItem],
    future: state.future.slice(1),
    messages: [`已重做：${historyItem.label}`, ...state.messages].slice(0, 6),
  };
}

function summarizeEditorState(state) {
  return {
    activeTool: state.activeTool,
    selectedCount: state.selectedIds.length,
    marked: state.cells.reduce(
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
    historyCount: state.history.length,
    futureCount: state.future.length,
  };
}

function toolLabel(tool) {
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

function render() {
  renderTools();
  renderGrid();
  renderStatus();
}

function renderTools() {
  toolButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === editorState.activeTool);
  });
}

function renderGrid() {
  const width = 7 * (CELL_SIZE + CELL_GAP) + CELL_GAP;
  const height = 5 * (CELL_SIZE + CELL_GAP) + CELL_GAP;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = "";

  for (const cell of editorState.cells) {
    const x = CELL_GAP + (cell.x - 1) * (CELL_SIZE + CELL_GAP);
    const y = CELL_GAP + (cell.y - 1) * (CELL_SIZE + CELL_GAP);
    const selected = editorState.selectedIds.includes(cell.id);
    const hovered = editorState.hoveredId === cell.id;

    const group = createSvgElement("g", {
      "data-cell-id": cell.id,
      class: [
        "cell",
        selected ? "selected" : "",
        hovered ? "hovered" : "",
        cell.stair ? "has-stair" : "",
        cell.anchor ? "has-anchor" : "",
        cell.rung ? "has-rung" : "",
        cell.bracing ? "has-bracing" : "",
      ].join(" "),
    });

    group.appendChild(createSvgElement("rect", {
      x,
      y,
      width: CELL_SIZE,
      height: CELL_SIZE,
      rx: 2,
    }));

    if (cell.bracing) {
      group.appendChild(createSvgElement("line", {
        x1: x + 8,
        y1: y + CELL_SIZE - 8,
        x2: x + CELL_SIZE - 8,
        y2: y + 8,
        class: "mark bracing",
      }));
    }

    if (cell.rung) {
      for (const ratio of [0.35, 0.65]) {
        group.appendChild(createSvgElement("line", {
          x1: x + 8,
          y1: y + CELL_SIZE * ratio,
          x2: x + CELL_SIZE - 8,
          y2: y + CELL_SIZE * ratio,
          class: "mark rung",
        }));
      }
    }

    if (cell.stair) {
      for (let index = 0; index < 4; index += 1) {
        const stepY = y + 16 + index * 12;
        group.appendChild(createSvgElement("line", {
          x1: x + 12,
          y1: stepY,
          x2: x + 34,
          y2: stepY,
          class: "mark stair",
        }));
      }
    }

    if (cell.anchor) {
      group.appendChild(createSvgElement("circle", {
        cx: x + CELL_SIZE - 18,
        cy: y + 18,
        r: 9,
        class: "mark anchor",
      }));
    }

    group.appendChild(createSvgElement("text", {
      x: x + CELL_SIZE / 2,
      y: y + CELL_SIZE / 2 + 4,
      class: "height-label",
    }, cell.height.toString()));

    group.appendChild(createSvgElement("title", {}, `${cell.id}，高度 ${cell.height}`));
    svg.appendChild(group);
  }
}

function renderStatus() {
  const summary = summarizeEditorState(editorState);
  status.innerHTML = `
    <span>目前工具：${toolLabel(editorState.activeTool)}</span>
    <span>選取：${summary.selectedCount}</span>
    <span>高度標記：${summary.marked.height}</span>
    <span>樓梯：${summary.marked.stair}</span>
    <span>錨點：${summary.marked.anchor}</span>
    <span>橫桿：${summary.marked.rung}</span>
    <span>斜撐：${summary.marked.bracing}</span>
    <span>歷史：${summary.historyCount}</span>
  `;

  messageList.innerHTML = editorState.messages
    .map((message) => `<li>${message}</li>`)
    .join("");
}

function createSvgElement(tagName, attributes = {}, textContent = "") {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  if (textContent !== "") {
    element.textContent = textContent;
  }
  return element;
}

window.editorPrototype = {
  getState: () => editorState,
  setTool: (tool) => {
    if (Object.values(TOOLS).includes(tool)) {
      editorState = setActiveTool(editorState, tool);
      render();
    }
  },
};

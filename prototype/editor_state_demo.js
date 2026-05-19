import {
  createInitialEditorState,
  handleCellClick,
  handleKey,
  setActiveTool,
  setHoveredCell,
  summarizeEditorState,
  toolLabel,
  TOOLS,
} from "./editor_state_core.js";

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

import type { BaseDimensions, EditorCell, Tool } from "../models/scaffold";

export interface EditorState {
  activeTool: Tool;
  selectedIds: string[];
  hoveredId: string | null;
  cells: EditorCell[];
  history: HistoryItem[];
  future: HistoryItem[];
  messages: string[];
}

interface HistoryItem {
  label: string;
  before: EditorCell[];
  after: EditorCell[];
}

interface EditorCommand {
  type: "INCREASE_HEIGHT" | "DECREASE_HEIGHT" | "TOGGLE_FLAG" | "CLEAR_SELECTED_MARKS";
  label: string;
  ids: string[];
  amount?: number;
  field?: keyof Pick<EditorCell, "stair" | "anchor" | "rung" | "bracing">;
}

export const toolLabels: Record<Tool, string> = {
  select: "選取",
  height: "高度",
  stair: "樓梯",
  anchor: "錨點",
  rung: "橫桿",
  bracing: "斜撐",
};

export const toolShortcuts: Record<string, Tool> = {
  v: "select",
  h: "height",
  s: "stair",
  a: "anchor",
  r: "rung",
  b: "bracing",
};

export function createEditorState(base: BaseDimensions): EditorState {
  const cells: EditorCell[] = [];
  const initialHeight = Math.max(1, Math.round(base.coordZ));

  for (let y = 1; y <= base.coordY; y += 1) {
    for (let x = 1; x <= base.coordX; x += 1) {
      cells.push({
        id: `${x}_${y}_1`,
        viewId: `${x}_${y}`,
        x,
        y,
        height: initialHeight,
        stair: false,
        anchor: false,
        rung: false,
        bracing: false,
      });
    }
  }

  return {
    activeTool: "select",
    selectedIds: [],
    hoveredId: null,
    cells,
    history: [],
    future: [],
    messages: [`已建立格線，Z 層數預設為 ${initialHeight}`],
  };
}

export function setActiveTool(state: EditorState, tool: Tool): EditorState {
  return {
    ...state,
    activeTool: tool,
    messages: [`已切換工具：${toolLabels[tool]}`, ...state.messages].slice(0, 6),
  };
}

export function handleCellClick(state: EditorState, cellId: string, additive = false): EditorState {
  if (state.activeTool === "select") {
    return selectIds(state, additive ? toggleValue(state.selectedIds, cellId) : [cellId]);
  }

  const selectedIds = state.selectedIds.includes(cellId) ? state.selectedIds : [cellId];
  return applyToolToIds({ ...state, selectedIds }, selectedIds);
}

export function handleItemClick(state: EditorState, ids: string[], additive = false): EditorState {
  if (ids.length === 0) return state;

  if (state.activeTool === "select") {
    if (additive) {
      return selectIds(state, mergeUnique(state.selectedIds, ids));
    }
    return selectIds(state, ids);
  }

  const selectedIds = ids.some((id) => state.selectedIds.includes(id)) ? state.selectedIds : ids;
  return applyToolToIds({ ...state, selectedIds }, selectedIds);
}

export function handleKey(state: EditorState, event: KeyboardEvent): EditorState {
  const key = event.key.toLowerCase();

  if (event.ctrlKey && key === "z") return undo(state);
  if (event.ctrlKey && key === "y") return redo(state);
  if (key === "escape") return clearSelection(setActiveTool(state, "select"));
  if (key === "delete" || key === "backspace") {
    return applyCommand(state, {
      type: "CLEAR_SELECTED_MARKS",
      label: "清除選取標記",
      ids: state.selectedIds,
    });
  }
  if (key === "+" || key === "=") {
    return adjustHeight(state, 1);
  }
  if (key === "-") {
    return adjustHeight(state, -1);
  }
  if (toolShortcuts[key]) return setActiveTool(state, toolShortcuts[key]);
  if ((key === "enter" || key === " ") && state.selectedIds.length > 0) {
    return applyToolToIds(state, state.selectedIds);
  }

  return state;
}

export function setHoveredCell(state: EditorState, cellId: string | null): EditorState {
  return { ...state, hoveredId: cellId };
}

export function selectIds(state: EditorState, ids: string[]): EditorState {
  const filtered = ids.filter((id) => state.cells.some((cell) => cell.id === id));
  return {
    ...state,
    selectedIds: filtered,
    messages: [`已選取 ${filtered.length} 個格子`, ...state.messages].slice(0, 6),
  };
}

export function applyToolToIds(state: EditorState, ids: string[]): EditorState {
  if (ids.length === 0) {
    return { ...state, messages: ["請先選取格子", ...state.messages].slice(0, 6) };
  }

  switch (state.activeTool) {
    case "height":
      return applyCommand(state, { type: "INCREASE_HEIGHT", label: "增加高度", ids, amount: 1 });
    case "stair":
      return applyCommand(state, { type: "TOGGLE_FLAG", label: "切換樓梯", ids, field: "stair" });
    case "anchor":
      return applyCommand(state, { type: "TOGGLE_FLAG", label: "切換錨點", ids, field: "anchor" });
    case "rung":
      return applyCommand(state, { type: "TOGGLE_FLAG", label: "切換橫桿", ids, field: "rung" });
    case "bracing":
      return applyCommand(state, { type: "TOGGLE_FLAG", label: "切換斜撐", ids, field: "bracing" });
    default:
      return selectIds(state, ids);
  }
}

export function adjustHeight(state: EditorState, delta: number): EditorState {
  if (state.selectedIds.length === 0) {
    return { ...state, messages: ["請先選取格子", ...state.messages].slice(0, 6) };
  }

  return applyCommand(state, {
    type: delta >= 0 ? "INCREASE_HEIGHT" : "DECREASE_HEIGHT",
    label: delta >= 0 ? "增加高度" : "減少高度",
    ids: state.selectedIds,
    amount: Math.abs(delta),
  });
}

export function summarize(state: EditorState) {
  return state.cells.reduce(
    (summary, cell) => {
      summary.height += cell.height;
      summary.stair += cell.stair ? 1 : 0;
      summary.anchor += cell.anchor ? 1 : 0;
      summary.rung += cell.rung ? 1 : 0;
      summary.bracing += cell.bracing ? 1 : 0;
      return summary;
    },
    {
      selected: state.selectedIds.length,
      height: state.cells.reduce((sum, cell) => sum + cell.height, 0),
      stair: 0,
      anchor: 0,
      rung: 0,
      bracing: 0,
      history: state.history.length,
    },
  );
}

function applyCommand(state: EditorState, command: EditorCommand): EditorState {
  if (command.ids.length === 0) return state;

  const before = snapshotCells(state.cells, command.ids);
  const cells = state.cells.map((cell) => applyCommandToCell(cell, command));
  const after = snapshotCells(cells, command.ids);

  if (JSON.stringify(before) === JSON.stringify(after)) return state;

  const historyItem = { label: command.label, before, after };
  return {
    ...state,
    cells,
    history: [...state.history, historyItem],
    future: [],
    messages: [`已套用：${command.label}`, ...state.messages].slice(0, 6),
  };
}

function undo(state: EditorState): EditorState {
  const historyItem = state.history.at(-1);
  if (!historyItem) {
    return { ...state, messages: ["沒有可復原的操作", ...state.messages].slice(0, 6) };
  }

  return {
    ...state,
    cells: restoreCells(state.cells, historyItem.before),
    history: state.history.slice(0, -1),
    future: [historyItem, ...state.future],
    messages: [`已復原：${historyItem.label}`, ...state.messages].slice(0, 6),
  };
}

function redo(state: EditorState): EditorState {
  const historyItem = state.future[0];
  if (!historyItem) {
    return { ...state, messages: ["沒有可重做的操作", ...state.messages].slice(0, 6) };
  }

  return {
    ...state,
    cells: restoreCells(state.cells, historyItem.after),
    history: [...state.history, historyItem],
    future: state.future.slice(1),
    messages: [`已重做：${historyItem.label}`, ...state.messages].slice(0, 6),
  };
}

function clearSelection(state: EditorState): EditorState {
  return { ...state, selectedIds: [], hoveredId: null };
}

function applyCommandToCell(cell: EditorCell, command: EditorCommand): EditorCell {
  if (!command.ids.includes(cell.id)) return cell;

  if (command.type === "INCREASE_HEIGHT") {
    return { ...cell, height: cell.height + (command.amount ?? 1) };
  }

  if (command.type === "DECREASE_HEIGHT") {
    return { ...cell, height: Math.max(1, cell.height - (command.amount ?? 1)) };
  }

  if (command.type === "TOGGLE_FLAG" && command.field) {
    return { ...cell, [command.field]: !cell[command.field] };
  }

  if (command.type === "CLEAR_SELECTED_MARKS") {
    return { ...cell, height: 1, stair: false, anchor: false, rung: false, bracing: false };
  }

  return cell;
}

function snapshotCells(cells: EditorCell[], ids: string[]): EditorCell[] {
  const idSet = new Set(ids);
  return cells.filter((cell) => idSet.has(cell.id)).map((cell) => ({ ...cell }));
}

function restoreCells(cells: EditorCell[], snapshots: EditorCell[]): EditorCell[] {
  const snapshotMap = new Map(snapshots.map((cell) => [cell.id, cell]));
  return cells.map((cell) => (snapshotMap.has(cell.id) ? { ...snapshotMap.get(cell.id)! } : cell));
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function mergeUnique(left: string[], right: string[]): string[] {
  return Array.from(new Set([...left, ...right]));
}

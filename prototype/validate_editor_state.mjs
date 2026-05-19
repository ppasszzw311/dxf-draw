import assert from "node:assert/strict";
import {
  createInitialEditorState,
  handleCellClick,
  handleKey,
  summarizeEditorState,
  TOOLS,
} from "./editor_state_core.js";

let state = createInitialEditorState({ columns: 3, rows: 2 });
assert.equal(state.cells.length, 6);
assert.equal(state.activeTool, TOOLS.SELECT);

state = handleCellClick(state, "1_1_1");
assert.deepEqual(state.selectedIds, ["1_1_1"]);

state = handleCellClick(state, "2_1_1", { shiftKey: true });
assert.deepEqual(state.selectedIds, ["1_1_1", "2_1_1"]);

state = handleKey(state, { key: "h", ctrlKey: false });
assert.equal(state.activeTool, TOOLS.HEIGHT);

state = handleKey(state, { key: "Enter", ctrlKey: false });
assert.equal(summarizeEditorState(state).marked.height, 2);
assert.equal(state.history.length, 1);

state = handleKey(state, { key: "a", ctrlKey: false });
assert.equal(state.activeTool, TOOLS.ANCHOR);

state = handleKey(state, { key: "Enter", ctrlKey: false });
assert.equal(summarizeEditorState(state).marked.anchor, 2);
assert.equal(state.history.length, 2);

state = handleKey(state, { key: "z", ctrlKey: true });
assert.equal(summarizeEditorState(state).marked.anchor, 0);
assert.equal(state.future.length, 1);

state = handleKey(state, { key: "y", ctrlKey: true });
assert.equal(summarizeEditorState(state).marked.anchor, 2);
assert.equal(state.future.length, 0);

state = handleKey(state, { key: "Delete", ctrlKey: false });
const summary = summarizeEditorState(state);
assert.equal(summary.marked.height, 0);
assert.equal(summary.marked.anchor, 0);
assert.equal(state.history.length, 3);

console.log("Editor state validation: OK");

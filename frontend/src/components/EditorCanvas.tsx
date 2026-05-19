import type { EditorState } from "../editor/editorState";
import { handleCellClick, setHoveredCell } from "../editor/editorState";

interface EditorCanvasProps {
  state: EditorState;
  setState: (state: EditorState) => void;
  columns: number;
  rows: number;
}

const CELL_SIZE = 74;
const CELL_GAP = 4;

export function EditorCanvas({ state, setState, columns, rows }: EditorCanvasProps) {
  const width = columns * (CELL_SIZE + CELL_GAP) + CELL_GAP;
  const height = rows * (CELL_SIZE + CELL_GAP) + CELL_GAP;

  return (
    <svg
      className="editor-canvas"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="施工架格線編輯器"
      onMouseMove={(event) => {
        const target = event.target as Element;
        const cell = target.closest("[data-cell-id]") as SVGElement | null;
        const nextHoveredId = cell?.dataset.cellId ?? null;
        if (state.hoveredId !== nextHoveredId) {
          setState(setHoveredCell(state, nextHoveredId));
        }
      }}
    >
      {state.cells.map((cell) => {
        const x = CELL_GAP + (cell.x - 1) * (CELL_SIZE + CELL_GAP);
        const y = CELL_GAP + (cell.y - 1) * (CELL_SIZE + CELL_GAP);
        const selected = state.selectedIds.includes(cell.id);
        const hovered = state.hoveredId === cell.id;
        return (
          <g
            key={cell.id}
            data-cell-id={cell.id}
            className={["cell", selected ? "selected" : "", hovered ? "hovered" : ""].join(" ")}
            onClick={(event) => setState(handleCellClick(state, cell.id, event.shiftKey))}
          >
            <rect x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} rx={2} />
            {cell.bracing && (
              <line className="mark bracing" x1={x + 8} y1={y + CELL_SIZE - 8} x2={x + CELL_SIZE - 8} y2={y + 8} />
            )}
            {cell.rung && [0.35, 0.65].map((ratio) => (
              <line
                key={ratio}
                className="mark rung"
                x1={x + 8}
                y1={y + CELL_SIZE * ratio}
                x2={x + CELL_SIZE - 8}
                y2={y + CELL_SIZE * ratio}
              />
            ))}
            {cell.stair && [0, 1, 2, 3].map((index) => (
              <line
                key={index}
                className="mark stair"
                x1={x + 12}
                y1={y + 16 + index * 12}
                x2={x + 34}
                y2={y + 16 + index * 12}
              />
            ))}
            {cell.anchor && <circle className="mark anchor" cx={x + CELL_SIZE - 18} cy={y + 18} r={9} />}
            <text className="height-label" x={x + CELL_SIZE / 2} y={y + CELL_SIZE / 2 + 4}>
              {cell.height}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

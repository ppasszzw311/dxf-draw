import { useMemo } from "react";
import { handleItemClick, setHoveredCell, type EditorState } from "../editor/editorState";
import type { BaseDimensions } from "../models/scaffold";
import type { ProjectionCell, ProjectionViewModel } from "../editor/projection";
import type { Dispatch, SetStateAction } from "react";

interface ProjectionViewProps {
  base: BaseDimensions;
  state: EditorState;
  setState: Dispatch<SetStateAction<EditorState>>;
  view: ProjectionViewModel;
}

export function ProjectionView({ base, state, setState, view }: ProjectionViewProps) {
  const [totalWidth, totalHeight] = view.totalSize;
  const gridLines = useMemo(() => buildGridLines(view, base), [base, view]);

  return (
    <section className={`projection-panel projection-panel--${view.key}`}>
      <header className="projection-header">
        <div>
          <h3>{view.title}</h3>
          <p>{view.subtitle}</p>
        </div>
        <span className="projection-count">{view.cells.length}</span>
      </header>

      <svg
        className="projection-canvas"
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        role="img"
        aria-label={view.title}
      >
        {gridLines.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className={`guide-line ${line.axis}`}
          />
        ))}

        {view.cells.map((cell) => {
          const selected = cell.baseIds.some((id) => state.selectedIds.includes(id));
          const hovered = state.hoveredId === cell.id;
          return (
            <g
              key={cell.id}
              data-cell-id={cell.id}
              className={["projection-cell", selected ? "selected" : "", hovered ? "hovered" : ""]
                .filter(Boolean)
                .join(" ")}
              onMouseEnter={() => setState((current) => setHoveredCell(current, cell.id))}
              onMouseLeave={() => setState((current) => setHoveredCell(current, null))}
              onClick={(event) => setState((current) => handleItemClick(current, cell.baseIds, event.shiftKey))}
            >
              <rect x={cell.coord[0]} y={cell.coord[1]} width={cell.border[0]} height={cell.border[1]} rx={3} />
              {renderMarks(cell)}
              <text className="projection-label" x={cell.coord[0] + cell.border[0] / 2} y={cell.coord[1] + cell.border[1] / 2 + 5}>
                {cell.value}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

interface GuideLine {
  id: string;
  axis: "axis-x" | "axis-y";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function buildGridLines(view: ProjectionViewModel, base: BaseDimensions): GuideLine[] {
  const [totalWidth, totalHeight] = view.totalSize;

  if (view.key === "topView") {
    const lines: GuideLine[] = [];
    for (let x = 0; x <= base.coordX; x += 1) {
      lines.push({
        id: `x-${x}`,
        axis: "axis-y",
        x1: x * base.long,
        y1: 0,
        x2: x * base.long,
        y2: totalHeight,
      });
    }
    for (let y = 0; y <= base.coordY; y += 1) {
      lines.push({
        id: `y-${y}`,
        axis: "axis-x",
        x1: 0,
        y1: y * base.width,
        x2: totalWidth,
        y2: y * base.width,
      });
    }
    return lines;
  }

  const unit = base.height;
  const rowCount = Math.round(totalHeight / unit);
  const colCount = view.key === "frontView" || view.key === "rearView" ? base.coordX : base.coordY;
  const colUnit = view.key === "frontView" || view.key === "rearView" ? base.long : base.width;

  const lines: GuideLine[] = [];
  for (let x = 0; x <= colCount; x += 1) {
    lines.push({
      id: `col-${x}`,
      axis: "axis-y",
      x1: x * colUnit,
      y1: 0,
      x2: x * colUnit,
      y2: totalHeight,
    });
  }
  for (let y = 0; y <= rowCount; y += 1) {
    lines.push({
      id: `row-${y}`,
      axis: "axis-x",
      x1: 0,
      y1: y * unit,
      x2: totalWidth,
      y2: y * unit,
    });
  }
  return lines;
}

function renderMarks(cell: ProjectionCell) {
  const left = cell.coord[0];
  const top = cell.coord[1];
  const width = cell.border[0];
  const height = cell.border[1];

  return (
    <>
      {cell.bracing && (
        <line className="mark bracing" x1={left + 8} y1={top + height - 8} x2={left + width - 8} y2={top + 8} />
      )}
      {cell.rung && (
        <>
          <line className="mark rung" x1={left + 8} y1={top + height * 0.35} x2={left + width - 8} y2={top + height * 0.35} />
          <line className="mark rung" x1={left + 8} y1={top + height * 0.65} x2={left + width - 8} y2={top + height * 0.65} />
        </>
      )}
      {cell.stair && (
        <>
          <line className="mark stair" x1={left + 12} y1={top + 14} x2={left + 36} y2={top + 14} />
          <line className="mark stair" x1={left + 12} y1={top + 26} x2={left + 36} y2={top + 26} />
          <line className="mark stair" x1={left + 12} y1={top + 38} x2={left + 36} y2={top + 38} />
        </>
      )}
      {cell.anchor && <circle className="mark anchor" cx={left + width - 18} cy={top + 18} r={8} />}
    </>
  );
}

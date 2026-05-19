import type { BaseDimensions, EditorCell, FiveViewGrid, GridItem, ScaffoldModel } from "../models/scaffold";

export function buildScaffoldModel(caseName: string, base: BaseDimensions, cells: EditorCell[]): ScaffoldModel {
  return {
    fileName: caseName || "untitled",
    base,
    role: { acnchor: 1, rung: 1 },
    fiveViewGrid: buildFiveViewGrid(base, cells),
    height: cells.filter((cell) => cell.height > 1).map((cell) => `${cell.viewId}_${cell.height}`),
    stair: cells.filter((cell) => cell.stair).map((cell) => `${cell.viewId}_${cell.height}`),
    anchor: cells.filter((cell) => cell.anchor).map((cell) => `${cell.viewId}_${cell.height}`),
    rung: cells.filter((cell) => cell.rung).map((cell) => `${cell.viewId}_${cell.height}`),
    bracing: cells.filter((cell) => cell.bracing).map((cell) => `${cell.viewId}_${cell.height}`),
    description: "React editor 初版",
  };
}

function buildFiveViewGrid(base: BaseDimensions, cells: EditorCell[]): FiveViewGrid {
  const topView = cells.map<GridItem>((cell) => ({
    id: cell.id,
    viewId: cell.viewId,
    coord: [cell.x - 1, cell.y - 1],
    border: [base.long, base.width],
  }));

  const elevationCells = cells.flatMap((cell) =>
    Array.from({ length: cell.height }, (_, index) => ({
      x: cell.x,
      y: cell.y,
      z: index + 1,
    })),
  );

  const frontView = elevationCells.map<GridItem>((cell) => ({
    id: `${cell.x}_${cell.y}_${cell.z}`,
    viewId: `${cell.x}_${cell.z}`,
    coord: [cell.x - 1, cell.z - 1],
    border: [base.long, base.height],
  }));

  const rearView = elevationCells.map<GridItem>((cell) => ({
    id: `${cell.x}_${cell.y}_${cell.z}`,
    viewId: `${base.coordX - cell.x + 1}_${cell.z}`,
    coord: [base.coordX - cell.x, cell.z - 1],
    border: [base.long, base.height],
  }));

  const leftSideView = elevationCells.map<GridItem>((cell) => ({
    id: `${cell.x}_${cell.y}_${cell.z}`,
    viewId: `${cell.y}_${cell.z}`,
    coord: [cell.y - 1, cell.z - 1],
    border: [base.width, base.height],
  }));

  const rightSideView = elevationCells.map<GridItem>((cell) => ({
    id: `${cell.x}_${cell.y}_${cell.z}`,
    viewId: `${base.coordY - cell.y + 1}_${cell.z}`,
    coord: [base.coordY - cell.y, cell.z - 1],
    border: [base.width, base.height],
  }));

  return { topView, leftSideView, rightSideView, frontView, rearView };
}

import type { BaseDimensions, EditorCell } from "../models/scaffold";

export type ViewKey = "topView" | "leftSideView" | "rightSideView" | "frontView" | "rearView";

export interface ProjectionCell {
  id: string;
  baseIds: string[];
  coord: [number, number];
  border: [number, number];
  value: number;
  stair: boolean;
  anchor: boolean;
  rung: boolean;
  bracing: boolean;
}

export interface ProjectionViewModel {
  key: ViewKey;
  title: string;
  subtitle: string;
  totalSize: [number, number];
  cells: ProjectionCell[];
}

export interface ProjectionSet {
  topView: ProjectionViewModel;
  leftSideView: ProjectionViewModel;
  rightSideView: ProjectionViewModel;
  frontView: ProjectionViewModel;
  rearView: ProjectionViewModel;
}

export function buildProjectionSet(base: BaseDimensions, cells: EditorCell[]): ProjectionSet {
  const maxHeight = Math.max(base.coordZ, ...cells.map((cell) => cell.height));
  const topView = buildTopView(base, cells);
  const frontView = buildXAxisView(base, cells, maxHeight, "frontView");
  const rearView = buildXAxisView(base, cells, maxHeight, "rearView");
  const leftSideView = buildYAxisView(base, cells, maxHeight, "leftSideView");
  const rightSideView = buildYAxisView(base, cells, maxHeight, "rightSideView");

  return { topView, leftSideView, rightSideView, frontView, rearView };
}

function buildTopView(base: BaseDimensions, cells: EditorCell[]): ProjectionViewModel {
  return {
    key: "topView",
    title: "俯視圖",
    subtitle: `${base.long} x ${base.width}`,
    totalSize: [base.coordX * base.long, base.coordY * base.width],
    cells: cells.map((cell) => ({
      id: cell.id,
      baseIds: [cell.id],
      coord: [(cell.x - 1) * base.long, (cell.y - 1) * base.width],
      border: [base.long, base.width],
      value: cell.height,
      stair: cell.stair,
      anchor: cell.anchor,
      rung: cell.rung,
      bracing: cell.bracing,
    })),
  };
}

function buildXAxisView(
  base: BaseDimensions,
  cells: EditorCell[],
  maxHeight: number,
  key: "frontView" | "rearView",
): ProjectionViewModel {
  const grouped = groupByAxis(cells, "x");
  const isRear = key === "rearView";
  const totalWidth = base.coordX * base.long;
  const totalHeight = maxHeight * base.height;

  return {
    key,
    title: isRear ? "背視圖" : "正視圖",
    subtitle: `${base.long} x ${base.height}`,
    totalSize: [totalWidth, totalHeight],
    cells: grouped.map((group) => {
      const xIndex = isRear ? base.coordX - group.index : group.index - 1;
      return {
        id: `${key}_${group.index}`,
        baseIds: group.ids,
        coord: [xIndex * base.long, totalHeight - group.value * base.height],
        border: [base.long, group.value * base.height],
        value: group.value,
        stair: group.stair,
        anchor: group.anchor,
        rung: group.rung,
        bracing: group.bracing,
      };
    }),
  };
}

function buildYAxisView(
  base: BaseDimensions,
  cells: EditorCell[],
  maxHeight: number,
  key: "leftSideView" | "rightSideView",
): ProjectionViewModel {
  const grouped = groupByAxis(cells, "y");
  const isLeft = key === "leftSideView";
  const totalWidth = base.coordY * base.width;
  const totalHeight = maxHeight * base.height;

  return {
    key,
    title: isLeft ? "左視圖" : "右視圖",
    subtitle: `${base.width} x ${base.height}`,
    totalSize: [totalWidth, totalHeight],
    cells: grouped.map((group) => {
      const yIndex = isLeft ? base.coordY - group.index : group.index - 1;
      return {
        id: `${key}_${group.index}`,
        baseIds: group.ids,
        coord: [yIndex * base.width, totalHeight - group.value * base.height],
        border: [base.width, group.value * base.height],
        value: group.value,
        stair: group.stair,
        anchor: group.anchor,
        rung: group.rung,
        bracing: group.bracing,
      };
    }),
  };
}

interface GroupedAxis {
  index: number;
  ids: string[];
  value: number;
  stair: boolean;
  anchor: boolean;
  rung: boolean;
  bracing: boolean;
}

function groupByAxis(cells: EditorCell[], axis: "x" | "y"): GroupedAxis[] {
  const groups = new Map<number, GroupedAxis>();

  for (const cell of cells) {
    const index = axis === "x" ? cell.x : cell.y;
    const existing = groups.get(index);
    if (!existing) {
      groups.set(index, {
        index,
        ids: [cell.id],
        value: cell.height,
        stair: cell.stair,
        anchor: cell.anchor,
        rung: cell.rung,
        bracing: cell.bracing,
      });
      continue;
    }

    existing.ids.push(cell.id);
    existing.value = Math.max(existing.value, cell.height);
    existing.stair = existing.stair || cell.stair;
    existing.anchor = existing.anchor || cell.anchor;
    existing.rung = existing.rung || cell.rung;
    existing.bracing = existing.bracing || cell.bracing;
  }

  return Array.from(groups.values()).sort((left, right) => left.index - right.index);
}

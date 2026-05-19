export type Tool = "select" | "height" | "stair" | "anchor" | "rung" | "bracing";

export interface BaseDimensions {
  long: number;
  width: number;
  height: number;
  coordX: number;
  coordY: number;
  coordZ: number;
  scaling: number;
}

export interface EditorCell {
  id: string;
  viewId: string;
  x: number;
  y: number;
  height: number;
  stair: boolean;
  anchor: boolean;
  rung: boolean;
  bracing: boolean;
}

export interface GridItem {
  id: string;
  viewId: string;
  coord: [number, number];
  border: [number, number];
}

export interface FiveViewGrid {
  topView: GridItem[];
  leftSideView: GridItem[];
  rightSideView: GridItem[];
  frontView: GridItem[];
  rearView: GridItem[];
}

export interface ScaffoldModel {
  fileName: string;
  base: BaseDimensions;
  role: {
    acnchor: number;
    rung: number;
  };
  fiveViewGrid: FiveViewGrid;
  height: string[];
  stair: string[];
  anchor: string[];
  rung: string[];
  bracing: string[];
  description: string;
}

export interface ExportResponse {
  result: true;
  fileName: string;
  relativePath: string;
  entityCount: number;
  createdAt: string;
}

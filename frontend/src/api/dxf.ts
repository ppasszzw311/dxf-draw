import type { ExportResponse, ScaffoldModel } from "../models/scaffold";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function exportDxf(scaffold: ScaffoldModel): Promise<ExportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/dxf/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scaffold }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail?.message ?? "匯出 DXF 失敗");
  }
  return data;
}

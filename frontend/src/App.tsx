import type { ComponentType } from "react";
import { Anchor, Braces, Download, Footprints, MousePointer2, Ruler, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { exportDxf } from "./api/dxf";
import { EditorCanvas } from "./components/EditorCanvas";
import { buildScaffoldModel } from "./editor/buildScaffold";
import {
  createEditorState,
  handleKey,
  setActiveTool,
  summarize,
  toolLabels,
  type EditorState,
} from "./editor/editorState";
import type { BaseDimensions, Tool } from "./models/scaffold";

const initialBase: BaseDimensions = {
  long: 1.8,
  width: 0.9,
  height: 2.1,
  coordX: 7,
  coordY: 5,
  coordZ: 5,
  scaling: 1,
};

const tools: Array<{ id: Tool; icon: ComponentType<{ size?: number }> }> = [
  { id: "select", icon: MousePointer2 },
  { id: "height", icon: Ruler },
  { id: "stair", icon: Footprints },
  { id: "anchor", icon: Anchor },
  { id: "rung", icon: Undo2 },
  { id: "bracing", icon: Braces },
];

export function App() {
  const [caseName, setCaseName] = useState("dxfTest");
  const [base, setBase] = useState<BaseDimensions>(initialBase);
  const [state, setState] = useState<EditorState>(() => createEditorState(initialBase));
  const [isExporting, setIsExporting] = useState(false);

  const summary = useMemo(() => summarize(state), [state]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      setState((current) => {
        const next = handleKey(current, event);
        if (next !== current) event.preventDefault();
        return next;
      });
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);

  async function onExport() {
    setIsExporting(true);
    try {
      const scaffold = buildScaffoldModel(caseName, base, state.cells);
      const response = await exportDxf(scaffold);
      setState((current) => ({
        ...current,
        messages: [`DXF 已匯出：${response.fileName}`, ...current.messages].slice(0, 6),
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        messages: [`匯出失敗：${error instanceof Error ? error.message : "未知錯誤"}`, ...current.messages].slice(0, 6),
      }));
    } finally {
      setIsExporting(false);
    }
  }

  function resetGrid() {
    setState(createEditorState(base));
  }

  function updateBase<K extends keyof BaseDimensions>(key: K, value: BaseDimensions[K]) {
    setBase((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>施工架設計稿編輯器</h1>
          <p>React 版本前端，使用工具模式編輯格線，並串接 Python DXF 匯出服務。</p>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={resetGrid}>重建格線</button>
          <button type="button" className="primary" onClick={onExport} disabled={isExporting}>
            <Download size={16} />
            {isExporting ? "匯出中" : "匯出 DXF"}
          </button>
        </div>
      </header>

      <div className="main-grid">
        <aside className="sidebar">
          <section>
            <h2>基本資料</h2>
            <label>
              案件名稱
              <input value={caseName} onChange={(event) => setCaseName(event.target.value)} />
            </label>
            <div className="form-grid">
              <NumberInput label="長度 long" value={base.long} onChange={(value) => updateBase("long", value)} />
              <NumberInput label="寬度 width" value={base.width} onChange={(value) => updateBase("width", value)} />
              <NumberInput label="高度 height" value={base.height} onChange={(value) => updateBase("height", value)} />
              <NumberInput label="X 格數" value={base.coordX} step={1} onChange={(value) => updateBase("coordX", value)} />
              <NumberInput label="Y 格數" value={base.coordY} step={1} onChange={(value) => updateBase("coordY", value)} />
              <NumberInput label="Z 層數" value={base.coordZ} step={1} onChange={(value) => updateBase("coordZ", value)} />
            </div>
          </section>

          <section>
            <h2>工具</h2>
            <div className="tool-grid">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    className={state.activeTool === tool.id ? "active" : ""}
                    onClick={() => setState((current) => setActiveTool(current, tool.id))}
                  >
                    <Icon size={16} />
                    {toolLabels[tool.id]}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2>狀態</h2>
            <div className="status-grid">
              <span>工具：{toolLabels[state.activeTool]}</span>
              <span>選取：{summary.selected}</span>
              <span>高度：{summary.height}</span>
              <span>樓梯：{summary.stair}</span>
              <span>錨點：{summary.anchor}</span>
              <span>橫桿：{summary.rung}</span>
              <span>斜撐：{summary.bracing}</span>
              <span>歷史：{summary.history}</span>
            </div>
          </section>

          <section>
            <h2>訊息</h2>
            <ul className="messages">
              {state.messages.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
            </ul>
          </section>
        </aside>

        <section className="workspace">
          <div className="canvas-card">
            <EditorCanvas state={state} setState={setState} columns={base.coordX} rows={base.coordY} />
          </div>
          <div className="hints">
            <span>V/H/S/A/R/B 切換工具</span>
            <span>Shift + 點擊多選</span>
            <span>Enter 或 Space 套用工具</span>
            <span>Ctrl + Z / Ctrl + Y 復原與重做</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function NumberInput({
  label,
  value,
  step = 0.1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={step}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

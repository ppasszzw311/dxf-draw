from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

os.environ.setdefault("XDG_CACHE_HOME", str(Path("prototype/.cache").resolve()))

import ezdxf
from ezdxf import units
from ezdxf.enums import TextEntityAlignment

from scaffold_model import validate_scaffold_data


MM_PER_METER = 1000
VIEW_GAP = 600
MARGIN = 200
CJK_STYLE = "CJK_TEXT"


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def grid_extents(grid: list[dict[str, Any]]) -> tuple[float, float]:
    max_x = 0.0
    max_y = 0.0
    for item in grid:
        x = float(item["coord"][0] + item["border"][0]) * MM_PER_METER
        y = float(item["coord"][1] + item["border"][1]) * MM_PER_METER
        max_x = max(max_x, x)
        max_y = max(max_y, y)
    return max_x, max_y


def create_document() -> ezdxf.EzDxf:
    doc = ezdxf.new(ezdxf.DXF2007)
    doc.units = units.MM
    doc.header["$DWGCODEPAGE"] = "UTF-8"

    doc.layers.new("VIEW_FRAME", dxfattribs={"color": 7})
    doc.layers.new("GRID", dxfattribs={"color": 7})
    doc.layers.new("TEXT", dxfattribs={"color": 3})
    doc.layers.new("ANCHOR", dxfattribs={"color": 6})
    doc.layers.new("STAIR", dxfattribs={"color": 1})
    doc.layers.new("RUNG", dxfattribs={"color": 4})
    doc.layers.new("BRACING", dxfattribs={"color": 5})

    if CJK_STYLE not in doc.styles:
        doc.styles.new(
            CJK_STYLE,
            dxfattribs={
                "font": "unicode.lff",
                "bigfont": "",
            },
        )

    return doc


def add_text(
    msp: Any,
    text: str,
    point: tuple[float, float],
    height: float = 120,
    align: TextEntityAlignment = TextEntityAlignment.MIDDLE_CENTER,
    rotation: float = 0,
) -> None:
    entity = msp.add_text(
        text,
        dxfattribs={
            "layer": "TEXT",
            "style": CJK_STYLE,
            "height": height,
            "rotation": rotation,
        },
    )
    entity.set_placement(point, align=align)


def draw_rect(
    msp: Any,
    x: float,
    y: float,
    width: float,
    height: float,
    layer: str = "GRID",
) -> None:
    points = [
        (x, y),
        (x + width, y),
        (x + width, y + height),
        (x, y + height),
    ]
    msp.add_lwpolyline(points, close=True, dxfattribs={"layer": layer})


def draw_grid(
    msp: Any,
    grid: list[dict[str, Any]],
    origin: tuple[float, float],
    view_name: str,
    height_marks: set[str],
    stair_marks: set[str],
    anchor_marks: set[str],
    draw_rung: bool = False,
) -> None:
    ox, oy = origin
    max_x, max_y = grid_extents(grid)

    add_text(msp, view_name, (ox + max_x / 2, oy + max_y + 180), height=110)
    draw_rect(msp, ox, oy, max_x, max_y, layer="VIEW_FRAME")

    for item in grid:
        item_id = item["id"]
        view_id = item["viewId"]
        x = ox + float(item["coord"][0]) * MM_PER_METER
        y = oy + float(item["coord"][1]) * MM_PER_METER
        width = float(item["border"][0]) * MM_PER_METER
        height = float(item["border"][1]) * MM_PER_METER

        draw_rect(msp, x, y, width, height)

        matching_height = next(
            (mark for mark in height_marks if mark.startswith(f"{view_id}_")),
            None,
        )
        if matching_height:
            label = matching_height.split("_")[2]
            add_text(msp, label, (x + width / 2, y + height / 2), height=130)

        if item_id in stair_marks or matching_height in stair_marks:
            draw_stair(msp, x, y, width, height)

        if item_id in anchor_marks or matching_height in anchor_marks:
            draw_anchor(msp, x, y)

        if draw_rung:
            draw_rungs(msp, x, y, width, height)

    if draw_rung:
        draw_bracing(msp, grid, origin)


def draw_stair(msp: Any, x: float, y: float, width: float, height: float) -> None:
    stair_width = min(width * 0.3, 280)
    step_count = max(int(height // 180), 3)

    msp.add_line((x + 40, y + 40), (x + 40, y + height - 40), dxfattribs={"layer": "STAIR"})
    msp.add_line(
        (x + 40 + stair_width, y + 40),
        (x + 40 + stair_width, y + height - 40),
        dxfattribs={"layer": "STAIR"},
    )

    for index in range(step_count + 1):
        step_y = y + 60 + (height - 120) * index / step_count
        msp.add_line(
            (x + 40, step_y),
            (x + 40 + stair_width, step_y),
            dxfattribs={"layer": "STAIR"},
        )


def draw_anchor(msp: Any, x: float, y: float) -> None:
    for radius in (60, 90, 120):
        msp.add_circle((x, y), radius, dxfattribs={"layer": "ANCHOR"})


def draw_rungs(msp: Any, x: float, y: float, width: float, height: float) -> None:
    for ratio in (0.25, 0.5, 0.75):
        rung_y = y + height * ratio
        msp.add_line((x + 20, rung_y), (x + width - 20, rung_y), dxfattribs={"layer": "RUNG"})


def draw_bracing(msp: Any, grid: list[dict[str, Any]], origin: tuple[float, float]) -> None:
    ox, oy = origin
    for item in grid:
        column = int(str(item["viewId"]).split("_")[0])
        if column % 2 != 1:
            continue

        x = ox + float(item["coord"][0]) * MM_PER_METER
        y = oy + float(item["coord"][1]) * MM_PER_METER
        width = float(item["border"][0]) * MM_PER_METER
        height = float(item["border"][1]) * MM_PER_METER
        msp.add_line((x, y), (x + width, y + height), dxfattribs={"layer": "BRACING"})


def draw_dimension_basics(msp: Any, data: dict[str, Any], total_width: float, baseline_y: float) -> None:
    base = data["base"]
    add_text(msp, "施工架設計稿 DXF Prototype", (total_width / 2, baseline_y + 360), height=150)
    add_text(msp, "LibreCAD 中文測試：平面圖 / 立面圖 / 錨定點 / 樓梯 / 高度 1.8m", (total_width / 2, baseline_y + 180), height=100)
    add_text(
        msp,
        f"基本尺寸：長 {base['long']}m，寬 {base['width']}m，高 {base['height']}m",
        (total_width / 2, baseline_y),
        height=90,
    )


def render(data: dict[str, Any], output: Path) -> None:
    validation = validate_scaffold_data(data)
    if validation.warnings:
        for warning in validation.warnings:
            print(f"WARNING: {warning}")
    if not validation.ok:
        for error in validation.errors:
            print(f"ERROR: {error}")
        raise ValueError("Invalid scaffold data.")

    doc = create_document()
    msp = doc.modelspace()

    grids = data["fiveViewGrid"]
    height_marks = set(data.get("height", []))
    stair_marks = set(data.get("stair", []))
    anchor_marks = set(data.get("anchor", []))

    top_w, top_h = grid_extents(grids["topView"])
    side_w, side_h = grid_extents(grids["leftSideView"])
    front_w, front_h = grid_extents(grids["frontView"])

    y_elevation = MARGIN
    y_top = y_elevation + max(side_h, front_h) + VIEW_GAP

    origins = {
        "leftSideView": (MARGIN, y_elevation),
        "frontView": (MARGIN + side_w + VIEW_GAP, y_elevation),
        "rightSideView": (MARGIN + side_w + VIEW_GAP + front_w + VIEW_GAP, y_elevation),
        "rearView": (MARGIN + side_w * 2 + VIEW_GAP * 3 + front_w, y_elevation),
        "topView": (MARGIN + side_w + VIEW_GAP, y_top),
    }

    view_labels = {
        "topView": "平面圖",
        "leftSideView": "左側立面圖",
        "frontView": "正立面圖",
        "rightSideView": "右側立面圖",
        "rearView": "背立面圖",
    }

    for view_key in ("leftSideView", "frontView", "rightSideView", "rearView"):
        draw_grid(
            msp,
            grids[view_key],
            origins[view_key],
            view_labels[view_key],
            height_marks,
            stair_marks,
            anchor_marks,
            draw_rung=True,
        )

    draw_grid(
        msp,
        grids["topView"],
        origins["topView"],
        view_labels["topView"],
        height_marks,
        stair_marks,
        anchor_marks,
    )

    total_width = origins["rearView"][0] + top_w
    draw_dimension_basics(msp, data, total_width, y_top + top_h + 420)

    output.parent.mkdir(parents=True, exist_ok=True)
    doc.saveas(output)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a LibreCAD-oriented DXF prototype.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("lib/example.json"),
        help="Input scaffold JSON file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("prototype/output/librecad_cjk_test.dxf"),
        help="Output DXF file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    data = load_json(args.input)
    render(data, args.output)
    print(f"DXF written to {args.output}")


if __name__ == "__main__":
    main()

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

os.environ.setdefault("XDG_CACHE_HOME", str(Path("backend/.cache").resolve()))

import ezdxf
from ezdxf import units
from ezdxf.document import Drawing
from ezdxf.enums import TextEntityAlignment
from ezdxf.layouts import Modelspace

from .models import GridItem, ScaffoldModel


MM_PER_METER = 1000
VIEW_GAP = 600
MARGIN = 200
CJK_STYLE = "CJK_TEXT"


def render_scaffold_to_dxf(scaffold: ScaffoldModel, output_path: Path) -> int:
    doc = create_document()
    msp = doc.modelspace()

    view_grid = scaffold.fiveViewGrid
    height_marks = set(scaffold.height)
    stair_marks = set(scaffold.stair)
    anchor_marks = set(scaffold.anchor)
    bracing_marks = set(scaffold.bracing)

    top_w, top_h = grid_extents(view_grid.topView)
    side_w, side_h = grid_extents(view_grid.leftSideView)
    front_w, front_h = grid_extents(view_grid.frontView)

    y_elevation = MARGIN
    y_top = y_elevation + max(side_h, front_h) + VIEW_GAP

    origins = {
        "leftSideView": (MARGIN, y_elevation),
        "frontView": (MARGIN + side_w + VIEW_GAP, y_elevation),
        "rightSideView": (MARGIN + side_w + VIEW_GAP + front_w + VIEW_GAP, y_elevation),
        "rearView": (MARGIN + side_w * 2 + VIEW_GAP * 3 + front_w, y_elevation),
        "topView": (MARGIN + side_w + VIEW_GAP, y_top),
    }

    draw_grid(
        msp,
        view_grid.leftSideView,
        origins["leftSideView"],
        "左側立面圖",
        height_marks,
        stair_marks,
        anchor_marks,
        bracing_marks,
        draw_rung=True,
    )
    draw_grid(
        msp,
        view_grid.frontView,
        origins["frontView"],
        "正立面圖",
        height_marks,
        stair_marks,
        anchor_marks,
        bracing_marks,
        draw_rung=True,
    )
    draw_grid(
        msp,
        view_grid.rightSideView,
        origins["rightSideView"],
        "右側立面圖",
        height_marks,
        stair_marks,
        anchor_marks,
        bracing_marks,
        draw_rung=True,
    )
    draw_grid(
        msp,
        view_grid.rearView,
        origins["rearView"],
        "背立面圖",
        height_marks,
        stair_marks,
        anchor_marks,
        bracing_marks,
        draw_rung=True,
    )
    draw_grid(
        msp,
        view_grid.topView,
        origins["topView"],
        "平面圖",
        height_marks,
        stair_marks,
        anchor_marks,
        bracing_marks,
    )

    total_width = origins["rearView"][0] + top_w
    draw_title_block(msp, scaffold, total_width, y_top + top_h + 420)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.saveas(output_path)
    return len(list(msp))


def create_document() -> Drawing:
    doc = ezdxf.new(ezdxf.DXF2007)
    doc.units = units.MM

    for name, color in (
        ("VIEW_FRAME", 7),
        ("GRID", 7),
        ("TEXT", 3),
        ("ANCHOR", 6),
        ("STAIR", 1),
        ("RUNG", 4),
        ("BRACING", 5),
    ):
        if name not in doc.layers:
            doc.layers.new(name, dxfattribs={"color": color})

    if CJK_STYLE not in doc.styles:
        doc.styles.new(CJK_STYLE, dxfattribs={"font": "unicode.lff", "bigfont": ""})

    return doc


def grid_extents(grid: Iterable[GridItem]) -> tuple[float, float]:
    max_x = 0.0
    max_y = 0.0
    for item in grid:
        x = float(item.coord[0] + item.border[0]) * MM_PER_METER
        y = float(item.coord[1] + item.border[1]) * MM_PER_METER
        max_x = max(max_x, x)
        max_y = max(max_y, y)
    return max_x, max_y


def draw_grid(
    msp: Modelspace,
    grid: list[GridItem],
    origin: tuple[float, float],
    view_name: str,
    height_marks: set[str],
    stair_marks: set[str],
    anchor_marks: set[str],
    bracing_marks: set[str],
    draw_rung: bool = False,
) -> None:
    ox, oy = origin
    max_x, max_y = grid_extents(grid)

    add_text(msp, view_name, (ox + max_x / 2, oy + max_y + 180), height=110)
    draw_rect(msp, ox, oy, max_x, max_y, layer="VIEW_FRAME")

    for item in grid:
        x = ox + float(item.coord[0]) * MM_PER_METER
        y = oy + float(item.coord[1]) * MM_PER_METER
        width = float(item.border[0]) * MM_PER_METER
        height = float(item.border[1]) * MM_PER_METER

        draw_rect(msp, x, y, width, height)

        matching_height = next(
            (mark for mark in height_marks if mark.startswith(f"{item.viewId}_")),
            None,
        )
        if matching_height:
            add_text(msp, matching_height.split("_")[2], (x + width / 2, y + height / 2), height=130)

        if item.id in stair_marks or matching_height in stair_marks:
            draw_stair(msp, x, y, width, height)

        if item.id in anchor_marks or matching_height in anchor_marks:
            draw_anchor(msp, x, y)

        if item.id in bracing_marks or matching_height in bracing_marks:
            draw_bracing_cell(msp, x, y, width, height)

        if draw_rung:
            draw_rungs(msp, x, y, width, height)


def add_text(
    msp: Modelspace,
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


def draw_rect(msp: Modelspace, x: float, y: float, width: float, height: float, layer: str = "GRID") -> None:
    points = [(x, y), (x + width, y), (x + width, y + height), (x, y + height)]
    msp.add_lwpolyline(points, close=True, dxfattribs={"layer": layer})


def draw_stair(msp: Modelspace, x: float, y: float, width: float, height: float) -> None:
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
        msp.add_line((x + 40, step_y), (x + 40 + stair_width, step_y), dxfattribs={"layer": "STAIR"})


def draw_anchor(msp: Modelspace, x: float, y: float) -> None:
    for radius in (60, 90, 120):
        msp.add_circle((x, y), radius, dxfattribs={"layer": "ANCHOR"})


def draw_rungs(msp: Modelspace, x: float, y: float, width: float, height: float) -> None:
    for ratio in (0.25, 0.5, 0.75):
        rung_y = y + height * ratio
        msp.add_line((x + 20, rung_y), (x + width - 20, rung_y), dxfattribs={"layer": "RUNG"})


def draw_bracing_cell(msp: Modelspace, x: float, y: float, width: float, height: float) -> None:
    msp.add_line((x, y), (x + width, y + height), dxfattribs={"layer": "BRACING"})


def draw_title_block(msp: Modelspace, scaffold: ScaffoldModel, total_width: float, baseline_y: float) -> None:
    base = scaffold.base
    add_text(msp, "施工架設計稿", (total_width / 2, baseline_y + 360), height=150)
    add_text(msp, "LibreCAD 中文測試：平面圖 / 立面圖 / 錨定點 / 樓梯 / 高度 1.8m", (total_width / 2, baseline_y + 180), height=100)
    add_text(
        msp,
        f"基本尺寸：長 {base.long}m，寬 {base.width}m，高 {base.height}m",
        (total_width / 2, baseline_y),
        height=90,
    )

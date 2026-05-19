from __future__ import annotations

import argparse
import os
from pathlib import Path

os.environ.setdefault("XDG_CACHE_HOME", str(Path("prototype/.cache").resolve()))

import ezdxf


REQUIRED_LAYERS = {
    "VIEW_FRAME",
    "GRID",
    "TEXT",
    "ANCHOR",
    "STAIR",
    "RUNG",
    "BRACING",
}

REQUIRED_CHINESE_TEXT = (
    "施工架設計稿",
    "LibreCAD 中文測試",
    "平面圖",
    "立面圖",
    "錨定點",
    "樓梯",
)


def validate(path: Path) -> int:
    errors: list[str] = []
    warnings: list[str] = []

    if not path.exists():
        print(f"ERROR: DXF file does not exist: {path}")
        return 1

    doc = ezdxf.readfile(path)
    msp = doc.modelspace()
    entities = list(msp)

    layer_names = {layer.dxf.name for layer in doc.layers}
    missing_layers = sorted(REQUIRED_LAYERS - layer_names)
    if missing_layers:
        errors.append(f"Missing layers: {', '.join(missing_layers)}")

    if "CJK_TEXT" not in doc.styles:
        errors.append("Missing text style: CJK_TEXT")
    else:
        style = doc.styles.get("CJK_TEXT")
        if style.dxf.font.lower() != "unicode.lff":
            warnings.append(f"CJK_TEXT uses font '{style.dxf.font}', expected 'unicode.lff'.")

    type_counts: dict[str, int] = {}
    text_values: list[str] = []
    for entity in entities:
        dxftype = entity.dxftype()
        type_counts[dxftype] = type_counts.get(dxftype, 0) + 1
        if dxftype == "TEXT":
            text_values.append(entity.dxf.text)

    for required_type in ("TEXT", "LWPOLYLINE", "LINE", "CIRCLE"):
        if type_counts.get(required_type, 0) == 0:
            errors.append(f"Missing entity type: {required_type}")

    all_text = "\n".join(text_values)
    for value in REQUIRED_CHINESE_TEXT:
        if value not in all_text:
            errors.append(f"Missing Chinese text sample: {value}")

    print(f"DXF: {path}")
    print(f"Version: {doc.dxfversion}")
    print(f"Entities: {len(entities)}")
    print("Entity counts:")
    for dxftype in sorted(type_counts):
        print(f"  {dxftype}: {type_counts[dxftype]}")
    print(f"Layers: {', '.join(sorted(layer_names))}")

    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"  WARNING: {warning}")

    if errors:
        print("Errors:")
        for error in errors:
            print(f"  ERROR: {error}")
        return 1

    print("Validation: OK")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate the generated DXF prototype.")
    parser.add_argument(
        "path",
        nargs="?",
        type=Path,
        default=Path("prototype/output/librecad_cjk_test.dxf"),
        help="DXF file to validate.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    raise SystemExit(validate(args.path))


if __name__ == "__main__":
    main()

from __future__ import annotations

import json
from pathlib import Path

from backend.app.dxf_renderer import render_scaffold_to_dxf
from backend.app.file_naming import build_export_name
from backend.app.models import ScaffoldModel


ROOT_DIR = Path(__file__).resolve().parents[2]
EXAMPLE_PATH = ROOT_DIR / "lib" / "example.json"
OUTPUT_DIR = ROOT_DIR / "public" / "dxfFile"


def main() -> None:
    data = json.loads(EXAMPLE_PATH.read_text(encoding="utf-8"))
    scaffold = ScaffoldModel.model_validate(data)
    output_name = build_export_name(scaffold.fileName, OUTPUT_DIR)
    output_path = OUTPUT_DIR / output_name
    entity_count = render_scaffold_to_dxf(scaffold, output_path)
    print(f"DXF written: {output_path}")
    print(f"Entities: {entity_count}")


if __name__ == "__main__":
    main()

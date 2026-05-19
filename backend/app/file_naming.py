from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path


INVALID_FILENAME_CHARS = re.compile(r"[^A-Za-z0-9._-]+")


def safe_name(value: str, fallback: str = "untitled") -> str:
    normalized = INVALID_FILENAME_CHARS.sub("_", value.strip())
    normalized = normalized.strip("._-")
    return normalized or fallback


def build_export_name(case_name: str, output_dir: Path, now: datetime | None = None) -> str:
    timestamp = (now or datetime.now()).strftime("%Y%m%d_%H%M%S")
    base_name = f"export_{safe_name(case_name)}_{timestamp}"
    sequence = 1

    while True:
        name = f"{base_name}_{sequence:02d}.dxf"
        if not (output_dir / name).exists():
            return name
        sequence += 1

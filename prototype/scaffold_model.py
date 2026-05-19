from __future__ import annotations

from dataclasses import dataclass
from typing import Any


REQUIRED_VIEWS = (
    "topView",
    "leftSideView",
    "rightSideView",
    "frontView",
    "rearView",
)


@dataclass(frozen=True)
class ScaffoldValidationResult:
    errors: list[str]
    warnings: list[str]

    @property
    def ok(self) -> bool:
        return not self.errors


def validate_scaffold_data(data: dict[str, Any]) -> ScaffoldValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    if not isinstance(data, dict):
        return ScaffoldValidationResult(["Root data must be an object."], [])

    base = data.get("base")
    if not isinstance(base, dict):
        errors.append("Missing object: base")
    else:
        for key in ("long", "width", "height", "coordX", "coordY", "coordZ"):
            value = base.get(key)
            if not isinstance(value, (int, float)):
                errors.append(f"base.{key} must be a number.")
            elif value <= 0:
                errors.append(f"base.{key} must be greater than 0.")

    five_view_grid = data.get("fiveViewGrid")
    if not isinstance(five_view_grid, dict):
        errors.append("Missing object: fiveViewGrid")
    else:
        for view_name in REQUIRED_VIEWS:
            grid = five_view_grid.get(view_name)
            if not isinstance(grid, list):
                errors.append(f"fiveViewGrid.{view_name} must be an array.")
                continue
            if not grid:
                warnings.append(f"fiveViewGrid.{view_name} is empty.")
            for index, item in enumerate(grid):
                validate_grid_item(item, f"fiveViewGrid.{view_name}[{index}]", errors)

    for key in ("height", "stair", "anchor"):
        value = data.get(key, [])
        if not isinstance(value, list):
            errors.append(f"{key} must be an array.")
        elif not all(isinstance(item, str) for item in value):
            errors.append(f"{key} must only contain string ids.")

    role = data.get("role", {})
    if role and not isinstance(role, dict):
        errors.append("role must be an object when provided.")

    file_name = data.get("fileName")
    if file_name is not None and not isinstance(file_name, str):
        errors.append("fileName must be a string when provided.")

    return ScaffoldValidationResult(errors, warnings)


def validate_grid_item(item: Any, path: str, errors: list[str]) -> None:
    if not isinstance(item, dict):
        errors.append(f"{path} must be an object.")
        return

    for key in ("id", "viewId"):
        if not isinstance(item.get(key), str):
            errors.append(f"{path}.{key} must be a string.")

    coord = item.get("coord")
    if not is_number_pair(coord):
        errors.append(f"{path}.coord must be a two-number array.")

    border = item.get("border")
    if not is_number_pair(border):
        errors.append(f"{path}.border must be a two-number array.")
    elif border[0] <= 0 or border[1] <= 0:
        errors.append(f"{path}.border values must be greater than 0.")


def is_number_pair(value: Any) -> bool:
    return (
        isinstance(value, list)
        and len(value) == 2
        and isinstance(value[0], (int, float))
        and isinstance(value[1], (int, float))
    )

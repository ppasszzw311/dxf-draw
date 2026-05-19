from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi.testclient import TestClient


ROOT_DIR = Path(__file__).resolve().parents[2]
EXAMPLE_PATH = ROOT_DIR / "lib" / "example.json"
TEST_EXPORT_DIR = ROOT_DIR / "backend" / ".cache" / "api_contracts"
os.environ["DXF_EXPORT_DIR"] = str(TEST_EXPORT_DIR)

from backend.app.main import app


def main() -> None:
    scaffold = json.loads(EXAMPLE_PATH.read_text(encoding="utf-8"))
    client = TestClient(app)

    assert client.get("/health").status_code == 200

    validate_direct = client.post("/api/scaffold/validate", json=scaffold)
    assert validate_direct.status_code == 200, validate_direct.text

    validate_data_string = client.post("/api/scaffold/validate", json={"data": json.dumps(scaffold)})
    assert validate_data_string.status_code == 200, validate_data_string.text

    export_wrapped = client.post(
        "/api/dxf/export",
        json={
            "scaffold": scaffold,
            "outputName": "api_contract_wrapped.dxf",
        },
    )
    assert export_wrapped.status_code == 200, export_wrapped.text

    export_direct = client.post(
        "/api/dxf/export",
        json={
            **scaffold,
            "outputName": "api_contract_direct.dxf",
        },
    )
    assert export_direct.status_code == 200, export_direct.text

    export_data_string = client.post(
        "/api/dxf/export",
        json={
            "data": json.dumps(scaffold),
            "outputName": "api_contract_data_string.dxf",
        },
    )
    assert export_data_string.status_code == 200, export_data_string.text

    for name in (
        "api_contract_wrapped.dxf",
        "api_contract_direct.dxf",
        "api_contract_data_string.dxf",
    ):
        path = TEST_EXPORT_DIR / name
        assert path.exists(), f"Missing generated DXF: {path}"

    print("API contract validation: OK")


if __name__ == "__main__":
    main()

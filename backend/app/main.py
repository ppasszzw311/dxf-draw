from __future__ import annotations

import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .dxf_renderer import render_scaffold_to_dxf
from .file_naming import build_export_name
from .models import ExportResponse, ValidationResponse
from .request_parsing import RequestParseError, parse_export_payload, parse_scaffold_payload


ROOT_DIR = Path(__file__).resolve().parents[2]
EXPORT_DIR = Path(os.environ.get("DXF_EXPORT_DIR", ROOT_DIR / "public" / "dxfFile"))

app = FastAPI(title="DXF Draw Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/scaffold/validate", response_model=ValidationResponse)
def validate_scaffold(payload: dict[str, Any] = Body(...)) -> ValidationResponse:
    parse_scaffold_payload(payload)
    return ValidationResponse(result=True, message="資料格式驗證通過")


@app.post("/api/dxf/export", response_model=ExportResponse)
def export_dxf(payload: dict[str, Any] = Body(...)) -> ExportResponse:
    request = parse_export_payload(payload)
    output_name = request.outputName or build_export_name(request.scaffold.fileName, EXPORT_DIR)
    output_path = EXPORT_DIR / output_name
    entity_count = render_scaffold_to_dxf(request.scaffold, output_path)
    return ExportResponse(
        result=True,
        fileName=output_name,
        relativePath=f"/dxfFile/{output_name}",
        entityCount=entity_count,
        createdAt=datetime.now(UTC),
    )


@app.exception_handler(RequestParseError)
def request_parse_error_handler(_request: Any, exc: RequestParseError) -> JSONResponse:
    detail: dict[str, Any] = {"message": str(exc)}
    if exc.details is not None:
        detail["errors"] = exc.details
    return JSONResponse(status_code=422, content={"detail": detail})

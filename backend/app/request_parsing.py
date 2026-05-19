from __future__ import annotations

import json
from typing import Any

from pydantic import ValidationError

from .models import ExportRequest, ScaffoldModel


class RequestParseError(ValueError):
    def __init__(self, message: str, details: Any | None = None) -> None:
        super().__init__(message)
        self.details = details


def parse_scaffold_payload(payload: Any) -> ScaffoldModel:
    raw_scaffold = extract_raw_scaffold(payload)
    try:
        return ScaffoldModel.model_validate(raw_scaffold)
    except ValidationError as error:
        raise RequestParseError("Scaffold 資料格式不正確", error.errors()) from error


def parse_export_payload(payload: Any) -> ExportRequest:
    if not isinstance(payload, dict):
        raise RequestParseError("Request body 必須是 JSON object")

    if "scaffold" in payload:
        try:
            return ExportRequest.model_validate(payload)
        except ValidationError as error:
            raise RequestParseError("匯出資料格式不正確", error.errors()) from error

    scaffold = parse_scaffold_payload(payload)
    return ExportRequest(scaffold=scaffold, outputName=payload.get("outputName"))


def extract_raw_scaffold(payload: Any) -> Any:
    if not isinstance(payload, dict):
        raise RequestParseError("Request body 必須是 JSON object")

    if "scaffold" in payload:
        return payload["scaffold"]

    if "data" in payload:
        data = payload["data"]
        if isinstance(data, str):
            try:
                return json.loads(data)
            except json.JSONDecodeError as error:
                raise RequestParseError("data 欄位不是合法 JSON 字串") from error
        return data

    return payload

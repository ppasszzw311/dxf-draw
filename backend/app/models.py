from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DraftStatus(str, Enum):
    DRAFT = "draft"
    EXPORTED = "exported"
    ARCHIVED = "archived"


class BaseDimensions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    long: float = Field(gt=0, description="沿建築物立面方向")
    width: float = Field(gt=0, description="往外伸出/離建築物深度方向")
    height: float = Field(gt=0, description="垂直高度方向")
    coordX: int = Field(gt=0)
    coordY: int = Field(gt=0)
    coordZ: int = Field(gt=0)
    scaling: float = Field(default=1, gt=0)


class RoleSettings(BaseModel):
    model_config = ConfigDict(extra="allow")

    acnchor: int | None = None
    rung: int = Field(default=1, ge=1, le=3)


class GridItem(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    viewId: str
    coord: tuple[float, float]
    border: tuple[float, float]

    @field_validator("border")
    @classmethod
    def border_must_be_positive(cls, value: tuple[float, float]) -> tuple[float, float]:
        if value[0] <= 0 or value[1] <= 0:
            raise ValueError("border values must be greater than 0")
        return value


class FiveViewGrid(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topView: list[GridItem]
    leftSideView: list[GridItem]
    rightSideView: list[GridItem]
    frontView: list[GridItem]
    rearView: list[GridItem]


class ScaffoldModel(BaseModel):
    model_config = ConfigDict(extra="allow")

    fileName: str = Field(default="untitled", min_length=1)
    base: BaseDimensions
    role: RoleSettings = Field(default_factory=RoleSettings)
    fiveViewGrid: FiveViewGrid
    height: list[str] = Field(default_factory=list)
    stair: list[str] = Field(default_factory=list)
    anchor: list[str] = Field(default_factory=list)
    rung: list[str] = Field(default_factory=list)
    bracing: list[str] = Field(default_factory=list)
    description: str | dict | None = None


class ExportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scaffold: ScaffoldModel
    outputName: str | None = None


class ExportResponse(BaseModel):
    result: Literal[True]
    fileName: str
    relativePath: str
    entityCount: int
    createdAt: datetime


class ValidationResponse(BaseModel):
    result: Literal[True]
    message: str


class DesignDraft(BaseModel):
    id: str
    caseName: str
    status: DraftStatus = DraftStatus.DRAFT
    currentVersionId: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))


class DesignVersion(BaseModel):
    id: str
    designId: str
    versionNumber: int = Field(gt=0)
    scaffold: ScaffoldModel
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ExportRecord(BaseModel):
    id: str
    designId: str
    versionId: str
    fileName: str
    filePath: str
    exportedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

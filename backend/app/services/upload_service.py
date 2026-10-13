"""
GridMind AI – Data Upload & Validation Service.
"""

from __future__ import annotations

import io
from typing import List, Optional
import pandas as pd

from app.models.schemas import UploadResponse


_REQUIRED_COLUMNS = {
    "solar": ["timestamp", "solar_mw"],
    "wind":  ["timestamp", "wind_mw"],
    "demand":["timestamp", "demand_mw"],
    "ev":    ["timestamp", "ev_kw"],
    "weather":["timestamp", "temperature", "cloud_cover"],
}


def validate_csv(filename: str, content: bytes) -> UploadResponse:
    warnings: List[str] = []

    if not filename.lower().endswith(".csv"):
        return UploadResponse(
            filename=filename,
            rows=0,
            columns=[],
            missingValues=0,
            duplicates=0,
            warnings=["Only CSV files (.csv) are supported."],
            status="error",
        )

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        return UploadResponse(
            filename=filename,
            rows=0,
            columns=[],
            missingValues=0,
            duplicates=0,
            warnings=[f"Failed to parse CSV: {e}"],
            status="error",
        )

    rows, _ = df.shape
    columns = list(df.columns)
    missing = int(df.isnull().sum().sum())
    duplicates = int(df.duplicated().sum())

    if missing > 0:
        warnings.append(f"{missing} missing value(s) detected. Forward-fill will be applied before modelling.")
    if duplicates > 0:
        warnings.append(f"{duplicates} duplicate row(s) detected. De-duplication will be applied.")
    if rows < 100:
        warnings.append("Fewer than 100 rows—dataset may be too small for reliable model training.")

    # Try to detect time range
    time_range: Optional[str] = None
    for col in ["timestamp", "time", "datetime", "date"]:
        if col in df.columns:
            try:
                ts = pd.to_datetime(df[col])
                time_range = f"{ts.min()} → {ts.max()}"
            except Exception:
                pass
            break

    # File type hint from name
    for key, req_cols in _REQUIRED_COLUMNS.items():
        if key in filename.lower():
            missing_cols = [c for c in req_cols if c not in columns]
            if missing_cols:
                warnings.append(f"Expected column(s) for {key} dataset not found: {missing_cols}")

    status = "error" if not columns else ("warning" if warnings else "ok")
    sample_rows = df.head(5).fillna("").to_dict(orient="records") if not df.empty else []

    return UploadResponse(
        filename=filename,
        rows=rows,
        rowCount=rows,
        columns=columns,
        missingValues=missing,
        duplicates=duplicates,
        timeRange=time_range,
        warnings=warnings,
        issues=warnings,
        sampleRows=sample_rows,
        status=status,
    )

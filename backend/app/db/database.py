"""
Voltaris AI – Database setup (SQLAlchemy + SQLite via aiosqlite).
Stores: forecast runs, alert history, scenario configs, upload metadata,
        model metrics, user settings.
"""

from __future__ import annotations

from sqlalchemy import (
    Column, DateTime, Float, Integer, JSON, String, Text,
    create_engine, text
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os
from datetime import datetime, timezone

from app.core.config import settings

# Ensure SQLite parent directory exists
if "sqlite" in settings.DATABASE_URL:
    db_path = settings.DATABASE_URL.split("///")[-1]
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class ForecastRun(Base):
    __tablename__ = "forecast_runs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    location_id = Column(String(32))
    source = Column(String(32))
    horizon = Column(String(8))
    mae = Column(Float)
    rmse = Column(Float)
    mape = Column(Float)
    payload = Column(JSON)  # full response JSON


class AlertRecord(Base):
    __tablename__ = "alert_history"
    id = Column(String(64), primary_key=True)
    timestamp = Column(String(64))
    severity = Column(String(16))
    type = Column(String(64))
    title = Column(String(256))
    cause = Column(Text)
    recommended_action = Column(Text)
    why_explanation = Column(Text)
    status = Column(String(32), default="active")


class ScenarioRun(Base):
    __tablename__ = "scenario_runs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    location_id = Column(String(32))
    inputs = Column(JSON)
    result_summary = Column(JSON)


class UploadRecord(Base):
    __tablename__ = "upload_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    filename = Column(String(256))
    rows = Column(Integer)
    columns = Column(JSON)
    status = Column(String(16))
    warnings = Column(JSON)


class ModelMetricRecord(Base):
    __tablename__ = "model_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    location_id = Column(String(32))
    source = Column(String(32))
    model_name = Column(String(64))
    mae = Column(Float)
    rmse = Column(Float)
    mape = Column(Float)
    r2 = Column(Float)


class AppSetting(Base):
    __tablename__ = "app_settings"
    key = Column(String(128), primary_key=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


async def init_db() -> None:
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

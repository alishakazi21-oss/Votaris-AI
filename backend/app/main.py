"""
Voltaris AI – FastAPI Application Entry Point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.database import init_db
from app.api import api_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL, logging.INFO))
logger = logging.getLogger("voltaris")


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Voltaris AI backend starting…")
    await init_db()
    logger.info("Database initialised.")
    yield
    logger.info("Voltaris AI backend shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Voltaris AI",
    description=(
        "AI-Powered Renewable Energy Forecasting & Smart Grid Optimization Platform. "
        "All /api/* endpoints return JSON-serialisable data compatible with the "
        "Voltaris AI React frontend."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Check server logs."},
    )


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"], summary="Health check")
async def health():
    return {"status": "ok", "version": "1.0.0", "app": "Voltaris AI"}


# ── API routes ────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api")

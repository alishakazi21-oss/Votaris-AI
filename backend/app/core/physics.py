"""
Voltaris AI – Physics-based deterministic data engine.

All generators produce values that match the TypeScript mock generators
in the frontend (mockGenerators.ts) so that demo mode is identical
whether served by the backend or by the client.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timezone, timedelta
from typing import List, Literal, Optional

import pytz

IST = pytz.timezone("Asia/Kolkata")

# ── Location catalogue (mirrors frontend uiStore.ts LOCATIONS) ─────────────
LOCATIONS = {
    "pune":      {"name": "Pune Smart Grid Hub",       "state": "Maharashtra", "coordinates": [18.5204, 73.8567], "solarMW": 120, "windMW": 45},
    "nashik":    {"name": "Nashik Renewable Valley",   "state": "Maharashtra", "coordinates": [19.9975, 73.7898], "solarMW": 85,  "windMW": 90},
    "jaisalmer": {"name": "Jaisalmer Solar-Wind Park", "state": "Rajasthan",   "coordinates": [26.9157, 70.9083], "solarMW": 450, "windMW": 310},
    "chennai":   {"name": "Chennai Coastal Microgrid", "state": "Tamil Nadu",  "coordinates": [13.0827, 80.2707], "solarMW": 160, "windMW": 110},
    "custom":    {"name": "Custom Location",           "state": "India",       "coordinates": [20.5937, 78.9629], "solarMW": 100, "windMW": 60},
}


# ── Core physics helpers ───────────────────────────────────────────────────

def solar_mw(hour: float, max_solar_mw: float, cloud_fraction: float = 0.0) -> float:
    """Bell-curve diurnal solar generation. Zero before 06:00 and after 18:30."""
    if hour < 6 or hour > 18.5:
        return 0.0
    solar_noon = 12.5
    half_width = 6.25
    norm = (hour - solar_noon) / half_width
    raw_bell = math.exp(-0.5 * (norm * 2.8) ** 2)
    cloud_att = max(0.15, 1 - cloud_fraction * 0.85)
    return round(max(0.0, raw_bell * max_solar_mw * cloud_att), 2)


def wind_mw(hour: float, max_wind_mw: float, seed_offset: float = 0.0) -> float:
    """Smooth diurnal wind generation with afternoon and overnight uplift."""
    t = (hour + seed_offset) * (math.pi / 12)
    baseline = 0.45
    diurnal = 0.25 * math.sin(t - 1.2) + 0.1 * math.cos(2 * t)
    fraction = min(0.95, max(0.1, baseline + diurnal))
    return round(fraction * max_wind_mw, 2)


def demand_mw(hour: float, base_mw: float) -> float:
    """Indian dual-peak demand profile: morning 09-11h, evening 18-21h."""
    morning = 0.45 * math.exp(-0.5 * ((hour - 10) / 1.8) ** 2)
    evening = 0.65 * math.exp(-0.5 * ((hour - 19.5) / 2.0) ** 2)
    night   = 0.35 * (1 - math.exp(-0.5 * ((hour - 3.5) / 2.5) ** 2))
    mult = 0.55 + morning + evening - (1 - night) * 0.15
    return round(base_mw * mult, 2)


def ev_demand_kw(hour: float, scale_kw: float = 2500.0) -> float:
    """EV fleet charging demand with office-arrival and home-charging peaks."""
    office = 0.35 * math.exp(-0.5 * ((hour - 9.5) / 1.2) ** 2)
    home   = 0.85 * math.exp(-0.5 * ((hour - 20) / 2.1) ** 2)
    base   = 0.08
    return round(scale_kw * (base + office + home))


def tariff_band(hour: int) -> str:
    """Returns the tariff band name for a given hour."""
    if 22 <= hour or hour < 6:
        return "off_peak"
    elif 6 <= hour < 9 or 13 <= hour < 17:
        return "mid_peak"
    else:
        return "on_peak"


def tariff_rate(hour: int, off: float = 4.50, mid: float = 7.20, on: float = 10.80) -> float:
    band = tariff_band(hour)
    return {"off_peak": off, "mid_peak": mid, "on_peak": on}[band]


def risk_level(net_mw: float) -> str:
    if net_mw < -25:
        return "critical"
    if net_mw < -5 or net_mw > 35:
        return "watch"
    return "stable"


def _loc(location_id: str) -> dict:
    return LOCATIONS.get(location_id, LOCATIONS["pune"])

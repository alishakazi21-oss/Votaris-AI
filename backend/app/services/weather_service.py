"""
GridMind AI – Weather Service.
Fetches from Open-Meteo (free, no API key required) and falls back
to a physics-based demo dataset if the network is unavailable.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import List

import httpx

from app.core.physics import solar_mw, wind_mw, _loc
from app.models.schemas import WeatherData, WeatherHourlyPoint, WeatherAlert, RiskLevel

# Open-Meteo endpoint (no key needed for standard variables)
_OM_URL = "https://api.open-meteo.com/v1/forecast"

_CONDITION_MAP = [
    (0,   "Clear Sky"),
    (1,   "Mainly Clear"),
    (2,   "Partly Cloudy"),
    (3,   "Overcast"),
    (45,  "Foggy"),
    (61,  "Light Rain"),
    (80,  "Showers"),
    (95,  "Thunderstorm"),
]


def _wmo_condition(code: int) -> str:
    for c, label in reversed(_CONDITION_MAP):
        if code >= c:
            return label
    return "Clear Sky"


def _generation_impact(cloud_pct: float, wind_ms: float) -> float:
    """Estimated % impact on combined renewable output (negative = reduction)."""
    solar_loss = cloud_pct * 0.7
    wind_gain  = max(0.0, (wind_ms - 5) * 2.5)
    return round(wind_gain - solar_loss, 1)


def _demo_weather(location_id: str) -> WeatherData:
    """Deterministic demo weather dataset."""
    loc = _loc(location_id)
    forecast: List[WeatherHourlyPoint] = []
    for h in range(24):
        cloud = 20 + 30 * math.sin((h - 6) * math.pi / 18) if 6 <= h <= 18 else 10.0
        cloud = max(0.0, min(100.0, cloud))
        temp = 28 + 8 * math.sin((h - 6) * math.pi / 12)
        wind_speed = 4 + 3 * math.sin(h * math.pi / 12 + 1.2)
        humidity = 65 - 15 * math.sin((h - 8) * math.pi / 12)
        ghi = max(0.0, 900 * math.sin((h - 6) * math.pi / 12.5) * (1 - cloud / 100 * 0.7))
        condition = "Partly Cloudy" if cloud > 40 else "Clear Sky"
        impact = _generation_impact(cloud, wind_speed)

        forecast.append(WeatherHourlyPoint(
            timestamp=f"{h:02d}:00",
            tempC=round(temp, 1),
            cloudCoverPct=round(cloud, 1),
            windSpeedMs=round(wind_speed, 1),
            humidityPct=round(humidity, 1),
            ghiWm2=round(ghi, 0),
            condition=condition,
            generationImpactPct=impact,
        ))

    alerts: List[WeatherAlert] = []
    if any(p.cloudCoverPct > 70 for p in forecast):
        alerts.append(WeatherAlert(
            timestamp="14:00",
            condition="Heavy Cloud Cover",
            severity="watch",
            impact="Solar generation expected to drop 40–60% between 13:00–16:00",
        ))

    return WeatherData(
        locationId=location_id,
        locationName=loc["name"],
        forecast=forecast,
        alerts=alerts,
        demoMode=True,
    )


async def fetch_weather(location_id: str) -> WeatherData:
    loc = _loc(location_id)
    lat, lon = loc["coordinates"]
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,cloudcover,windspeed_10m,relativehumidity_2m,direct_radiation,weathercode",
        "forecast_days": 1,
        "timezone": "Asia/Kolkata",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(_OM_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        hourly = data.get("hourly", {})
        times   = hourly.get("time", [])
        temps   = hourly.get("temperature_2m", [])
        clouds  = hourly.get("cloudcover", [])
        winds   = hourly.get("windspeed_10m", [])
        hums    = hourly.get("relativehumidity_2m", [])
        rads    = hourly.get("direct_radiation", [])
        codes   = hourly.get("weathercode", [])

        forecast = []
        for i in range(min(24, len(times))):
            cloud = float(clouds[i]) if i < len(clouds) else 20.0
            wind  = float(winds[i])  if i < len(winds)  else 4.0
            ghi   = float(rads[i])   if i < len(rads)   else 0.0
            code  = int(codes[i])    if i < len(codes)  else 0
            ts    = times[i][11:16]  if len(times[i]) > 10 else f"{i:02d}:00"

            forecast.append(WeatherHourlyPoint(
                timestamp=ts,
                tempC=round(float(temps[i]) if i < len(temps) else 28.0, 1),
                cloudCoverPct=round(cloud, 1),
                windSpeedMs=round(wind, 1),
                humidityPct=round(float(hums[i]) if i < len(hums) else 65.0, 1),
                ghiWm2=round(ghi, 0),
                condition=_wmo_condition(code),
                generationImpactPct=_generation_impact(cloud, wind),
            ))

        alerts = []
        heavy_cloud = [p for p in forecast if p.cloudCoverPct > 70]
        if heavy_cloud:
            alerts.append(WeatherAlert(
                timestamp=heavy_cloud[0].timestamp,
                condition="Heavy Cloud Cover",
                severity="watch",
                impact=f"Solar generation drop expected during {heavy_cloud[0].timestamp}–{heavy_cloud[-1].timestamp}",
            ))
        high_wind = [p for p in forecast if p.windSpeedMs > 15]
        if high_wind:
            alerts.append(WeatherAlert(
                timestamp=high_wind[0].timestamp,
                condition="High Wind Speed",
                severity="watch",
                impact="Wind generation above rated speed—turbine cut-out risk after 25 m/s",
            ))

        return WeatherData(
            locationId=location_id,
            locationName=loc["name"],
            forecast=forecast,
            alerts=alerts,
            demoMode=False,
        )

    except Exception:
        # Graceful fallback to demo data if API is unavailable
        return _demo_weather(location_id)

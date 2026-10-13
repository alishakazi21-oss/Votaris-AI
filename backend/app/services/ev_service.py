"""
GridMind AI – EV Management Service.
"""

from __future__ import annotations

from app.core.physics import solar_mw, wind_mw, ev_demand_kw, _loc
from app.models.schemas import EvManagementData, EVStation, EVDemandPoint

_STATION_TEMPLATES = [
    {"id": "ev-01", "name": "Tech Park Fast Charger Hub", "location": "IT Zone"},
    {"id": "ev-02", "name": "Residential Block EV Bay",   "location": "Housing Colony"},
    {"id": "ev-03", "name": "Highway Corridor Station",   "location": "NH-48"},
    {"id": "ev-04", "name": "Commercial Mall Chargers",   "location": "Central Market"},
]


def generate_ev_management(location_id: str) -> EvManagementData:
    loc = _loc(location_id)
    stations = []
    total_fleet = 0.0
    total_savings = 0.0

    for i, t in enumerate(_STATION_TEMPLATES):
        scale = [2500, 1800, 3200, 1500][i]
        peak_h = [9, 20, 14, 19][i]
        peak_kw = round(ev_demand_kw(peak_h, scale))
        current_kw = round(ev_demand_kw(15, scale) * 0.6)
        optimized_kw = round(peak_kw * 0.65)
        sav = round((peak_kw - optimized_kw) * 0.5 * 10.80, 0)

        stations.append(EVStation(
            id=t["id"],
            name=t["name"],
            location=t["location"],
            totalPorts=20 + i * 5,
            activePorts=8 + i * 2,
            currentLoadKW=current_kw,
            peakForecastKW=peak_kw,
            peakHour=peak_h,
            scheduledChargeKW=float(peak_kw),
            optimizedChargeKW=float(optimized_kw),
            savingsINR=float(sav),
        ))
        total_fleet += current_kw
        total_savings += sav

    hourly = []
    for h in range(24):
        sol = solar_mw(h, loc["solarMW"])
        wnd = wind_mw(h, loc["windMW"])
        dem_ev = ev_demand_kw(h, 8000)
        surplus_kw = max(0.0, (sol + wnd) * 1000 - dem_ev * 0.3)
        optimized = round(dem_ev * 0.75 if 10 <= h <= 15 else dem_ev * 1.0)
        hourly.append(EVDemandPoint(
            timestamp=f"{h:02d}:00",
            forecastKW=float(dem_ev),
            optimizedKW=float(optimized),
            renewableSurplusKW=round(surplus_kw, 1),
        ))

    peak_kw_total = max(p.forecastKW for p in hourly)
    optimized_peak = max(p.optimizedKW for p in hourly)

    return EvManagementData(
        locationId=location_id,
        stations=stations,
        hourlyDemand=hourly,
        totalFleetKW=round(total_fleet, 1),
        peakDemandKW=round(peak_kw_total, 1),
        optimizedPeakKW=round(optimized_peak, 1),
        totalSavingsINR=round(total_savings, 0),
        recommendedShiftHours=[10, 11, 12, 13, 14],
    )

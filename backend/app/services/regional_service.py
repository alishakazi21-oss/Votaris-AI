"""
GridMind AI – Regional Map Service.
"""

from __future__ import annotations

from typing import List
from app.core.physics import solar_mw, wind_mw, demand_mw, risk_level, _loc, LOCATIONS
from app.models.schemas import RegionalAsset
from datetime import datetime, timezone


def generate_regional_assets(location_id: str) -> List[RegionalAsset]:
    now_h = datetime.now(timezone.utc).hour
    assets: List[RegionalAsset] = []

    # Add assets for ALL known locations to populate the map
    for lid, loc in LOCATIONS.items():
        sol = solar_mw(now_h, loc["solarMW"])
        wnd = wind_mw(now_h, loc["windMW"])
        dem = demand_mw(now_h, loc["solarMW"] * 0.95)
        net = sol + wnd - dem
        rl = risk_level(net)
        lat, lon = loc["coordinates"]

        assets.append(RegionalAsset(
            id=f"solar-{lid}",
            name=f"{loc['name']} – Solar Farm",
            type="solar_farm",
            coordinates=[lat + 0.05, lon - 0.05],
            capacityMW=float(loc["solarMW"]),
            currentOutputMW=round(sol, 1),
            risk=rl,
            label=f"{round(sol,1)} MW",
        ))
        assets.append(RegionalAsset(
            id=f"wind-{lid}",
            name=f"{loc['name']} – Wind Farm",
            type="wind_farm",
            coordinates=[lat - 0.05, lon + 0.05],
            capacityMW=float(loc["windMW"]),
            currentOutputMW=round(wnd, 1),
            risk="stable" if wnd > loc["windMW"] * 0.3 else "watch",
            label=f"{round(wnd,1)} MW",
        ))
        assets.append(RegionalAsset(
            id=f"sub-{lid}",
            name=f"{loc['name']} – Substation",
            type="substation",
            coordinates=[lat, lon],
            demandMW=round(dem, 1),
            risk=rl,
            label=f"{round(dem,1)} MW load",
        ))

    # EV stations (static demo locations)
    ev_stations = [
        {"id": "ev-pune-01",   "name": "Pune IT Park EV Hub",      "coords": [18.5500, 73.9200], "cap": 2.5},
        {"id": "ev-nashik-01", "name": "Nashik MIDC EV Station",    "coords": [19.9800, 73.8000], "cap": 1.8},
        {"id": "ev-jai-01",    "name": "Jaisalmer NH Station",      "coords": [26.9000, 70.9300], "cap": 3.2},
        {"id": "ev-che-01",    "name": "Chennai OMR EV Fast Charge","coords": [13.0600, 80.2900], "cap": 4.0},
    ]
    for ev in ev_stations:
        assets.append(RegionalAsset(
            id=ev["id"],
            name=ev["name"],
            type="ev_station",
            coordinates=ev["coords"],
            capacityMW=ev["cap"],
            currentOutputMW=round(ev["cap"] * 0.6, 1),
            risk="stable",
            label=f"{ev['cap']} MW capacity",
        ))

    return assets

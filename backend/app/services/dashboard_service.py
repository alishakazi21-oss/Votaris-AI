"""
Voltaris AI – Dashboard Service.
Generates the Overview Dashboard payload using the physics engine.
"""

from __future__ import annotations

from datetime import datetime, timezone
from app.core.physics import solar_mw, wind_mw, demand_mw, ev_demand_kw, risk_level, _loc
from app.models.schemas import (
    OverviewDashboardData, KPIs, TimeSeriesPoint,
    GridAlert, UpcomingForecast, BatteryMiniStatus
)


def generate_dashboard(location_id: str) -> OverviewDashboardData:
    loc = _loc(location_id)
    now = datetime.now(timezone.utc)
    current_hour = now.hour + now.minute / 60.0

    s = solar_mw(current_hour, loc["solarMW"])
    w = wind_mw(current_hour, loc["windMW"])
    renewable = round(s + w, 2)
    dem = demand_mw(current_hour, loc["solarMW"] * 0.95)
    ev_mw = round(ev_demand_kw(current_hour, 3500) / 1000, 2)
    gap = round(renewable - dem, 2)

    ts = []
    for h in range(24):
        sol = solar_mw(h, loc["solarMW"])
        wnd = wind_mw(h, loc["windMW"])
        total_r = round(sol + wnd, 2)
        dem_h = demand_mw(h, loc["solarMW"] * 0.95)
        is_fc = h >= int(current_hour)
        uncertainty = (h - int(current_hour) + 1) * 2.2 if is_fc else 0.0
        pred_d = round(dem_h + (2.0 if h % 3 == 0 else -1.5), 2) if is_fc else dem_h
        ts.append(TimeSeriesPoint(
            timestamp=f"{h:02d}:00",
            solarMW=sol,
            windMW=wnd,
            totalRenewableMW=total_r,
            demandMW=dem_h,
            predictedDemandMW=pred_d,
            upperConfidenceMW=round(pred_d + uncertainty, 2),
            lowerConfidenceMW=round(max(0.0, pred_d - uncertainty), 2),
            netBalanceMW=round(total_r - dem_h, 2),
            isForecast=is_fc,
        ))

    alerts = [
        GridAlert(
            id="alt-top-1",
            timestamp=datetime.fromtimestamp(now.timestamp() - 900, tz=timezone.utc).isoformat(),
            severity="critical",
            type="Peak Deficit Risk",
            title="Projected 42 MW Gap during 19:00 Peak",
            cause="Solar generation sunset coincides with residential + EV demand ramp",
            recommendedAction="Schedule 35 MW BESS discharge and initiate 5 MW EV dynamic throttling",
            whyExplanation="Prevents reliance on expensive spot-market grid power during peak tariffs.",
            status="active",
        ),
        GridAlert(
            id="alt-top-2",
            timestamp=datetime.fromtimestamp(now.timestamp() - 3000, tz=timezone.utc).isoformat(),
            severity="watch",
            type="Solar Headroom",
            title="Solar Inverter Headroom Bottleneck",
            cause="Substation line loading approaching 92% capacity at 13:00",
            recommendedAction="Divert excess generation into local battery storage",
            whyExplanation="Mitigates risk of statutory curtailment while maintaining stability.",
            status="active",
        ),
        GridAlert(
            id="alt-top-3",
            timestamp=datetime.fromtimestamp(now.timestamp() - 7200, tz=timezone.utc).isoformat(),
            severity="stable",
            type="Optimization Active",
            title="BESS Arbitrage Schedule Confirmed",
            cause="Off-peak tariff absorption complete",
            recommendedAction="Battery holding reserve for evening arbitrage",
            whyExplanation="Saved estimated ₹22,400 during early morning charge cycles.",
            status="acknowledged",
        ),
    ]

    upcoming = [
        UpcomingForecast(horizon="1h",  renewableMW=round(renewable * 1.02, 1), demandMW=round(dem * 0.98, 1), expectedGapMW=round(renewable * 1.02 - dem * 0.98, 1), risk=risk_level(renewable - dem)),
        UpcomingForecast(horizon="6h",  renewableMW=185.0, demandMW=160.2, expectedGapMW=24.8,  risk="watch"),
        UpcomingForecast(horizon="24h", renewableMW=94.0,  demandMW=138.5, expectedGapMW=-44.5, risk="critical"),
        UpcomingForecast(horizon="7d",  renewableMW=132.0, demandMW=125.0, expectedGapMW=7.0,   risk="stable"),
    ]

    return OverviewDashboardData(
        lastUpdated=now.isoformat(),
        kpis=KPIs(
            renewableGenerationMW=round(renewable, 1),
            renewableDelta=12.4,
            totalDemandMW=round(dem, 1),
            demandDelta=-3.8,
            energyGapMW=round(gap, 1),
            evLoadMW=ev_mw,
            evLoadDelta=18.2,
            batterySoC=72,
            batteryDelta=-5.0,
            estimatedSavingsINR=148500,
            savingsDelta=14.6,
        ),
        timeSeries=ts,
        topAlerts=alerts,
        upcomingForecasts=upcoming,
        batteryMiniStatus=BatteryMiniStatus(
            currentSoC=72,
            action="Holding / Ready to Discharge",
            window="Discharge Window: 18:30 – 21:30 IST",
            targetSoC=25,
        ),
    )

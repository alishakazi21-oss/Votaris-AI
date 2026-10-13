"""
GridMind AI – Grid Intelligence Service.
Computes energy imbalance, risk timeline, and alert history.
"""

from __future__ import annotations

from datetime import datetime, timezone
from app.core.physics import solar_mw, wind_mw, demand_mw, risk_level, _loc
from app.models.schemas import (
    GridIntelligenceData, RiskTimelineEntry, HourlyImbalanceEntry, GridAlert
)


def generate_grid_intelligence(location_id: str) -> GridIntelligenceData:
    loc = _loc(location_id)
    risk_timeline = []
    hourly_imbalance = []

    for h in range(48):
        hour_mod = h % 24
        sol = solar_mw(hour_mod, loc["solarMW"])
        wnd = wind_mw(hour_mod, loc["windMW"])
        dem = demand_mw(hour_mod, loc["solarMW"] * 0.95)
        net = round(sol + wnd - dem, 2)
        rl = risk_level(net)

        if net < -25:
            reason = "Severe shortage predicted: demand peak exceeds renewable generation & base tie capacity"
        elif net < -5:
            reason = "Tight operating reserve margin (<8%)"
        elif net > 35:
            reason = "Potential renewable curtailment risk due to substation limit"
        else:
            reason = "Balanced supply and demand with adequate reserve margin"

        risk_timeline.append(RiskTimelineEntry(
            timestamp=f"+{h}h ({hour_mod:02d}:00)",
            net=net,
            risk=rl,
            reason=reason,
            solar=sol,
            wind=wnd,
            demand=dem,
        ))

        if h < 24:
            surplus = max(0.0, net)
            deficit = abs(min(0.0, net))
            hourly_imbalance.append(HourlyImbalanceEntry(
                hour=f"{hour_mod:02d}:00",
                surplus=round(surplus, 2),
                deficit=round(deficit, 2),
                net=net,
            ))

    now = datetime.now(timezone.utc)
    alert_history = [
        GridAlert(
            id="gi-alert-1",
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
            id="gi-alert-2",
            timestamp=datetime.fromtimestamp(now.timestamp() - 3600, tz=timezone.utc).isoformat(),
            severity="watch",
            type="Curtailment Risk",
            title="Solar Curtailment Risk at 13:00",
            cause="PV output forecast to exceed local substation absorption capacity by ~18 MW",
            recommendedAction="Pre-charge BESS to max SoC before 12:00 to absorb excess",
            whyExplanation="Avoids mandatory curtailment and maximises renewable utilisation.",
            status="acknowledged",
        ),
        GridAlert(
            id="gi-alert-3",
            timestamp=datetime.fromtimestamp(now.timestamp() - 7200, tz=timezone.utc).isoformat(),
            severity="stable",
            type="Forecast Uncertainty",
            title="Extended Wind Forecast Uncertainty > 48h",
            cause="NWP model ensemble spread of ±22 MW at +48h horizon",
            recommendedAction="Activate rolling 6h forecast refresh cycle",
            whyExplanation="Shorter refresh window reduces uncertainty compounding.",
            status="resolved",
        ),
    ]

    # Determine current risk from current hour
    now_h = datetime.now(timezone.utc).hour
    sol_now = solar_mw(now_h, loc["solarMW"])
    wnd_now = wind_mw(now_h, loc["windMW"])
    dem_now = demand_mw(now_h, loc["solarMW"] * 0.95)
    net_now = sol_now + wnd_now - dem_now
    current_risk = risk_level(net_now)

    critical_count = sum(1 for r in risk_timeline if r.risk == "critical")
    watch_count = sum(1 for r in risk_timeline if r.risk == "watch")

    summary = (
        f"48-hour risk scan for {loc['name']}: "
        f"{critical_count} critical window(s) and {watch_count} watch window(s) detected. "
        f"Peak deficit risk at evening demand hours (19:00–21:00). "
        f"BESS dispatch and EV throttling recommended."
    )

    return GridIntelligenceData(
        locationId=location_id,
        riskTimeline=risk_timeline,
        hourlyImbalance=hourly_imbalance,
        alertHistory=alert_history,
        currentRisk=current_risk,
        summaryText=summary,
    )

"""
GridMind AI – Microgrid Planner Service.
"""

from __future__ import annotations

from typing import List
from app.core.physics import solar_mw, wind_mw, demand_mw
from app.models.schemas import MicrogridConfig, MicrogridPlan, MicrogridHourlyPoint


def simulate_microgrid(config: MicrogridConfig) -> MicrogridPlan:
    soc = config.batterySoC
    cap_kwh = config.batteryCapacityKWh
    usable_kwh = cap_kwh * (soc - 0.10)  # 10% reserve floor
    hourly: List[MicrogridHourlyPoint] = []

    total_renewable_kwh = 0.0
    total_demand_kwh = 0.0
    critical_met_hours = 0

    # Scale solar/wind to kW (microgrid uses kW not MW)
    max_solar_kw = config.solarCapacityKW
    max_wind_kw  = config.windCapacityKW
    total_demand_kw = config.totalDemandKW
    critical_kw = config.criticalLoadKW

    for h in range(24):
        sol_kw  = solar_mw(h, max_solar_kw / 1000) * 1000
        wnd_kw  = wind_mw(h, max_wind_kw / 1000) * 1000
        dem_kw  = demand_mw(h, total_demand_kw / 1000) * 1000
        net_kw  = sol_kw + wnd_kw - dem_kw

        batt_action = "idle"
        if net_kw > 0 and soc < 0.95:
            charge_kwh = min(net_kw / 4, (0.95 - soc) * cap_kwh)
            soc = min(0.95, soc + charge_kwh / cap_kwh)
            batt_action = "charge"
        elif net_kw < 0 and soc > 0.10:
            discharge_kwh = min(abs(net_kw) / 4, (soc - 0.10) * cap_kwh * 0.92)
            soc = max(0.10, soc - discharge_kwh / cap_kwh)
            batt_action = "discharge"

        # Critical load met if renewable + battery covers it
        available = sol_kw + wnd_kw + (soc * cap_kwh * 0.25)  # rough
        critical_met = available >= critical_kw
        if critical_met:
            critical_met_hours += 1

        total_renewable_kwh += sol_kw + wnd_kw
        total_demand_kwh    += dem_kw

        hourly.append(MicrogridHourlyPoint(
            hour=h,
            solarKW=round(sol_kw, 1),
            windKW=round(wnd_kw, 1),
            totalRenewableKW=round(sol_kw + wnd_kw, 1),
            demandKW=round(dem_kw, 1),
            netKW=round(net_kw, 1),
            batteryAction=batt_action,
            socAfter=round(soc, 3),
            criticalLoadMet=critical_met,
        ))

    # Backup duration: usable battery / critical load
    backup_h = round(usable_kwh / max(0.01, critical_kw), 1)
    critical_cov_h = float(critical_met_hours)
    renewable_supply_pct = round(min(100.0, total_renewable_kwh / max(0.01, total_demand_kwh) * 100), 1)

    plan = []
    if renewable_supply_pct > 80:
        plan.append("Microgrid is largely self-sufficient. Operate in islanded mode during peak grid tariff hours.")
    else:
        plan.append("Renewable supply below 80%—maintain grid tie for backup import capability.")
    plan.append(f"BESS can sustain critical loads ({critical_kw} kW) for {backup_h} hours from current SoC.")
    plan.append("Pre-charge BESS to 90% SoC before 17:00 to cover evening deficit window.")
    if config.type in ("residential", "village"):
        plan.append("Prioritise lighting, water pump, and communication loads as critical during shortfalls.")

    risks = []
    if backup_h < 4:
        risks.append("Backup duration < 4 hours—insufficient for overnight critical operations. Increase battery capacity.")
    if renewable_supply_pct < 50:
        risks.append("Renewable supply < 50%—high grid dependency. Consider adding PV or wind capacity.")
    if not risks:
        risks.append("No critical risks identified under current configuration. Monitor battery SoC daily.")

    return MicrogridPlan(
        config=config,
        backupDurationHours=backup_h,
        criticalLoadCoverageHours=critical_cov_h,
        renewableSupplyPct=renewable_supply_pct,
        hourly=hourly,
        operatingPlan=plan,
        risks=risks,
    )

"""
GridMind AI – Scenario Simulator Service.
All values are computed from the user-supplied inputs—nothing is hardcoded.
"""

from __future__ import annotations

from typing import List
from app.core.physics import (
    solar_mw, wind_mw, demand_mw, ev_demand_kw,
    tariff_rate, tariff_band, risk_level, _loc
)
from app.models.schemas import (
    ScenarioInputs, ScenarioResult, ScenarioHourlyPoint
)
from app.core.config import settings


def simulate_scenario(inputs: ScenarioInputs) -> ScenarioResult:
    loc = _loc(inputs.locationId)
    cloud = inputs.cloudCoverPct / 100.0

    baseline_renewable = 0.0
    scenario_renewable = 0.0
    baseline_demand = 0.0
    scenario_demand = 0.0
    baseline_cost = 0.0
    scenario_cost = 0.0
    baseline_co2 = 0.0
    scenario_co2 = 0.0

    hourly: List[ScenarioHourlyPoint] = []
    soc = inputs.batterySoC
    cap_kwh = inputs.batteryCapacityKWh

    surplus_hours = 0
    deficit_hours = 0
    peak_demand = 0.0

    for h in range(24):
        # Baseline
        b_sol = solar_mw(h, loc["solarMW"])
        b_wnd = wind_mw(h, loc["windMW"])
        b_dem = demand_mw(h, loc["solarMW"] * 0.95)
        b_ev = ev_demand_kw(h, 3500) / 1000
        b_total_dem = b_dem + b_ev
        b_net = b_sol + b_wnd - b_total_dem

        # Scenario
        s_sol = solar_mw(h, loc["solarMW"] * (inputs.solarPct / 100), cloud)
        s_wnd = wind_mw(h, loc["windMW"] * (inputs.windPct / 100))
        s_dem = demand_mw(h, loc["solarMW"] * 0.95 * (inputs.demandPct / 100))
        s_ev = ev_demand_kw(h, 3500 * (inputs.evDemandPct / 100)) / 1000
        s_total_dem = s_dem + s_ev
        s_net = s_sol + s_wnd - s_total_dem

        # Battery dispatch
        rate = tariff_rate(h, settings.TARIFF_OFF_PEAK, settings.TARIFF_MID_PEAK, settings.TARIFF_ON_PEAK)
        batt_action = "idle"
        batt_power_kw = 0.0

        if cap_kwh > 0:
            if s_net > 2 and soc < 0.95:
                charge_kwh = min(cap_kwh * 0.125, (0.95 - soc) * cap_kwh)
                soc = min(0.95, soc + charge_kwh / cap_kwh)
                batt_action = "charge"
                batt_power_kw = round(charge_kwh * 4, 1)
            elif s_net < -2 and soc > 0.10:
                discharge_kwh = min(cap_kwh * 0.125, (soc - 0.10) * cap_kwh * 0.92)
                soc = max(0.10, soc - discharge_kwh / cap_kwh)
                batt_action = "discharge"
                batt_power_kw = round(discharge_kwh * 4, 1)

        effective_net = s_net + (batt_power_kw / 1000 if batt_action == "discharge" else -batt_power_kw / 1000 if batt_action == "charge" else 0)
        rl = risk_level(effective_net)

        # Accumulate
        baseline_renewable += b_sol + b_wnd
        scenario_renewable += s_sol + s_wnd
        baseline_demand    += b_total_dem
        scenario_demand    += s_total_dem

        # Cost (₹/kWh on demand side)
        emission = settings.GRID_EMISSION_FACTOR_KG_PER_KWH
        b_grid_import = max(0.0, b_net * -1)
        s_grid_import = max(0.0, effective_net * -1)
        baseline_cost += b_grid_import * rate
        scenario_cost += s_grid_import * rate
        baseline_co2  += b_grid_import * emission
        scenario_co2  += s_grid_import * emission

        if s_net > 0: surplus_hours += 1
        if s_net < 0: deficit_hours += 1
        peak_demand = max(peak_demand, s_total_dem)

        hourly.append(ScenarioHourlyPoint(
            hour=h,
            solarMW=round(s_sol, 2),
            windMW=round(s_wnd, 2),
            totalRenewableMW=round(s_sol + s_wnd, 2),
            demandMW=round(s_total_dem, 2),
            netBalanceMW=round(s_net, 2),
            risk=rl,
            batteryAction=batt_action,
            batteryPowerKW=batt_power_kw,
            socAfter=round(soc, 3),
        ))

    renewable_util = round(min(100.0, scenario_renewable / max(0.01, scenario_demand) * 100), 1)
    cost_savings = round(baseline_cost - scenario_cost, 0)
    co2_avoided = round(baseline_co2 - scenario_co2, 1)

    recs = []
    if inputs.solarPct < 80:
        recs.append("Solar generation reduced—consider cloud-cover mitigation (panel cleaning, tilt adjustment).")
    if inputs.evDemandPct > 120:
        recs.append("High EV demand—shift 30% of charging sessions to 10:00–14:00 solar surplus window.")
    if deficit_hours > 8:
        recs.append("Extended deficit periods—increase battery capacity or activate demand-response program.")
    if surplus_hours > 10:
        recs.append("Extended surplus hours—activate additional BESS charging to avoid curtailment.")
    if cost_savings < 0:
        recs.append("Scenario cost exceeds baseline—review tariff assumptions or reduce grid imports.")
    if not recs:
        recs.append("Scenario is within normal operating range. Monitor evening peak hours.")

    return ScenarioResult(
        inputs=inputs,
        baselineTotalRenewableMWh=round(baseline_renewable, 1),
        scenarioTotalRenewableMWh=round(scenario_renewable, 1),
        baselineTotalDemandMWh=round(baseline_demand, 1),
        scenarioTotalDemandMWh=round(scenario_demand, 1),
        baselineNetBalanceMWh=round(baseline_renewable - baseline_demand, 1),
        scenarioNetBalanceMWh=round(scenario_renewable - scenario_demand, 1),
        baselineCostINR=round(baseline_cost * 1000, 0),
        scenarioCostINR=round(scenario_cost * 1000, 0),
        costSavingsINR=round(cost_savings * 1000, 0),
        baselineCO2Kg=round(baseline_co2 * 1000, 1),
        scenarioCO2Kg=round(scenario_co2 * 1000, 1),
        co2AvoidedKg=round(co2_avoided * 1000, 1),
        renewableUtilizationPct=renewable_util,
        peakDemandMW=round(peak_demand, 2),
        surplusHours=surplus_hours,
        deficitHours=deficit_hours,
        hourly=hourly,
        recommendations=recs,
    )

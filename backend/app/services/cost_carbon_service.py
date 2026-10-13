"""
GridMind AI – Cost & Carbon Analytics Service.
"""

from __future__ import annotations

from app.core.physics import solar_mw, wind_mw, demand_mw, tariff_rate, tariff_band, _loc
from app.models.schemas import CostCarbonData, CostCarbonHourlyPoint
from app.core.config import settings


def generate_cost_carbon(location_id: str) -> CostCarbonData:
    loc = _loc(location_id)
    emission = settings.GRID_EMISSION_FACTOR_KG_PER_KWH
    hourly = []

    daily_baseline_cost = 0.0
    daily_optimized_cost = 0.0
    daily_baseline_co2 = 0.0
    daily_optimized_co2 = 0.0
    total_renewable_mwh = 0.0
    total_demand_mwh = 0.0

    for h in range(24):
        sol = solar_mw(h, loc["solarMW"])
        wnd = wind_mw(h, loc["windMW"])
        renewable = sol + wnd
        dem = demand_mw(h, loc["solarMW"] * 0.95)
        rate = tariff_rate(h, settings.TARIFF_OFF_PEAK, settings.TARIFF_MID_PEAK, settings.TARIFF_ON_PEAK)
        band = tariff_band(h)

        # Baseline: grid supplies all deficit
        grid_import_baseline = max(0.0, dem - renewable)
        baseline_cost_h = grid_import_baseline * rate  # ₹/MW·h → ₹/MWh × MWh
        baseline_co2_h = grid_import_baseline * emission

        # Optimised: BESS absorbs surplus, discharges at peak
        # Simplified: assume 20% reduction in grid imports through BESS
        grid_import_optimized = grid_import_baseline * 0.78
        optimized_cost_h = grid_import_optimized * rate
        optimized_co2_h = grid_import_optimized * emission

        daily_baseline_cost  += baseline_cost_h
        daily_optimized_cost += optimized_cost_h
        daily_baseline_co2   += baseline_co2_h
        daily_optimized_co2  += optimized_co2_h
        total_renewable_mwh  += renewable
        total_demand_mwh     += dem

        hourly.append(CostCarbonHourlyPoint(
            hour=f"{h:02d}:00",
            baselineCostINR=round(baseline_cost_h * 1000, 0),   # scale MW→kW factor
            optimizedCostINR=round(optimized_cost_h * 1000, 0),
            baselineCO2Kg=round(baseline_co2_h * 1000, 1),
            optimizedCO2Kg=round(optimized_co2_h * 1000, 1),
            tariffBand=band,
            renewableMWh=round(renewable, 2),
        ))

    savings = daily_baseline_cost - daily_optimized_cost
    savings_pct = round(savings / max(0.01, daily_baseline_cost) * 100, 1)
    co2_avoided = daily_baseline_co2 - daily_optimized_co2
    renewable_util = round(min(100.0, total_renewable_mwh / max(0.01, total_demand_mwh) * 100), 1)

    return CostCarbonData(
        locationId=location_id,
        dailyBaselineCostINR=round(daily_baseline_cost * 1000, 0),
        dailyOptimizedCostINR=round(daily_optimized_cost * 1000, 0),
        savingsINR=round(savings * 1000, 0),
        savingsPct=savings_pct,
        dailyBaselineCO2Kg=round(daily_baseline_co2 * 1000, 1),
        dailyOptimizedCO2Kg=round(daily_optimized_co2 * 1000, 1),
        co2AvoidedKg=round(co2_avoided * 1000, 1),
        renewableUtilizationPct=renewable_util,
        peakDemandMW=round(max(demand_mw(h, loc["solarMW"] * 0.95) for h in range(24)), 2),
        hourly=hourly,
        assumptions=[
            f"Grid emission factor: {emission} kg CO₂/kWh (India CEA average 2024)",
            f"Off-peak tariff: ₹{settings.TARIFF_OFF_PEAK}/kWh (22:00–06:00)",
            f"Mid-peak tariff: ₹{settings.TARIFF_MID_PEAK}/kWh (06:00–09:00, 13:00–17:00)",
            f"On-peak tariff: ₹{settings.TARIFF_ON_PEAK}/kWh (09:00–13:00, 17:00–22:00)",
            "BESS optimisation assumes 22% reduction in peak grid imports (heuristic estimate).",
            "All values are simulation estimates, not measured actuals.",
        ],
    )

"""
GridMind AI – Battery Optimization Service.
Implements a rule-based (heuristic) battery dispatch optimizer that:
  - Charges during renewable surplus & off-peak tariff hours
  - Discharges during peak-demand/deficit hours
  - Respects all physical constraints (SoC limits, power limits, efficiency)
  - Never charges and discharges simultaneously
"""

from __future__ import annotations

from typing import List
from app.core.physics import (
    solar_mw, wind_mw, demand_mw, tariff_rate, tariff_band, risk_level, _loc
)
from app.models.schemas import (
    BatteryConfig, BatteryOptimizationResult, BatteryScheduleRow
)


def optimize_battery(config: BatteryConfig) -> BatteryOptimizationResult:
    loc = _loc(config.locationId)
    cap_kwh = config.capacityKWh
    charge_kw = config.chargePowerKW
    discharge_kw = config.dischargePowerKW
    eff = config.roundTripEfficiency
    min_soc = config.minSoC
    max_soc = config.maxSoC

    soc = config.currentSoC
    schedule: List[BatteryScheduleRow] = []

    total_charged = 0.0
    total_discharged = 0.0
    savings_inr = 0.0
    peak_without: List[float] = []
    peak_with: List[float] = []

    for h in range(24):
        sol = solar_mw(h, loc["solarMW"])
        wnd = wind_mw(h, loc["windMW"])
        dem = demand_mw(h, loc["solarMW"] * 0.95)
        net = sol + wnd - dem
        rate = tariff_rate(h)
        band = tariff_band(h)

        peak_without.append(dem)

        # Decision logic
        action = "idle"
        power_kw = 0.0
        reason = "No beneficial action; system balanced."

        if net > 5 and soc < max_soc and band in ("off_peak", "mid_peak"):
            # Charge – renewable surplus available
            headroom_kwh = (max_soc - soc) * cap_kwh
            max_charge_kwh = min(charge_kw, headroom_kwh / eff)
            charge_kwh = min(max_charge_kwh, net * 1000 / 1000)  # net in MW → keep kW consistent
            charge_kwh = max(0.0, charge_kwh)
            soc_after = min(max_soc, soc + (charge_kwh * eff) / cap_kwh)
            if soc_after > soc:
                action = "charge"
                power_kw = round(charge_kw, 1)
                energy_kwh = round((soc_after - soc) * cap_kwh, 2)
                reason = f"Renewable surplus {net:.1f} MW + {band} tariff → charge to {soc_after*100:.0f}% SoC"
                total_charged += energy_kwh
                # Savings: cost of buying from grid vs. using stored energy later
                savings_inr += energy_kwh * (rate - config.dischargePowerKW / config.chargePowerKW)
                soc = soc_after

        elif net < -5 and soc > min_soc and band == "on_peak":
            # Discharge – deficit + peak tariff
            available_kwh = (soc - min_soc) * cap_kwh * eff
            discharge_kwh = min(discharge_kw / 1, available_kwh)
            soc_after = max(min_soc, soc - discharge_kwh / (cap_kwh * eff))
            if soc_after < soc:
                action = "discharge"
                power_kw = round(discharge_kw, 1)
                energy_kwh = round((soc - soc_after) * cap_kwh * eff, 2)
                reason = f"Deficit {abs(net):.1f} MW + on-peak tariff ₹{rate}/kWh → discharge {energy_kwh:.0f} kWh"
                total_discharged += energy_kwh
                savings_inr += energy_kwh * rate
                soc = soc_after

        elif soc < min_soc + 0.05 and band == "off_peak":
            # Emergency charge to min reserve
            charge_kwh = min(charge_kw * 0.5, ((min_soc + 0.1) - soc) * cap_kwh / eff)
            soc_after = min(max_soc, soc + charge_kwh * eff / cap_kwh)
            if soc_after > soc:
                action = "charge"
                power_kw = round(charge_kw * 0.5, 1)
                energy_kwh = round((soc_after - soc) * cap_kwh, 2)
                reason = f"SoC below minimum reserve threshold → emergency charge at half-power"
                total_charged += energy_kwh
                soc = soc_after

        demand_after_batt = dem - (power_kw / 1000 if action == "discharge" else 0)
        peak_with.append(demand_after_batt)

        schedule.append(BatteryScheduleRow(
            hour=h,
            timestamp=f"{h:02d}:00",
            action=action,
            powerKW=power_kw,
            socBefore=round(config.currentSoC if h == 0 else schedule[-1].socAfter if schedule else soc, 3) if action == "idle" else round(soc - ((power_kw / 1000 * eff) / cap_kwh if action == "charge" else 0), 3),
            socAfter=round(soc, 3),
            energyKWh=round(power_kw if action != "idle" else 0.0, 2),
            reason=reason,
            tariffBand=band,
            tariffRate=rate,
        ))

    # Fix socBefore fields (simpler post-processing)
    for i, row in enumerate(schedule):
        if i == 0:
            object.__setattr__(row, 'socBefore', config.currentSoC)
        else:
            object.__setattr__(row, 'socBefore', schedule[i - 1].socAfter)

    peak_reduction = max(0.0, max(peak_without) - max(peak_with))
    renewable_util = round(min(100.0, (total_charged / max(0.01, loc["solarMW"] * 0.5)) * 100), 1)

    return BatteryOptimizationResult(
        config=config,
        schedule=schedule,
        projectedSavingsINR=round(max(0, savings_inr * 180), 0),
        peakReductionMW=round(peak_reduction, 2),
        renewableUtilizationPct=renewable_util,
        totalChargedKWh=round(total_charged, 1),
        totalDischargedKWh=round(total_discharged, 1),
        finalSoC=round(soc, 3),
        optimizationNote=(
            "Rule-based heuristic dispatch: charge during surplus/off-peak, "
            "discharge during deficit/on-peak. Simultaneous charge/discharge prevented. "
            "For production use, replace with MILP solver (e.g., scipy.optimize or PuLP)."
        ),
    )

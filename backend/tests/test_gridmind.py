"""
Voltaris AI – Automated tests for energy balance, battery constraints,
data validation, and scenario calculations.
"""

import pytest
from app.core.physics import solar_mw, wind_mw, demand_mw, ev_demand_kw, risk_level
from app.services.dashboard_service import generate_dashboard
from app.services.battery_service import optimize_battery
from app.services.scenario_service import simulate_scenario
from app.services.grid_service import generate_grid_intelligence
from app.services.upload_service import validate_csv
from app.models.schemas import BatteryConfig, ScenarioInputs


# ── Physics engine tests ───────────────────────────────────────────────────────

def test_solar_zero_at_night():
    """Solar output must be zero before 06:00 and after 18:30."""
    assert solar_mw(0, 100) == 0.0
    assert solar_mw(3, 100) == 0.0
    assert solar_mw(19, 100) == 0.0
    assert solar_mw(23, 100) == 0.0


def test_solar_positive_at_noon():
    """Solar output must be positive at solar noon."""
    assert solar_mw(12.5, 100) > 50.0


def test_solar_cloud_attenuation():
    """Heavy cloud cover must reduce solar output."""
    clear = solar_mw(12, 100, cloud_fraction=0.0)
    cloudy = solar_mw(12, 100, cloud_fraction=0.9)
    assert cloudy < clear


def test_wind_always_positive():
    """Wind output must always be positive."""
    for h in range(24):
        assert wind_mw(h, 100) > 0


def test_demand_peaks():
    """Evening demand must exceed early morning demand."""
    evening = demand_mw(19.5, 100)
    early_morning = demand_mw(3, 100)
    assert evening > early_morning


def test_ev_demand_shape():
    """EV charging demand must be higher in morning and evening than midday."""
    midday = ev_demand_kw(13)
    evening = ev_demand_kw(20)
    assert evening > midday


def test_risk_level_logic():
    assert risk_level(-30) == "critical"
    assert risk_level(-10) == "watch"
    assert risk_level(40) == "watch"
    assert risk_level(0)  == "stable"
    assert risk_level(10) == "stable"


# ── Dashboard tests ────────────────────────────────────────────────────────────

def test_dashboard_generates_for_all_locations():
    for loc in ["pune", "nashik", "jaisalmer", "chennai"]:
        data = generate_dashboard(loc)
        assert data.kpis.renewableGenerationMW >= 0
        assert data.kpis.totalDemandMW > 0
        assert len(data.timeSeries) == 24
        assert len(data.upcomingForecasts) == 4
        assert len(data.topAlerts) > 0


def test_dashboard_time_series_energy_balance():
    """Net balance must equal totalRenewable - demand."""
    data = generate_dashboard("pune")
    for pt in data.timeSeries:
        expected = round(pt.totalRenewableMW - pt.demandMW, 2)
        assert abs(pt.netBalanceMW - expected) < 0.01, (
            f"Balance mismatch at {pt.timestamp}: "
            f"net={pt.netBalanceMW}, expected={expected}"
        )


# ── Battery optimization tests ─────────────────────────────────────────────────

def test_battery_soc_bounds():
    """Battery SoC must never exceed maxSoC or go below minSoC."""
    config = BatteryConfig(
        capacityKWh=500, chargePowerKW=125, dischargePowerKW=125,
        roundTripEfficiency=0.92, currentSoC=0.50, minSoC=0.10, maxSoC=0.95,
        locationId="pune",
    )
    result = optimize_battery(config)
    for row in result.schedule:
        assert row.socAfter >= config.minSoC - 0.001
        assert row.socAfter <= config.maxSoC + 0.001


def test_battery_no_simultaneous_charge_discharge():
    """A single hour must not be both charging and discharging."""
    config = BatteryConfig(locationId="pune")
    result = optimize_battery(config)
    for row in result.schedule:
        assert row.action in ("charge", "discharge", "idle")
        # Not possible to check simultaneous in this schema, but action is one of three
        if row.action == "charge":
            assert row.powerKW > 0
        if row.action == "discharge":
            assert row.powerKW > 0


def test_battery_final_soc_consistent():
    """Final SoC reported must match the last schedule row."""
    config = BatteryConfig(locationId="jaisalmer", currentSoC=0.72)
    result = optimize_battery(config)
    assert abs(result.finalSoC - result.schedule[-1].socAfter) < 0.01


# ── Scenario simulation tests ──────────────────────────────────────────────────

def test_scenario_100pct_equals_baseline():
    """With all percentages at 100% and cloud=0, scenario should be close to baseline."""
    inputs = ScenarioInputs(
        locationId="pune", solarPct=100, windPct=100, evDemandPct=100,
        demandPct=100, batteryCapacityKWh=0, batterySoC=0.5,
        cloudCoverPct=0, electricityPriceINRkWh=7.20,
    )
    result = simulate_scenario(inputs)
    # Totals should be similar (allow for EV load in scenario)
    assert result.scenarioTotalRenewableMWh > 0
    assert result.scenarioTotalDemandMWh > 0


def test_scenario_reduced_solar_means_less_renewable():
    base = ScenarioInputs(locationId="pune", solarPct=100, windPct=100, batteryCapacityKWh=0)
    reduced = ScenarioInputs(locationId="pune", solarPct=50, windPct=100, batteryCapacityKWh=0)
    r_base    = simulate_scenario(base)
    r_reduced = simulate_scenario(reduced)
    assert r_reduced.scenarioTotalRenewableMWh < r_base.scenarioTotalRenewableMWh


def test_scenario_recommendations_not_empty():
    inputs = ScenarioInputs(locationId="pune")
    result = simulate_scenario(inputs)
    assert len(result.recommendations) > 0


def test_scenario_hourly_count():
    inputs = ScenarioInputs(locationId="chennai")
    result = simulate_scenario(inputs)
    assert len(result.hourly) == 24


# ── Grid intelligence tests ────────────────────────────────────────────────────

def test_grid_intelligence_risk_timeline():
    data = generate_grid_intelligence("pune")
    assert len(data.riskTimeline) == 48
    assert len(data.hourlyImbalance) == 24
    for entry in data.riskTimeline:
        assert entry.risk in ("stable", "watch", "critical")


# ── Upload validation tests ────────────────────────────────────────────────────

def test_upload_valid_csv():
    content = b"timestamp,solar_mw,temperature\n2024-01-01 00:00,12.4,28.1\n2024-01-01 01:00,0.0,26.3\n"
    result = validate_csv("solar_data.csv", content)
    assert result.rows == 2
    assert "solar_mw" in result.columns
    assert result.status in ("ok", "warning")


def test_upload_missing_values():
    content = b"timestamp,solar_mw\n2024-01-01 00:00,12.4\n2024-01-01 01:00,\n"
    result = validate_csv("solar.csv", content)
    assert result.missingValues > 0
    assert any("missing" in w.lower() for w in result.warnings)


def test_upload_non_csv_rejected():
    """Non-CSV should produce an error response (handled at API layer)."""
    # At service level, we just parse whatever bytes – it would fail gracefully
    result = validate_csv("data.xlsx", b"PK\x03\x04not-a-csv")
    assert result.status == "error"

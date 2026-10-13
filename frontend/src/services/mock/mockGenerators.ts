// Realistic, deterministic physical generators for renewable energy systems

import {
  OverviewDashboardData,
  ForecastResult,
  GridIntelligenceData,
  BatteryConfig,
  BatteryOptimizationResult,
  BatteryScheduleRow,
  EvManagementData,
  ScenarioInputs,
  ScenarioResult,
  WeatherData,
  RegionalAsset,
  CostCarbonData,
  MicrogridPlan,
  ModelLabData,
  LocationId,
  ChatMessage,
} from '../../types';
import { LOCATIONS } from '../../store/uiStore';

/**
 * Generates a physically plausible solar output (MW) following a diurnal bell curve.
 * Solar peak occurs at ~12:30 IST; zero before 06:00 and after 18:30.
 */
export function getSolarMW(hour: number, maxSolarMW: number, cloudFraction = 0): number {
  if (hour < 6 || hour > 18.5) return 0;
  const solarNoon = 12.5;
  const daylightHalfWidth = 6.25;
  const normalizedHour = (hour - solarNoon) / daylightHalfWidth;
  const rawBell = Math.exp(-0.5 * Math.pow(normalizedHour * 2.8, 2));
  const cloudAttenuation = Math.max(0.15, 1 - cloudFraction * 0.85);
  return Math.max(0, parseFloat((rawBell * maxSolarMW * cloudAttenuation).toFixed(2)));
}

/**
 * Generates smooth wind generation (MW). Wind tends to pick up during late afternoon and overnight.
 */
export function getWindMW(hour: number, maxWindMW: number, seedOffset = 0): number {
  const t = (hour + seedOffset) * (Math.PI / 12);
  const baseline = 0.45;
  const diurnalWind = 0.25 * Math.sin(t - 1.2) + 0.1 * Math.cos(2 * t);
  const fraction = Math.min(0.95, Math.max(0.1, baseline + diurnalWind));
  return parseFloat((fraction * maxWindMW).toFixed(2));
}

/**
 * Generates daily demand (MW) with dual peaks characteristic of Indian cities:
 * Morning peak (09:00 - 11:30) and severe evening peak (18:30 - 21:30).
 */
export function getDemandMW(hour: number, baseMW: number): number {
  const morningPeak = 0.45 * Math.exp(-0.5 * Math.pow((hour - 10) / 1.8, 2));
  const eveningPeak = 0.65 * Math.exp(-0.5 * Math.pow((hour - 19.5) / 2.0, 2));
  const nightValley = 0.35 * (1 - Math.exp(-0.5 * Math.pow((hour - 3.5) / 2.5, 2)));
  const multiplier = 0.55 + morningPeak + eveningPeak - (1 - nightValley) * 0.15;
  return parseFloat((baseMW * multiplier).toFixed(2));
}

/**
 * Generates EV fleet charging demand (kW)
 */
export function getEvDemandKW(hour: number, scaleKW = 2500): number {
  const officeArrival = 0.35 * Math.exp(-0.5 * Math.pow((hour - 9.5) / 1.2, 2));
  const eveningHome = 0.85 * Math.exp(-0.5 * Math.pow((hour - 20) / 2.1, 2));
  const base = 0.08;
  return Math.round(scaleKW * (base + officeArrival + eveningHome));
}

// ----------------------------------------------------
// 1. Dashboard Generator
// ----------------------------------------------------
export function generateDashboardData(locationId: LocationId): OverviewDashboardData {
  const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const currentSolar = getSolarMW(currentHour, loc.installedSolarMW);
  const currentWind = getWindMW(currentHour, loc.installedWindMW);
  const currentRenewable = currentSolar + currentWind;
  const currentDemand = getDemandMW(currentHour, loc.installedSolarMW * 0.95);
  const currentEvMW = getEvDemandKW(currentHour, 3500) / 1000;
  const currentGap = currentRenewable - currentDemand;

  const timeSeries = [];
  for (let h = 0; h < 24; h++) {
    const timestamp = `${h.toString().padStart(2, '0')}:00`;
    const solar = getSolarMW(h, loc.installedSolarMW);
    const wind = getWindMW(h, loc.installedWindMW);
    const totalRenewable = parseFloat((solar + wind).toFixed(2));
    const demand = getDemandMW(h, loc.installedSolarMW * 0.95);
    const isForecast = h >= Math.floor(currentHour);

    const uncertainty = isForecast ? (h - Math.floor(currentHour) + 1) * 2.2 : 0;
    const predictedDemand = isForecast ? parseFloat((demand + (h % 3 === 0 ? 2 : -1.5)).toFixed(2)) : demand;

    timeSeries.push({
      timestamp,
      solarMW: solar,
      windMW: wind,
      totalRenewableMW: totalRenewable,
      demandMW: demand,
      predictedDemandMW: predictedDemand,
      upperConfidenceMW: parseFloat((predictedDemand + uncertainty).toFixed(2)),
      lowerConfidenceMW: Math.max(0, parseFloat((predictedDemand - uncertainty).toFixed(2))),
      netBalanceMW: parseFloat((totalRenewable - demand).toFixed(2)),
      isForecast,
    });
  }

  return {
    lastUpdated: now.toISOString(),
    kpis: {
      renewableGenerationMW: parseFloat(currentRenewable.toFixed(1)),
      renewableDelta: 12.4,
      totalDemandMW: parseFloat(currentDemand.toFixed(1)),
      demandDelta: -3.8,
      energyGapMW: parseFloat(currentGap.toFixed(1)),
      evLoadMW: parseFloat(currentEvMW.toFixed(2)),
      evLoadDelta: 18.2,
      batterySoC: 72,
      batteryDelta: -5.0,
      estimatedSavingsINR: 148500,
      savingsDelta: 14.6,
    },
    timeSeries,
    topAlerts: [
      {
        id: 'alt-top-1',
        timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
        severity: 'critical',
        type: 'Peak Deficit Risk',
        title: 'Projected 42 MW Gap during 19:00 Peak',
        cause: 'Solar generation sunset coincides with residential + EV demand ramp',
        recommendedAction: 'Schedule 35 MW BESS discharge and initiate 5 MW EV dynamic throttling',
        whyExplanation: 'Prevents reliance on expensive spot-market grid power during peak tariffs.',
        status: 'active',
      },
      {
        id: 'alt-top-2',
        timestamp: new Date(now.getTime() - 50 * 60000).toISOString(),
        severity: 'watch',
        type: 'Solar Headroom',
        title: 'Solar Inverter Headroom Bottleneck',
        cause: 'Substation line loading approaching 92% capacity at 13:00',
        recommendedAction: 'Divert excess generation into local battery storage',
        whyExplanation: 'Mitigates risk of statutory curtailment while maintaining stability.',
        status: 'active',
      },
      {
        id: 'alt-top-3',
        timestamp: new Date(now.getTime() - 120 * 60000).toISOString(),
        severity: 'stable',
        type: 'Optimization Active',
        title: 'BESS Arbitrage Schedule Confirmed',
        cause: 'Off-peak tariff absorption complete',
        recommendedAction: 'Battery holding reserve for evening arbitrage',
        whyExplanation: 'Saved estimated ₹22,400 during early morning charge cycles.',
        status: 'acknowledged',
      },
    ],
    upcomingForecasts: [
      { horizon: '1h', renewableMW: 142.5, demandMW: 118.0, expectedGapMW: 24.5, risk: 'stable' },
      { horizon: '6h', renewableMW: 185.0, demandMW: 160.2, expectedGapMW: 24.8, risk: 'watch' },
      { horizon: '24h', renewableMW: 94.0, demandMW: 138.5, expectedGapMW: -44.5, risk: 'critical' },
      { horizon: '7d', renewableMW: 132.0, demandMW: 125.0, expectedGapMW: 7.0, risk: 'stable' },
    ],
    batteryMiniStatus: {
      currentSoC: 72,
      action: 'Holding / Ready to Discharge',
      window: 'Discharge Window: 18:30 - 21:30 IST',
      targetSoC: 25,
    },
  };
}

// ----------------------------------------------------
// 2. AI Forecasting Generator
// ----------------------------------------------------
export function generateForecastResult(
  locationId: LocationId,
  source: 'solar' | 'wind' | 'ev' | 'demand' | 'combined',
  horizon: '1h' | '6h' | '24h' | '7d'
): ForecastResult {
  const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
  const steps = horizon === '1h' ? 12 : horizon === '6h' ? 24 : horizon === '24h' ? 24 : 28;
  const points = [];

  for (let i = 0; i < steps; i++) {
    const hour = horizon === '7d' ? (i * 6) % 24 : i % 24;
    const label = horizon === '1h' 
      ? `+${(i + 1) * 5}m` 
      : horizon === '6h' 
        ? `+${(i + 1) * 15}m` 
        : horizon === '7d' 
          ? `Day ${Math.floor(i / 4) + 1} ${hour}:00` 
          : `${hour.toString().padStart(2, '0')}:00`;

    let baseVal = 0;
    if (source === 'solar') baseVal = getSolarMW(hour, loc.installedSolarMW);
    else if (source === 'wind') baseVal = getWindMW(hour, loc.installedWindMW);
    else if (source === 'ev') baseVal = getEvDemandKW(hour, 4000) / 1000;
    else if (source === 'demand') baseVal = getDemandMW(hour, loc.installedSolarMW * 0.95);
    else baseVal = getSolarMW(hour, loc.installedSolarMW) + getWindMW(hour, loc.installedWindMW);

    const actual = i < Math.floor(steps * 0.4) ? parseFloat((baseVal + (Math.sin(i) * 1.5)).toFixed(2)) : null;
    const predicted = parseFloat(baseVal.toFixed(2));
    const margin = Math.max(1.8, baseVal * 0.12 + (i * 0.25));

    points.push({
      timestamp: label,
      actual: actual !== null ? Math.max(0, actual) : null,
      predicted: Math.max(0, predicted),
      upperInterval: parseFloat((predicted + margin).toFixed(2)),
      lowerInterval: Math.max(0, parseFloat((predicted - margin).toFixed(2))),
      error: actual !== null ? parseFloat(Math.abs(actual - predicted).toFixed(2)) : null,
    });
  }

  return {
    horizon,
    source,
    points,
    metrics: {
      mae: 2.14,
      rmse: 3.42,
      mape: 3.85,
      intervalCoverage: 91.8,
    },
    featureImportance: [
      { feature: 'Global Horizontal Irradiance (GHI)', importance: 88 },
      { feature: 'Historical 24h Autoregressive Demand', importance: 74 },
      { feature: 'Direct Normal Irradiance (DNI)', importance: 69 },
      { feature: 'Hub-Height Wind Speed (80m)', importance: 62 },
      { feature: 'Ambient Air Temperature', importance: 48 },
      { feature: 'Time of Day & Tariff Band', importance: 41 },
      { feature: 'Relative Humidity', importance: 27 },
    ],
    explainabilityNote:
      'High attention weight observed on 11:00-14:00 solar irradiance sensors. Model detected an incoming afternoon cloud bank via satellite albedo data, shifting predicted peak downward by 14.2 MW.',
  };
}

// ----------------------------------------------------
// 3. Grid Intelligence Generator
// ----------------------------------------------------
export function generateGridIntelligenceData(locationId: LocationId): GridIntelligenceData {
  const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
  const riskTimeline = [];
  const hourlyImbalance = [];

  for (let h = 0; h < 48; h++) {
    const hourMod = h % 24;
    const timestamp = `+${h}h (${hourMod.toString().padStart(2, '0')}:00)`;
    const solar = getSolarMW(hourMod, loc.installedSolarMW);
    const wind = getWindMW(hourMod, loc.installedWindMW);
    const demand = getDemandMW(hourMod, loc.installedSolarMW * 0.95);
    const net = parseFloat((solar + wind - demand).toFixed(2));

    let risk: 'stable' | 'watch' | 'critical' = 'stable';
    let reason = 'Balanced supply and demand with adequate reserve margin';

    if (net < -25) {
      risk = 'critical';
      reason = 'Severe shortage predicted: demand peak exceeds renewable generation & base tie capacity';
    } else if (net < -5 || net > 35) {
      risk = 'watch';
      reason = net < 0 ? 'Tight operating reserve margin (<8%)' : 'Potential renewable curtailment risk due to substation limit';
    }

    riskTimeline.push({
      hour: h,
      timestamp,
      risk,
      marginMW: parseFloat(Math.abs(net).toFixed(1)),
      shortageRisk: risk === 'critical' ? 84 : risk === 'watch' ? 38 : 5,
      reason,
    });

    if (h < 24) {
      hourlyImbalance.push({
        timestamp: `${hourMod.toString().padStart(2, '0')}:00`,
        balanceMW: net,
        solarMW: solar,
        windMW: wind,
        demandMW: demand,
        status: (net >= 0 ? (net > 20 ? 'surplus' : 'balanced') : 'deficit') as 'surplus' | 'deficit' | 'balanced',
      });
    }
  }

  return {
    riskTimeline,
    hourlyImbalance,
    thresholds: {
      shortageMW: -20,
      surplusMW: 30,
      reserveMarginPct: 15,
    },
    alertHistory: [
      {
        id: 'alert-g-1',
        timestamp: 'Today, 08:30 IST',
        severity: 'critical',
        type: 'Peak Deficit',
        title: 'Projected 42 MW Gap in Evening Peak',
        cause: 'Solar drop at sunset + 18:30 EV charging peak',
        recommendedAction: 'Trigger BESS 35 MW discharge, initiate flexible EV load shedding',
        whyExplanation: 'Grid tie line would otherwise exceed safe operating thermal limit by 18%.',
        status: 'active',
      },
      {
        id: 'alert-g-2',
        timestamp: 'Today, 06:15 IST',
        severity: 'watch',
        type: 'Solar Ramp Up',
        title: 'High Ramp Rate at 10:00 IST',
        cause: 'Rapid clear-sky solar irradiance increase (+18 MW/15min)',
        recommendedAction: 'Ramp down conventional thermal imports smoothly',
        whyExplanation: 'Maintains frequency within Indian Electricity Grid Code (49.90 - 50.05 Hz).',
        status: 'active',
      },
      {
        id: 'alert-g-3',
        timestamp: 'Yesterday, 21:00 IST',
        severity: 'stable',
        type: 'Frequency Recovery',
        title: 'Grid Frequency Restabilized to 50.01 Hz',
        cause: 'Successful battery primary frequency response dispatch',
        recommendedAction: 'Resume standard schedule',
        whyExplanation: 'Autonomous droop response completed within statutory 400ms.',
        status: 'resolved',
      },
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Peak Evening Demand Shifting (18:30 - 20:30)',
        priority: 'critical',
        action: 'Dispatch 35 MW BESS discharge at 18:30 and defer 4.5 MW commercial EV charging to 22:30',
        why: 'Prevents drawing from expensive peak tariff band (₹11.50/kWh) and eliminates unscheduled interchange penalties.',
        impactMW: 39.5,
      },
      {
        id: 'rec-2',
        title: 'Midday Solar Absorption (11:00 - 14:00)',
        priority: 'watch',
        action: 'Charge stationary storage at maximum 20 MW rate and offer discounted daytime EV charging',
        why: 'Avoids curtailing 48 MWh of clean solar power while lowering evening state grid dependency.',
        impactMW: 20.0,
      },
      {
        id: 'rec-3',
        title: 'Overnight Wind Firming (01:00 - 05:00)',
        priority: 'stable',
        action: 'Utilize 15 MW surplus nocturnal wind generation to top up municipal cold storage pumping',
        why: 'Monetizes low-cost nocturnal wind generation at baseline tariff.',
        impactMW: 15.0,
      },
    ],
  };
}

// ----------------------------------------------------
// 4. Battery Optimization Generator
// ----------------------------------------------------
export function generateBatteryOptimization(config: BatteryConfig): BatteryOptimizationResult {
  const schedule: BatteryScheduleRow[] = [];
  const timeSeries = [];

  let currentSoC = config.currentSoCPct;
  const maxCap = config.capacityKWh;
  const maxP = config.maxChargeKW;
  const eff = config.roundTripEfficiencyPct / 100;

  for (let h = 0; h < 24; h++) {
    const hourLabel = `${h.toString().padStart(2, '0')}:00`;
    let action: 'Charge' | 'Discharge' | 'Hold' = 'Hold';
    let powerKW = 0;
    let reason = 'Holding charge; tariffs in neutral band';
    let tariffINR = 5.8;

    // Time-of-use tariffs in Maharashtra/Gujarat:
    // Off-peak (22:00 - 06:00): ₹3.40/kWh
    // Normal (06:00 - 18:00, with solar dip at midday): ₹6.20/kWh
    // Peak (18:00 - 22:00): ₹11.50/kWh
    if (h >= 23 || h < 6) {
      tariffINR = 3.4;
      if (currentSoC < config.maxSoCPct - 5) {
        action = 'Charge';
        powerKW = Math.min(maxP, (config.maxSoCPct - currentSoC) * 0.01 * maxCap);
        reason = 'Low off-peak tariff (₹3.40/kWh); absorbing baseline power';
      }
    } else if (h >= 11 && h <= 14) {
      tariffINR = 4.2;
      if (currentSoC < config.maxSoCPct - 5) {
        action = 'Charge';
        powerKW = Math.min(maxP, (config.maxSoCPct - currentSoC) * 0.01 * maxCap * 0.7);
        reason = 'Absorbing local solar surplus to prevent substation curtailment';
      }
    } else if (h >= 18 && h <= 21) {
      tariffINR = 11.5;
      if (currentSoC > config.minSoCPct + 5) {
        action = 'Discharge';
        powerKW = Math.min(config.maxDischargeKW, (currentSoC - config.minSoCPct) * 0.01 * maxCap);
        reason = 'Peak tariff avoidance (₹11.50/kWh) and grid deficit support';
      }
    }

    if (action === 'Charge') {
      const addedKWh = powerKW * eff;
      currentSoC = Math.min(config.maxSoCPct, currentSoC + (addedKWh / maxCap) * 100);
    } else if (action === 'Discharge') {
      const drawnKWh = powerKW;
      currentSoC = Math.max(config.minSoCPct, currentSoC - (drawnKWh / maxCap) * 100);
    }

    currentSoC = parseFloat(currentSoC.toFixed(1));

    schedule.push({
      hour: hourLabel,
      action,
      powerKW: Math.round(powerKW),
      socAfterPct: currentSoC,
      reason,
      tariffINR,
    });

    timeSeries.push({
      timestamp: hourLabel,
      socPct: currentSoC,
      powerKW: action === 'Discharge' ? -powerKW : powerKW,
      reserveKW: Math.round(maxCap * (currentSoC / 100)),
    });
  }

  const baselineCost = 185000;
  const optimizedCost = 129500;

  return {
    config,
    schedule,
    timeSeries,
    validation: {
      valid: true,
      messages: [
        'No simultaneous charge and discharge detected.',
        `State of Charge remains strictly between ${config.minSoCPct}% and ${config.maxSoCPct}%.`,
        `C-rate within safe cell thermal limits (${(config.maxChargeKW / config.capacityKWh).toFixed(2)}C).`,
        `Round-trip thermodynamic efficiency modeled at ${config.roundTripEfficiencyPct}%.`,
      ],
    },
    savings: {
      baselineCostINR: baselineCost,
      optimizedCostINR: optimizedCost,
      netSavingsINR: baselineCost - optimizedCost,
      savingsPct: 30.0,
    },
  };
}

// ----------------------------------------------------
// 5. EV Management Generator
// ----------------------------------------------------
export function generateEvManagementData(locationId: LocationId): EvManagementData {
  const stations = [
    { id: 'ev-1', name: 'Pune Central Tech Park Hub', chargers: 24, activeSessions: 19, utilizationPct: 79, peakLoadKW: 720, status: 'Online' as const },
    { id: 'ev-2', name: 'Hinjawadi Phase 1 Fast Chargers', chargers: 32, activeSessions: 28, utilizationPct: 88, peakLoadKW: 1200, status: 'High Demand' as const },
    { id: 'ev-3', name: 'Shivajinagar Transit Depot', chargers: 16, activeSessions: 9, utilizationPct: 56, peakLoadKW: 480, status: 'Online' as const },
    { id: 'ev-4', name: 'Hadapsar Logistics Center', chargers: 20, activeSessions: 14, utilizationPct: 70, peakLoadKW: 600, status: 'Online' as const },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatmap = [];

  for (const day of days) {
    const isWeekend = day === 'Sat' || day === 'Sun';
    for (let h = 0; h < 24; h++) {
      let base = getEvDemandKW(h, 2800);
      if (isWeekend) base = base * 0.75 + (h >= 12 && h <= 18 ? 400 : 0);
      heatmap.push({
        day,
        hour: h,
        demandKW: Math.round(base),
      });
    }
  }

  const scheduleComparison = [];
  for (let h = 0; h < 24; h++) {
    const timestamp = `${h.toString().padStart(2, '0')}:00`;
    const originalKW = getEvDemandKW(h, 2800);
    // Shifted: lower during 18:00 - 21:00 peak, shifted to 11:00 - 14:00 (solar) & 23:00 - 04:00 (cheap)
    let shiftedKW = originalKW;
    if (h >= 18 && h <= 21) {
      shiftedKW = Math.round(originalKW * 0.58);
    } else if (h >= 11 && h <= 14) {
      shiftedKW = Math.round(originalKW * 1.42);
    } else if (h >= 23 || h < 4) {
      shiftedKW = Math.round(originalKW * 1.35);
    }

    scheduleComparison.push({
      timestamp,
      originalKW,
      shiftedKW,
      renewableAvailableKW: Math.round(getSolarMW(h, 50) * 1000 + getWindMW(h, 30) * 1000),
    });
  }

  return {
    stations,
    heatmap,
    scheduleComparison,
    metrics: {
      peakReductionPct: 34.2,
      renewableSharePct: 76.5,
      costSavingsINR: 42800,
    },
  };
}

// ----------------------------------------------------
// 6. Scenario Simulator Generator (Dynamic Calculation)
// ----------------------------------------------------
export function simulateScenarioCalculations(inputs: ScenarioInputs): ScenarioResult {
  const weatherMultipliers = {
    Clear: { solar: 1.05, wind: 0.95 },
    Cloudy: { solar: 0.45, wind: 1.15 },
    Storm: { solar: 0.2, wind: 1.45 },
    Heatwave: { solar: 1.1, wind: 0.75 },
  }[inputs.weatherPreset];

  const overlay = [];
  let totalBaseDemand = 0;
  let totalScenDemand = 0;
  let totalBaseGen = 0;
  let totalScenGen = 0;
  let shortageHours = 0;
  let surplusHours = 0;

  for (let h = 0; h < 24; h++) {
    const timestamp = `${h.toString().padStart(2, '0')}:00`;
    const baseDemand = getDemandMW(h, 120);
    const scenDemand = baseDemand * (inputs.baseDemandPct / 100) + (getEvDemandKW(h, 2000) / 1000) * (inputs.evDemandPct / 100);

    const baseSolar = getSolarMW(h, 100);
    const baseWind = getWindMW(h, 50);
    const baseGen = baseSolar + baseWind;

    const scenSolar = baseSolar * (inputs.solarPct / 100) * weatherMultipliers.solar;
    const scenWind = baseWind * (inputs.windPct / 100) * weatherMultipliers.wind;
    const scenGen = scenSolar + scenWind;

    totalBaseDemand += baseDemand;
    totalScenDemand += scenDemand;
    totalBaseGen += baseGen;
    totalScenGen += scenGen;

    const net = scenGen - scenDemand;
    if (net < -15) shortageHours++;
    if (net > 20) surplusHours++;

    overlay.push({
      timestamp,
      baselineDemandMW: parseFloat(baseDemand.toFixed(1)),
      scenarioDemandMW: parseFloat(scenDemand.toFixed(1)),
      baselineGenerationMW: parseFloat(baseGen.toFixed(1)),
      scenarioGenerationMW: parseFloat(scenGen.toFixed(1)),
    });
  }

  const baseCost = totalBaseDemand * 1000 * 6.5;
  const scenCost = (totalScenDemand * 1000 * 6.5 * inputs.priceMultiplier) - (totalScenGen * 1000 * 2.8);

  const baseline = {
    peakDemandMW: 148.2,
    totalCostINR: Math.round(baseCost),
    renewableUtilPct: 68.4,
    shortageHours: 4,
    surplusHours: 3,
  };

  const scenario = {
    peakDemandMW: parseFloat((148.2 * (inputs.baseDemandPct / 100)).toFixed(1)),
    totalCostINR: Math.round(Math.max(50000, scenCost)),
    renewableUtilPct: Math.min(98.5, parseFloat((68.4 * (totalScenGen / (totalBaseGen || 1))).toFixed(1))),
    shortageHours,
    surplusHours,
  };

  const costDelta = ((scenario.totalCostINR - baseline.totalCostINR) / baseline.totalCostINR) * 100;
  const peakDelta = ((scenario.peakDemandMW - baseline.peakDemandMW) / baseline.peakDemandMW) * 100;
  const renDelta = scenario.renewableUtilPct - baseline.renewableUtilPct;

  return {
    inputs,
    baseline,
    scenario,
    deltas: {
      costDeltaPct: parseFloat(costDelta.toFixed(1)),
      peakDeltaPct: parseFloat(peakDelta.toFixed(1)),
      renewableDeltaPct: parseFloat(renDelta.toFixed(1)),
      shortageDeltaHours: scenario.shortageHours - baseline.shortageHours,
      surplusDeltaHours: scenario.surplusHours - baseline.surplusHours,
    },
    overlay,
    recommendedActions: [
      `Weather impact (${inputs.weatherPreset}): solar yields adjusted by ${Math.round((weatherMultipliers.solar - 1) * 100)}%`,
      `Battery reserve (${inputs.batteryCapacityKWh} kWh): provides ${Math.round(inputs.batteryCapacityKWh / 180)} minutes of emergency islanding at current peak`,
      scenario.shortageHours > 0
        ? `Deficit warning: ${scenario.shortageHours} hours with net deficit detected. Dispatch demand-response to avoid penalty tariffs.`
        : 'Self-sufficient balance: zero shortage hours under current simulated conditions.',
      `Tariff sensitivity factor: ${inputs.priceMultiplier}x implies ₹${Math.abs(Math.round(scenCost - baseCost)).toLocaleString('en-IN')} net cost variance`,
    ],
  };
}

// ----------------------------------------------------
// 7. Weather Intelligence Generator
// ----------------------------------------------------
export function generateWeatherData(locationId: LocationId): WeatherData {
  const loc = LOCATIONS.find(l => l.id === locationId) || LOCATIONS[0];
  const hourly = [];

  for (let h = 0; h < 24; h++) {
    const timestamp = `${h.toString().padStart(2, '0')}:00`;
    const tempC = 24 + 10 * Math.sin(((h - 8) / 12) * Math.PI);
    const cloudCover = h >= 13 && h <= 16 ? 68 : 15 + (h % 5) * 4;
    const windSpeed = 16 + 8 * Math.sin((h / 24) * 2 * Math.PI);
    const irradiance = h >= 6 && h <= 18 ? Math.round(920 * Math.sin(((h - 6) / 12) * Math.PI) * (1 - cloudCover / 100)) : 0;
    const humidity = 45 + (100 - tempC * 2.2);

    hourly.push({
      timestamp,
      temperatureC: parseFloat(tempC.toFixed(1)),
      cloudCoverPct: Math.round(cloudCover),
      windSpeedKmh: parseFloat(windSpeed.toFixed(1)),
      irradianceWm2: Math.max(0, irradiance),
      humidityPct: Math.min(95, Math.max(25, Math.round(humidity))),
      expectedSolarMW: getSolarMW(h, loc.installedSolarMW, cloudCover / 100),
      expectedWindMW: getWindMW(h, loc.installedWindMW),
    });
  }

  return {
    hourly,
    solarImpactPct: -14.2,
    windImpactPct: +8.6,
    alerts: [
      'Afternoon Convective Cloud Cover (13:30 - 16:00 IST): Anticipate 22 MW solar dip.',
      'Favorable Late Evening Wind Gradient (19:00 - 02:00 IST): Wind yield +12% above seasonal average.',
      'Surface temperature index above 36°C at 14:00 IST: PV panel thermal efficiency derated by 3.2%.',
    ],
    isDemoWeather: true,
  };
}

// ----------------------------------------------------
// 8. Regional Energy Map Generator
// ----------------------------------------------------
export function generateRegionalAssets(): RegionalAsset[] {
  return [
    {
      id: 'reg-solar-1',
      name: 'Bhadla Phase IV Solar Complex',
      type: 'solar',
      lat: 27.5385,
      lng: 71.9167,
      capacityMW: 450,
      currentOutputMW: 382.4,
      risk: 'stable',
      locationName: 'Jaisalmer Region, Rajasthan',
      details: { forecast1hMW: 375, forecast24hMW: 3200, efficiencyPct: 96.4, status: 'Nominal Generation' },
    },
    {
      id: 'reg-wind-1',
      name: 'Muppandal Wind Super-Cluster',
      type: 'wind',
      lat: 8.2541,
      lng: 77.5458,
      capacityMW: 310,
      currentOutputMW: 245.0,
      risk: 'stable',
      locationName: 'Kanyakumari / Tamil Nadu Corridor',
      details: { forecast1hMW: 252, forecast24hMW: 4200, efficiencyPct: 94.1, status: 'High Wind Velocity' },
    },
    {
      id: 'reg-solar-2',
      name: 'Nashik Agro-Solar Microgrid Cluster',
      type: 'solar',
      lat: 19.9975,
      lng: 73.7898,
      capacityMW: 85,
      currentOutputMW: 52.1,
      risk: 'watch',
      locationName: 'Nashik Valley, Maharashtra',
      details: { forecast1hMW: 48, forecast24hMW: 480, efficiencyPct: 82.5, status: 'Partial Cloud Cover' },
    },
    {
      id: 'reg-ev-1',
      name: 'Pune Hinjawadi EV Mega Hub',
      type: 'ev',
      lat: 18.5913,
      lng: 73.7389,
      capacityMW: 12,
      currentOutputMW: 9.8,
      risk: 'critical',
      locationName: 'Pune IT Park, Maharashtra',
      details: { forecast1hMW: 11.2, forecast24hMW: 95, efficiencyPct: 89.2, status: 'Peak Congestion Warning' },
    },
    {
      id: 'reg-demand-1',
      name: 'Chennai Industrial Corridor Grid Zone',
      type: 'demand',
      lat: 13.0827,
      lng: 80.2707,
      capacityMW: 280,
      currentOutputMW: 265.4,
      risk: 'watch',
      locationName: 'Chennai North, Tamil Nadu',
      details: { forecast1hMW: 270, forecast24hMW: 5800, efficiencyPct: 91.0, status: 'High Industrial Base Load' },
    },
  ];
}

// ----------------------------------------------------
// 9. Cost & Carbon Analytics Generator
// ----------------------------------------------------
export function generateCostCarbonData(locationId: LocationId): CostCarbonData {
  const hourlyBreakdown = [];
  let cumSavings = 0;

  for (let h = 0; h < 24; h++) {
    const timestamp = `${h.toString().padStart(2, '0')}:00`;
    let tariff = 5.8;
    if (h >= 23 || h < 6) tariff = 3.4;
    else if (h >= 18 && h <= 21) tariff = 11.5;

    const baseCost = getDemandMW(h, 100) * 1000 * tariff;
    const optimizedCost = baseCost * (h >= 18 && h <= 21 ? 0.68 : h >= 11 && h <= 14 ? 0.82 : 0.95);
    const hourlySavings = baseCost - optimizedCost;
    cumSavings += hourlySavings;

    hourlyBreakdown.push({
      timestamp,
      baselineCostINR: Math.round(baseCost),
      optimizedCostINR: Math.round(optimizedCost),
      tariffINRPkwh: tariff,
      carbonIntensityGpkwh: Math.round(710 - getSolarMW(h, 80) * 3.8 - getWindMW(h, 40) * 2.5),
      cumulativeSavingsINR: Math.round(cumSavings),
    });
  }

  return {
    kpis: {
      energyCostINR: 1845000,
      costSavingsINR: 492000,
      renewableUtilPct: 78.4,
      co2AvoidedTons: 142.8,
      peakDemandMW: 138.4,
    },
    hourlyBreakdown,
    tariffs: [
      { band: 'Off-Peak (Night)', hours: '22:00 - 06:00 IST', rateINRPkwh: 3.4 },
      { band: 'Normal Daytime', hours: '06:00 - 18:00 IST', rateINRPkwh: 5.8 },
      { band: 'Evening Peak (ToD Surcharge)', hours: '18:00 - 22:00 IST', rateINRPkwh: 11.5 },
    ],
    emissionFactorGpkwh: 710,
  };
}

// ----------------------------------------------------
// 10. Microgrid Planner Generator (Dynamic)
// ----------------------------------------------------
export function generateMicrogridSimulation(plan: Partial<MicrogridPlan>): MicrogridPlan {
  const facilityType = plan.facilityType || 'Campus';
  const solarKW = plan.solarKW ?? 250;
  const windKW = plan.windKW ?? 50;
  const batteryKWh = plan.batteryKWh ?? 400;

  const criticalLoads = plan.criticalLoads && plan.criticalLoads.length > 0
    ? plan.criticalLoads
    : [
        { id: 'cl-1', name: 'ICU / Hospital / Server Room', powerKW: 45, priority: 'Critical (Tier 1)' as const },
        { id: 'cl-2', name: 'Water Pumping & Fire Safety', powerKW: 30, priority: 'Essential (Tier 2)' as const },
        { id: 'cl-3', name: 'HVAC & General Lighting', powerKW: 60, priority: 'Flexible (Tier 3)' as const },
      ];

  const totalCriticalPower = criticalLoads
    .filter(l => l.priority.includes('Tier 1') || l.priority.includes('Tier 2'))
    .reduce((sum, l) => sum + l.powerKW, 0);

  // Backup hours = available battery energy / critical power
  const usableBatteryKWh = batteryKWh * 0.85; // 85% depth of discharge
  const backupDurationHours = parseFloat((usableBatteryKWh / (totalCriticalPower || 1)).toFixed(1));

  const batteryReserveCurve = [];
  const supplyDemand = [];
  let currentReserveKWh = usableBatteryKWh;

  for (let h = 0; h < 24; h++) {
    const supply = getSolarMW(h, solarKW / 1000) * 1000 + getWindMW(h, windKW / 1000) * 1000;
    const demand = totalCriticalPower + (h >= 9 && h <= 18 ? 55 : 15);
    const net = supply - demand;

    if (net > 0) {
      currentReserveKWh = Math.min(batteryKWh, currentReserveKWh + net * 0.88);
    } else {
      currentReserveKWh = Math.max(0, currentReserveKWh + net);
    }

    batteryReserveCurve.push({
      hour: h,
      reserveKWh: Math.round(currentReserveKWh),
      socPct: Math.round((currentReserveKWh / batteryKWh) * 100),
    });

    supplyDemand.push({
      hour: h,
      supplyKW: Math.round(supply),
      demandKW: Math.round(demand),
      gapKW: Math.round(net),
    });
  }

  return {
    id: plan.id || 'plan-1',
    name: plan.name || `${facilityType} Resilience Blueprint`,
    facilityType,
    solarKW,
    windKW,
    batteryKWh,
    criticalLoads,
    results: {
      backupDurationHours,
      solarGenerationKWh: Math.round(solarKW * 4.6),
      batteryReserveCurve,
      supplyDemand,
      loadStatus: criticalLoads.map(cl => ({
        loadName: cl.name,
        tier: cl.priority,
        poweredInShortage: !cl.priority.includes('Tier 3'),
        rationingHour: cl.priority.includes('Tier 3') ? 18 : undefined,
      })),
      suggestedOperatingPlan: [
        `Islanding Autonomy: System sustains Tier 1 & Tier 2 critical loads for up to ${backupDurationHours} consecutive hours during a blackout.`,
        'Tier 3 HVAC load automatically sheds at SoC threshold < 35% to protect essential circuits.',
        `Midday solar generates ~${Math.round(solarKW * 4.6)} kWh/day, sufficient to fully replenish the ${batteryKWh} kWh battery pack in clear weather.`,
      ],
    },
  };
}

// ----------------------------------------------------
// 11. AI Energy Assistant Generator
// ----------------------------------------------------
export function generateAssistantReply(userQuery: string): ChatMessage {
  const queryLower = userQuery.toLowerCase();
  const id = `msg-${Date.now()}`;
  const now = new Date();

  if (queryLower.includes('gap') || queryLower.includes('shortage') || queryLower.includes('evening') || queryLower.includes('deficit')) {
    return {
      id,
      role: 'assistant',
      content:
        'Between **18:30 and 21:00 IST**, Voltaris predicts a net energy deficit of **42.4 MW** at Pune Hub. This is triggered by sunset solar tapering coinciding with a 38% ramp in residential and EV charging loads.',
      timestamp: now.toISOString(),
      recommendation: {
        title: 'Dispatch BESS Peak Shaving & Throttle Commercial EV Charging',
        impact: 'Eliminates 38 MW grid shortfall, saving estimated ₹1,82,000 in unscheduled interchange penalties.',
        actionLabel: 'Preview Dispatch Order',
      },
      miniChartData: [
        { label: '17:00', value: 12 },
        { label: '18:00', value: -8 },
        { label: '19:00', value: -42 },
        { label: '20:00', value: -35 },
        { label: '21:00', value: -14 },
        { label: '22:00', value: 4 },
      ],
    };
  }

  if (queryLower.includes('battery') || queryLower.includes('soc') || queryLower.includes('storage')) {
    return {
      id,
      role: 'assistant',
      content:
        'The stationary BESS is currently at **72% State of Charge (SoC)**. Based on the Time-of-Use tariff structure, the optimization engine recommends holding reserve until 18:30 IST, then discharging at 35 MW until SoC reaches the 20% statutory reserve margin.',
      timestamp: now.toISOString(),
      recommendation: {
        title: 'Hold 72% SoC for 18:30 ToD Peak Arbitrage',
        impact: 'Avoids purchasing energy at ₹11.50/kWh peak tariff.',
        actionLabel: 'Apply Battery Schedule',
      },
    };
  }

  if (queryLower.includes('weather') || queryLower.includes('solar') || queryLower.includes('cloud')) {
    return {
      id,
      role: 'assistant',
      content:
        'Satellite imagery and numerical weather prediction flag an incoming cloud front over Pune between **13:00 and 15:30 IST**, reducing Global Horizontal Irradiance (GHI) by 46%. Anticipate a 18.5 MW reduction compared to clear-sky potential.',
      timestamp: now.toISOString(),
      recommendation: {
        title: 'Pre-charge battery storage before 13:00 cloud onset',
        impact: 'Stores 24 MWh clean solar prior to irradiance drop.',
        actionLabel: 'Adjust Pre-Charge Schedule',
      },
    };
  }

  return {
    id,
    role: 'assistant',
    content:
      `I analyzed your query: "${userQuery}". Voltaris's real-time predictive models indicate stable grid frequency (50.01 Hz) and 78.4% renewable penetration. Our 24-hour horizon indicates ample midday solar with an actionable evening peak at 19:00 IST.`,
    timestamp: now.toISOString(),
    recommendation: {
      title: 'Maintain Active AI Optimization Mode',
      impact: 'Automated dispatch continues managing battery & EV charging within statutory tolerances.',
      actionLabel: 'View Detailed Telemetry',
    },
  };
}

// ----------------------------------------------------
// 12. Model Lab Generator
// ----------------------------------------------------
export function generateModelLabData(): ModelLabData {
  const models = [
    { modelName: 'Dual-LSTM + Multi-Head Attention', category: 'Deep Learning', mae: 1.84, rmse: 2.91, mape: 3.12, trainingTimeSec: 284, isBest: true, architecture: 'Bidirectional LSTM (2x128) + 4-Head Self-Attention + Dense' },
    { modelName: 'Single-LSTM Recurrent Baseline', category: 'Deep Learning', mae: 2.65, rmse: 4.12, mape: 4.88, trainingTimeSec: 142, isBest: false, architecture: 'Unidirectional LSTM (128) + Dense' },
    { modelName: 'XGBoost Gradient Boosted Trees', category: 'Machine Learning', mae: 2.21, rmse: 3.58, mape: 3.95, trainingTimeSec: 18, isBest: false, architecture: '150 Trees, max_depth=6, eta=0.08' },
    { modelName: 'Persistence / Naive Baseline', category: 'Benchmark', mae: 6.82, rmse: 9.45, mape: 12.4, trainingTimeSec: 1, isBest: false, architecture: 'y(t) = y(t-24h)' },
  ];

  const testSetPredictions = [];
  const residuals = [];

  for (let i = 0; i < 24; i++) {
    const timestamp = `${i.toString().padStart(2, '0')}:00`;
    const actual = getSolarMW(i, 100);
    const dual = parseFloat((actual + (Math.sin(i * 1.5) * 1.2)).toFixed(2));
    const xgb = parseFloat((actual + (Math.cos(i) * 2.2)).toFixed(2));
    const lstm = parseFloat((actual + (Math.sin(i * 0.8) * 3.1)).toFixed(2));
    const pers = parseFloat((actual + (Math.sin(i * 2.1) * 6.5)).toFixed(2));

    testSetPredictions.push({
      step: i,
      timestamp,
      actual,
      dualLstmAttention: Math.max(0, dual),
      xgboost: Math.max(0, xgb),
      lstm: Math.max(0, lstm),
      persistence: Math.max(0, pers),
    });

    const err = parseFloat((dual - actual).toFixed(2));
    residuals.push({ timestamp, error: err });
  }

  const errorDistribution = [
    { bucket: '< -3 MW', count: 4 },
    { bucket: '-3 to -2 MW', count: 12 },
    { bucket: '-2 to -1 MW', count: 28 },
    { bucket: '-1 to 0 MW', count: 64 },
    { bucket: '0 to +1 MW', count: 71 },
    { bucket: '+1 to +2 MW', count: 32 },
    { bucket: '+2 to +3 MW', count: 14 },
    { bucket: '> +3 MW', count: 5 },
  ];

  return {
    models,
    testSetPredictions,
    residuals,
    errorDistribution,
  };
}

// Core domain types for GridMind AI

export type PowerUnit = 'MW' | 'kW';
export type LocationId = 'pune' | 'nashik' | 'jaisalmer' | 'chennai' | 'custom';
export type DateRangePreset = 'today' | '24h' | '7d' | '30d' | 'custom';
export type DataMode = 'demo' | 'live';
export type RiskLevel = 'stable' | 'watch' | 'critical';
export type ForecastHorizon = '1h' | '6h' | '24h' | '7d';
export type EnergySource = 'solar' | 'wind' | 'ev' | 'demand' | 'combined';

export interface LocationOption {
  id: LocationId;
  name: string;
  state: string;
  coordinates: [number, number];
  installedSolarMW: number;
  installedWindMW: number;
}

export interface OverviewDashboardData {
  lastUpdated: string;
  kpis: {
    renewableGenerationMW: number;
    renewableDelta: number;
    totalDemandMW: number;
    demandDelta: number;
    energyGapMW: number; // positive = surplus, negative = deficit
    evLoadMW: number;
    evLoadDelta: number;
    batterySoC: number;
    batteryDelta: number;
    estimatedSavingsINR: number;
    savingsDelta: number;
  };
  timeSeries: {
    timestamp: string;
    solarMW: number;
    windMW: number;
    totalRenewableMW: number;
    demandMW: number;
    predictedDemandMW: number;
    upperConfidenceMW: number;
    lowerConfidenceMW: number;
    netBalanceMW: number;
    isForecast: boolean;
  }[];
  topAlerts: GridAlert[];
  upcomingForecasts: {
    horizon: ForecastHorizon;
    renewableMW: number;
    demandMW: number;
    expectedGapMW: number;
    risk: RiskLevel;
  }[];
  batteryMiniStatus: {
    currentSoC: number;
    action: string;
    window: string;
    targetSoC: number;
  };
}

export interface GridAlert {
  id: string;
  timestamp: string;
  severity: RiskLevel;
  type: string;
  title: string;
  cause: string;
  recommendedAction: string;
  whyExplanation: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface ForecastResult {
  horizon: ForecastHorizon;
  source: EnergySource;
  points: {
    timestamp: string;
    actual: number | null;
    predicted: number;
    upperInterval: number;
    lowerInterval: number;
    error: number | null;
  }[];
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
    intervalCoverage: number; // e.g., 91.4%
  };
  reliabilityWarning?: string;
  featureImportance: {
    feature: string;
    importance: number; // 0 - 100
  }[];
  explainabilityNote: string;
}

export interface GridIntelligenceData {
  riskTimeline: {
    hour: number;
    timestamp: string;
    risk: RiskLevel;
    marginMW: number;
    shortageRisk: number; // %
    reason: string;
  }[];
  hourlyImbalance: {
    timestamp: string;
    balanceMW: number;
    solarMW: number;
    windMW: number;
    demandMW: number;
    status: 'surplus' | 'deficit' | 'balanced';
  }[];
  thresholds: {
    shortageMW: number;
    surplusMW: number;
    reserveMarginPct: number;
  };
  alertHistory: GridAlert[];
  recommendations: {
    id: string;
    title: string;
    priority: RiskLevel;
    action: string;
    why: string;
    impactMW: number;
  }[];
}

export interface BatteryConfig {
  capacityKWh: number;
  maxChargeKW: number;
  maxDischargeKW: number;
  roundTripEfficiencyPct: number;
  minSoCPct: number;
  maxSoCPct: number;
  currentSoCPct: number;
}

export interface BatteryScheduleRow {
  hour: string;
  action: 'Charge' | 'Discharge' | 'Hold';
  powerKW: number;
  socAfterPct: number;
  reason: string;
  tariffINR: number;
}

export interface BatteryOptimizationResult {
  config: BatteryConfig;
  schedule: BatteryScheduleRow[];
  timeSeries: {
    timestamp: string;
    socPct: number;
    powerKW: number;
    reserveKW: number;
  }[];
  validation: {
    valid: boolean;
    messages: string[];
  };
  savings: {
    baselineCostINR: number;
    optimizedCostINR: number;
    netSavingsINR: number;
    savingsPct: number;
  };
}

export interface EvStation {
  id: string;
  name: string;
  chargers: number;
  activeSessions: number;
  utilizationPct: number;
  peakLoadKW: number;
  status: 'Online' | 'High Demand' | 'Maintenance';
}

export interface EvManagementData {
  stations: EvStation[];
  heatmap: {
    day: string; // Mon, Tue...
    hour: number; // 0..23
    demandKW: number;
  }[];
  scheduleComparison: {
    timestamp: string;
    originalKW: number;
    shiftedKW: number;
    renewableAvailableKW: number;
  }[];
  metrics: {
    peakReductionPct: number;
    renewableSharePct: number;
    costSavingsINR: number;
  };
}

export interface ScenarioInputs {
  solarPct: number;
  windPct: number;
  evDemandPct: number;
  baseDemandPct: number;
  batteryCapacityKWh: number;
  batteryCurrentSoC: number;
  weatherPreset: 'Clear' | 'Cloudy' | 'Storm' | 'Heatwave';
  priceMultiplier: number;
}

export interface ScenarioResult {
  inputs: ScenarioInputs;
  baseline: {
    peakDemandMW: number;
    totalCostINR: number;
    renewableUtilPct: number;
    shortageHours: number;
    surplusHours: number;
  };
  scenario: {
    peakDemandMW: number;
    totalCostINR: number;
    renewableUtilPct: number;
    shortageHours: number;
    surplusHours: number;
  };
  deltas: {
    costDeltaPct: number;
    peakDeltaPct: number;
    renewableDeltaPct: number;
    shortageDeltaHours: number;
    surplusDeltaHours: number;
  };
  overlay: {
    timestamp: string;
    baselineDemandMW: number;
    scenarioDemandMW: number;
    baselineGenerationMW: number;
    scenarioGenerationMW: number;
  }[];
  recommendedActions: string[];
}

export interface WeatherData {
  hourly: {
    timestamp: string;
    temperatureC: number;
    cloudCoverPct: number;
    windSpeedKmh: number;
    irradianceWm2: number;
    humidityPct: number;
    expectedSolarMW: number;
    expectedWindMW: number;
  }[];
  solarImpactPct: number;
  windImpactPct: number;
  alerts: string[];
  isDemoWeather: boolean;
}

export interface RegionalAsset {
  id: string;
  name: string;
  type: 'solar' | 'wind' | 'ev' | 'demand';
  lat: number;
  lng: number;
  capacityMW: number;
  currentOutputMW: number;
  risk: RiskLevel;
  locationName: string;
  details: {
    forecast1hMW: number;
    forecast24hMW: number;
    efficiencyPct: number;
    status: string;
  };
}

export interface CostCarbonData {
  kpis: {
    energyCostINR: number;
    costSavingsINR: number;
    renewableUtilPct: number;
    co2AvoidedTons: number;
    peakDemandMW: number;
  };
  hourlyBreakdown: {
    timestamp: string;
    baselineCostINR: number;
    optimizedCostINR: number;
    tariffINRPkwh: number;
    carbonIntensityGpkwh: number;
    cumulativeSavingsINR: number;
  }[];
  tariffs: {
    band: string;
    hours: string;
    rateINRPkwh: number;
  }[];
  emissionFactorGpkwh: number;
}

export interface CriticalLoad {
  id: string;
  name: string;
  powerKW: number;
  priority: 'Critical (Tier 1)' | 'Essential (Tier 2)' | 'Flexible (Tier 3)';
}

export interface MicrogridPlan {
  id: string;
  name: string;
  facilityType: 'Campus' | 'Industrial' | 'Residential society' | 'Village';
  solarKW: number;
  windKW: number;
  batteryKWh: number;
  criticalLoads: CriticalLoad[];
  results: {
    backupDurationHours: number;
    solarGenerationKWh: number;
    batteryReserveCurve: {
      hour: number;
      reserveKWh: number;
      socPct: number;
    }[];
    supplyDemand: {
      hour: number;
      supplyKW: number;
      demandKW: number;
      gapKW: number;
    }[];
    loadStatus: {
      loadName: string;
      tier: string;
      poweredInShortage: boolean;
      rationingHour?: number;
    }[];
    suggestedOperatingPlan: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  recommendation?: {
    title: string;
    impact: string;
    actionLabel: string;
  };
  miniChartData?: { label: string; value: number }[];
}

export interface ModelComparisonRow {
  modelName: string;
  category: string;
  mae: number;
  rmse: number;
  mape: number;
  trainingTimeSec: number;
  isBest: boolean;
  architecture: string;
}

export interface ModelLabData {
  models: ModelComparisonRow[];
  testSetPredictions: {
    step: number;
    timestamp: string;
    actual: number;
    persistence: number;
    xgboost: number;
    lstm: number;
    dualLstmAttention: number;
  }[];
  residuals: {
    timestamp: string;
    error: number;
  }[];
  errorDistribution: {
    bucket: string;
    count: number;
  }[];
}

"""
GridMind AI – Pydantic schemas for all API request/response objects.
These mirror the TypeScript types/index.ts definitions in the frontend.
"""

from __future__ import annotations

from typing import List, Literal, Optional, Any
from pydantic import BaseModel, Field


# ── Enums / Literals ─────────────────────────────────────────────────────────
LocationId   = Literal["pune", "nashik", "jaisalmer", "chennai", "custom"]
ForecastHorizon = Literal["1h", "6h", "24h", "7d"]
EnergySource = Literal["solar", "wind", "ev", "demand", "combined"]
RiskLevel    = Literal["stable", "watch", "critical"]
DataMode     = Literal["demo", "live"]


# ── Shared leaf objects ───────────────────────────────────────────────────────
class GridAlert(BaseModel):
    id: str
    timestamp: str
    severity: RiskLevel
    type: str
    title: str
    cause: str
    recommendedAction: str
    whyExplanation: str
    status: Literal["active", "acknowledged", "resolved"]


class KPIs(BaseModel):
    renewableGenerationMW: float
    renewableDelta: float
    totalDemandMW: float
    demandDelta: float
    energyGapMW: float
    evLoadMW: float
    evLoadDelta: float
    batterySoC: float
    batteryDelta: float
    estimatedSavingsINR: float
    savingsDelta: float


class TimeSeriesPoint(BaseModel):
    timestamp: str
    solarMW: float
    windMW: float
    totalRenewableMW: float
    demandMW: float
    predictedDemandMW: float
    upperConfidenceMW: float
    lowerConfidenceMW: float
    netBalanceMW: float
    isForecast: bool


class UpcomingForecast(BaseModel):
    horizon: ForecastHorizon
    renewableMW: float
    demandMW: float
    expectedGapMW: float
    risk: RiskLevel


class BatteryMiniStatus(BaseModel):
    currentSoC: float
    action: str
    window: str
    targetSoC: float


# ── 1. Dashboard ─────────────────────────────────────────────────────────────
class OverviewDashboardData(BaseModel):
    lastUpdated: str
    kpis: KPIs
    timeSeries: List[TimeSeriesPoint]
    topAlerts: List[GridAlert]
    upcomingForecasts: List[UpcomingForecast]
    batteryMiniStatus: BatteryMiniStatus


# ── 2. Forecast ───────────────────────────────────────────────────────────────
class ForecastPoint(BaseModel):
    timestamp: str
    actual: Optional[float]
    predicted: float
    upperInterval: float
    lowerInterval: float
    error: Optional[float]


class ForecastMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float
    intervalCoverage: float


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class ForecastResult(BaseModel):
    horizon: ForecastHorizon
    source: EnergySource
    points: List[ForecastPoint]
    metrics: ForecastMetrics
    reliabilityWarning: Optional[str] = None
    featureImportance: List[FeatureImportance]
    explainabilityNote: str


class ForecastRequest(BaseModel):
    locationId: LocationId = "pune"
    source: EnergySource = "solar"
    horizon: ForecastHorizon = "24h"


# ── 3. Grid Intelligence ──────────────────────────────────────────────────────
class RiskTimelineEntry(BaseModel):
    timestamp: str
    net: float
    risk: RiskLevel
    reason: str
    solar: float
    wind: float
    demand: float


class HourlyImbalanceEntry(BaseModel):
    hour: str
    surplus: float
    deficit: float
    net: float


class GridIntelligenceData(BaseModel):
    locationId: str
    riskTimeline: List[RiskTimelineEntry]
    hourlyImbalance: List[HourlyImbalanceEntry]
    alertHistory: List[GridAlert]
    currentRisk: RiskLevel
    summaryText: str


# ── 4. Battery Optimization ────────────────────────────────────────────────────
class BatteryConfig(BaseModel):
    capacityKWh: float = Field(default=500.0, ge=10, le=100000)
    chargePowerKW: float = Field(default=125.0, ge=1)
    dischargePowerKW: float = Field(default=125.0, ge=1)
    roundTripEfficiency: float = Field(default=0.92, ge=0.5, le=1.0)
    currentSoC: float = Field(default=0.72, ge=0.0, le=1.0)
    minSoC: float = Field(default=0.10, ge=0.0, le=0.5)
    maxSoC: float = Field(default=0.95, ge=0.5, le=1.0)
    locationId: LocationId = "pune"


class BatteryScheduleRow(BaseModel):
    hour: int
    timestamp: str
    action: Literal["charge", "discharge", "idle"]
    powerKW: float
    socBefore: float
    socAfter: float
    energyKWh: float
    reason: str
    tariffBand: str
    tariffRate: float


class BatteryOptimizationResult(BaseModel):
    config: BatteryConfig
    schedule: List[BatteryScheduleRow]
    projectedSavingsINR: float
    peakReductionMW: float
    renewableUtilizationPct: float
    totalChargedKWh: float
    totalDischargedKWh: float
    finalSoC: float
    optimizationNote: str


# ── 5. EV Management ───────────────────────────────────────────────────────────
class EVStation(BaseModel):
    id: str
    name: str
    location: str
    totalPorts: int
    activePorts: int
    currentLoadKW: float
    peakForecastKW: float
    peakHour: int
    scheduledChargeKW: float
    optimizedChargeKW: float
    savingsINR: float


class EVDemandPoint(BaseModel):
    timestamp: str
    forecastKW: float
    optimizedKW: float
    renewableSurplusKW: float


class EvManagementData(BaseModel):
    locationId: str
    stations: List[EVStation]
    hourlyDemand: List[EVDemandPoint]
    totalFleetKW: float
    peakDemandKW: float
    optimizedPeakKW: float
    totalSavingsINR: float
    recommendedShiftHours: List[int]


# ── 6. Scenario Simulator ──────────────────────────────────────────────────────
class ScenarioInputs(BaseModel):
    locationId: LocationId = "pune"
    solarPct: float = Field(default=100.0, ge=0, le=200)
    windPct: float = Field(default=100.0, ge=0, le=200)
    evDemandPct: float = Field(default=100.0, ge=0, le=300)
    demandPct: float = Field(default=100.0, ge=0, le=300)
    batteryCapacityKWh: float = Field(default=500.0, ge=0)
    batterySoC: float = Field(default=0.72, ge=0, le=1.0)
    cloudCoverPct: float = Field(default=20.0, ge=0, le=100)
    electricityPriceINRkWh: float = Field(default=7.20, ge=0)


class ScenarioHourlyPoint(BaseModel):
    hour: int
    solarMW: float
    windMW: float
    totalRenewableMW: float
    demandMW: float
    netBalanceMW: float
    risk: RiskLevel
    batteryAction: str
    batteryPowerKW: float
    socAfter: float


class ScenarioResult(BaseModel):
    inputs: ScenarioInputs
    baselineTotalRenewableMWh: float
    scenarioTotalRenewableMWh: float
    baselineTotalDemandMWh: float
    scenarioTotalDemandMWh: float
    baselineNetBalanceMWh: float
    scenarioNetBalanceMWh: float
    baselineCostINR: float
    scenarioCostINR: float
    costSavingsINR: float
    baselineCO2Kg: float
    scenarioCO2Kg: float
    co2AvoidedKg: float
    renewableUtilizationPct: float
    peakDemandMW: float
    surplusHours: int
    deficitHours: int
    hourly: List[ScenarioHourlyPoint]
    recommendations: List[str]


# ── 7. Weather ─────────────────────────────────────────────────────────────────
class WeatherHourlyPoint(BaseModel):
    timestamp: str
    tempC: float
    cloudCoverPct: float
    windSpeedMs: float
    humidityPct: float
    ghiWm2: float
    condition: str
    generationImpactPct: float


class WeatherAlert(BaseModel):
    timestamp: str
    condition: str
    severity: RiskLevel
    impact: str


class WeatherData(BaseModel):
    locationId: str
    locationName: str
    forecast: List[WeatherHourlyPoint]
    alerts: List[WeatherAlert]
    demoMode: bool


# ── 8. Regional Map ────────────────────────────────────────────────────────────
class RegionalAsset(BaseModel):
    id: str
    name: str
    type: Literal["solar_farm", "wind_farm", "ev_station", "substation", "microgrid"]
    coordinates: List[float]
    capacityMW: Optional[float] = None
    currentOutputMW: Optional[float] = None
    risk: RiskLevel
    demandMW: Optional[float] = None
    label: str


# ── 9. Cost & Carbon ───────────────────────────────────────────────────────────
class CostCarbonHourlyPoint(BaseModel):
    hour: str
    baselineCostINR: float
    optimizedCostINR: float
    baselineCO2Kg: float
    optimizedCO2Kg: float
    tariffBand: str
    renewableMWh: float


class CostCarbonData(BaseModel):
    locationId: str
    dailyBaselineCostINR: float
    dailyOptimizedCostINR: float
    savingsINR: float
    savingsPct: float
    dailyBaselineCO2Kg: float
    dailyOptimizedCO2Kg: float
    co2AvoidedKg: float
    renewableUtilizationPct: float
    peakDemandMW: float
    hourly: List[CostCarbonHourlyPoint]
    assumptions: List[str]


# ── 10. Microgrid ──────────────────────────────────────────────────────────────
class MicrogridConfig(BaseModel):
    name: str = "Campus Microgrid"
    type: Literal["campus", "industrial", "residential", "village"] = "campus"
    solarCapacityKW: float = Field(default=500.0, ge=0)
    windCapacityKW: float = Field(default=200.0, ge=0)
    batteryCapacityKWh: float = Field(default=1000.0, ge=0)
    totalDemandKW: float = Field(default=400.0, ge=0)
    criticalLoadKW: float = Field(default=100.0, ge=0)
    batterySoC: float = Field(default=0.80, ge=0, le=1.0)


class MicrogridHourlyPoint(BaseModel):
    hour: int
    solarKW: float
    windKW: float
    totalRenewableKW: float
    demandKW: float
    netKW: float
    batteryAction: str
    socAfter: float
    criticalLoadMet: bool


class MicrogridPlan(BaseModel):
    config: MicrogridConfig
    backupDurationHours: float
    criticalLoadCoverageHours: float
    renewableSupplyPct: float
    hourly: List[MicrogridHourlyPoint]
    operatingPlan: List[str]
    risks: List[str]


# ── 11. AI Assistant ─────────────────────────────────────────────────────────
class Recommendation(BaseModel):
    title: str
    impact: str
    actionLabel: str


class MiniChartPoint(BaseModel):
    label: str
    value: float


class ChatMessage(BaseModel):
    id: Optional[str] = None
    role: Literal["user", "assistant", "system"] = "assistant"
    content: str
    timestamp: Optional[str] = None
    recommendation: Optional[Recommendation] = None
    miniChartData: Optional[List[MiniChartPoint]] = None
    # For backwards compatibility with direct response models:
    reply: Optional[str] = None
    sources: List[str] = []
    confidence: Literal["high", "medium", "low"] = "medium"


class AssistantRequest(BaseModel):
    message: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None
    locationId: LocationId = "pune"
    contextData: Optional[dict] = None


class AssistantResponse(ChatMessage):
    pass


# ── 12. Model Lab ─────────────────────────────────────────────────────────────
class ModelComparisonRow(BaseModel):
    modelName: str
    category: str
    mae: float
    rmse: float
    mape: float
    trainingTimeSec: float
    isBest: bool
    architecture: str


class ModelLabPrediction(BaseModel):
    step: int
    timestamp: str
    actual: float
    persistence: float
    xgboost: float
    lstm: float
    dualLstmAttention: float


class ModelResidual(BaseModel):
    timestamp: str
    error: float


class ModelErrorBucket(BaseModel):
    bucket: str
    count: int


class ModelMetric(BaseModel):
    modelName: str
    mae: float
    rmse: float
    mape: float
    r2: float
    trainingSamples: int
    testSamples: int
    trainingTimeS: float


class ModelLabData(BaseModel):
    models: List[ModelComparisonRow]
    testSetPredictions: List[ModelLabPrediction]
    residuals: List[ModelResidual]
    errorDistribution: List[ModelErrorBucket]
    locationId: Optional[str] = "pune"
    source: Optional[EnergySource] = "solar"
    metrics: Optional[List[ModelMetric]] = None
    note: Optional[str] = None


# ── Data Upload ────────────────────────────────────────────────────────────────
class UploadResponse(BaseModel):
    filename: str
    rows: int = 0
    rowCount: int = 0
    columns: List[str] = []
    missingValues: int = 0
    duplicates: int = 0
    timeRange: Optional[str] = None
    warnings: List[str] = []
    issues: List[str] = []
    sampleRows: List[dict] = []
    status: str = "ok"

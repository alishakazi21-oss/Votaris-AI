// Voltaris AI API Client
// Handles both Live FastAPI backend connection and deterministic Demo Mode with configurable latency

import {
  OverviewDashboardData,
  ForecastResult,
  GridIntelligenceData,
  BatteryConfig,
  BatteryOptimizationResult,
  EvManagementData,
  ScenarioInputs,
  ScenarioResult,
  WeatherData,
  RegionalAsset,
  CostCarbonData,
  MicrogridPlan,
  ModelLabData,
  LocationId,
  ForecastHorizon,
  EnergySource,
  ChatMessage,
  GridAlert,
} from '../../types';
import {
  generateDashboardData,
  generateForecastResult,
  generateGridIntelligenceData,
  generateBatteryOptimization,
  generateEvManagementData,
  simulateScenarioCalculations,
  generateWeatherData,
  generateRegionalAssets,
  generateCostCarbonData,
  generateMicrogridSimulation,
  generateAssistantReply,
  generateModelLabData,
} from '../mock/mockGenerators';
import { useUiStore } from '../../store/uiStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private async mockDelay<T>(factory: () => T): Promise<T> {
    const { simulateApiError, artificialLatencyMs } = useUiStore.getState();

    await new Promise((resolve) => setTimeout(resolve, artificialLatencyMs || 350));

    if (simulateApiError) {
      throw new Error('Simulated Voltaris API Error: Backend gateway connection timeout (503 Service Unavailable).');
    }

    return factory();
  }

  private isLiveMode(): boolean {
    const storeMode = useUiStore.getState().dataMode;
    return storeMode === 'live';
  }

  // 1. Overview Dashboard: GET /api/dashboard
  async getDashboard(locationId: LocationId): Promise<OverviewDashboardData> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/dashboard?location=${locationId}`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateDashboardData(locationId));
  }

  // 2. AI Forecasting: POST /api/forecast
  async getForecast(params: {
    locationId: LocationId;
    source: EnergySource;
    horizon: ForecastHorizon;
  }): Promise<ForecastResult> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateForecastResult(params.locationId, params.source, params.horizon));
  }

  // 3. Grid Intelligence: GET /api/grid/imbalance
  async getGridImbalance(locationId: LocationId): Promise<GridIntelligenceData> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/grid/imbalance?location=${locationId}`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateGridIntelligenceData(locationId));
  }

  // 4. Alerts: GET /api/alerts
  async getAlerts(locationId: LocationId): Promise<GridAlert[]> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/alerts?location=${locationId}`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateGridIntelligenceData(locationId).alertHistory);
  }

  // 5. Battery Optimization: POST /api/optimization/battery
  async optimizeBattery(config: BatteryConfig): Promise<BatteryOptimizationResult> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/optimization/battery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateBatteryOptimization(config));
  }

  // 6. EV Management: POST /api/optimization/ev
  async getEvManagement(locationId: LocationId): Promise<EvManagementData> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/optimization/ev?location=${locationId}`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateEvManagementData(locationId));
  }

  // 7. Scenario Simulator: POST /api/scenarios/simulate
  async simulateScenario(inputs: ScenarioInputs): Promise<ScenarioResult> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/scenarios/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => simulateScenarioCalculations(inputs));
  }

  // 8. Weather: GET /api/weather
  async getWeather(locationId: LocationId): Promise<WeatherData> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/weather?location=${locationId}`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateWeatherData(locationId));
  }

  // 9. Regional Energy Map: GET /api/regions
  async getRegionalAssets(): Promise<RegionalAsset[]> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/regions`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateRegionalAssets());
  }

  // 10. Cost & Carbon: GET /api/analytics/cost-carbon
  async getCostCarbon(locationId: LocationId): Promise<CostCarbonData> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/analytics/cost-carbon?location=${locationId}`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateCostCarbonData(locationId));
  }

  // 11. Microgrid Planner: POST /api/microgrid/simulate
  async simulateMicrogrid(plan: Partial<MicrogridPlan>): Promise<MicrogridPlan> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/microgrid/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateMicrogridSimulation(plan));
  }

  // 12. AI Energy Assistant: POST /api/assistant/chat
  async sendChatMessage(userMessage: string): Promise<ChatMessage> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateAssistantReply(userMessage));
  }

  // 13. Model Lab: GET /api/models/metrics
  async getModelLab(): Promise<ModelLabData> {
    if (this.isLiveMode()) {
      const res = await fetch(`${BASE_URL}/api/models/metrics`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }
    return this.mockDelay(() => generateModelLabData());
  }

  // 14. Data Upload: POST /api/data/upload
  async uploadDataFile(file: File, type: string): Promise<{
    filename: string;
    rowCount: number;
    status: 'success' | 'warning' | 'error';
    issues: string[];
    sampleRows: Record<string, string | number>[];
  }> {
    if (this.isLiveMode()) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const res = await fetch(`${BASE_URL}/api/data/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      return res.json();
    }

    return this.mockDelay(() => ({
      filename: file.name,
      rowCount: 8760,
      status: 'success' as const,
      issues: [
        'Timestamp resolution verified: 15-minute intervals.',
        'Zero null/NaN values detected across target irradiance columns.',
        'Data aligned with IST (Asia/Kolkata) timezone offset +05:30.',
      ],
      sampleRows: [
        { timestamp: '2026-10-12 00:00:00 IST', ghi_wm2: 0, dni_wm2: 0, temp_c: 23.4, wind_speed_ms: 4.2 },
        { timestamp: '2026-10-12 00:15:00 IST', ghi_wm2: 0, dni_wm2: 0, temp_c: 23.2, wind_speed_ms: 4.4 },
        { timestamp: '2026-10-12 00:30:00 IST', ghi_wm2: 0, dni_wm2: 0, temp_c: 23.0, wind_speed_ms: 4.1 },
        { timestamp: '2026-10-12 00:45:00 IST', ghi_wm2: 0, dni_wm2: 0, temp_c: 22.8, wind_speed_ms: 3.9 },
      ],
    }));
  }
}

export const apiClient = new ApiClient();

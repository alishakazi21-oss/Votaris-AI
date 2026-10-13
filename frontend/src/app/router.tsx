import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSkeleton } from '../components/ui/StateBanners';

// Lazy-loaded pages
const OverviewPage = lazy(() => import('../features/overview/OverviewPage').then((m) => ({ default: m.OverviewPage })));
const ForecastingPage = lazy(() => import('../features/forecasting/ForecastingPage').then((m) => ({ default: m.ForecastingPage })));
const GridIntelligencePage = lazy(() => import('../features/grid/GridIntelligencePage').then((m) => ({ default: m.GridIntelligencePage })));
const BatteryOptimizationPage = lazy(() => import('../features/battery/BatteryOptimizationPage').then((m) => ({ default: m.BatteryOptimizationPage })));
const EvManagementPage = lazy(() => import('../features/ev/EvManagementPage').then((m) => ({ default: m.EvManagementPage })));
const ScenarioSimulatorPage = lazy(() => import('../features/simulator/ScenarioSimulatorPage').then((m) => ({ default: m.ScenarioSimulatorPage })));
const WeatherIntelligencePage = lazy(() => import('../features/weather/WeatherIntelligencePage').then((m) => ({ default: m.WeatherIntelligencePage })));
const RegionalMapPage = lazy(() => import('../features/map/RegionalMapPage').then((m) => ({ default: m.RegionalMapPage })));
const CostCarbonPage = lazy(() => import('../features/cost-carbon/CostCarbonPage').then((m) => ({ default: m.CostCarbonPage })));
const MicrogridPage = lazy(() => import('../features/microgrid/MicrogridPage').then((m) => ({ default: m.MicrogridPage })));
const AiAssistantPage = lazy(() => import('../features/assistant/AiAssistantPage').then((m) => ({ default: m.AiAssistantPage })));
const ModelLabPage = lazy(() => import('../features/model-lab/ModelLabPage').then((m) => ({ default: m.ModelLabPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const PageSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSkeleton rows={4} height="h-28" />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <PageSuspense>
            <OverviewPage />
          </PageSuspense>
        ),
      },
      {
        path: 'forecasting',
        element: (
          <PageSuspense>
            <ForecastingPage />
          </PageSuspense>
        ),
      },
      {
        path: 'grid-intelligence',
        element: (
          <PageSuspense>
            <GridIntelligencePage />
          </PageSuspense>
        ),
      },
      {
        path: 'battery-optimization',
        element: (
          <PageSuspense>
            <BatteryOptimizationPage />
          </PageSuspense>
        ),
      },
      {
        path: 'ev-management',
        element: (
          <PageSuspense>
            <EvManagementPage />
          </PageSuspense>
        ),
      },
      {
        path: 'scenario-simulator',
        element: (
          <PageSuspense>
            <ScenarioSimulatorPage />
          </PageSuspense>
        ),
      },
      {
        path: 'weather-intelligence',
        element: (
          <PageSuspense>
            <WeatherIntelligencePage />
          </PageSuspense>
        ),
      },
      {
        path: 'regional-map',
        element: (
          <PageSuspense>
            <RegionalMapPage />
          </PageSuspense>
        ),
      },
      {
        path: 'cost-carbon',
        element: (
          <PageSuspense>
            <CostCarbonPage />
          </PageSuspense>
        ),
      },
      {
        path: 'microgrid-planner',
        element: (
          <PageSuspense>
            <MicrogridPage />
          </PageSuspense>
        ),
      },
      {
        path: 'assistant',
        element: (
          <PageSuspense>
            <AiAssistantPage />
          </PageSuspense>
        ),
      },
      {
        path: 'model-lab',
        element: (
          <PageSuspense>
            <ModelLabPage />
          </PageSuspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <PageSuspense>
            <SettingsPage />
          </PageSuspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

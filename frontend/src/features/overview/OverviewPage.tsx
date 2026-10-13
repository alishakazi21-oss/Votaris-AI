import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useUiStore } from '../../store/uiStore';
import { KpiCard } from '../../components/ui/KpiCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MultiSeriesChart } from '../../components/charts/MultiSeriesChart';
import { ImbalanceBarChart } from '../../components/charts/BarChart';
import { BatteryGauge } from '../../components/charts/Gauge';
import { LoadingSkeleton, ErrorState, StaleDataBanner } from '../../components/ui/StateBanners';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { formatRupees, formatTimeIST } from '../../lib/formatters';
import { convertPower } from '../../lib/units';
import { AlertCircle, ArrowRight, Download, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { exportToCSV } from '../../lib/csv';
import { Link } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const { selectedLocationId, selectedLocation, powerUnit, setNotificationDrawerOpen } = useUiStore();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['dashboard', selectedLocationId],
    queryFn: () => apiClient.getDashboard(selectedLocationId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={2} height="h-28" />
        <LoadingSkeleton rows={1} height="h-80" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Failed to Retrieve Overview Telemetry"
        message={(error as Error)?.message || 'Substation telemetry stream unreachable.'}
        onRetry={() => refetch()}
      />
    );
  }

  const { kpis, timeSeries, topAlerts, upcomingForecasts, batteryMiniStatus } = data;

  // Convert power values according to active powerUnit (MW or kW)
  const renGen = convertPower(kpis.renewableGenerationMW, powerUnit);
  const demand = convertPower(kpis.totalDemandMW, powerUnit);
  const gap = convertPower(kpis.energyGapMW, powerUnit);
  const ev = convertPower(kpis.evLoadMW, powerUnit);

  // Sparkline data samples
  const genSparkline = timeSeries.slice(0, 12).map((t) => t.totalRenewableMW);
  const demandSparkline = timeSeries.slice(0, 12).map((t) => t.demandMW);

  const handleExportChartData = () => {
    exportToCSV(
      `overview_${selectedLocationId}_24h`,
      timeSeries.map((t) => ({
        timestamp: t.timestamp,
        solarMW: t.solarMW,
        windMW: t.windMW,
        totalRenewableMW: t.totalRenewableMW,
        demandMW: t.demandMW,
        netBalanceMW: t.netBalanceMW,
      }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Overview Dashboard</h2>
          <p className="text-xs text-secondary mt-0.5">
            Real-time renewable generation, grid demand balancing, and 24-hour predictive dispatch for{' '}
            <strong className="text-accent-cyan">{selectedLocation.name}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportChartData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-elevated hover:border-accent-cyan/50 text-xs font-medium text-secondary hover:text-primary transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Export 24h Data</span>
          </button>
        </div>
      </div>

      {/* Stale Data Notice */}
      <StaleDataBanner
        lastUpdatedText={formatTimeIST(dataUpdatedAt)}
        onRefresh={() => refetch()}
      />

      {/* Row of 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <KpiCard
          label="Renewable Gen"
          value={renGen.toFixed(1)}
          unit={powerUnit}
          delta={kpis.renewableDelta}
          status="Measured"
          sparklineData={genSparkline}
          sparklineColor="#F5B83D"
          tooltipText="Combined instantaneous solar PV and wind turbine generation"
        />
        <KpiCard
          label="Grid Demand"
          value={demand.toFixed(1)}
          unit={powerUnit}
          delta={kpis.demandDelta}
          isNegativeGood={true}
          status="Measured"
          sparklineData={demandSparkline}
          sparklineColor="#E2E8F0"
          tooltipText="Aggregate residential, commercial, and industrial grid draw"
        />
        <KpiCard
          label="Energy Gap"
          value={(gap >= 0 ? '+' : '') + gap.toFixed(1)}
          unit={powerUnit}
          status={gap >= 0 ? 'Stable' : 'Critical'}
          delta={gap >= 0 ? 8.4 : -12.1}
          tooltipText="Instantaneous renewable surplus (+) or state deficit (-)"
        />
        <KpiCard
          label="EV Fleet Load"
          value={ev.toFixed(2)}
          unit={powerUnit}
          delta={kpis.evLoadDelta}
          status="Watch"
          sparklineColor="#FB923C"
          tooltipText="Real-time connected fast-charging station aggregate draw"
        />
        <KpiCard
          label="Battery SoC"
          value={kpis.batterySoC}
          unit="%"
          delta={kpis.batteryDelta}
          status={kpis.batterySoC > 30 ? 'Stable' : 'Watch'}
          sparklineColor="#8B8CF8"
          tooltipText="Central substation Battery Energy Storage System charge level"
        />
        <KpiCard
          label="Est. Savings"
          value={formatRupees(kpis.estimatedSavingsINR, true)}
          delta={kpis.savingsDelta}
          status="Estimated"
          tooltipText="Arbitrage and peak-demand penalty avoidance savings"
        />
      </div>

      {/* Main Generation vs Demand Section */}
      <Card>
        <CardHeader
          title="Renewable Generation (Solar + Wind Stacked) vs Grid Demand (Next 24h)"
          subtitle="Dual-model predictive horizon with 90% confidence bands and evening peak identification"
          actions={
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted bg-base px-2 py-1 rounded border border-border">
                Horizon: 24h IST
              </span>
            </div>
          }
        />
        <MultiSeriesChart
          data={timeSeries}
          unit={powerUnit}
          height={320}
          showStackedGen={true}
        />
        <div className="mt-3">
          <AssumptionNote
            note="Generation models apply clear-sky solar indexing derated by satellite cloud fraction. Demand model includes 24h autoregressive LSTM weights."
            type="estimated"
          />
        </div>
      </Card>

      {/* Energy Balance Bar Strip */}
      <Card>
        <CardHeader
          title="Hourly Energy Balance (Surplus vs Deficit)"
          subtitle="Green bars indicate net export surplus; red bars indicate dispatch deficit requiring battery or grid support"
        />
        <ImbalanceBarChart
          data={timeSeries.map((t) => ({
            timestamp: t.timestamp,
            balanceMW: t.netBalanceMW,
          }))}
          unit={powerUnit}
          height={200}
        />
      </Card>

      {/* Bottom 3 Cards: Current Alerts, Upcoming Forecasts, Battery Mini Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card: Current Alerts */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader
              title="Active Grid Alerts"
              subtitle="Top prioritized operational advisories"
              actions={
                <button
                  type="button"
                  onClick={() => setNotificationDrawerOpen(true)}
                  className="text-xs text-accent-cyan hover:underline flex items-center gap-1 font-medium"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              }
            />
            <div className="space-y-2.5">
              {topAlerts.map((alt) => (
                <div key={alt.id} className="p-2.5 rounded-lg bg-base border border-border/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={alt.severity} size="sm" />
                    <span className="text-[10px] text-muted font-mono">{alt.type}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-primary">{alt.title}</h4>
                  <p className="text-[11px] text-secondary line-clamp-2">{alt.recommendedAction}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-border/40 mt-3">
            <Link
              to="/grid-intelligence"
              className="text-xs text-accent-cyan hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>Explore Grid Intelligence Risk Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Card: Upcoming Forecasts */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader
              title="Upcoming Forecast Summary"
              subtitle="Multi-horizon renewable vs demand projection"
              actions={
                <Link
                  to="/forecasting"
                  className="text-xs text-accent-cyan hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Lab</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-2.5">
              {upcomingForecasts.map((fc) => (
                <div key={fc.horizon} className="p-3 rounded-lg bg-base border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-accent-cyan">+{fc.horizon}</span>
                    <StatusBadge status={fc.risk} size="sm" />
                  </div>
                  <div className="text-[11px] text-secondary">
                    <div>Ren: <strong className="text-primary font-mono">{fc.renewableMW} MW</strong></div>
                    <div>Dem: <strong className="text-primary font-mono">{fc.demandMW} MW</strong></div>
                    <div className="border-t border-border/40 pt-1 mt-1 font-mono text-[10px]">
                      Net: <strong className={fc.expectedGapMW >= 0 ? 'text-accent-green' : 'text-accent-red'}>
                        {fc.expectedGapMW >= 0 ? '+' : ''}{fc.expectedGapMW} MW
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-border/40 mt-3 text-[11px] text-muted">
            Calibrated interval coverage: <strong className="text-primary font-mono">91.8%</strong>
          </div>
        </Card>

        {/* Card: Battery Status Mini-Gauge */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader
              title="BESS Storage Status"
              subtitle="Substation battery reserve & next dispatch window"
              actions={
                <Link
                  to="/battery-optimization"
                  className="text-xs text-accent-cyan hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Optimize</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <BatteryGauge
              socPct={batteryMiniStatus.currentSoC}
              actionText={batteryMiniStatus.action}
              className="border-none p-0 bg-transparent"
            />
          </div>
          <div className="p-2.5 rounded-lg bg-base border border-border text-xs text-secondary mt-3">
            <span className="text-accent-amber font-semibold block">{batteryMiniStatus.window}</span>
            <span className="text-[11px] text-muted">
              Target discharge depth: {batteryMiniStatus.targetSoC}% SoC
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};

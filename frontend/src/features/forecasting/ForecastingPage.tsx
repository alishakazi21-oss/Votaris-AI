import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useUiStore } from '../../store/uiStore';
import { EnergySource, ForecastHorizon } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Overlays';
import { SegmentedControl } from '../../components/ui/FormControls';
import { ForecastChart } from '../../components/charts/ForecastChart';
import { LoadingSkeleton, ErrorState } from '../../components/ui/StateBanners';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { Download, AlertTriangle, Cpu, HelpCircle, Layers } from 'lucide-react';
import { exportToCSV } from '../../lib/csv';

export const ForecastingPage: React.FC = () => {
  const { selectedLocationId, powerUnit } = useUiStore();
  const [activeSource, setActiveSource] = useState<EnergySource>('solar');
  const [horizon, setHorizon] = useState<ForecastHorizon>('24h');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['forecast', selectedLocationId, activeSource, horizon],
    queryFn: () =>
      apiClient.getForecast({
        locationId: selectedLocationId,
        source: activeSource,
        horizon,
      }),
  });

  const sourceTabs = [
    { id: 'solar', label: 'Solar PV' },
    { id: 'wind', label: 'Wind Turbine' },
    { id: 'ev', label: 'EV Demand' },
    { id: 'demand', label: 'Total Grid Demand' },
    { id: 'combined', label: 'Combined Renewable' },
  ];

  const horizonOptions: { value: ForecastHorizon; label: string }[] = [
    { value: '1h', label: '1 Hour (Ultra-Short)' },
    { value: '6h', label: '6 Hours (Intraday)' },
    { value: '24h', label: '24 Hours (Day-Ahead)' },
    { value: '7d', label: '7 Days (Week-Ahead)' },
  ];

  const handleDownloadCsv = () => {
    if (!data) return;
    exportToCSV(
      `forecast_${activeSource}_${horizon}`,
      data.points.map((p) => ({
        timestamp: p.timestamp,
        actual: p.actual ?? '',
        predicted: p.predicted,
        upperInterval: p.upperInterval,
        lowerInterval: p.lowerInterval,
        error: p.error ?? '',
      }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">AI Forecasting Engine</h2>
          <p className="text-xs text-secondary mt-0.5">
            Calibrated probabilistic generation and load forecasting powered by Attention-based Neural Architectures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-elevated hover:border-accent-cyan/50 text-xs font-medium text-secondary hover:text-primary transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Download Forecast CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs for Source & Horizon Segmented Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border pb-2">
        <Tabs
          tabs={sourceTabs}
          activeTab={activeSource}
          onChange={(tab) => setActiveSource(tab as EnergySource)}
          className="border-b-0"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted hidden sm:inline">Horizon:</span>
          <SegmentedControl
            options={horizonOptions}
            value={horizon}
            onChange={(h) => setHorizon(h)}
            size="sm"
          />
        </div>
      </div>

      {/* Reliability Warning Banner */}
      <div className="flex items-center gap-2.5 p-3 rounded-lg border border-accent-amber/30 bg-accent-amber/10 text-xs text-accent-amber">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <div className="leading-tight">
          <strong>Calibrated Confidence Warning:</strong> Numerical weather prediction flags rapid convective cloud formations in regional satellite scans. Confidence intervals dynamically widened by 14% past +12h.
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={3} height="h-32" />
      ) : isError || !data ? (
        <ErrorState
          title="Forecasting Engine Timeout"
          message={(error as Error)?.message || 'Unable to execute inference.'}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Chart Column: 8 cols */}
          <div className="lg:col-span-8 space-y-5">
            <Card>
              <CardHeader
                title={`${sourceTabs.find((t) => t.id === activeSource)?.label} — Horizon: ${horizon.toUpperCase()}`}
                subtitle="Telemetry actuals vs Attention-BiLSTM predictions with 90% calibrated confidence band"
                actions={
                  <div className="text-xs font-mono text-muted bg-base px-2 py-0.5 rounded border border-border">
                    Unit: {powerUnit}
                  </div>
                }
              />
              <ForecastChart
                data={data.points}
                unit={powerUnit}
                height={350}
                forecastDividerIndex={Math.floor(data.points.length * 0.4)}
              />
              <div className="mt-4">
                <AssumptionNote
                  note="Error bounds computed via Conformal Prediction coverage over 30 days of backtested telemetry. Forecast horizon origin indicated by dotted line."
                  type="estimated"
                />
              </div>
            </Card>

            {/* Explainability & Feature Importance Card */}
            <Card>
              <CardHeader
                title="Model Explainability & Feature Attention Weights"
                subtitle="SHAP/Attention importance breakdown for the active forecast horizon"
              />
              <div className="space-y-3">
                <div className="space-y-2">
                  {data.featureImportance.map((feat) => (
                    <div key={feat.feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-secondary">{feat.feature}</span>
                        <span className="font-mono text-accent-cyan">{feat.importance}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-base overflow-hidden border border-border/40">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${feat.importance}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-3 rounded-lg bg-base border border-border/80 text-xs text-secondary leading-relaxed">
                  <div className="font-semibold text-primary mb-0.5 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-accent-cyan" />
                    <span>Neural Attention Interpretation</span>
                  </div>
                  <p>{data.explainabilityNote}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Metrics Panel: 4 cols */}
          <div className="lg:col-span-4 space-y-5">
            <Card>
              <CardHeader
                title="Forecast Performance Metrics"
                subtitle="Backtested against historical test set"
              />
              <div className="space-y-3 font-mono">
                <div className="p-3 rounded-lg bg-base border border-border flex items-center justify-between">
                  <span className="text-xs text-secondary font-sans">Mean Absolute Error (MAE):</span>
                  <span className="text-sm font-semibold text-primary">{data.metrics.mae} {powerUnit}</span>
                </div>
                <div className="p-3 rounded-lg bg-base border border-border flex items-center justify-between">
                  <span className="text-xs text-secondary font-sans">Root Mean Squared Error (RMSE):</span>
                  <span className="text-sm font-semibold text-primary">{data.metrics.rmse} {powerUnit}</span>
                </div>
                <div className="p-3 rounded-lg bg-base border border-border flex items-center justify-between">
                  <span className="text-xs text-secondary font-sans">Mean Absolute % Error (MAPE):</span>
                  <span className="text-sm font-semibold text-accent-green">{data.metrics.mape}%</span>
                </div>
                <div className="p-3 rounded-lg bg-base border border-border flex items-center justify-between">
                  <span className="text-xs text-secondary font-sans">Calibrated CI Coverage:</span>
                  <span className="text-sm font-semibold text-accent-cyan">{data.metrics.intervalCoverage}%</span>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-lg border border-border bg-base/50 text-[11px] text-muted space-y-1">
                <div className="font-semibold text-secondary flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-accent-cyan" />
                  <span>Data Quality Indicator</span>
                </div>
                <p>
                  Telemetry stream packet loss rate: <strong>0.02%</strong>. Latency: <strong>140ms</strong>.
                  Temporal frequency: 15-minute standard resolution with zero imputed outliers.
                </p>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Model Architecture"
                subtitle="Active inference checkpoint"
              />
              <div className="text-xs space-y-2 text-secondary">
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span>Architecture:</span>
                  <span className="font-mono text-primary font-semibold">Dual-LSTM + Self-Attention</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span>Input Window:</span>
                  <span className="font-mono text-primary">96 Steps (24h @ 15m)</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span>Optimizer:</span>
                  <span className="font-mono text-primary">AdamW (lr=0.001)</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantization:</span>
                  <span className="font-mono text-accent-green">FP16 Accelerated</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

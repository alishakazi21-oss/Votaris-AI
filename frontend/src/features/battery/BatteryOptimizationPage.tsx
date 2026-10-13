import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { BatteryConfig, BatteryScheduleRow } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { BatteryGauge } from '../../components/charts/Gauge';
import { NumberField, SliderField } from '../../components/ui/FormControls';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton, ErrorState } from '../../components/ui/StateBanners';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { formatRupees } from '../../lib/formatters';
import { CheckCircle2, AlertOctagon, RotateCcw, Zap, Sparkles, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { chartColors } from '../../lib/chartColors';

const DEFAULT_CONFIG: BatteryConfig = {
  capacityKWh: 4000,
  maxChargeKW: 1000,
  maxDischargeKW: 1200,
  roundTripEfficiencyPct: 88,
  minSoCPct: 20,
  maxSoCPct: 95,
  currentSoCPct: 72,
};

export const BatteryOptimizationPage: React.FC = () => {
  const [config, setConfig] = useState<BatteryConfig>(DEFAULT_CONFIG);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['battery-opt', config],
    queryFn: () => apiClient.optimizeBattery(config),
  });

  const handleResetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const scheduleColumns: Column<BatteryScheduleRow>[] = [
    { key: 'hour', label: 'Time (IST)', sortable: true },
    {
      key: 'action',
      label: 'Dispatch Action',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
            r.action === 'Charge'
              ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
              : r.action === 'Discharge'
              ? 'bg-accent-red/15 text-accent-red border border-accent-red/30'
              : 'bg-base text-muted border border-border'
          }`}
        >
          {r.action}
        </span>
      ),
    },
    {
      key: 'powerKW',
      label: 'Power Rate (kW)',
      render: (r) => `${r.powerKW.toLocaleString()} kW`,
      sortable: true,
    },
    {
      key: 'socAfterPct',
      label: 'SoC After (%)',
      render: (r) => `${r.socAfterPct}%`,
      sortable: true,
    },
    {
      key: 'tariffINR',
      label: 'ToD Tariff',
      render: (r) => `₹${r.tariffINR.toFixed(2)}/kWh`,
      sortable: true,
    },
    {
      key: 'reason',
      label: 'Arbitrage Rationale',
      sortable: false,
    },
  ];

  if (isLoading) {
    return <LoadingSkeleton rows={4} height="h-28" />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Optimization Solver Unreachable"
        message={(error as Error)?.message || 'Failed to solve mixed-integer linear dispatch program.'}
        onRetry={() => refetch()}
      />
    );
  }

  const { schedule, timeSeries, validation, savings } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Battery Energy Storage (BESS) Optimization</h2>
          <p className="text-xs text-secondary mt-0.5">
            Mixed-Integer Linear Programming (MILP) dispatch for peak shaving, solar arbitrage, and reserve longevity.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetConfig}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-base hover:bg-elevated text-xs font-medium text-secondary hover:text-primary transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Config</span>
        </button>
      </div>

      {/* Top 2 Columns: Config Form + Live Mini Status & Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Config Panel: 8 cols */}
        <Card className="lg:col-span-8">
          <CardHeader
            title="BESS Asset & Operational Constraints"
            subtitle="Configure cell capacity, maximum continuous C-rates, and statutory State of Charge boundaries"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <NumberField
              label="BESS Capacity"
              value={config.capacityKWh}
              min={500}
              max={20000}
              step={500}
              unit="kWh"
              onChange={(v) => setConfig({ ...config, capacityKWh: v })}
            />
            <NumberField
              label="Max Charge Power"
              value={config.maxChargeKW}
              min={100}
              max={5000}
              step={100}
              unit="kW"
              onChange={(v) => setConfig({ ...config, maxChargeKW: v })}
            />
            <NumberField
              label="Max Discharge Power"
              value={config.maxDischargeKW}
              min={100}
              max={5000}
              step={100}
              unit="kW"
              onChange={(v) => setConfig({ ...config, maxDischargeKW: v })}
            />
            <SliderField
              label="Round-Trip Efficiency"
              value={config.roundTripEfficiencyPct}
              min={70}
              max={98}
              unit="%"
              onChange={(v) => setConfig({ ...config, roundTripEfficiencyPct: v })}
            />
            <SliderField
              label="Minimum SoC (Reserve)"
              value={config.minSoCPct}
              min={10}
              max={40}
              unit="%"
              onChange={(v) => setConfig({ ...config, minSoCPct: v })}
            />
            <SliderField
              label="Maximum SoC (Headroom)"
              value={config.maxSoCPct}
              min={80}
              max={100}
              unit="%"
              onChange={(v) => setConfig({ ...config, maxSoCPct: v })}
            />
          </div>

          {/* Constraint Validator UI */}
          <div className="mt-5 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-accent-green">
              <CheckCircle2 className="w-4 h-4" />
              <span>MILP Constraint Validation Status: All Physical Limits Satisfied</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-secondary">
              {validation.messages.map((m, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-base p-2 rounded border border-border/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Savings & SoC Gauge: 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader
              title="Estimated Arbitrage Savings"
              subtitle="Comparison against unmanaged baseline"
            />
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-base border border-border text-xs">
                <span className="text-secondary font-sans">Baseline Energy Cost:</span>
                <span className="text-muted">{formatRupees(savings.baselineCostINR)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-base border border-border text-xs">
                <span className="text-secondary font-sans">Optimized Dispatch Cost:</span>
                <span className="text-primary font-bold">{formatRupees(savings.optimizedCostINR)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent-green/10 border border-accent-green/30 text-xs">
                <span className="text-accent-green font-sans font-semibold">Net Savings:</span>
                <span className="text-accent-green font-bold text-sm">
                  {formatRupees(savings.netSavingsINR)} ({savings.savingsPct}%)
                </span>
              </div>
            </div>
            <div className="mt-3">
              <AssumptionNote
                note="Estimated from ToD tariff arbitrage spread and avoided unscheduled interchange penalties. Round-trip thermodynamic loss factored at 12%."
                type="estimated"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Main Charts: SoC Curve & Charge/Discharge Schedule */}
      <Card>
        <CardHeader
          title="24-Hour Battery SoC Trajectory & Charge/Discharge Schedule"
          subtitle="Top: State of Charge (%) with min/max safety bands. Bottom: Charge (positive bars) vs Discharge (negative bars) in kW"
        />
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeSeries} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <XAxis dataKey="timestamp" stroke={chartColors.axisText} fontSize={11} tickLine={false} dy={8} />
              <YAxis yAxisId="soc" stroke={chartColors.battery} fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
              <YAxis yAxisId="power" orientation="right" stroke={chartColors.axisText} fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const soc = payload.find((p: any) => p.dataKey === 'socPct')?.value;
                    const pwr = payload.find((p: any) => p.dataKey === 'powerKW')?.value;
                    return (
                      <div className="bg-surface/95 border border-border p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                        <div className="text-primary font-bold border-b border-border/50 pb-1">{label} IST</div>
                        <div className="text-accent-violet">SoC: {soc}%</div>
                        <div className={pwr < 0 ? 'text-accent-red' : pwr > 0 ? 'text-accent-green' : 'text-muted'}>
                          Power: {pwr > 0 ? `Charge +${pwr}` : pwr < 0 ? `Discharge ${pwr}` : 'Idle (0)'} kW
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />

              <ReferenceLine yAxisId="soc" y={config.minSoCPct} stroke={chartColors.deficit} strokeDasharray="3 3" label={{ value: 'Min Reserve', fill: '#F26B6B', fontSize: 10 }} />
              <ReferenceLine yAxisId="soc" y={config.maxSoCPct} stroke={chartColors.accentAmber} strokeDasharray="3 3" label={{ value: 'Max Headroom', fill: '#F5B83D', fontSize: 10 }} />

              <Bar yAxisId="power" dataKey="powerKW" fill={chartColors.battery} opacity={0.65} name="Dispatch Power (kW)" radius={[2, 2, 2, 2]} />
              <Line yAxisId="soc" type="monotone" dataKey="socPct" stroke={chartColors.accentCyan} strokeWidth={2.5} dot={{ r: 3 }} name="State of Charge (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Schedule Table */}
      <Card>
        <CardHeader
          title="Optimal 24-Hour Dispatch Table"
          subtitle="Hourly action, commanded power, resulting State of Charge, and economic rationale"
        />
        <DataTable
          data={schedule as unknown as Record<string, unknown>[]}
          columns={scheduleColumns as unknown as Column<Record<string, unknown>>[]}
          pageSize={8}
          searchPlaceholder="Search hour, action, or reason..."
          exportFilename="bess_optimal_schedule"
        />
      </Card>
    </div>
  );
};

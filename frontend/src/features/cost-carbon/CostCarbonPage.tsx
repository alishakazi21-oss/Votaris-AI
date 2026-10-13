import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useUiStore } from '../../store/uiStore';
import { Card, CardHeader } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';
import { NumberField } from '../../components/ui/FormControls';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { LoadingSkeleton, ErrorState } from '../../components/ui/StateBanners';
import { formatRupees } from '../../lib/formatters';
import { Coins, Leaf, Download, Zap, TrendingDown } from 'lucide-react';
import { exportToCSV } from '../../lib/csv';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { chartColors } from '../../lib/chartColors';

export const CostCarbonPage: React.FC = () => {
  const { selectedLocationId } = useUiStore();
  const [emissionFactor, setEmissionFactor] = useState<number>(710);
  const [offPeakTariff, setOffPeakTariff] = useState<number>(3.4);
  const [normalTariff, setNormalTariff] = useState<number>(5.8);
  const [peakTariff, setPeakTariff] = useState<number>(11.5);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cost-carbon', selectedLocationId],
    queryFn: () => apiClient.getCostCarbon(selectedLocationId),
  });

  if (isLoading) return <LoadingSkeleton rows={4} height="h-32" />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Tariff Engine Offline"
        message={(error as Error)?.message || 'Failed to calculate economic dispatch ledger.'}
        onRetry={() => refetch()}
      />
    );
  }

  const { kpis, hourlyBreakdown } = data;

  const handleExportCsv = () => {
    exportToCSV('cost_and_carbon_hourly_ledger', hourlyBreakdown);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Cost & Carbon Emission Analytics</h2>
          <p className="text-xs text-secondary mt-0.5">
            Time-of-Use (ToD) tariff optimization, grid arbitrage accounting, and decarbonization ledger.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-elevated hover:border-accent-cyan/50 text-xs font-medium text-secondary hover:text-primary transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Row of 5 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiCard
          label="Total Energy Cost"
          value={formatRupees(kpis.energyCostINR, true)}
          status="Estimated"
          tooltipText="Aggregate daily energy procurement expenditure"
        />
        <KpiCard
          label="Estimated Cost Savings"
          value={formatRupees(kpis.costSavingsINR, true)}
          delta={26.7}
          status="Estimated"
          sparklineColor="#2ED47A"
          tooltipText="Savings achieved via battery arbitrage & EV peak-shifting"
        />
        <KpiCard
          label="Renewable Utilisation"
          value={kpis.renewableUtilPct}
          unit="%"
          delta={12.4}
          status="Measured"
          sparklineColor="#22D3EE"
          tooltipText="Percentage of total load served directly by zero-carbon renewables"
        />
        <KpiCard
          label="CO₂ Avoided"
          value={kpis.co2AvoidedTons}
          unit="t CO₂"
          delta={15.2}
          status="Estimated"
          sparklineColor="#2ED47A"
          tooltipText="Tons of carbon emissions avoided compared to baseline grid mix"
        />
        <KpiCard
          label="Peak Grid Demand"
          value={kpis.peakDemandMW}
          unit="MW"
          delta={-14.8}
          isNegativeGood={true}
          status="Measured"
          sparklineColor="#F5B83D"
          tooltipText="Maximum recorded instantaneous substation draw"
        />
      </div>

      {/* Charts: Baseline vs Optimized Cost & Cumulative Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-8">
          <CardHeader
            title="Hourly Baseline vs Optimized Energy Expenditure (₹)"
            subtitle="Overlay showing ToD peak tariff surge avoidance (18:00 - 22:00)"
          />
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyBreakdown} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <XAxis dataKey="timestamp" stroke={chartColors.axisText} fontSize={11} tickLine={false} dy={8} />
                <YAxis stroke={chartColors.axisText} fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface/95 border border-border p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                          <div className="font-bold text-primary border-b border-border/50 pb-1">{label} IST</div>
                          {payload.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between gap-4" style={{ color: p.color }}>
                              <span>{p.name}:</span>
                              <span className="font-semibold">{formatRupees(p.value)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />

                <Bar dataKey="baselineCostINR" fill="#5F6E8A" opacity={0.4} name="Baseline Cost" />
                <Bar dataKey="optimizedCostINR" fill={chartColors.accentGreen} opacity={0.8} name="Optimized Cost" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3">
            <AssumptionNote
              note="Estimated from configured tariff and emission factor, not measured savings. Excludes statutory wheeling charges."
              type="estimated"
            />
          </div>
        </Card>

        {/* Cumulative Savings Line */}
        <Card className="lg:col-span-4">
          <CardHeader
            title="Cumulative Daily Savings (₹)"
            subtitle="Accrued economic benefit across 24h"
          />
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyBreakdown} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <XAxis dataKey="timestamp" stroke={chartColors.axisText} fontSize={11} tickLine={false} dy={8} />
                <YAxis stroke={chartColors.axisText} fontSize={11} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="cumulativeSavingsINR" stroke={chartColors.accentCyan} strokeWidth={2.5} dot={false} name="Accrued Savings (₹)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Editable Tariff & Emission Factors Card */}
      <Card>
        <CardHeader
          title="Editable Tariff Schedule & Carbon Intensity Parameters"
          subtitle="Configure Time-of-Day (ToD) tariff bands (₹/kWh) and regional grid emission factors (gCO₂/kWh)"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NumberField
            label="Off-Peak Band (22:00 - 06:00)"
            value={offPeakTariff}
            step={0.1}
            unit="₹/kWh"
            onChange={(v) => setOffPeakTariff(v)}
          />
          <NumberField
            label="Normal Daytime Band (06:00 - 18:00)"
            value={normalTariff}
            step={0.1}
            unit="₹/kWh"
            onChange={(v) => setNormalTariff(v)}
          />
          <NumberField
            label="Evening Peak Surcharge (18:00 - 22:00)"
            value={peakTariff}
            step={0.1}
            unit="₹/kWh"
            onChange={(v) => setPeakTariff(v)}
          />
          <NumberField
            label="Grid Emission Factor"
            value={emissionFactor}
            step={10}
            unit="gCO₂/kWh"
            onChange={(v) => setEmissionFactor(v)}
          />
        </div>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useUiStore } from '../../store/uiStore';
import { Card, CardHeader } from '../../components/ui/Card';
import { Heatmap } from '../../components/charts/Heatmap';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { KpiCard } from '../../components/ui/KpiCard';
import { LoadingSkeleton, ErrorState } from '../../components/ui/StateBanners';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { formatRupees } from '../../lib/formatters';
import { Car, Zap, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { chartColors } from '../../lib/chartColors';

export const EvManagementPage: React.FC = () => {
  const { selectedLocationId } = useUiStore();
  const [selectedStationId, setSelectedStationId] = useState<string>('ev-1');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ev-management', selectedLocationId],
    queryFn: () => apiClient.getEvManagement(selectedLocationId),
  });

  if (isLoading) return <LoadingSkeleton rows={4} height="h-32" />;
  if (isError || !data) {
    return (
      <ErrorState
        title="EV Telemetry Link Down"
        message={(error as Error)?.message || 'OCPP broker communication timed out.'}
        onRetry={() => refetch()}
      />
    );
  }

  const { stations, heatmap, scheduleComparison, metrics } = data;
  const activeStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">EV Fleet & Station Load Management</h2>
          <p className="text-xs text-secondary mt-0.5">
            Smart charging schedule shifting, OCPP station utilization, and renewable alignment.
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Peak Load Reduction"
          value={metrics.peakReductionPct}
          unit="%"
          delta={metrics.peakReductionPct}
          status="Stable"
          tooltipText="Peak shaving achieved by shifting non-critical EV charging sessions"
        />
        <KpiCard
          label="Renewable Solar Share"
          value={metrics.renewableSharePct}
          unit="%"
          delta={18.4}
          status="Measured"
          tooltipText="Proportion of total EV charging energy directly sourced from local solar/wind"
        />
        <KpiCard
          label="Avoided Peak Tariff Surcharge"
          value={formatRupees(metrics.costSavingsINR)}
          delta={24.2}
          status="Estimated"
          tooltipText="Net financial savings from avoiding evening ToD peak tariff rates (₹11.50/kWh)"
        />
      </div>

      {/* Station Cards Grid */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-secondary uppercase tracking-wider">
          Connected Public & Depot Charging Hubs
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {stations.map((st) => {
            const isSelected = st.id === selectedStationId;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStationId(st.id)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-elevated border-accent-cyan shadow-md'
                    : 'bg-surface border-border hover:border-border/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <StatusBadge status={st.status} size="sm" />
                    <span className="font-mono text-[11px] text-muted">{st.chargers} Guns</span>
                  </div>
                  <h4 className="text-xs font-semibold text-primary">{st.name}</h4>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-secondary flex justify-between">
                  <span>Utilization: <strong className="font-mono text-primary">{st.utilizationPct}%</strong></span>
                  <span>Peak: <strong className="font-mono text-accent-amber">{st.peakLoadKW} kW</strong></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optimized Schedule: Original vs Shifted Load */}
      <Card>
        <CardHeader
          title="Dynamic Load Shifting: Unmanaged vs Optimized Charging (kW)"
          subtitle="Shifts high-power EV demand out of the 18:00 - 21:00 peak deficit into midday solar generation"
        />
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={scheduleComparison} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="solarAvail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.solar} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColors.solar} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" stroke={chartColors.axisText} fontSize={11} tickLine={false} dy={8} />
              <YAxis stroke={chartColors.axisText} fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface/95 border border-border p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                        <div className="font-bold text-primary border-b border-border/50 pb-1">{label} IST</div>
                        {payload.map((p: any, i: number) => (
                          <div key={i} className="flex justify-between gap-4" style={{ color: p.color }}>
                            <span>{p.name}:</span>
                            <span className="font-semibold">{p.value.toLocaleString()} kW</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />

              <Area type="monotone" dataKey="renewableAvailableKW" stroke={chartColors.solar} strokeWidth={1} fill="url(#solarAvail)" name="Available Renewable (kW)" />
              <Line type="monotone" dataKey="originalKW" stroke={chartColors.deficit} strokeWidth={2} strokeDasharray="4 4" dot={false} name="Original Unmanaged Draw" />
              <Line type="monotone" dataKey="shiftedKW" stroke={chartColors.accentGreen} strokeWidth={2.5} dot={{ r: 2 }} name="Optimized Scheduled Draw" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3">
          <AssumptionNote
            note="Based on dynamic OCPP 2.0.1 smart charging profiles with 65% commercial fleet flexibility participation."
            type="estimated"
          />
        </div>
      </Card>

      {/* Heatmap */}
      <Heatmap data={heatmap} title="Fleet Charging Density Matrix (Hour × Weekday)" unit="kW" />
    </div>
  );
};

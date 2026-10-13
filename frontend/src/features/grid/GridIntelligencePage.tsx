import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useUiStore } from '../../store/uiStore';
import { Card, CardHeader } from '../../components/ui/Card';
import { RiskTimeline } from '../../components/ui/RiskTimeline';
import { ImbalanceBarChart } from '../../components/charts/BarChart';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SliderField } from '../../components/ui/FormControls';
import { LoadingSkeleton, ErrorState } from '../../components/ui/StateBanners';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { ChevronDown, ChevronUp, ShieldAlert, Sparkles, Filter, Info } from 'lucide-react';
import { GridAlert } from '../../types';

export const GridIntelligencePage: React.FC = () => {
  const { selectedLocationId, powerUnit } = useUiStore();

  // Configurable threshold sliders
  const [shortageThresholdMW, setShortageThresholdMW] = useState(-20);
  const [surplusThresholdMW, setSurplusThresholdMW] = useState(30);
  const [reserveMarginPct, setReserveMarginPct] = useState(15);

  // Expanded "Why?" states
  const [expandedWhyIds, setExpandedWhyIds] = useState<Record<string, boolean>>({});

  // Alert filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['grid-intelligence', selectedLocationId],
    queryFn: () => apiClient.getGridImbalance(selectedLocationId),
  });

  const toggleWhy = (id: string) => {
    setExpandedWhyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Recompute timeline based on live slider thresholds
  const dynamicTimeline = useMemo(() => {
    if (!data) return [];
    return data.riskTimeline.map((item) => {
      let risk = item.risk;
      const margin = item.marginMW;
      if (item.hour >= 18 && item.hour <= 21 && margin > Math.abs(shortageThresholdMW)) {
        risk = 'critical';
      } else if (margin > surplusThresholdMW) {
        risk = 'watch';
      } else if (reserveMarginPct > 20 && margin < 5) {
        risk = 'watch';
      }
      return {
        ...item,
        risk,
      };
    });
  }, [data, shortageThresholdMW, surplusThresholdMW, reserveMarginPct]);

  // Filter alert history
  const filteredAlerts = useMemo(() => {
    if (!data) return [];
    if (severityFilter === 'all') return data.alertHistory;
    return data.alertHistory.filter((a) => a.severity === severityFilter);
  }, [data, severityFilter]);

  const alertColumns: Column<GridAlert>[] = [
    { key: 'timestamp', label: 'Timestamp', sortable: true },
    {
      key: 'severity',
      label: 'Severity',
      render: (row) => <StatusBadge status={row.severity} size="sm" />,
    },
    { key: 'type', label: 'Alert Type', sortable: true },
    { key: 'title', label: 'Operational Event', sortable: false },
    { key: 'cause', label: 'Root Cause Trigger', sortable: false },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className="capitalize px-2 py-0.5 rounded text-[10px] bg-base border border-border">
          {row.status}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={2} height="h-28" />
        <LoadingSkeleton rows={2} height="h-56" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Grid Telemetry Unavailable"
        message={(error as Error)?.message || 'Failed to query state load dispatch center.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Grid Intelligence & Risk Assessment</h2>
          <p className="text-xs text-secondary mt-0.5">
            48-hour probabilistic stability timeline, imbalance tracking, and dispatch decision recommendations.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-base border border-border text-[11px] text-muted">
          <Info className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Forecast-based risk indicators, not actual grid faults.</span>
        </div>
      </div>

      {/* Threshold Sliders Control Bar */}
      <Card className="bg-surface/80 border-border">
        <div className="text-xs font-semibold text-primary mb-3 flex items-center justify-between">
          <span>Configurable Grid Risk Sensitivity Thresholds</span>
          <span className="text-[11px] text-muted font-normal">Adjust sliders to dynamically recompute 48h risk blocks</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SliderField
            label="Shortage Alert Trigger"
            value={shortageThresholdMW}
            min={-50}
            max={-5}
            step={5}
            unit="MW"
            defaultValue={-20}
            onChange={(v) => setShortageThresholdMW(v)}
          />
          <SliderField
            label="Curtailment / Surplus Trigger"
            value={surplusThresholdMW}
            min={10}
            max={60}
            step={5}
            unit="MW"
            defaultValue={30}
            onChange={(v) => setSurplusThresholdMW(v)}
          />
          <SliderField
            label="Minimum Reserve Margin"
            value={reserveMarginPct}
            min={5}
            max={30}
            step={1}
            unit="%"
            defaultValue={15}
            onChange={(v) => setReserveMarginPct(v)}
          />
        </div>
      </Card>

      {/* 48-Hour Risk Timeline Strip */}
      <Card>
        <CardHeader
          title="48-Hour Grid Operational Risk Timeline"
          subtitle="Continuous hourly stability evaluation (Click or hover any block to inspect margins and root cause)"
        />
        <RiskTimeline blocks={dynamicTimeline} />
      </Card>

      {/* 2-Column: Imbalance Chart + Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Net Imbalance: 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader
              title="Next 24h Net Generation vs Demand Imbalance"
              subtitle="Hourly energy balance variance in MW (Surplus vs Deficit)"
              actions={
                <span className="text-xs font-mono text-muted bg-base px-2 py-0.5 rounded border border-border">
                  Unit: {powerUnit}
                </span>
              }
            />
            <ImbalanceBarChart
              data={data.hourlyImbalance}
              unit={powerUnit}
              height={260}
            />
            <div className="mt-3">
              <AssumptionNote
                note="Calculated as (Predicted Solar + Predicted Wind - Predicted Demand). Negative bars indicate hours where reserve dispatch or load curtailment is required."
                type="simulated"
              />
            </div>
          </Card>
        </div>

        {/* Recommended Actions: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader
                title="Recommended Dispatch Actions"
                subtitle="Optimized mitigation measures generated by Voltaris AI"
              />
              <div className="space-y-3">
                {data.recommendations.map((rec) => {
                  const isExpanded = expandedWhyIds[rec.id];
                  return (
                    <div
                      key={rec.id}
                      className="p-3 rounded-lg bg-base border border-border/80 space-y-2 transition-colors hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={rec.priority} size="sm" />
                          <h4 className="text-xs font-semibold text-primary">{rec.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-accent-cyan whitespace-nowrap">
                          ±{rec.impactMW} MW
                        </span>
                      </div>
                      <p className="text-xs text-secondary leading-relaxed">{rec.action}</p>

                      {/* "Why?" Expander Button */}
                      <button
                        type="button"
                        onClick={() => toggleWhy(rec.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-accent-cyan hover:underline font-medium focus:outline-none"
                      >
                        <span>{isExpanded ? 'Hide explanation' : 'Why this recommendation?'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <div className="p-2.5 rounded bg-elevated/70 border border-border text-[11px] text-muted space-y-1 animate-fadeIn">
                          <div className="font-semibold text-secondary">Operational Rationale:</div>
                          <p>{rec.why}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pt-3 border-t border-border/40 mt-3 text-[11px] text-muted">
              Actions labeled <strong>Recommendation (not executed)</strong>. Operator authorization required.
            </div>
          </Card>
        </div>
      </div>

      {/* Alert History Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/50 mb-4 gap-2">
          <div>
            <h3 className="text-base font-semibold text-primary">Grid Alert & Stability History</h3>
            <p className="text-xs text-secondary mt-0.5">Filterable log of automated advisory alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-base border border-border rounded-lg px-2.5 py-1 text-xs text-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="watch">Watch Only</option>
              <option value="stable">Stable Only</option>
            </select>
          </div>
        </div>

        <DataTable
          data={filteredAlerts as unknown as Record<string, unknown>[]}
          columns={alertColumns as unknown as Column<Record<string, unknown>>[]}
          pageSize={5}
          searchPlaceholder="Search alert cause, type, or event..."
          exportFilename={`grid_alerts_${selectedLocationId}`}
        />
      </Card>
    </div>
  );
};

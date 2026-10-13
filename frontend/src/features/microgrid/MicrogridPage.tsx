import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { MicrogridPlan, CriticalLoad } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { NumberField, SelectField } from '../../components/ui/FormControls';
import { DataTable, Column } from '../../components/ui/DataTable';
import { LoadingSkeleton, ErrorState } from '../../components/ui/StateBanners';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { ShieldCheck, Plus, Trash2, BatteryCharging, Zap, Save, CheckCircle2 } from 'lucide-react';
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

const INITIAL_CRITICAL_LOADS: CriticalLoad[] = [
  { id: '1', name: 'Server Farm & Telecom Data Centers', powerKW: 45, priority: 'Critical (Tier 1)' },
  { id: '2', name: 'Emergency Hospital & ICUs', powerKW: 60, priority: 'Critical (Tier 1)' },
  { id: '3', name: 'Water Pumping & Fire Suppression', powerKW: 30, priority: 'Essential (Tier 2)' },
  { id: '4', name: 'HVAC & Administrative Lighting', powerKW: 75, priority: 'Flexible (Tier 3)' },
];

export const MicrogridPage: React.FC = () => {
  const [facilityType, setFacilityType] = useState<'Campus' | 'Industrial' | 'Residential society' | 'Village'>('Campus');
  const [solarKW, setSolarKW] = useState<number>(300);
  const [windKW, setWindKW] = useState<number>(50);
  const [batteryKWh, setBatteryKWh] = useState<number>(500);
  const [criticalLoads, setCriticalLoads] = useState<CriticalLoad[]>(INITIAL_CRITICAL_LOADS);

  const [savedPlans, setSavedPlans] = useState<string[]>(['Campus Standard Resilience', 'Monsoon Microgrid Backup']);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['microgrid', facilityType, solarKW, windKW, batteryKWh, criticalLoads],
    queryFn: () =>
      apiClient.simulateMicrogrid({
        facilityType,
        solarKW,
        windKW,
        batteryKWh,
        criticalLoads,
      }),
  });

  const handleAddLoad = () => {
    const newId = String(Date.now());
    setCriticalLoads([
      ...criticalLoads,
      { id: newId, name: 'Auxiliary Cooling Circuit', powerKW: 25, priority: 'Flexible (Tier 3)' },
    ]);
  };

  const handleRemoveLoad = (id: string) => {
    setCriticalLoads(criticalLoads.filter((l) => l.id !== id));
  };

  const loadColumns: Column<CriticalLoad>[] = [
    { key: 'name', label: 'Circuit / Facility Load' },
    {
      key: 'powerKW',
      label: 'Demand (kW)',
      render: (r) => `${r.powerKW} kW`,
    },
    {
      key: 'priority',
      label: 'Resilience Priority',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            r.priority.includes('Tier 1')
              ? 'bg-accent-green/15 text-accent-green border border-accent-green/30'
              : r.priority.includes('Tier 2')
              ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
              : 'bg-base text-muted border border-border'
          }`}
        >
          {r.priority}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Action',
      render: (r) => (
        <button
          type="button"
          onClick={() => handleRemoveLoad(r.id)}
          className="text-muted hover:text-accent-red transition-colors p-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton rows={4} height="h-32" />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Microgrid Simulation Failed"
        message={(error as Error)?.message || 'Islanding solver timed out.'}
        onRetry={() => refetch()}
      />
    );
  }

  const { results } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Microgrid Resilience Planner</h2>
          <p className="text-xs text-secondary mt-0.5">
            Islanded grid sizing, critical-tier load rationing, and autonomous blackout survivability calculation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const name = `${facilityType} (${batteryKWh}kWh)`;
              setSavedPlans([...savedPlans, name]);
              alert(`Microgrid Plan "${name}" saved!`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-elevated hover:border-accent-cyan/50 text-xs font-medium text-secondary hover:text-primary transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Top 2 Columns: Facility Sizing Inputs + Backup Duration Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sizing Inputs: 7 cols */}
        <Card className="lg:col-span-7 space-y-4">
          <CardHeader
            title="Facility Architecture & Generation Sizing"
            subtitle="Configure local distributed generation and battery storage"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Facility Installation Type"
              value={facilityType}
              options={[
                { value: 'Campus', label: 'University / Healthcare Campus' },
                { value: 'Industrial', label: 'Continuous Process Industrial Plant' },
                { value: 'Residential society', label: 'Residential Microgrid Society' },
                { value: 'Village', label: 'Rural Islanded Remote Village' },
              ]}
              onChange={(v) => setFacilityType(v as any)}
            />
            <NumberField
              label="Rooftop Solar PV Array"
              value={solarKW}
              min={50}
              max={2000}
              step={25}
              unit="kW"
              onChange={(v) => setSolarKW(v)}
            />
            <NumberField
              label="Small Wind Generation"
              value={windKW}
              min={0}
              max={500}
              step={10}
              unit="kW"
              onChange={(v) => setWindKW(v)}
            />
            <NumberField
              label="Dedicated Battery Bank"
              value={batteryKWh}
              min={100}
              max={5000}
              step={50}
              unit="kWh"
              onChange={(v) => setBatteryKWh(v)}
            />
          </div>
        </Card>

        {/* Hero Backup Duration: 5 cols */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl border border-border bg-gradient-to-br from-surface to-elevated shadow-card">
          <div>
            <div className="flex items-center justify-between text-xs text-secondary mb-2">
              <span className="font-semibold uppercase tracking-wider text-muted font-mono">Autonomous Resilience</span>
              <ShieldCheck className="w-5 h-5 text-accent-green" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-primary font-mono tracking-tight">
                {results.backupDurationHours}
              </span>
              <span className="text-sm font-semibold text-accent-cyan font-mono">Hours Autonomy</span>
            </div>
            <p className="text-xs text-secondary mt-2 leading-relaxed">
              In the event of complete grid disconnection (islanding mode), the modeled BESS can sustain all Tier 1 & Tier 2 critical loads continuously.
            </p>
          </div>

          <div className="pt-3 border-t border-border/50 mt-4 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-secondary">
              <span>Daily Solar Generation:</span>
              <span className="text-primary font-bold">{results.solarGenerationKWh} kWh/day</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>Tier 1 Protected Load:</span>
              <span className="text-accent-green font-bold">105 kW (100% Online)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Load Priority Table */}
      <Card>
        <CardHeader
          title="Critical Load Rationing & Circuit Priority List"
          subtitle="During shortage, loads are shed in inverse priority order (Tier 3 flexible loads shed first)"
          actions={
            <button
              type="button"
              onClick={handleAddLoad}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-base hover:bg-elevated border border-border text-xs font-medium text-accent-cyan transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Circuit</span>
            </button>
          }
        />
        <DataTable
          data={criticalLoads as unknown as Record<string, unknown>[]}
          columns={loadColumns as unknown as Column<Record<string, unknown>>[]}
          pageSize={5}
          searchPlaceholder="Search circuit..."
        />
      </Card>

      {/* Chart: Supply vs Demand & Battery Reserve Curve */}
      <Card>
        <CardHeader
          title="24-Hour Islanded Supply vs Demand & Battery State"
          subtitle="Simulates a 24-hour blackout condition to evaluate system survivability"
        />
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={results.supplyDemand} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <XAxis dataKey="hour" stroke={chartColors.axisText} fontSize={11} tickLine={false} tickFormatter={(h) => `${h}:00`} dy={8} />
              <YAxis stroke={chartColors.axisText} fontSize={11} tickLine={false} unit=" kW" />
              <Tooltip labelFormatter={(h) => `${h}:00 IST`} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />

              <Area type="monotone" dataKey="supplyKW" stroke={chartColors.solar} fill={chartColors.solarFill} name="Local Renewable Supply (kW)" />
              <Line type="monotone" dataKey="demandKW" stroke={chartColors.demand} strokeWidth={2} dot={false} name="Total Critical Demand (kW)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Operating Plan Advice */}
      <Card>
        <CardHeader
          title="Suggested Operating Dispatch Plan"
          subtitle="Autonomous islanding rules for facility electrical engineering team"
        />
        <div className="space-y-2 text-xs text-secondary">
          {results.suggestedOperatingPlan.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-base p-2.5 rounded border border-border/60">
              <CheckCircle2 className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../services/api/apiClient';
import { ScenarioInputs, ScenarioResult } from '../../types';
import { Card, CardHeader } from '../../components/ui/Card';
import { SliderField, SelectField } from '../../components/ui/FormControls';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { formatRupees } from '../../lib/formatters';
import { exportToCSV } from '../../lib/csv';
import {
  RotateCcw,
  BookmarkCheck,
  Download,
  Share2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { chartColors } from '../../lib/chartColors';

const BASELINE_INPUTS: ScenarioInputs = {
  solarPct: 100,
  windPct: 100,
  evDemandPct: 100,
  baseDemandPct: 100,
  batteryCapacityKWh: 4000,
  batteryCurrentSoC: 72,
  weatherPreset: 'Clear',
  priceMultiplier: 1.0,
};

export const ScenarioSimulatorPage: React.FC = () => {
  const [inputs, setInputs] = useState<ScenarioInputs>(BASELINE_INPUTS);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<{ name: string; result: ScenarioResult }[]>([]);

  // Instant calculation via API simulator (debounced 250ms)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await apiClient.simulateScenario(inputs);
      setResult(res);
    }, 250);
    return () => clearTimeout(timer);
  }, [inputs]);

  const handleReset = () => {
    setInputs(BASELINE_INPUTS);
  };

  const handleSaveScenario = () => {
    if (!result) return;
    const name = `Scenario ${savedScenarios.length + 1} (${inputs.weatherPreset}, Sol:${inputs.solarPct}%)`;
    setSavedScenarios([...savedScenarios, { name, result }]);
  };

  const handleExport = () => {
    if (!result) return;
    exportToCSV('scenario_simulation_results', result.overlay);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Scenario & Stress Simulator</h2>
          <p className="text-xs text-secondary mt-0.5">
            Real-time sensitivity analysis, extreme weather simulations, and tariff volatility stress tests. Zero hardcoded values.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-base hover:bg-elevated text-xs font-medium text-secondary hover:text-primary transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
          <button
            type="button"
            onClick={handleSaveScenario}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-elevated hover:border-accent-cyan/50 text-xs font-medium text-secondary hover:text-primary transition-colors"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Save Scenario</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan hover:bg-cyan-400 text-xs font-semibold text-black transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column: Left Controls (5 cols) + Right Live Results (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Control Panel: 5 cols */}
        <Card className="lg:col-span-5 space-y-4">
          <CardHeader
            title="Simulation Variables & Levers"
            subtitle="Parameters recalculate downstream power flows instantly"
          />

          <div className="space-y-4">
            <SelectField
              label="Weather Preset Scenario"
              value={inputs.weatherPreset}
              options={[
                { value: 'Clear', label: 'Clear Sky (Standard Optimum)' },
                { value: 'Cloudy', label: 'Monsoon Overcast (-55% Solar, +15% Wind)' },
                { value: 'Storm', label: 'Cyclonic Squall (-80% Solar, +45% Wind)' },
                { value: 'Heatwave', label: 'Severe Summer Heatwave (+10% Solar, -25% Wind)' },
              ]}
              onChange={(val) => setInputs({ ...inputs, weatherPreset: val as any })}
            />

            <SliderField
              label="Solar PV Generation Capacity"
              value={inputs.solarPct}
              min={20}
              max={200}
              step={5}
              unit="%"
              defaultValue={100}
              onChange={(v) => setInputs({ ...inputs, solarPct: v })}
            />

            <SliderField
              label="Wind Turbine Capacity"
              value={inputs.windPct}
              min={20}
              max={200}
              step={5}
              unit="%"
              defaultValue={100}
              onChange={(v) => setInputs({ ...inputs, windPct: v })}
            />

            <SliderField
              label="Grid Base Demand Scaling"
              value={inputs.baseDemandPct}
              min={50}
              max={160}
              step={5}
              unit="%"
              defaultValue={100}
              onChange={(v) => setInputs({ ...inputs, baseDemandPct: v })}
            />

            <SliderField
              label="EV Fleet Charging Adoption"
              value={inputs.evDemandPct}
              min={50}
              max={250}
              step={10}
              unit="%"
              defaultValue={100}
              onChange={(v) => setInputs({ ...inputs, evDemandPct: v })}
            />

            <SliderField
              label="Battery Storage Capacity"
              value={inputs.batteryCapacityKWh}
              min={1000}
              max={15000}
              step={500}
              unit="kWh"
              defaultValue={4000}
              onChange={(v) => setInputs({ ...inputs, batteryCapacityKWh: v })}
            />

            <SliderField
              label="Grid Electricity Price Multiplier"
              value={inputs.priceMultiplier}
              min={0.5}
              max={3.0}
              step={0.1}
              unit="x"
              defaultValue={1.0}
              onChange={(v) => setInputs({ ...inputs, priceMultiplier: v })}
            />
          </div>

          <div className="pt-2">
            <AssumptionNote
              note="Calculations dynamically executed in browser client sandbox via physical thermodynamic models."
              type="simulated"
            />
          </div>
        </Card>

        {/* Right Live Results: 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          {result && (
            <>
              {/* Comparison KPI Deltas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-[11px] font-sans text-muted block">Total Cost Delta</span>
                  <div className={`text-base font-bold flex items-center gap-0.5 mt-0.5 ${
                    result.deltas.costDeltaPct > 0 ? 'text-accent-red' : 'text-accent-green'
                  }`}>
                    {result.deltas.costDeltaPct > 0 ? '+' : ''}{result.deltas.costDeltaPct}%
                  </div>
                  <span className="text-[10px] text-muted font-sans">
                    {formatRupees(result.scenario.totalCostINR)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-[11px] font-sans text-muted block">Peak Demand</span>
                  <div className="text-base font-bold text-primary mt-0.5">
                    {result.scenario.peakDemandMW} MW
                  </div>
                  <span className="text-[10px] text-muted font-sans">
                    Δ {result.deltas.peakDeltaPct > 0 ? '+' : ''}{result.deltas.peakDeltaPct}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-[11px] font-sans text-muted block">Renewable Share</span>
                  <div className="text-base font-bold text-accent-cyan mt-0.5">
                    {result.scenario.renewableUtilPct}%
                  </div>
                  <span className="text-[10px] text-muted font-sans">
                    Δ {result.deltas.renewableDeltaPct > 0 ? '+' : ''}{result.deltas.renewableDeltaPct}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-[11px] font-sans text-muted block">Shortage Hours</span>
                  <div className={`text-base font-bold mt-0.5 ${
                    result.scenario.shortageHours > 0 ? 'text-accent-red' : 'text-accent-green'
                  }`}>
                    {result.scenario.shortageHours} hrs
                  </div>
                  <span className="text-[10px] text-muted font-sans">
                    Surplus: {result.scenario.surplusHours}h
                  </span>
                </div>
              </div>

              {/* Overlay Chart */}
              <Card>
                <CardHeader
                  title="Baseline vs Scenario Dynamic Overlay"
                  subtitle="Solid: Scenario with live variable adjustments. Dotted: Standard baseline profile"
                />
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.overlay} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                      <XAxis dataKey="timestamp" stroke={chartColors.axisText} fontSize={11} tickLine={false} dy={8} />
                      <YAxis stroke={chartColors.axisText} fontSize={11} tickLine={false} unit=" MW" />
                      <Tooltip
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-surface/95 border border-border p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                                <div className="font-bold text-primary border-b border-border/50 pb-1">{label} IST</div>
                                {payload.map((p: any, i: number) => (
                                  <div key={i} className="flex justify-between gap-4" style={{ color: p.color }}>
                                    <span>{p.name}:</span>
                                    <span className="font-semibold">{p.value} MW</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />

                      <Line type="monotone" dataKey="baselineDemandMW" stroke={chartColors.demand} strokeDasharray="3 3" dot={false} name="Baseline Demand" />
                      <Line type="monotone" dataKey="scenarioDemandMW" stroke={chartColors.ev} strokeWidth={2.5} dot={false} name="Scenario Demand" />
                      <Line type="monotone" dataKey="baselineGenerationMW" stroke={chartColors.solar} strokeDasharray="3 3" dot={false} name="Baseline Generation" />
                      <Line type="monotone" dataKey="scenarioGenerationMW" stroke={chartColors.accentGreen} strokeWidth={2.5} dot={false} name="Scenario Generation" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Recommended Mitigation Measures */}
              <Card>
                <CardHeader
                  title="Dynamic Stress Response Recommendations"
                  subtitle="Automated dispatch directives derived from simulated grid stress"
                />
                <div className="space-y-2 text-xs">
                  {result.recommendedActions.map((act, i) => (
                    <div key={i} className="flex items-start gap-2 bg-base p-2.5 rounded-lg border border-border/70 text-secondary">
                      <Sparkles className="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Saved Scenarios Side-by-Side if any */}
          {savedScenarios.length > 0 && (
            <Card>
              <CardHeader
                title={`Saved Scenarios (${savedScenarios.length})`}
                subtitle="Side-by-side comparison snapshots"
              />
              <div className="space-y-2">
                {savedScenarios.map((sc, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-base border border-border flex items-center justify-between text-xs font-mono">
                    <span className="font-sans font-medium text-primary">{sc.name}</span>
                    <span className="text-secondary">
                      Cost: {formatRupees(sc.result.scenario.totalCostINR)} | Peak: {sc.result.scenario.peakDemandMW} MW
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

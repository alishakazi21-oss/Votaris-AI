import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useUiStore } from '../../store/uiStore';
import { Card, CardHeader } from '../../components/ui/Card';
import { LoadingSkeleton, ErrorState, ApiUnavailableBanner } from '../../components/ui/StateBanners';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { Cloud, Sun, Wind, Droplets, Thermometer, AlertTriangle, Sparkles } from 'lucide-react';
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

export const WeatherIntelligencePage: React.FC = () => {
  const { selectedLocationId, selectedLocation } = useUiStore();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['weather', selectedLocationId],
    queryFn: () => apiClient.getWeather(selectedLocationId),
  });

  if (isLoading) return <LoadingSkeleton rows={4} height="h-28" />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Weather Satellite Feed Unavailable"
        message={(error as Error)?.message || 'NWP data stream error.'}
        onRetry={() => refetch()}
      />
    );
  }

  const { hourly, solarImpactPct, windImpactPct, alerts, isDemoWeather } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Weather & Microclimate Intelligence</h2>
          <p className="text-xs text-secondary mt-0.5">
            Numerical Weather Prediction (NWP), satellite irradiance feeds, and atmospheric renewable derating models for{' '}
            <strong className="text-accent-cyan">{selectedLocation.name}</strong>.
          </p>
        </div>
      </div>

      {/* Demo Weather Mode Banner */}
      {isDemoWeather && (
        <div className="p-3 rounded-lg border border-accent-amber/30 bg-accent-amber/10 text-xs text-accent-amber flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 shrink-0" />
            <span>
              <strong>Physical NWP Simulation Active:</strong> OpenWeather/IMD API key not configured in settings. Operating in deterministic simulated microclimate mode.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-accent-amber/20">
            Simulated
          </span>
        </div>
      )}

      {/* Generation Impact Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-secondary font-sans mb-1">
            <span>Solar Yield Impact</span>
            <Sun className="w-4 h-4 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold text-accent-red">{solarImpactPct}%</div>
          <span className="text-[11px] text-muted font-sans">Due to afternoon cloud cover at 14:00</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-secondary font-sans mb-1">
            <span>Wind Velocity Impact</span>
            <Wind className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="text-2xl font-bold text-accent-green">+{windImpactPct}%</div>
          <span className="text-[11px] text-muted font-sans">Nocturnal coastal thermal gradient</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-secondary font-sans mb-1">
            <span>Peak Irradiance (GHI)</span>
            <Thermometer className="w-4 h-4 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold text-primary">840 W/m²</div>
          <span className="text-[11px] text-muted font-sans">Solar noon (12:30 IST)</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-secondary font-sans mb-1">
            <span>Avg Surface Temp</span>
            <Droplets className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="text-2xl font-bold text-primary">31.4 °C</div>
          <span className="text-[11px] text-muted font-sans">Panel thermal derate: -2.1%</span>
        </div>
      </div>

      {/* Shared Time-Axis Chart: Atmospheric Telemetry vs Renewable Output */}
      <Card>
        <CardHeader
          title="24-Hour Microclimate Atmospheric Variables & Renewable Generation"
          subtitle="Top: Irradiance (W/m²), Cloud Cover (%), and Wind Speed (km/h). Bottom: Resulting Solar and Wind output (MW)"
        />
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourly} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <XAxis dataKey="timestamp" stroke={chartColors.axisText} fontSize={11} tickLine={false} dy={8} />
              <YAxis yAxisId="power" stroke={chartColors.solar} fontSize={11} tickLine={false} unit=" MW" />
              <YAxis yAxisId="env" orientation="right" stroke={chartColors.axisText} fontSize={11} tickLine={false} unit="" />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface/95 border border-border p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                        <div className="font-bold text-primary border-b border-border/50 pb-1">{label} IST</div>
                        {payload.map((p: any, i: number) => (
                          <div key={i} className="flex justify-between gap-4" style={{ color: p.color }}>
                            <span>{p.name}:</span>
                            <span className="font-semibold">{p.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />

              <Area yAxisId="power" type="monotone" dataKey="expectedSolarMW" stroke={chartColors.solar} fill={chartColors.solarFill} name="Solar Output (MW)" />
              <Line yAxisId="power" type="monotone" dataKey="expectedWindMW" stroke={chartColors.wind} strokeWidth={2} dot={false} name="Wind Output (MW)" />
              <Line yAxisId="env" type="monotone" dataKey="cloudCoverPct" stroke={chartColors.deficit} strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Cloud Cover (%)" />
              <Line yAxisId="env" type="monotone" dataKey="temperatureC" stroke="#FB923C" strokeWidth={1.5} dot={false} name="Temp (°C)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Weather Risk Alerts */}
      <Card>
        <CardHeader
          title="Meteorological Energy Risk Advisories"
          subtitle="Anticipated cloud transit, ambient thermal derating, and wind ramp events"
        />
        <div className="space-y-2.5">
          {alerts.map((alt, i) => (
            <div key={i} className="p-3 rounded-lg bg-base border border-border/70 flex items-start gap-2.5 text-xs text-secondary">
              <AlertTriangle className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" />
              <span>{alt}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

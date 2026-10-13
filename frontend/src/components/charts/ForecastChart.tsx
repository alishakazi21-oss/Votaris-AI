import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
} from 'recharts';
import { chartColors } from '../../lib/chartColors';

interface ForecastDataPoint {
  timestamp: string;
  actual?: number | null;
  predicted: number;
  upperInterval?: number;
  lowerInterval?: number;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
  unit?: string;
  title?: string;
  height?: number;
  forecastDividerIndex?: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  unit = 'MW',
  height = 340,
  forecastDividerIndex,
}) => {
  // Custom Tooltip showing exact value and confidence interval
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as ForecastDataPoint;
      const lower = point.lowerInterval ?? point.predicted * 0.9;
      const upper = point.upperInterval ?? point.predicted * 1.1;
      const intervalBand = ((upper - lower) / 2).toFixed(1);

      return (
        <div className="bg-surface/95 border border-border p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
          <div className="font-semibold text-primary border-b border-border/50 pb-1 mb-1.5 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-muted">IST</span>
          </div>
          {point.actual !== null && typeof point.actual !== 'undefined' && (
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span>Actual:</span>
              <span className="font-semibold">{point.actual.toFixed(1)} {unit}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 text-accent-cyan">
            <span>AI Forecast:</span>
            <span className="font-semibold">{point.predicted.toFixed(1)} ± {intervalBand} {unit}</span>
          </div>
          <div className="text-[10px] text-muted pt-1 border-t border-border/40">
            90% CI: [{lower.toFixed(1)} - {upper.toFixed(1)} {unit}]
          </div>
        </div>
      );
    }
    return null;
  };

  const dividerTimestamp = forecastDividerIndex && data[forecastDividerIndex] ? data[forecastDividerIndex].timestamp : undefined;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.wind} stopOpacity={0.25} />
              <stop offset="95%" stopColor={chartColors.wind} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="confidenceArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.battery} stopOpacity={0.15} />
              <stop offset="100%" stopColor={chartColors.battery} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timestamp"
            stroke={chartColors.axisText}
            fontSize={11}
            tickLine={false}
            dy={8}
          />
          <YAxis
            stroke={chartColors.axisText}
            fontSize={11}
            tickLine={false}
            unit={` ${unit}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
            iconType="circle"
          />

          {dividerTimestamp && (
            <ReferenceLine
              x={dividerTimestamp}
              stroke={chartColors.accentAmber || '#F5B83D'}
              strokeDasharray="4 4"
              label={{
                value: 'Forecast Origin',
                fill: '#F5B83D',
                fontSize: 10,
                position: 'top',
              }}
            />
          )}

          {/* Confidence interval band */}
          <Area
            type="monotone"
            dataKey="upperInterval"
            stroke="transparent"
            fill="url(#confidenceArea)"
            name="Confidence Interval (90%)"
          />
          <Area
            type="monotone"
            dataKey="lowerInterval"
            stroke="transparent"
            fill="#101828"
            name="CI Floor"
            legendType="none"
          />

          {/* AI Forecast predicted line */}
          <Area
            type="monotone"
            dataKey="predicted"
            stroke={chartColors.wind}
            strokeWidth={2}
            fill="url(#forecastArea)"
            name="Predicted Generation"
          />

          {/* Actual observed line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke={chartColors.surplus}
            strokeWidth={2.5}
            dot={{ r: 3, fill: chartColors.surplus }}
            name="Actual Telemetry"
            connectNulls={false}
          />

          {/* Interactive Brush Zoom */}
          <Brush
            dataKey="timestamp"
            height={22}
            stroke={chartColors.gridLine}
            fill="#0A1020"
            travellerWidth={8}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

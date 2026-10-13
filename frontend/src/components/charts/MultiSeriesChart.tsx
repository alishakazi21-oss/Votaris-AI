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
  ReferenceLine,
} from 'recharts';
import { chartColors } from '../../lib/chartColors';

interface MultiSeriesPoint {
  timestamp: string;
  solarMW?: number;
  windMW?: number;
  totalRenewableMW?: number;
  demandMW?: number;
  predictedDemandMW?: number;
  upperConfidenceMW?: number;
  lowerConfidenceMW?: number;
  [key: string]: any;
}

interface MultiSeriesChartProps {
  data: MultiSeriesPoint[];
  unit?: string;
  height?: number;
  showStackedGen?: boolean;
}

export const MultiSeriesChart: React.FC<MultiSeriesChartProps> = ({
  data,
  unit = 'MW',
  height = 340,
  showStackedGen = true,
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/95 border border-border p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
          <div className="font-semibold text-primary border-b border-border/50 pb-1 mb-1.5 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-muted">IST</span>
          </div>
          {payload.map((entry: any, i: number) => {
            if (entry.name === 'CI Lower' || entry.dataKey === 'lowerConfidenceMW') return null;
            return (
              <div key={i} className="flex items-center justify-between gap-4" style={{ color: entry.color }}>
                <span>{entry.name}:</span>
                <span className="font-semibold">
                  {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value} {unit}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="solarArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.solar} stopOpacity={0.4} />
              <stop offset="95%" stopColor={chartColors.solar} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="windArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.wind} stopOpacity={0.4} />
              <stop offset="95%" stopColor={chartColors.wind} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="demandConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.battery} stopOpacity={0.12} />
              <stop offset="95%" stopColor={chartColors.battery} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <XAxis dataKey="timestamp" stroke={chartColors.axisText} fontSize={11} tickLine={false} dy={8} />
          <YAxis stroke={chartColors.axisText} fontSize={11} tickLine={false} unit={` ${unit}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} iconType="circle" />

          {/* Stacked generation areas or separate areas */}
          {showStackedGen ? (
            <>
              <Area
                type="monotone"
                dataKey="solarMW"
                stackId="generation"
                stroke={chartColors.solar}
                strokeWidth={1.5}
                fill="url(#solarArea)"
                name="Solar Generation"
              />
              <Area
                type="monotone"
                dataKey="windMW"
                stackId="generation"
                stroke={chartColors.wind}
                strokeWidth={1.5}
                fill="url(#windArea)"
                name="Wind Generation"
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="totalRenewableMW"
              stroke={chartColors.surplus}
              strokeWidth={2.5}
              dot={false}
              name="Renewable Total"
            />
          )}

          {/* Confidence interval band on demand */}
          <Area
            type="monotone"
            dataKey="upperConfidenceMW"
            stroke="transparent"
            fill="url(#demandConfidence)"
            name="Demand 90% CI"
          />

          {/* Actual demand line */}
          <Line
            type="monotone"
            dataKey="demandMW"
            stroke={chartColors.demand}
            strokeWidth={2.5}
            dot={{ r: 2, fill: chartColors.demand }}
            name="Grid Demand"
          />

          {/* Predicted Demand line */}
          <Line
            type="monotone"
            dataKey="predictedDemandMW"
            stroke={chartColors.accentAmber}
            strokeDasharray="4 4"
            strokeWidth={2}
            dot={false}
            name="Predicted Demand"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

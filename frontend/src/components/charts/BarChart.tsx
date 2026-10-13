import React from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { chartColors } from '../../lib/chartColors';

interface ImbalancePoint {
  timestamp: string;
  balanceMW: number;
  status?: string;
}

interface ImbalanceBarChartProps {
  data: ImbalancePoint[];
  unit?: string;
  height?: number;
  title?: string;
}

export const ImbalanceBarChart: React.FC<ImbalanceBarChartProps> = ({
  data,
  unit = 'MW',
  height = 240,
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value as number;
      const isSurplus = val >= 0;
      return (
        <div className="bg-surface/95 border border-border p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-secondary pb-1 border-b border-border/50 mb-1">{label}</div>
          <div className="flex items-center justify-between gap-4">
            <span className={isSurplus ? 'text-accent-green' : 'text-accent-red'}>
              {isSurplus ? 'Net Surplus:' : 'Net Deficit:'}
            </span>
            <span className="font-semibold text-primary">
              {isSurplus ? '+' : ''}{val.toFixed(1)} {unit}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis dataKey="timestamp" stroke={chartColors.axisText} fontSize={11} tickLine={false} dy={8} />
          <YAxis stroke={chartColors.axisText} fontSize={11} tickLine={false} unit={` ${unit}`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke={chartColors.gridLine} strokeWidth={1.5} />
          <Bar dataKey="balanceMW" radius={[3, 3, 3, 3]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.balanceMW >= 0 ? chartColors.surplus : chartColors.deficit}
              />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
};

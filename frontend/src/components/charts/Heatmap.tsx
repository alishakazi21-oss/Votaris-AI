import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface HeatmapDataPoint {
  day: string; // Mon, Tue, etc.
  hour: number; // 0..23
  demandKW: number;
}

interface HeatmapProps {
  data: HeatmapDataPoint[];
  title?: string;
  unit?: string;
  className?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  title = 'EV Charging Fleet Demand Density (Hour × Weekday)',
  unit = 'kW',
  className,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxDemand = Math.max(...data.map((d) => d.demandKW), 1);

  // Group by day
  const grid: Record<string, Record<number, number>> = {};
  for (const d of days) grid[d] = {};
  data.forEach((item) => {
    if (grid[item.day]) {
      grid[item.day][item.hour] = item.demandKW;
    }
  });

  const getCellIntensity = (val: number) => {
    const ratio = val / maxDemand;
    if (ratio > 0.8) return 'bg-accent-amber text-black';
    if (ratio > 0.55) return 'bg-amber-600/80 text-white';
    if (ratio > 0.35) return 'bg-cyan-600/70 text-white';
    if (ratio > 0.15) return 'bg-cyan-900/50 text-cyan-200';
    return 'bg-base/80 text-muted';
  };

  return (
    <div className={twMerge('space-y-3 bg-surface p-4 rounded-xl border border-border', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-primary">{title}</h4>
        <div className="flex items-center gap-2 text-[10px] text-muted">
          <span>Low</span>
          <div className="flex gap-0.5">
            <span className="w-3 h-2.5 rounded-xs bg-base border border-border" />
            <span className="w-3 h-2.5 rounded-xs bg-cyan-900/50" />
            <span className="w-3 h-2.5 rounded-xs bg-cyan-600/70" />
            <span className="w-3 h-2.5 rounded-xs bg-amber-600/80" />
            <span className="w-3 h-2.5 rounded-xs bg-accent-amber" />
          </div>
          <span>Peak</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[620px] space-y-1">
          {/* Hour labels header */}
          <div className="flex text-[10px] text-muted font-mono pl-10 pr-1">
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="flex-1 text-center">
                {h % 3 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* Rows per day */}
          {days.map((day) => (
            <div key={day} className="flex items-center gap-1">
              <span className="w-9 text-[11px] font-semibold text-secondary">{day}</span>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: 24 }).map((_, h) => {
                  const val = grid[day]?.[h] ?? 0;
                  return (
                    <button
                      key={h}
                      type="button"
                      onMouseEnter={() => setHoveredCell({ day, hour: h, demandKW: val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={clsx(
                        'flex-1 h-6 rounded-xs transition-transform duration-100 hover:scale-110 focus:outline-none cursor-pointer',
                        getCellIntensity(val)
                      )}
                      aria-label={`${day} ${h}:00 - ${val} ${unit}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hover preview tooltip */}
      <div className="h-6 flex items-center text-xs font-mono text-secondary">
        {hoveredCell ? (
          <span className="text-primary">
            {hoveredCell.day} at {hoveredCell.hour.toString().padStart(2, '0')}:00 IST →{' '}
            <strong className="text-accent-amber">{hoveredCell.demandKW.toLocaleString()} {unit}</strong>
          </span>
        ) : (
          <span className="text-[11px] text-muted">Hover over any hourly cell to inspect charging load</span>
        )}
      </div>
    </div>
  );
};

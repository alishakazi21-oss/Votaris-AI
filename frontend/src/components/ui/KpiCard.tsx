import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { Card } from './Card';
import { StatusBadge, StatusType } from './StatusBadge';
import { Tooltip } from './Tooltip';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaSuffix?: string;
  deltaPeriod?: string;
  status?: StatusType | string;
  tooltipText?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  className?: string;
  isNegativeGood?: boolean; // if true, negative delta is green (e.g. demand reduction)
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  delta,
  deltaSuffix = '%',
  deltaPeriod = 'vs previous period',
  status,
  tooltipText,
  sparklineData,
  sparklineColor = '#22D3EE',
  className,
  isNegativeGood = false,
}) => {
  const hasDelta = typeof delta === 'number';
  const isZero = hasDelta && Math.abs(delta) < 0.05;
  const isPositive = hasDelta && delta > 0;
  
  // Decide delta color
  let deltaColor = 'text-muted';
  let DeltaIcon = Minus;
  if (hasDelta && !isZero) {
    if ((isPositive && !isNegativeGood) || (!isPositive && isNegativeGood)) {
      deltaColor = 'text-accent-green';
      DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    } else {
      deltaColor = 'text-accent-red';
      DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    }
  }

  return (
    <Card className={twMerge('flex flex-col justify-between p-5 hover:border-border/80 transition-all duration-200', className)}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-secondary tracking-wide uppercase">{label}</span>
          {tooltipText && (
            <Tooltip content={tooltipText} position="top">
              <button
                type="button"
                aria-label={`More information about ${label}`}
                className="text-muted hover:text-primary transition-colors focus:outline-none"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
        {status && <StatusBadge status={status} size="sm" />}
      </div>

      {/* Primary Value with Unit in Tabular Numerals */}
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-semibold text-primary font-mono tracking-tight tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </span>
        {unit && <span className="text-xs font-medium text-muted font-mono">{unit}</span>}
      </div>

      {/* Bottom Footer: Delta & Optional Mini Sparkline */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40">
        {hasDelta ? (
          <div className="flex items-center gap-1 text-xs">
            <span className={clsx('inline-flex items-center font-mono font-medium', deltaColor)}>
              <DeltaIcon className="w-3.5 h-3.5 mr-0.5" />
              {isPositive ? '+' : ''}
              {delta.toFixed(1)}
              {deltaSuffix}
            </span>
            <span className="text-[11px] text-muted truncate max-w-[120px]">{deltaPeriod}</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted">Telemetry steady</span>
        )}

        {/* Mini SVG Sparkline if data provided */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-16 h-6 flex items-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 64 24">
              {(() => {
                const min = Math.min(...sparklineData);
                const max = Math.max(...sparklineData);
                const range = max - min || 1;
                const points = sparklineData
                  .map((val, idx) => {
                    const x = (idx / (sparklineData.length - 1)) * 64;
                    const y = 22 - ((val - min) / range) * 20;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <polyline
                    fill="none"
                    stroke={sparklineColor}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
};

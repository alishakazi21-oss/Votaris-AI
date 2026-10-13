import React from 'react';
import { BatteryCharging, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BatteryGaugeProps {
  socPct: number; // 0 - 100
  minSoCPct?: number;
  maxSoCPct?: number;
  capacityKWh?: number;
  currentPowerKW?: number;
  actionText?: string;
  className?: string;
}

export const BatteryGauge: React.FC<BatteryGaugeProps> = ({
  socPct,
  minSoCPct = 20,
  maxSoCPct = 95,
  capacityKWh = 4000,
  currentPowerKW = 0,
  actionText = 'Standing Reserve / Peak Arbitrage Ready',
  className,
}) => {
  // SVG circular arc parameters
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // We use 240 degree arc (from 150 deg to 390 deg)
  const arcLength = circumference * 0.72;
  const strokeDashoffset = arcLength - (socPct / 100) * arcLength;

  let socColor = 'text-accent-green';
  let strokeHex = '#2ED47A';
  if (socPct < minSoCPct + 10) {
    socColor = 'text-accent-red';
    strokeHex = '#F26B6B';
  } else if (socPct < 45) {
    socColor = 'text-accent-amber';
    strokeHex = '#F5B83D';
  }

  return (
    <div className={twMerge('flex flex-col items-center justify-center p-4 bg-surface rounded-xl border border-border', className)}>
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          {/* Background Track */}
          <circle
            stroke="#243049"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
          {/* Active SoC Arc */}
          <circle
            stroke={strokeHex}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <BatteryCharging className={clsx('w-5 h-5 mb-0.5', socColor)} />
          <span className="text-2xl font-bold font-mono tracking-tight text-primary">{socPct}%</span>
          <span className="text-[10px] text-muted uppercase tracking-wider font-mono">BESS SoC</span>
        </div>
      </div>

      {/* Auxiliary Details */}
      <div className="mt-3 w-full space-y-1.5 text-xs text-secondary border-t border-border/40 pt-2.5">
        <div className="flex items-center justify-between">
          <span>Target Usable Band:</span>
          <span className="font-mono text-primary">{minSoCPct}% - {maxSoCPct}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Stored Energy:</span>
          <span className="font-mono text-primary">{Math.round((capacityKWh * socPct) / 100).toLocaleString('en-IN')} kWh</span>
        </div>
        {actionText && (
          <div className="text-[11px] text-accent-cyan bg-accent-cyan/10 px-2 py-1 rounded text-center font-medium mt-1">
            {actionText}
          </div>
        )}
      </div>
    </div>
  );
};

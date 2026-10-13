import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Radio, Compass, Calculator, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type StatusType =
  | 'Stable'
  | 'Watch'
  | 'Critical'
  | 'Demo'
  | 'Live'
  | 'Estimated'
  | 'Measured'
  | 'Online'
  | 'High Demand'
  | 'Maintenance';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className,
  showIcon = true,
}) => {
  const normalized = status.toLowerCase();

  let styles = 'bg-slate-800 text-secondary border-border';
  let Icon = Activity;

  if (normalized.includes('stable') || normalized.includes('live') || normalized.includes('online')) {
    styles = 'bg-accent-green/10 text-accent-green border-accent-green/30';
    Icon = ShieldCheck;
  } else if (normalized.includes('watch') || normalized.includes('demo') || normalized.includes('demand')) {
    styles = 'bg-accent-amber/10 text-accent-amber border-accent-amber/30';
    Icon = AlertTriangle;
  } else if (normalized.includes('critical') || normalized.includes('shortage')) {
    styles = 'bg-accent-red/10 text-accent-red border-accent-red/30';
    Icon = AlertOctagon;
  } else if (normalized.includes('estimated')) {
    styles = 'bg-accent-violet/10 text-accent-violet border-accent-violet/30';
    Icon = Calculator;
  } else if (normalized.includes('measured')) {
    styles = 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30';
    Icon = Radio;
  } else if (normalized.includes('maintenance')) {
    styles = 'bg-slate-700/50 text-muted border-border';
    Icon = Compass;
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide uppercase',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
          styles,
          className
        )
      )}
    >
      {showIcon && <Icon className={clsx(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />}
      <span>{status}</span>
    </span>
  );
};

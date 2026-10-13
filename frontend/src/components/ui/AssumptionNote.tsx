import React from 'react';
import { Info } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AssumptionNoteProps {
  note?: string;
  assumptions?: string[];
  type?: 'estimated' | 'simulated' | 'measured';
  className?: string;
}

export const AssumptionNote: React.FC<AssumptionNoteProps> = ({
  note = 'Estimated from configured ToD tariff structures and standard emission intensity factors, not guaranteed savings.',
  assumptions,
  type = 'estimated',
  className,
}) => {
  return (
    <div
      className={twMerge(
        'rounded-lg border border-border/60 bg-base/50 p-2.5 text-[11px] text-muted flex items-start gap-2',
        className
      )}
    >
      <Info className="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5" />
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-secondary">
          <span
            className={clsx(
              'px-1.5 py-0.2 rounded text-[9px] uppercase font-mono tracking-wider',
              type === 'measured'
                ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
                : 'bg-accent-violet/15 text-accent-violet border border-accent-violet/30'
            )}
          >
            {type} model
          </span>
          <span>Analytical Assumption & Disclaimers</span>
        </div>
        <p className="leading-relaxed">{note}</p>
        {assumptions && assumptions.length > 0 && (
          <ul className="list-disc list-inside space-y-0.5 text-muted pl-1">
            {assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

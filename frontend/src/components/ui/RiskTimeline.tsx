import React, { useState } from 'react';
import { RiskLevel } from '../../types';
import { chartColors } from '../../lib/chartColors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TimelineBlock {
  hour: number | string;
  timestamp: string;
  risk: RiskLevel;
  marginMW?: number;
  shortageRisk?: number;
  reason?: string;
}

interface RiskTimelineProps {
  blocks: TimelineBlock[];
  title?: string;
  className?: string;
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ blocks, title, className }) => {
  const [hoveredBlock, setHoveredBlock] = useState<TimelineBlock | null>(null);

  const getBlockColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'stable':
        return 'bg-accent-green/80 hover:bg-accent-green';
      case 'watch':
        return 'bg-accent-amber/80 hover:bg-accent-amber';
      case 'critical':
        return 'bg-accent-red/90 hover:bg-accent-red';
      default:
        return 'bg-muted/40';
    }
  };

  return (
    <div className={twMerge('space-y-2', className)}>
      {title && (
        <div className="flex items-center justify-between text-xs text-secondary">
          <span className="font-semibold text-primary">{title}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent-green inline-block" />
              <span>Stable</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent-amber inline-block" />
              <span>Watch</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent-red inline-block" />
              <span>Critical</span>
            </span>
          </div>
        </div>
      )}

      {/* The timeline strip */}
      <div className="relative">
        <div className="flex w-full gap-1 p-1 bg-surface rounded-lg border border-border overflow-x-auto">
          {blocks.map((block, idx) => (
            <button
              key={idx}
              type="button"
              onMouseEnter={() => setHoveredBlock(block)}
              onMouseLeave={() => setHoveredBlock(null)}
              onClick={() => setHoveredBlock(block)}
              className={clsx(
                'h-8 flex-1 min-w-[14px] rounded-sm transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent-cyan cursor-pointer',
                getBlockColor(block.risk)
              )}
              aria-label={`Hour ${block.timestamp}: ${block.risk} risk`}
            />
          ))}
        </div>

        {/* Hover / selected detail box */}
        {hoveredBlock && (
          <div className="mt-2 p-3 bg-elevated border border-border rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: chartColors.risk[hoveredBlock.risk] }}
              />
              <span className="font-semibold text-primary font-mono">{hoveredBlock.timestamp}</span>
              <span className="text-secondary capitalize">({hoveredBlock.risk})</span>
            </div>
            {typeof hoveredBlock.marginMW !== 'undefined' && (
              <div className="text-secondary">
                Net Margin: <span className="font-mono text-primary">{hoveredBlock.marginMW} MW</span>
              </div>
            )}
            {typeof hoveredBlock.shortageRisk !== 'undefined' && (
              <div className="text-secondary">
                Risk Prob: <span className="font-mono text-primary">{hoveredBlock.shortageRisk}%</span>
              </div>
            )}
            {hoveredBlock.reason && (
              <div className="w-full text-muted text-[11px] border-t border-border/40 pt-1.5 mt-0.5">
                {hoveredBlock.reason}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, elevated = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-xl border border-border p-5 transition-colors duration-200',
          elevated ? 'bg-elevated shadow-card' : 'bg-surface shadow-sm',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, actions, className }) => {
  return (
    <div className={twMerge('flex items-start justify-between pb-4 border-b border-border/50 mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-primary tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ title, description, actions, children, className }) => {
  return (
    <section className={twMerge('space-y-4', className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {title && (
            <div>
              <h2 className="text-lg font-semibold text-primary tracking-tight">{title}</h2>
              {description && <p className="text-xs text-secondary mt-0.5">{description}</p>}
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

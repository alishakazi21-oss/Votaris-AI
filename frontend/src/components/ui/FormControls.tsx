import React from 'react';
import { RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  onChange: (val: number) => void;
  className?: string;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  defaultValue,
  onChange,
  className,
}) => {
  return (
    <div className={twMerge('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-secondary">{label}</label>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="font-semibold text-primary">
            {value}
            {unit ? ` ${unit}` : ''}
          </span>
          {typeof defaultValue !== 'undefined' && value !== defaultValue && (
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              title="Reset to baseline"
              className="text-muted hover:text-accent-cyan transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent-cyan focus:outline-none"
      />
      <div className="flex justify-between text-[10px] text-muted font-mono">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  className,
}) => {
  return (
    <div className={twMerge('space-y-1', className)}>
      <label className="block text-xs font-medium text-secondary">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg bg-base border border-border px-3 py-1.5 text-xs text-primary font-mono focus:border-accent-cyan focus:outline-none"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted font-mono pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
  className,
}) => {
  return (
    <div className={twMerge('space-y-1', className)}>
      <label className="block text-xs font-medium text-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-base border border-border px-3 py-1.5 text-xs text-primary focus:border-accent-cyan focus:outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-primary">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const ToggleField: React.FC<ToggleFieldProps> = ({
  label,
  description,
  checked,
  onChange,
  className,
}) => {
  return (
    <div className={twMerge('flex items-center justify-between gap-4', className)}>
      <div>
        <span className="text-xs font-medium text-primary block">{label}</span>
        {description && <span className="text-[11px] text-muted block">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
          checked ? 'bg-accent-cyan' : 'bg-border'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-base shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
};

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={twMerge(
        'inline-flex rounded-lg bg-base p-1 border border-border gap-1',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              'rounded-md font-medium transition-colors duration-150',
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
              isSelected
                ? 'bg-elevated text-primary shadow-sm border border-border/80'
                : 'text-secondary hover:text-primary hover:bg-surface/50'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

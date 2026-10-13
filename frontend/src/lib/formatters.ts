// Formatting helpers for Indian currency, IST timestamps, and tabular metrics

export function formatRupees(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_00_00_000) {
      return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (Math.abs(amount) >= 1_00_000) {
      return `₹${(amount / 1_00_000).toFixed(2)} L`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `₹${(amount / 1_000).toFixed(1)} k`;
    }
  }

  // Standard Indian comma separator format
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(val: number, decimals = 1): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatPercent(val: number, decimals = 1): string {
  return `${val >= 0 ? '' : '-'}${Math.abs(val).toFixed(decimals)}%`;
}

export function formatTimeIST(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(date) + ' IST';
}

export function formatDateTimeIST(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const timeStr = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(date);
  return `${timeStr} IST`;
}

export function formatDelta(delta: number, suffix = '%'): { text: string; isPositive: boolean; isNeutral: boolean } {
  if (Math.abs(delta) < 0.001) {
    return { text: `0.0${suffix}`, isPositive: true, isNeutral: true };
  }
  const isPositive = delta > 0;
  const sign = isPositive ? '+' : '';
  return {
    text: `${sign}${delta.toFixed(1)}${suffix}`,
    isPositive,
    isNeutral: false,
  };
}

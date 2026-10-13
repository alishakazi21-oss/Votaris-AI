// Central Chart Color Token Mapping
// Consistent series colours across all charts in GridMind AI:
// Solar = amber-yellow #F5B83D, Wind = cyan #22D3EE, Battery = violet #8B8CF8,
// EV = orange-ish #FB923C, Demand = soft grey #E2E8F0, Surplus = green #2ED47A, Deficit = red #F26B6B

export const chartColors = {
  solar: '#F5B83D',
  solarFill: 'rgba(245, 184, 61, 0.25)',
  wind: '#22D3EE',
  windFill: 'rgba(34, 211, 238, 0.25)',
  battery: '#8B8CF8',
  batteryFill: 'rgba(139, 140, 248, 0.25)',
  ev: '#FB923C',
  evFill: 'rgba(251, 146, 60, 0.25)',
  demand: '#E2E8F0',
  demandFill: 'rgba(226, 232, 240, 0.15)',
  surplus: '#2ED47A',
  deficit: '#F26B6B',
  confidenceBand: 'rgba(139, 140, 248, 0.15)',
  gridLine: '#243049',
  axisText: '#93A1BB',
  tooltipBg: '#101828',
  tooltipBorder: '#243049',
  accentGreen: '#2ED47A',
  accentCyan: '#22D3EE',
  accentAmber: '#F5B83D',
  accentRed: '#F26B6B',
  accentViolet: '#8B8CF8',
  // Risk colors with accessible labels
  risk: {
    stable: '#2ED47A',
    watch: '#F5B83D',
    critical: '#F26B6B',
  },
} as const;

export type ChartColorKey = keyof typeof chartColors;

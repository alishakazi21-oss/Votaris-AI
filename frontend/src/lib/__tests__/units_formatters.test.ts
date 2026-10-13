// Vitest unit tests for GridMind AI unit conversions, formatters, and simulation

import { describe, it, expect } from 'vitest';
import { convertPower, convertEnergy, formatPowerValue } from '../units';
import { formatRupees, formatNumber, formatPercent, formatDelta } from '../formatters';
import { simulateScenarioCalculations, getSolarMW, getWindMW } from '../../services/mock/mockGenerators';

describe('Unit Conversion Utilities', () => {
  it('converts power correctly between MW and kW', () => {
    expect(convertPower(10, 'MW')).toBe(10);
    expect(convertPower(10, 'kW')).toBe(10000);
    expect(convertPower(0.5, 'kW')).toBe(500);
  });

  it('converts energy correctly between MWh and kWh', () => {
    expect(convertEnergy(2, 'MWh')).toBe(2);
    expect(convertEnergy(2, 'kWh')).toBe(2000);
  });

  it('formats power values with units properly', () => {
    const formatted = formatPowerValue(45.67, 'MW', 1);
    expect(formatted.value).toBe('45.7');
    expect(formatted.unit).toBe('MW');
  });
});

describe('Indian Currency and Number Formatters', () => {
  it('formats INR currency compact values', () => {
    expect(formatRupees(15000000, true)).toContain('1.50 Cr');
    expect(formatRupees(250000, true)).toContain('2.50 L');
    expect(formatRupees(4500, true)).toContain('4.5 k');
  });

  it('formats percentages and deltas', () => {
    expect(formatPercent(12.4)).toBe('12.4%');
    expect(formatPercent(-5.2)).toBe('-5.2%');

    const positiveDelta = formatDelta(14.2);
    expect(positiveDelta.isPositive).toBe(true);
    expect(positiveDelta.text).toBe('+14.2%');

    const negativeDelta = formatDelta(-8.1);
    expect(negativeDelta.isPositive).toBe(false);
    expect(negativeDelta.text).toBe('-8.1%');
  });
});

describe('Physical Energy Simulation Mechanics', () => {
  it('enforces diurnal bell curve: 0 solar output at night', () => {
    expect(getSolarMW(0, 100)).toBe(0);
    expect(getSolarMW(3, 100)).toBe(0);
    expect(getSolarMW(22, 100)).toBe(0);
    expect(getSolarMW(12.5, 100)).toBeGreaterThan(80);
  });

  it('recalculates scenario simulation deterministically from inputs', () => {
    const res = simulateScenarioCalculations({
      solarPct: 100,
      windPct: 100,
      evDemandPct: 100,
      baseDemandPct: 100,
      batteryCapacityKWh: 4000,
      batteryCurrentSoC: 72,
      weatherPreset: 'Clear',
      priceMultiplier: 1.0,
    });

    expect(res.overlay).toHaveLength(24);
    expect(res.scenario.peakDemandMW).toBeGreaterThan(0);
    expect(res.scenario.totalCostINR).toBeGreaterThan(0);
  });
});

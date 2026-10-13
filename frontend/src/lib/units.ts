// Unit conversion utilities for GridMind AI

export type PowerUnit = 'MW' | 'kW';
export type EnergyUnit = 'MWh' | 'kWh';

/**
 * Converts a power value given in MW to the selected target unit (MW or kW).
 */
export function convertPower(valueInMW: number, targetUnit: PowerUnit): number {
  if (targetUnit === 'kW') {
    return valueInMW * 1000;
  }
  return valueInMW;
}

/**
 * Converts an energy value given in MWh to the selected target unit (MWh or kWh).
 */
export function convertEnergy(valueInMWh: number, targetUnit: EnergyUnit): number {
  if (targetUnit === 'kWh') {
    return valueInMWh * 1000;
  }
  return valueInMWh;
}

/**
 * Formats value with appropriate unit label
 */
export function formatPowerValue(valueInMW: number, unit: PowerUnit, decimals = 1): { value: string; unit: string } {
  const converted = convertPower(valueInMW, unit);
  return {
    value: converted.toFixed(decimals),
    unit,
  };
}

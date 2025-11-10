import type { Amount, Food, UnitType } from '../types';

// Default densities (g/mL) for common volume conversions
export const DEFAULT_DENSITIES: Record<string, number> = {
  water: 1.0,
  milk: 1.03,
  oil: 0.91,
  flour: 0.53,
  sugar: 0.85,
  honey: 1.42,
};

// Convert ounces to grams
export function ozToGrams(oz: number): number {
  return oz * 28.3495;
}

// Convert mL to grams using density
export function mlToGrams(ml: number, densityGPerMl: number = 1.0): number {
  return ml * densityGPerMl;
}

// Convert any amount to grams
export function toGrams(amount: Amount, food?: Food): number {
  const { value, unit } = amount;

  switch (unit) {
    case 'g':
      return value;

    case 'oz':
      return ozToGrams(value);

    case 'ml':
      const density = food?.density_g_per_ml ?? 1.0;
      return mlToGrams(value, density);

    case 'serving':
      if (!food?.grams_per_serving) {
        throw new Error('Food does not have grams_per_serving defined');
      }
      return value * food.grams_per_serving;

    case 'piece':
      if (!food?.grams_per_piece) {
        throw new Error('Food does not have grams_per_piece defined');
      }
      return value * food.grams_per_piece;

    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

// Convert grams to other units
export function gramsTo(grams: number, unit: UnitType, food?: Food): number {
  switch (unit) {
    case 'g':
      return grams;

    case 'oz':
      return grams / 28.3495;

    case 'ml':
      const density = food?.density_g_per_ml ?? 1.0;
      return grams / density;

    case 'serving':
      if (!food?.grams_per_serving) {
        throw new Error('Food does not have grams_per_serving defined');
      }
      return grams / food.grams_per_serving;

    case 'piece':
      if (!food?.grams_per_piece) {
        throw new Error('Food does not have grams_per_piece defined');
      }
      return grams / food.grams_per_piece;

    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

// Get available units for a food item
export function getAvailableUnits(food: Food): UnitType[] {
  const units: UnitType[] = ['g', 'oz'];

  if (food.density_g_per_ml !== undefined) {
    units.push('ml');
  }

  if (food.grams_per_serving) {
    units.push('serving');
  }

  if (food.grams_per_piece) {
    units.push('piece');
  }

  return units;
}

// Format unit for display
export function formatUnit(unit: UnitType, value: number = 1): string {
  const isPlural = value !== 1;

  switch (unit) {
    case 'g':
      return 'g';
    case 'oz':
      return 'oz';
    case 'ml':
      return 'mL';
    case 'serving':
      return isPlural ? 'servings' : 'serving';
    case 'piece':
      return isPlural ? 'pieces' : 'piece';
    default:
      return unit;
  }
}

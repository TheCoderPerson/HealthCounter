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

// Convert cups to mL
export function cupsToMl(cups: number): number {
  return cups * 240; // 1 cup = 240 mL
}

// Convert tablespoons to mL
export function tbspToMl(tbsp: number): number {
  return tbsp * 15; // 1 tablespoon = 15 mL
}

// Convert teaspoons to mL
export function tspToMl(tsp: number): number {
  return tsp * 5; // 1 teaspoon = 5 mL
}

// Convert any amount to grams
export function toGrams(amount: Amount, food?: Food): number {
  const { value, unit } = amount;
  const density = food?.density_g_per_ml ?? 1.0; // Default to water density

  switch (unit) {
    case 'g':
      return value;

    case 'oz':
      return ozToGrams(value);

    case 'ml':
      return mlToGrams(value, density);

    case 'cup':
      return mlToGrams(cupsToMl(value), density);

    case 'tbsp':
      return mlToGrams(tbspToMl(value), density);

    case 'tsp':
      return mlToGrams(tspToMl(value), density);

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
  const density = food?.density_g_per_ml ?? 1.0; // Default to water density

  switch (unit) {
    case 'g':
      return grams;

    case 'oz':
      return grams / 28.3495;

    case 'ml':
      return grams / density;

    case 'cup':
      return (grams / density) / 240; // Convert to mL first, then to cups

    case 'tbsp':
      return (grams / density) / 15; // Convert to mL first, then to tablespoons

    case 'tsp':
      return (grams / density) / 5; // Convert to mL first, then to teaspoons

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

  // Always add volume units (they use density, defaulting to water if not specified)
  units.push('ml', 'cup', 'tbsp', 'tsp');

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
    case 'cup':
      return isPlural ? 'cups' : 'cup';
    case 'tbsp':
      return 'tbsp';
    case 'tsp':
      return 'tsp';
    case 'serving':
      return isPlural ? 'servings' : 'serving';
    case 'piece':
      return isPlural ? 'pieces' : 'piece';
    default:
      return unit;
  }
}

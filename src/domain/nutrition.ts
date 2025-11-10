import type {
  NutrientsPer100g,
  NutrientKey,
  EntryWithFood,
  RecipeWithItems,
  MealType,
  DailySummary,
} from '../types';

// Calculate nutrients for a given amount in grams from per-100g values
export function calculateNutrients(
  nutrientsPer100g: NutrientsPer100g,
  grams: number
): NutrientsPer100g {
  const result: NutrientsPer100g = {};

  for (const [key, value] of Object.entries(nutrientsPer100g)) {
    if (value !== undefined && value !== null) {
      result[key as NutrientKey] = (value * grams) / 100;
    }
  }

  return result;
}

// Sum multiple nutrient records
export function sumNutrients(...nutrientArrays: NutrientsPer100g[]): NutrientsPer100g {
  const result: NutrientsPer100g = {};

  for (const nutrients of nutrientArrays) {
    for (const [key, value] of Object.entries(nutrients)) {
      if (value !== undefined && value !== null) {
        const nutrientKey = key as NutrientKey;
        result[nutrientKey] = (result[nutrientKey] || 0) + value;
      }
    }
  }

  return result;
}

// Calculate total nutrients from a list of entries
export function calculateEntryTotals(entries: EntryWithFood[]): NutrientsPer100g {
  const nutrientArrays = entries.map((entry) =>
    calculateNutrients(entry.food.nutrients, entry.grams)
  );

  return sumNutrients(...nutrientArrays);
}

// Calculate recipe total nutrients
export function calculateRecipeTotals(recipe: RecipeWithItems): NutrientsPer100g {
  const nutrientArrays = recipe.items.map((item) =>
    calculateNutrients(item.food.nutrients, item.grams)
  );

  return sumNutrients(...nutrientArrays);
}

// Calculate per-serving nutrients for a recipe
export function calculateRecipePerServing(recipe: RecipeWithItems): NutrientsPer100g {
  const totalNutrients = calculateRecipeTotals(recipe);
  const result: NutrientsPer100g = {};

  for (const [key, value] of Object.entries(totalNutrients)) {
    if (value !== undefined && value !== null) {
      result[key as NutrientKey] = value / recipe.servings;
    }
  }

  return result;
}

// Calculate per-100g nutrients for a cooked recipe
export function calculateRecipePer100g(recipe: RecipeWithItems): NutrientsPer100g | null {
  if (!recipe.cooked_yield_g) return null;

  const totalNutrients = calculateRecipeTotals(recipe);
  const result: NutrientsPer100g = {};

  for (const [key, value] of Object.entries(totalNutrients)) {
    if (value !== undefined && value !== null) {
      result[key as NutrientKey] = (value * 100) / recipe.cooked_yield_g;
    }
  }

  return result;
}

// Create daily summary from entries
export function createDailySummary(
  date: string,
  entries: EntryWithFood[]
): DailySummary {
  const byMeal: Record<
    MealType,
    { entries: EntryWithFood[]; nutrients: NutrientsPer100g }
  > = {
    breakfast: { entries: [], nutrients: {} },
    lunch: { entries: [], nutrients: {} },
    dinner: { entries: [], nutrients: {} },
    snack: { entries: [], nutrients: {} },
  };

  // Group entries by meal
  for (const entry of entries) {
    byMeal[entry.meal].entries.push(entry);
  }

  // Calculate nutrients for each meal
  for (const meal of Object.keys(byMeal) as MealType[]) {
    byMeal[meal].nutrients = calculateEntryTotals(byMeal[meal].entries);
  }

  // Calculate total nutrients
  const totalNutrients = calculateEntryTotals(entries);

  return {
    date,
    entries,
    totalNutrients,
    byMeal,
  };
}

// Format nutrient value for display
export function formatNutrientValue(value: number | undefined, decimals = 1): string {
  if (value === undefined || value === null) return '—';

  // For very small values, show more decimals
  if (value < 0.1 && value > 0) {
    return value.toFixed(2);
  }

  // For whole numbers or large values, show no decimals
  if (value >= 100 || value === Math.floor(value)) {
    return Math.round(value).toString();
  }

  return value.toFixed(decimals);
}

// Calculate percentage of daily goal
export function calculateGoalPercentage(
  current: number | undefined,
  goal: number | undefined
): number | null {
  if (!current || !goal) return null;
  return Math.round((current / goal) * 100);
}

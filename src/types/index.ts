import type { NutrientsPer100g } from './nutrients';

// Food source types
export type FoodSource = 'OFF' | 'FDC' | 'USER';

// Food state (raw vs cooked)
export type FoodState = 'raw' | 'cooked' | null;

// Confidence levels
export type ConfidenceLevel = 'exact_label' | 'exact_db' | 'user_edited' | 'generic_mapped';

// Meal types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Food item
export interface Food {
  id: string; // UUID
  name: string;
  brand?: string;
  source: FoodSource;
  source_key?: string; // OFF barcode or FDC ID
  state: FoodState;
  grams_per_serving?: number;
  grams_per_piece?: number;
  density_g_per_ml?: number | null;
  confidence: ConfidenceLevel;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  last_checked_at?: string; // For remote lookups
  country_hint?: string; // For region-specific data
}

// Nutrients table (one-to-one with Food)
export interface Nutrients {
  food_id: string;
  nutrients: NutrientsPer100g;
}

// Entry (logged food)
export interface Entry {
  id: string; // UUID
  food_id: string;
  grams: number;
  timestamp: string; // ISO string
  meal: MealType;
  note?: string;
}

// Recipe
export interface Recipe {
  id: string; // UUID
  name: string;
  servings: number;
  cooked_yield_g?: number; // Total grams after cooking
  created_at: string;
  updated_at: string;
}

// Recipe item (ingredient)
export interface RecipeItem {
  id: string; // UUID
  recipe_id: string;
  food_id: string;
  grams: number;
}

// Favorite
export interface Favorite {
  id: string; // UUID
  food_id?: string;
  recipe_id?: string;
  created_at: string;
}

// Settings
export interface Settings {
  id: string; // Single row
  goals: {
    kcal?: number;
    protein_g?: number;
    sodium_mg?: number;
    [key: string]: number | undefined;
  };
  units: 'metric' | 'imperial';
  theme?: 'light' | 'dark' | 'auto';
}

// Unit types for input
export type UnitType = 'g' | 'oz' | 'ml' | 'cup' | 'tbsp' | 'tsp' | 'serving' | 'piece';

// Amount input
export interface Amount {
  value: number;
  unit: UnitType;
}

// Extended Food with nutrients for easier use
export interface FoodWithNutrients extends Food {
  nutrients: NutrientsPer100g;
}

// Extended Recipe with items and total nutrients
export interface RecipeWithItems extends Recipe {
  items: Array<RecipeItem & { food: FoodWithNutrients }>;
  totalNutrients?: NutrientsPer100g;
}

// Entry with food details
export interface EntryWithFood extends Entry {
  food: FoodWithNutrients;
}

// Daily summary
export interface DailySummary {
  date: string; // YYYY-MM-DD
  entries: EntryWithFood[];
  totalNutrients: NutrientsPer100g;
  byMeal: Record<MealType, {
    entries: EntryWithFood[];
    nutrients: NutrientsPer100g;
  }>;
}

// Import/Export types
export interface ImportFood {
  id?: string;
  name: string;
  brand?: string;
  state?: 'raw' | 'cooked';
  grams_per_serving?: number;
  grams_per_piece?: number;
  density_g_per_ml?: number | null;
  nutrients_per_100g?: NutrientsPer100g;
}

export interface ImportData {
  version: number;
  foods: ImportFood[];
}

// Conflict resolution
export type ConflictResolution = 'merge' | 'replace' | 'keep_both';

export interface ImportConflict {
  existingFood: Food;
  newFood: ImportFood;
  reason: string;
}

// Export all from nutrients
export * from './nutrients';

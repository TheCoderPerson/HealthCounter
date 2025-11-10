import Dexie, { type Table } from 'dexie';
import type {
  Food,
  Nutrients,
  Entry,
  Recipe,
  RecipeItem,
  Favorite,
  Settings,
} from '../types';

export class HealthCounterDB extends Dexie {
  // Tables
  foods!: Table<Food, string>;
  nutrients!: Table<Nutrients, string>;
  entries!: Table<Entry, string>;
  recipes!: Table<Recipe, string>;
  recipeItems!: Table<RecipeItem, string>;
  favorites!: Table<Favorite, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('HealthCounterDB');

    this.version(1).stores({
      foods: 'id, name, [brand+name], [source+source_key], created_at, updated_at',
      nutrients: 'food_id',
      entries: 'id, food_id, timestamp, meal, [timestamp+meal]',
      recipes: 'id, name, created_at, updated_at',
      recipeItems: 'id, recipe_id, food_id',
      favorites: 'id, food_id, recipe_id, created_at',
      settings: 'id',
    });
  }
}

// Export singleton instance
export const db = new HealthCounterDB();

// Initialize default settings if not exists
export async function initializeDatabase() {
  const settingsCount = await db.settings.count();

  if (settingsCount === 0) {
    try {
      await db.settings.add({
        id: 'default',
        goals: {
          kcal: 2000,
          protein_g: 150,
        },
        units: 'metric',
        theme: 'auto',
      });
    } catch (error: unknown) {
      // Ignore if key already exists (can happen due to React StrictMode double-calling in dev)
      if (error && typeof error === 'object' && 'name' in error && error.name !== 'ConstraintError') {
        throw error;
      }
    }
  }
}

import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import type { Recipe, RecipeItem, RecipeWithItems } from '../types';
import { getFoodWithNutrients } from './foodRepository';

export async function createRecipe(
  name: string,
  servings: number,
  cookedYieldG?: number
): Promise<Recipe> {
  const now = new Date().toISOString();
  const recipe: Recipe = {
    id: uuidv4(),
    name,
    servings,
    cooked_yield_g: cookedYieldG,
    created_at: now,
    updated_at: now,
  };

  await db.recipes.add(recipe);
  return recipe;
}

export async function updateRecipe(
  id: string,
  updates: Partial<Omit<Recipe, 'id' | 'created_at' | 'updated_at'>>
): Promise<Recipe | null> {
  const recipe = await db.recipes.get(id);
  if (!recipe) return null;

  const updatedRecipe: Recipe = {
    ...recipe,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await db.recipes.put(updatedRecipe);
  return updatedRecipe;
}

export async function addRecipeItem(
  recipeId: string,
  foodId: string,
  grams: number
): Promise<RecipeItem> {
  const item: RecipeItem = {
    id: uuidv4(),
    recipe_id: recipeId,
    food_id: foodId,
    grams,
  };

  await db.recipeItems.add(item);
  return item;
}

export async function updateRecipeItem(
  id: string,
  grams: number
): Promise<RecipeItem | null> {
  const item = await db.recipeItems.get(id);
  if (!item) return null;

  const updatedItem: RecipeItem = {
    ...item,
    grams,
  };

  await db.recipeItems.put(updatedItem);
  return updatedItem;
}

export async function deleteRecipeItem(id: string): Promise<void> {
  await db.recipeItems.delete(id);
}

export async function getRecipeWithItems(id: string): Promise<RecipeWithItems | null> {
  const recipe = await db.recipes.get(id);
  if (!recipe) return null;

  const items = await db.recipeItems.where('recipe_id').equals(id).toArray();

  const itemsWithFood = await Promise.all(
    items.map(async (item) => {
      const food = await getFoodWithNutrients(item.food_id);
      return {
        ...item,
        food: food!,
      };
    })
  );

  return {
    ...recipe,
    items: itemsWithFood,
  };
}

export async function getAllRecipes(): Promise<Recipe[]> {
  return db.recipes.orderBy('name').toArray();
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.transaction('rw', [db.recipes, db.recipeItems], async () => {
    await db.recipes.delete(id);
    await db.recipeItems.where('recipe_id').equals(id).delete();
  });
}

import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import type { Favorite, FoodWithNutrients } from '../types';
import { getFoodWithNutrients } from './foodRepository';
import { getRecipeWithItems } from './recipeRepository';

export async function addFavorite(foodId?: string, recipeId?: string): Promise<Favorite> {
  if (!foodId && !recipeId) {
    throw new Error('Either foodId or recipeId must be provided');
  }

  const favorite: Favorite = {
    id: uuidv4(),
    food_id: foodId,
    recipe_id: recipeId,
    created_at: new Date().toISOString(),
  };

  await db.favorites.add(favorite);
  return favorite;
}

export async function removeFavorite(id: string): Promise<void> {
  await db.favorites.delete(id);
}

export async function removeFavoriteByFoodId(foodId: string): Promise<void> {
  await db.favorites.where('food_id').equals(foodId).delete();
}

export async function removeFavoriteByRecipeId(recipeId: string): Promise<void> {
  await db.favorites.where('recipe_id').equals(recipeId).delete();
}

export async function isFavorite(foodId?: string, recipeId?: string): Promise<boolean> {
  if (foodId) {
    const count = await db.favorites.where('food_id').equals(foodId).count();
    return count > 0;
  }
  if (recipeId) {
    const count = await db.favorites.where('recipe_id').equals(recipeId).count();
    return count > 0;
  }
  return false;
}

export async function getFavoriteFoods(): Promise<FoodWithNutrients[]> {
  const favorites = await db.favorites.toArray();

  const foodFavorites = favorites.filter((f) => f.food_id !== undefined);

  const foods = await Promise.all(
    foodFavorites.map((f) => getFoodWithNutrients(f.food_id!))
  );

  return foods.filter((f) => f !== null) as FoodWithNutrients[];
}

export async function getFavoriteRecipes() {
  const favorites = await db.favorites.toArray();

  const recipeFavorites = favorites.filter((f) => f.recipe_id !== undefined);

  const recipes = await Promise.all(
    recipeFavorites.map((f) => getRecipeWithItems(f.recipe_id!))
  );

  return recipes.filter((r) => r !== null);
}

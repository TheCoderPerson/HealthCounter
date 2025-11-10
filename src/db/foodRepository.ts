import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import type { Food, FoodWithNutrients, NutrientsPer100g } from '../types';

export async function createFood(
  foodData: Omit<Food, 'id' | 'created_at' | 'updated_at'>,
  nutrients: NutrientsPer100g
): Promise<FoodWithNutrients> {
  const now = new Date().toISOString();
  const id = uuidv4();

  const food: Food = {
    ...foodData,
    id,
    created_at: now,
    updated_at: now,
  };

  await db.transaction('rw', [db.foods, db.nutrients], async () => {
    await db.foods.add(food);
    await db.nutrients.add({
      food_id: id,
      nutrients,
    });
  });

  return {
    ...food,
    nutrients,
  };
}

export async function updateFood(
  id: string,
  updates: Partial<Omit<Food, 'id' | 'created_at' | 'updated_at'>>,
  nutrientUpdates?: Partial<NutrientsPer100g>
): Promise<FoodWithNutrients | null> {
  const food = await db.foods.get(id);
  if (!food) return null;

  const updatedFood: Food = {
    ...food,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await db.transaction('rw', [db.foods, db.nutrients], async () => {
    await db.foods.put(updatedFood);

    if (nutrientUpdates) {
      const existing = await db.nutrients.get(id);
      if (existing) {
        await db.nutrients.put({
          food_id: id,
          nutrients: {
            ...existing.nutrients,
            ...nutrientUpdates,
          },
        });
      }
    }
  });

  const nutrients = await db.nutrients.get(id);
  return {
    ...updatedFood,
    nutrients: nutrients?.nutrients || {},
  };
}

export async function getFoodWithNutrients(id: string): Promise<FoodWithNutrients | null> {
  const food = await db.foods.get(id);
  if (!food) return null;

  const nutrients = await db.nutrients.get(id);
  return {
    ...food,
    nutrients: nutrients?.nutrients || {},
  };
}

export async function searchFoods(query: string, limit = 20): Promise<FoodWithNutrients[]> {
  const lowerQuery = query.toLowerCase();

  const foods = await db.foods
    .filter((food) => {
      const nameMatch = food.name.toLowerCase().includes(lowerQuery);
      const brandMatch = food.brand?.toLowerCase().includes(lowerQuery) || false;
      return nameMatch || brandMatch;
    })
    .limit(limit)
    .toArray();

  const foodIds = foods.map((f) => f.id);
  const nutrientsArray = await db.nutrients.bulkGet(foodIds);

  return foods.map((food, index) => ({
    ...food,
    nutrients: nutrientsArray[index]?.nutrients || {},
  }));
}

export async function getFoodBySourceKey(
  source: string,
  sourceKey: string
): Promise<FoodWithNutrients | null> {
  const food = await db.foods
    .where(['source', 'source_key'])
    .equals([source, sourceKey])
    .first();

  if (!food) return null;

  const nutrients = await db.nutrients.get(food.id);
  return {
    ...food,
    nutrients: nutrients?.nutrients || {},
  };
}

export async function deleteFood(id: string): Promise<void> {
  await db.transaction('rw', [db.foods, db.nutrients, db.entries], async () => {
    await db.foods.delete(id);
    await db.nutrients.delete(id);
    // Note: Don't delete entries, they preserve history
  });
}

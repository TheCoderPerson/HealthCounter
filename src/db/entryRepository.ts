import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import type { Entry, EntryWithFood, MealType } from '../types';
import { getFoodWithNutrients } from './foodRepository';

export async function createEntry(
  foodId: string,
  grams: number,
  meal: MealType,
  note?: string,
  timestamp?: string
): Promise<EntryWithFood | null> {
  const food = await getFoodWithNutrients(foodId);
  if (!food) return null;

  const entry: Entry = {
    id: uuidv4(),
    food_id: foodId,
    grams,
    timestamp: timestamp || new Date().toISOString(),
    meal,
    note,
  };

  await db.entries.add(entry);

  return {
    ...entry,
    food,
  };
}

export async function getEntriesByDate(date: string): Promise<EntryWithFood[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const entries = await db.entries
    .where('timestamp')
    .between(startOfDay.toISOString(), endOfDay.toISOString(), true, true)
    .toArray();

  return Promise.all(
    entries.map(async (entry) => {
      const food = await getFoodWithNutrients(entry.food_id);
      return {
        ...entry,
        food: food!,
      };
    })
  );
}

export async function getEntriesByDateAndMeal(
  date: string,
  meal: MealType
): Promise<EntryWithFood[]> {
  const entries = await getEntriesByDate(date);
  return entries.filter((e) => e.meal === meal);
}

export async function updateEntry(
  id: string,
  updates: Partial<Omit<Entry, 'id' | 'food_id'>>
): Promise<Entry | null> {
  const entry = await db.entries.get(id);
  if (!entry) return null;

  const updatedEntry: Entry = {
    ...entry,
    ...updates,
  };

  await db.entries.put(updatedEntry);
  return updatedEntry;
}

export async function deleteEntry(id: string): Promise<void> {
  await db.entries.delete(id);
}

export async function getRecentFoods(limit = 10): Promise<string[]> {
  const entries = await db.entries
    .orderBy('timestamp')
    .reverse()
    .limit(limit * 2) // Get more to account for duplicates
    .toArray();

  // Get unique food IDs in order
  const uniqueFoodIds: string[] = [];
  for (const entry of entries) {
    if (!uniqueFoodIds.includes(entry.food_id)) {
      uniqueFoodIds.push(entry.food_id);
      if (uniqueFoodIds.length >= limit) break;
    }
  }

  return uniqueFoodIds;
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEntriesByDate } from '../db/entryRepository';
import { createDailySummary, formatNutrientValue } from '../domain/nutrition';
import type { DailySummary, MealType } from '../types';

export function TodayPage() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  async function loadEntries() {
    const entries = await getEntriesByDate(selectedDate);
    const dailySummary = createDailySummary(selectedDate, entries);
    setSummary(dailySummary);
  }

  const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  if (!summary) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Today</h1>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Daily totals */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Daily Totals</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-600">Calories</div>
              <div className="text-2xl font-bold">
                {formatNutrientValue(summary.totalNutrients.kcal, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Protein</div>
              <div className="text-2xl font-bold">
                {formatNutrientValue(summary.totalNutrients.protein_g)}g
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Carbs</div>
              <div className="text-xl font-semibold">
                {formatNutrientValue(summary.totalNutrients.carbs_g)}g
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Fat</div>
              <div className="text-xl font-semibold">
                {formatNutrientValue(summary.totalNutrients.fat_g)}g
              </div>
            </div>
          </div>
        </div>

        {/* Meals */}
        {mealOrder.map((meal) => (
          <div key={meal} className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold capitalize">{meal}</h3>
              <Link
                to={`/search?meal=${meal}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add
              </Link>
            </div>

            {summary.byMeal[meal].entries.length === 0 ? (
              <div className="text-gray-400 text-sm">No items logged</div>
            ) : (
              <div className="space-y-2">
                {summary.byMeal[meal].entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-start py-2 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{entry.food.name}</div>
                      {entry.food.brand && (
                        <div className="text-sm text-gray-600">{entry.food.brand}</div>
                      )}
                      <div className="text-sm text-gray-500">{entry.grams}g</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatNutrientValue(
                          (entry.food.nutrients.kcal || 0) * entry.grams / 100,
                          0
                        )}
                      </div>
                      <div className="text-xs text-gray-500">kcal</div>
                    </div>
                  </div>
                ))}

                {/* Meal totals */}
                <div className="pt-2 text-sm text-gray-600">
                  <span className="font-medium">Total: </span>
                  {formatNutrientValue(summary.byMeal[meal].nutrients.kcal, 0)} kcal,{' '}
                  {formatNutrientValue(summary.byMeal[meal].nutrients.protein_g)}g protein
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

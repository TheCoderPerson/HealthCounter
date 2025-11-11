import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getFoodWithNutrients } from '../db/foodRepository';
import { createEntry } from '../db/entryRepository';
import { toGrams, getAvailableUnits, formatUnit } from '../domain/units';
import { calculateNutrients, formatNutrientValue } from '../domain/nutrition';
import type { FoodWithNutrients, MealType, UnitType, Amount } from '../types';
import { NUTRIENT_LABELS, NUTRIENT_UNITS } from '../types/nutrients';

export function FoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [food, setFood] = useState<FoodWithNutrients | null>(null);
  const [amount, setAmount] = useState<Amount>({ value: 100, unit: 'g' });
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    (searchParams.get('meal') as MealType) || 'breakfast'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFood();
  }, [id]);

  async function loadFood() {
    if (!id) return;

    const foodData = await getFoodWithNutrients(id);
    setFood(foodData);
    setLoading(false);

    // Set default amount to serving size if available
    if (foodData?.grams_per_serving) {
      setAmount({ value: foodData.grams_per_serving, unit: 'g' });
    }
  }

  const handleAddEntry = async () => {
    if (!food) return;

    try {
      const grams = toGrams(amount, food);
      await createEntry(food.id, grams, selectedMeal);
      navigate('/');
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const quickAddAmounts = [
    { label: '+25g', value: 25, unit: 'g' as UnitType },
    { label: '+50g', value: 50, unit: 'g' as UnitType },
    { label: '+100g', value: 100, unit: 'g' as UnitType },
  ];

  if (food?.grams_per_serving) {
    quickAddAmounts.unshift(
      { label: '+½ serving', value: 0.5, unit: 'serving' as UnitType },
      { label: '+1 serving', value: 1, unit: 'serving' as UnitType }
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Food not found</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const availableUnits = getAvailableUnits(food);
  const currentGrams = toGrams(amount, food);
  const currentNutrients = calculateNutrients(food.nutrients, currentGrams);

  // Confidence badge
  const confidenceBadge = {
    exact_label: { text: 'Exact (Label)', color: 'bg-green-100 text-green-800' },
    exact_db: { text: 'Exact (DB)', color: 'bg-blue-100 text-blue-800' },
    user_edited: { text: 'User Edited', color: 'bg-purple-100 text-purple-800' },
    generic_mapped: { text: 'Estimated', color: 'bg-yellow-100 text-yellow-800' },
  }[food.confidence];

  const sourceBadge = {
    OFF: { text: 'Open Food Facts', color: 'bg-orange-100 text-orange-800' },
    FDC: { text: 'USDA FDC', color: 'bg-green-100 text-green-800' },
    USER: { text: 'User Created', color: 'bg-gray-100 text-gray-800' },
  }[food.source];

  // Group nutrients for display
  const macros = ['kcal', 'protein_g', 'fat_g', 'carbs_g', 'fiber_g', 'sugar_g'];
  const fats = ['sat_fat_g', 'mono_fat_g', 'poly_fat_g', 'trans_fat_g', 'cholesterol_mg'];
  const minerals = ['sodium_mg', 'potassium_mg', 'calcium_mg', 'magnesium_mg', 'iron_mg', 'zinc_mg'];
  const vitamins = [
    'vitamin_d_ug',
    'vitamin_a_rae',
    'vitamin_e_mg',
    'vitamin_k_ug',
    'vitamin_c_mg',
    'thiamin_b1_mg',
    'riboflavin_b2_mg',
    'niacin_b3_mg',
    'vitamin_b6_mg',
    'folate_ug_dfe',
    'vitamin_b12_ug',
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <button onClick={() => navigate(-1)} className="text-blue-600 mb-3">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{food.name}</h1>
          {food.brand && <p className="text-gray-600">{food.brand}</p>}

          {/* Badges */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceBadge.color}`}>
              {confidenceBadge.text}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${sourceBadge.color}`}>
              {sourceBadge.text}
            </span>
            {food.state && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                {food.state}
              </span>
            )}
          </div>
        </div>

        {/* Amount selector */}
        <div className="bg-white border-b p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>

          <div className="flex gap-2 mb-3">
            <input
              type="number"
              step="0.1"
              min="0"
              value={amount.value}
              onChange={(e) => setAmount({ ...amount, value: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-3 py-2 border rounded-lg text-lg"
            />
            <select
              value={amount.unit}
              onChange={(e) => setAmount({ ...amount, unit: e.target.value as UnitType })}
              className="px-3 py-2 border rounded-lg"
            >
              {availableUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {formatUnit(unit)}
                </option>
              ))}
            </select>
          </div>

          {/* Quick add buttons */}
          <div className="flex gap-2 flex-wrap">
            {quickAddAmounts.map((qa) => (
              <button
                key={qa.label}
                onClick={() => {
                  // Add to current amount if units match, otherwise set
                  if (amount.unit === qa.unit) {
                    setAmount({ value: amount.value + qa.value, unit: qa.unit });
                  } else {
                    setAmount({ value: qa.value, unit: qa.unit });
                  }
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                {qa.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-600 mt-2">= {currentGrams.toFixed(1)}g</p>
        </div>

        {/* Macros */}
        <div className="bg-white border-b p-4">
          <h2 className="text-lg font-semibold mb-3">Macronutrients</h2>
          <div className="space-y-2">
            {macros.map((key) => {
              const value = currentNutrients[key as keyof typeof currentNutrients];
              if (value === undefined) return null;

              return (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-700">{NUTRIENT_LABELS[key as keyof typeof NUTRIENT_LABELS]}</span>
                  <span className="font-semibold">
                    {formatNutrientValue(value)} {NUTRIENT_UNITS[key as keyof typeof NUTRIENT_UNITS]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fats */}
        {fats.some((k) => currentNutrients[k as keyof typeof currentNutrients] !== undefined) && (
          <div className="bg-white border-b p-4">
            <h2 className="text-lg font-semibold mb-3">Fats & Cholesterol</h2>
            <div className="space-y-2">
              {fats.map((key) => {
                const value = currentNutrients[key as keyof typeof currentNutrients];
                if (value === undefined) return null;

                return (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-700">{NUTRIENT_LABELS[key as keyof typeof NUTRIENT_LABELS]}</span>
                    <span className="font-semibold">
                      {formatNutrientValue(value)} {NUTRIENT_UNITS[key as keyof typeof NUTRIENT_UNITS]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Minerals */}
        {minerals.some((k) => currentNutrients[k as keyof typeof currentNutrients] !== undefined) && (
          <div className="bg-white border-b p-4">
            <h2 className="text-lg font-semibold mb-3">Minerals</h2>
            <div className="space-y-2">
              {minerals.map((key) => {
                const value = currentNutrients[key as keyof typeof currentNutrients];
                if (value === undefined) return null;

                return (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-700">{NUTRIENT_LABELS[key as keyof typeof NUTRIENT_LABELS]}</span>
                    <span className="font-semibold">
                      {formatNutrientValue(value)} {NUTRIENT_UNITS[key as keyof typeof NUTRIENT_UNITS]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vitamins */}
        {vitamins.some((k) => currentNutrients[k as keyof typeof currentNutrients] !== undefined) && (
          <div className="bg-white border-b p-4">
            <h2 className="text-lg font-semibold mb-3">Vitamins</h2>
            <div className="space-y-2">
              {vitamins.map((key) => {
                const value = currentNutrients[key as keyof typeof currentNutrients];
                if (value === undefined) return null;

                return (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-700">{NUTRIENT_LABELS[key as keyof typeof NUTRIENT_LABELS]}</span>
                    <span className="font-semibold">
                      {formatNutrientValue(value)} {NUTRIENT_UNITS[key as keyof typeof NUTRIENT_UNITS]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom add button */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 shadow-lg z-40">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 mb-3">
            <select
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value as MealType)}
              className="flex-1 px-3 py-3 border rounded-lg"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <button
            onClick={handleAddEntry}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700"
          >
            Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
}

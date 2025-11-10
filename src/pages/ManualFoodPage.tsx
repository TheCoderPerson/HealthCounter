import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFood } from '../db/foodRepository';
import type { FoodState, NutrientsPer100g, NutrientKey } from '../types';
import { NUTRIENT_LABELS, NUTRIENT_UNITS } from '../types/nutrients';

export function ManualFoodPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [state, setState] = useState<FoodState>(null);
  const [gramsPerServing, setGramsPerServing] = useState('');
  const [nutrients, setNutrients] = useState<Partial<NutrientsPer100g>>({});

  const macroKeys: NutrientKey[] = ['kcal', 'protein_g', 'fat_g', 'carbs_g', 'fiber_g', 'sugar_g'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a food name');
      return;
    }

    await createFood(
      {
        name: name.trim(),
        brand: brand.trim() || undefined,
        source: 'USER',
        state,
        grams_per_serving: gramsPerServing ? parseFloat(gramsPerServing) : undefined,
        confidence: 'user_edited',
      },
      nutrients
    );

    navigate('/');
  };

  const updateNutrient = (key: NutrientKey, value: string) => {
    const numValue = parseFloat(value);
    setNutrients({
      ...nutrients,
      [key]: isNaN(numValue) ? undefined : numValue,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Create Food</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand (optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={state || ''}
                  onChange={(e) => setState(e.target.value as FoodState)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unknown</option>
                  <option value="raw">Raw</option>
                  <option value="cooked">Cooked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grams per Serving (optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gramsPerServing}
                  onChange={(e) => setGramsPerServing(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Nutrients (per 100g) */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Nutrients (per 100g)</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {macroKeys.map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {NUTRIENT_LABELS[key]} ({NUTRIENT_UNITS[key]})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nutrients[key] ?? ''}
                    onChange={(e) => updateNutrient(key, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Additional nutrients can be added later by editing the food.
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Create Food
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createRecipe,
  getRecipeWithItems,
  updateRecipe,
  addRecipeItem,
  deleteRecipeItem,
  deleteRecipe,
} from '../db/recipeRepository';
import { searchFoods } from '../db/foodRepository';
import {
  calculateRecipeTotals,
  calculateRecipePerServing,
  formatNutrientValue,
} from '../domain/nutrition';
import type { RecipeWithItems, FoodWithNutrients, MealType } from '../types';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNew = id === 'new';

  const [recipe, setRecipe] = useState<RecipeWithItems | null>(null);
  const [name, setName] = useState('');
  const [servings, setServings] = useState(4);
  const [cookedYieldG, setCookedYieldG] = useState('');
  const [loading, setLoading] = useState(!isNew);

  // Add ingredient flow
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodWithNutrients[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodWithNutrients | null>(null);
  const [ingredientGrams, setIngredientGrams] = useState('100');

  // Log recipe flow
  const [showLogRecipe, setShowLogRecipe] = useState(false);
  const [logServings, setLogServings] = useState('1');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('dinner');

  useEffect(() => {
    if (!isNew && id) {
      loadRecipe();
    }
  }, [id]);

  async function loadRecipe() {
    if (!id) return;
    const recipeData = await getRecipeWithItems(id);
    if (recipeData) {
      setRecipe(recipeData);
      setName(recipeData.name);
      setServings(recipeData.servings);
      setCookedYieldG(recipeData.cooked_yield_g?.toString() || '');
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Please enter a recipe name');
      return;
    }

    if (servings < 1) {
      alert('Servings must be at least 1');
      return;
    }

    const yieldG = cookedYieldG ? parseFloat(cookedYieldG) : undefined;

    if (isNew) {
      const newRecipe = await createRecipe(name, servings, yieldG);
      navigate(`/recipes/${newRecipe.id}`);
    } else if (recipe) {
      await updateRecipe(recipe.id, { name, servings, cooked_yield_g: yieldG });
      await loadRecipe();
    }
  }

  async function handleSearchIngredients() {
    if (searchQuery.length < 2) return;
    const results = await searchFoods(searchQuery, 10);
    setSearchResults(results);
  }

  async function handleSelectFood(food: FoodWithNutrients) {
    setSelectedFood(food);
    setSearchResults([]);
    setSearchQuery('');
  }

  async function handleAddIngredient() {
    if (!selectedFood || !recipe) return;

    const grams = parseFloat(ingredientGrams);
    if (isNaN(grams) || grams <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    await addRecipeItem(recipe.id, selectedFood.id, grams);
    await loadRecipe();

    // Reset
    setSelectedFood(null);
    setIngredientGrams('100');
    setShowAddIngredient(false);
  }

  async function handleRemoveIngredient(itemId: string) {
    if (!confirm('Remove this ingredient?')) return;
    await deleteRecipeItem(itemId);
    await loadRecipe();
  }

  async function handleDeleteRecipe() {
    if (!recipe) return;
    if (!confirm(`Delete recipe "${recipe.name}"?`)) return;

    await deleteRecipe(recipe.id);
    navigate('/recipes');
  }

  async function handleLogRecipe() {
    if (!recipe) return;

    const servingsCount = parseFloat(logServings);
    if (isNaN(servingsCount) || servingsCount <= 0) {
      alert('Please enter a valid number of servings');
      return;
    }

    // Calculate grams based on servings
    const totalGrams = recipe.items.reduce((sum, item) => sum + item.grams, 0);
    const gramsPerServing = totalGrams / recipe.servings;
    const logGrams = gramsPerServing * servingsCount;

    // Create a "virtual" food entry for the recipe
    // We'll need to save this as a food first, or log directly
    // For now, let's just calculate and alert the user
    // In a full implementation, you'd save the recipe as a composite food

    alert(
      `Would log ${servingsCount} servings (${logGrams.toFixed(0)}g) to ${selectedMeal}.\nRecipe logging will be fully implemented next.`
    );

    setShowLogRecipe(false);
  }

  // Calculate nutrition for current recipe
  const totalNutrients = recipe ? calculateRecipeTotals(recipe) : null;
  const perServingNutrients = recipe ? calculateRecipePerServing(recipe) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-lg">Loading recipe...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <button onClick={() => navigate('/recipes')} className="text-blue-600 mb-3">
            ← Back to Recipes
          </button>
          <h1 className="text-2xl font-bold">{isNew ? 'New Recipe' : 'Edit Recipe'}</h1>
        </div>

        {/* Basic Info */}
        <div className="bg-white border-b p-4">
          <h2 className="text-lg font-semibold mb-3">Recipe Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipe Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Chicken Stir Fry"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servings *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooked Yield (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={cookedYieldG}
                  onChange={(e) => setCookedYieldG(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
            >
              {isNew ? 'Create Recipe' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Ingredients (only show for existing recipes) */}
        {!isNew && recipe && (
          <>
            <div className="bg-white border-b p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Ingredients</h2>
                <button
                  onClick={() => setShowAddIngredient(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm"
                >
                  + Add Ingredient
                </button>
              </div>

              {recipe.items.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No ingredients yet. Add your first ingredient above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipe.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.food.name}</div>
                        <div className="text-sm text-gray-600">{item.grams}g</div>
                      </div>
                      <button
                        onClick={() => handleRemoveIngredient(item.id)}
                        className="text-red-600 hover:text-red-700 px-3"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nutrition Summary */}
            {recipe.items.length > 0 && totalNutrients && perServingNutrients && (
              <div className="bg-white border-b p-4">
                <h2 className="text-lg font-semibold mb-3">Nutrition Facts</h2>

                <div className="space-y-4">
                  {/* Per Serving */}
                  <div>
                    <h3 className="font-medium text-sm text-gray-700 mb-2">
                      Per Serving (1 of {recipe.servings})
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Calories:</span>{' '}
                        <span className="font-semibold">
                          {formatNutrientValue(perServingNutrients.kcal, 0)} kcal
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Protein:</span>{' '}
                        <span className="font-semibold">
                          {formatNutrientValue(perServingNutrients.protein_g)}g
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Carbs:</span>{' '}
                        <span className="font-semibold">
                          {formatNutrientValue(perServingNutrients.carbs_g)}g
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fat:</span>{' '}
                        <span className="font-semibold">
                          {formatNutrientValue(perServingNutrients.fat_g)}g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-3 border-t">
                    <h3 className="font-medium text-sm text-gray-700 mb-2">
                      Total Recipe
                    </h3>
                    <div className="text-sm text-gray-600">
                      {formatNutrientValue(totalNutrients.kcal, 0)} kcal,{' '}
                      {formatNutrientValue(totalNutrients.protein_g)}g protein
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-4 space-y-3">
              <button
                onClick={() => setShowLogRecipe(true)}
                disabled={recipe.items.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Log to Meal
              </button>

              <button
                onClick={handleDeleteRecipe}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
              >
                Delete Recipe
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Ingredient Modal */}
      {showAddIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Add Ingredient</h2>

            {!selectedFood ? (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 2) {
                        handleSearchIngredients();
                      }
                    }}
                    placeholder="Search foods..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="space-y-2 mb-4">
                  {searchResults.map((food) => (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <div className="font-medium">{food.name}</div>
                      {food.brand && (
                        <div className="text-sm text-gray-600">{food.brand}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{selectedFood.name}</div>
                  {selectedFood.brand && (
                    <div className="text-sm text-gray-600">{selectedFood.brand}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (grams)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={ingredientGrams}
                    onChange={(e) => setIngredientGrams(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddIngredient}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Change Food
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => {
                setShowAddIngredient(false);
                setSelectedFood(null);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="w-full mt-3 text-gray-600 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Log Recipe Modal */}
      {showLogRecipe && recipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Log Recipe</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Servings
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={logServings}
                  onChange={(e) => setLogServings(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal
                </label>
                <select
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value as MealType)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLogRecipe}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Log
                </button>
                <button
                  onClick={() => setShowLogRecipe(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

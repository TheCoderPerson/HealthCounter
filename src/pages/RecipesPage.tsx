import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRecipes } from '../db/recipeRepository';
import type { Recipe } from '../types';

export function RecipesPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    const allRecipes = await getAllRecipes();
    setRecipes(allRecipes);
    setLoading(false);
  }

  const handleCreateRecipe = () => {
    navigate('/recipes/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-lg">Loading recipes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Recipes</h1>
          <button
            onClick={handleCreateRecipe}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            + New Recipe
          </button>
        </div>

        {/* Recipe list */}
        {recipes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-xl font-semibold mb-2">No Recipes Yet</h2>
            <p className="text-gray-600 mb-4">
              Create your first recipe to track nutrition for your homemade meals
            </p>
            <button
              onClick={handleCreateRecipe}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Create Recipe
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{recipe.name}</h3>
                    <div className="flex gap-3 mt-2 text-sm text-gray-600">
                      <span>🍽️ {recipe.servings} servings</span>
                      {recipe.cooked_yield_g && (
                        <span>⚖️ {recipe.cooked_yield_g}g yield</span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl">→</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

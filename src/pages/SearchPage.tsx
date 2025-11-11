import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchFoods, createFood, getFoodWithNutrients, getFoodBySourceKey } from '../db/foodRepository';
import { getRecentFoods } from '../db/entryRepository';
import { getFavoriteFoods, addFavorite, removeFavoriteByFoodId, isFavorite } from '../db/favoritesRepository';
import { searchOFF } from '../api/openFoodFacts';
import { searchFDC } from '../api/foodDataCentral';
import type { FoodWithNutrients } from '../types';

type Tab = 'all' | 'favorites' | 'recent';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mealParam = searchParams.get('meal');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodWithNutrients[]>([]);
  const [favorites, setFavorites] = useState<FoodWithNutrients[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodWithNutrients[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFavorites();
    loadRecent();
  }, []);

  useEffect(() => {
    // Auto-search only local foods when query changes (with debounce)
    const timer = setTimeout(() => {
      if (query.length >= 2 && activeTab === 'all') {
        handleLocalSearch();
      } else if (query.length === 0) {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function handleLocalSearch() {
    if (!query.trim()) return;

    try {
      const localResults = await searchFoods(query);
      setResults(localResults);
    } catch (error) {
      console.error('Local search error:', error);
    }
  }

  async function loadFavorites() {
    const favs = await getFavoriteFoods();
    setFavorites(favs);

    // Build favorites map
    const map: Record<string, boolean> = {};
    for (const fav of favs) {
      map[fav.id] = true;
      if (fav.source_key) {
        map[`${fav.source}:${fav.source_key}`] = true;
      }
    }
    setFavoritesMap(map);
  }

  async function loadRecent() {
    const recentIds = await getRecentFoods(10);
    const foods = await Promise.all(recentIds.map((id) => getFoodWithNutrients(id)));
    setRecentFoods(foods.filter((f) => f !== null) as FoodWithNutrients[]);
  }

  async function handleRemoteSearch() {
    if (!query.trim()) return;

    setLoading(true);

    try {
      // Search all sources in parallel
      const [localResults, offResults, fdcResults] = await Promise.all([
        searchFoods(query).catch((err) => {
          console.error('Local search error:', err);
          return [];
        }),
        searchOFF(query).catch((err) => {
          console.error('OFF search error:', err);
          return [];
        }),
        searchFDC(query).catch((err) => {
          console.error('FDC search error:', err);
          return [];
        }),
      ]);

      // Combine all results
      const combinedResults = [...localResults, ...offResults, ...fdcResults];

      setResults(combinedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleRemoteSearch();
    }
  }

  async function handleFoodClick(food: FoodWithNutrients) {
    let foodId = food.id;

    // If from remote source (OFF/FDC), check if already in local DB
    if (food.source === 'OFF' || food.source === 'FDC') {
      // Check if we already have this food cached locally
      const existingFood = food.source_key
        ? await getFoodBySourceKey(food.source, food.source_key)
        : null;

      if (existingFood) {
        // Use the existing local food's ID
        foodId = existingFood.id;
      } else {
        // Save to local DB and use new ID
        const saved = await createFood(
          {
            name: food.name,
            brand: food.brand,
            source: food.source,
            source_key: food.source_key,
            state: food.state,
            grams_per_serving: food.grams_per_serving,
            confidence: food.confidence,
          },
          food.nutrients
        );
        foodId = saved.id;
      }
    }

    // Navigate to food detail, preserving meal parameter if present
    const url = mealParam ? `/food/${foodId}?meal=${mealParam}` : `/food/${foodId}`;
    navigate(url);
  }

  async function toggleFavorite(food: FoodWithNutrients, e: React.MouseEvent) {
    e.stopPropagation();

    let foodId = food.id;

    // If from remote source (OFF/FDC), ensure it's saved locally first
    if (food.source === 'OFF' || food.source === 'FDC') {
      const existingFood = food.source_key
        ? await getFoodBySourceKey(food.source, food.source_key)
        : null;

      if (existingFood) {
        foodId = existingFood.id;
      } else {
        const saved = await createFood(
          {
            name: food.name,
            brand: food.brand,
            source: food.source,
            source_key: food.source_key,
            state: food.state,
            grams_per_serving: food.grams_per_serving,
            confidence: food.confidence,
          },
          food.nutrients
        );
        foodId = saved.id;
      }
    }

    const isCurrentlyFavorite = await isFavorite(foodId);

    if (isCurrentlyFavorite) {
      await removeFavoriteByFoodId(foodId);
    } else {
      await addFavorite(foodId);
    }

    await loadFavorites();
  }

  const tabs = [
    { id: 'all' as Tab, label: 'All', icon: '🔍' },
    { id: 'favorites' as Tab, label: 'Favorites', icon: '⭐' },
    { id: 'recent' as Tab, label: 'Recent', icon: '🕒' },
  ];

  const displayResults =
    activeTab === 'all'
      ? results
      : activeTab === 'favorites'
      ? favorites
      : recentFoods;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b p-4 sticky top-0 z-10">
          <h1 className="text-2xl font-bold mb-4">Search Foods</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'all' && (
            <>
              {/* Search input */}
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search foods (press Enter for online search)..."
                  className="flex-1 px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleRemoteSearch}
                  disabled={query.length < 2}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Search Online
                </button>
              </div>

              {/* Info text */}
              <p className="text-sm text-gray-600">
                Auto-searches your saved foods. Click "Search Online" or press Enter to search Open Food Facts and USDA databases.
              </p>
            </>
          )}
        </div>

        {/* Results */}
        <div className="p-4">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Searching...</p>
            </div>
          )}

          {!loading && displayResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {activeTab === 'all' && query.length < 2 && (
                <div>
                  <p className="text-5xl mb-3">🔍</p>
                  <p>Enter at least 2 characters to search</p>
                </div>
              )}
              {activeTab === 'all' && query.length >= 2 && (
                <p>No results found for "{query}"</p>
              )}
              {activeTab === 'favorites' && <p>No favorites yet</p>}
              {activeTab === 'recent' && <p>No recent foods</p>}
            </div>
          )}

          {!loading && displayResults.length > 0 && (
            <div className="space-y-2">
              {displayResults.map((food) => {
                const foodIsFavorite =
                  favoritesMap[food.id] ||
                  (food.source_key && favoritesMap[`${food.source}:${food.source_key}`]);

                return (
                  <div
                    key={food.id}
                    onClick={() => handleFoodClick(food)}
                    className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{food.name}</h3>
                        {food.brand && (
                          <p className="text-sm text-gray-600">{food.brand}</p>
                        )}

                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              food.source === 'OFF'
                                ? 'bg-orange-100 text-orange-800'
                                : food.source === 'FDC'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {food.source === 'OFF'
                              ? 'Open Food Facts'
                              : food.source === 'FDC'
                              ? 'USDA'
                              : 'My Foods'}
                          </span>

                          {food.nutrients.kcal !== undefined && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {Math.round(food.nutrients.kcal)} kcal/100g
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(food, e)}
                        className="ml-3 text-2xl"
                      >
                        {foodIsFavorite ? '⭐' : '☆'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

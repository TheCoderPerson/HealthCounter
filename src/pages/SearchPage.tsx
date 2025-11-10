import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchFoods, createFood, getFoodWithNutrients } from '../db/foodRepository';
import { getRecentFoods } from '../db/entryRepository';
import { getFavoriteFoods, addFavorite, removeFavoriteByFoodId, isFavorite } from '../db/favoritesRepository';
import { searchOFF } from '../api/openFoodFacts';
import { searchFDC } from '../api/foodDataCentral';
import type { FoodWithNutrients } from '../types';

type Tab = 'all' | 'favorites' | 'recent';
type Source = 'local' | 'off' | 'fdc';

export function SearchPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<Source>('local');
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
    // Auto-search when query changes (with debounce)
    const timer = setTimeout(() => {
      if (query.length >= 2 && activeTab === 'all') {
        handleSearch();
      } else if (query.length === 0) {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, source]);

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

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);

    try {
      let searchResults: FoodWithNutrients[] = [];

      if (source === 'local') {
        searchResults = await searchFoods(query);
      } else if (source === 'off') {
        searchResults = await searchOFF(query);
      } else if (source === 'fdc') {
        searchResults = await searchFDC(query);
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFoodClick(food: FoodWithNutrients) {
    // If from remote source, save to local DB first
    if ((food.source === 'OFF' || food.source === 'FDC') && !food.id.match(/^[0-9a-f]{8}-/)) {
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
      navigate(`/food/${saved.id}`);
    } else {
      navigate(`/food/${food.id}`);
    }
  }

  async function toggleFavorite(food: FoodWithNutrients, e: React.MouseEvent) {
    e.stopPropagation();

    const isCurrentlyFavorite = await isFavorite(food.id);

    if (isCurrentlyFavorite) {
      await removeFavoriteByFoodId(food.id);
    } else {
      // Ensure the food is saved locally first
      let foodId = food.id;
      if ((food.source === 'OFF' || food.source === 'FDC') && !food.id.match(/^[0-9a-f]{8}-/)) {
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
      await addFavorite(foodId);
    }

    await loadFavorites();
  }

  const tabs = [
    { id: 'all' as Tab, label: 'All', icon: '🔍' },
    { id: 'favorites' as Tab, label: 'Favorites', icon: '⭐' },
    { id: 'recent' as Tab, label: 'Recent', icon: '🕒' },
  ];

  const sources = [
    { id: 'local' as Source, label: 'My Foods' },
    { id: 'off' as Source, label: 'Open Food Facts' },
    { id: 'fdc' as Source, label: 'USDA FDC' },
  ];

  const displayResults =
    activeTab === 'all'
      ? results
      : activeTab === 'favorites'
      ? favorites
      : recentFoods;

  return (
    <div className="min-h-screen bg-gray-50">
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
              <div className="mb-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search foods..."
                  className="w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Source selector */}
              <div className="flex gap-2">
                {sources.map((src) => (
                  <button
                    key={src.id}
                    onClick={() => setSource(src.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                      source === src.id
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
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

import type { FoodWithNutrients, NutrientsPer100g } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getFDCApiKey } from '../utils/settings';

// USDA FoodData Central API
// Note: Requires an API key from https://fdc.nal.usda.gov/api-key-signup.html
// IMPORTANT: DEMO_KEY has very strict rate limits (429 errors). Get a free API key at the URL above.
const FDC_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

// FDC nutrient IDs (standardized)
const NUTRIENT_IDS = {
  // Energy
  kcal: 1008,
  // Macros
  protein_g: 1003,
  fat_g: 1004,
  carbs_g: 1005,
  // Fiber & Sugar
  fiber_g: 1079,
  sugar_g: 2000,
  // Fats
  sat_fat_g: 1258,
  mono_fat_g: 1292,
  poly_fat_g: 1293,
  trans_fat_g: 1257,
  // Minerals (mg)
  sodium_mg: 1093,
  potassium_mg: 1092,
  calcium_mg: 1087,
  magnesium_mg: 1090,
  iron_mg: 1089,
  zinc_mg: 1095,
  // Vitamins
  vitamin_d_ug: 1114,
  vitamin_a_rae: 1106,
  vitamin_e_mg: 1109,
  vitamin_k_ug: 1185,
  vitamin_c_mg: 1162,
  thiamin_b1_mg: 1165,
  riboflavin_b2_mg: 1166,
  niacin_b3_mg: 1167,
  vitamin_b6_mg: 1175,
  folate_ug_dfe: 1190,
  vitamin_b12_ug: 1178,
  // Other
  cholesterol_mg: 1253,
};

interface FDCNutrient {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  value: number;
}

interface FDCFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: FDCNutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
}

interface FDCSearchResult {
  foods: FDCFood[];
  totalHits: number;
}

// Map FDC nutrients to our canonical format
function mapFDCNutrients(fdcNutrients: FDCNutrient[]): NutrientsPer100g {
  const nutrients: NutrientsPer100g = {};

  // Create a map of nutrient ID to value for easier lookup
  const nutrientMap = new Map<number, number>();
  fdcNutrients.forEach((n) => {
    nutrientMap.set(n.nutrientId, n.value);
  });

  // Map each of our canonical nutrients
  for (const [key, fdcId] of Object.entries(NUTRIENT_IDS)) {
    const value = nutrientMap.get(fdcId);
    if (value !== undefined) {
      // Most FDC nutrients are already per 100g
      nutrients[key as keyof NutrientsPer100g] = value;
    }
  }

  return nutrients;
}

// Parse serving size to grams
function parseServingSize(size?: number, unit?: string): number | undefined {
  if (!size || !unit) return undefined;

  // Convert common units to grams
  const lowerUnit = unit.toLowerCase();

  if (lowerUnit === 'g' || lowerUnit === 'grams') {
    return size;
  }

  // For other units, would need conversion factors
  // For now, return undefined if not in grams
  return undefined;
}

// Search FDC for foods
export async function searchFDC(
  query: string,
  limit = 20
): Promise<FoodWithNutrients[]> {
  try {
    const apiKey = getFDCApiKey();
    console.log('[FDC] Searching with query:', query, '| API Key:', apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : 'Custom Key (length: ' + apiKey.length + ')');

    const params = new URLSearchParams({
      query,
      pageSize: limit.toString(),
      api_key: apiKey, // Get API key from settings
      dataType: 'Foundation,SR Legacy', // Prefer these for full nutrient data
    });

    const url = `${FDC_API_BASE}/foods/search?${params}`;
    console.log('[FDC] Request URL:', url.replace(/api_key=[^&]+/, 'api_key=***'));

    const response = await fetch(url);

    console.log('[FDC] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FDC] API error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.status === 429) {
        console.error('[FDC] Rate limit exceeded. Your API key has hit the rate limit. Consider waiting or getting a new API key at https://fdc.nal.usda.gov/api-key-signup.html');
      } else if (response.status === 403) {
        console.error('[FDC] Access forbidden. Your API key may be invalid. Please check your API key in Settings.');
      } else if (response.status === 400) {
        console.error('[FDC] Bad request. The API key or request parameters may be invalid.');
      }
      return [];
    }

    const data: FDCSearchResult = await response.json();
    console.log('[FDC] Found', data.foods?.length || 0, 'results');

    return data.foods.map((fdcFood) => {
      const nutrients = mapFDCNutrients(fdcFood.foodNutrients);

      const food: FoodWithNutrients = {
        id: uuidv4(),
        name: fdcFood.description,
        source: 'FDC',
        source_key: fdcFood.fdcId.toString(),
        state: null, // Could be inferred from description
        grams_per_serving: parseServingSize(
          fdcFood.servingSize,
          fdcFood.servingSizeUnit
        ),
        confidence: 'exact_db',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        nutrients,
      };

      return food;
    });
  } catch (error) {
    console.error('[FDC] Error searching FDC:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[FDC] Network error - this could be a CORS issue, network connectivity problem, or the API might be unreachable from your device');
    }
    return [];
  }
}

// Get specific food by FDC ID
export async function getFDCFood(fdcId: string): Promise<FoodWithNutrients | null> {
  try {
    const apiKey = getFDCApiKey();
    console.log('[FDC] Fetching food ID:', fdcId);

    const params = new URLSearchParams({
      api_key: apiKey, // Get API key from settings
    });

    const url = `${FDC_API_BASE}/food/${fdcId}?${params}`;
    const response = await fetch(url);

    console.log('[FDC] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FDC] API error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });

      if (response.status === 429) {
        console.error('[FDC] Rate limit exceeded. Consider getting a free API key at https://fdc.nal.usda.gov/api-key-signup.html');
      } else if (response.status === 403) {
        console.error('[FDC] Access forbidden. Your API key may be invalid.');
      }
      return null;
    }

    const fdcFood: FDCFood = await response.json();
    const nutrients = mapFDCNutrients(fdcFood.foodNutrients);

    const food: FoodWithNutrients = {
      id: uuidv4(),
      name: fdcFood.description,
      source: 'FDC',
      source_key: fdcId,
      state: null,
      grams_per_serving: parseServingSize(
        fdcFood.servingSize,
        fdcFood.servingSizeUnit
      ),
      confidence: 'exact_db',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      nutrients,
    };

    return food;
  } catch (error) {
    console.error('[FDC] Error fetching FDC food:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[FDC] Network error - this could be a CORS issue, network connectivity problem, or the API might be unreachable from your device');
    }
    return null;
  }
}

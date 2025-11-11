import type { FoodWithNutrients, NutrientsPer100g } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Open Food Facts API base URL
const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2';

// OFF product response type
interface OFFProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    [key: string]: number | string;
  };
  nutriscore_grade?: string;
  countries_tags?: string[];
}

interface OFFResponse {
  status: number;
  product?: OFFProduct;
}

// Normalize barcode (remove spaces, ensure valid format)
export function normalizeBarcode(barcode: string): string {
  return barcode.replace(/\s+/g, '').trim();
}

// Map OFF nutrient keys to our canonical keys
function mapOFFNutrients(offNutriments: Record<string, number | string>): NutrientsPer100g {
  const nutrients: NutrientsPer100g = {};

  // Helper to safely get numeric value per 100g
  const get100g = (key: string): number | undefined => {
    const value = offNutriments[`${key}_100g`];
    return typeof value === 'number' ? value : undefined;
  };

  // Macros
  nutrients.kcal = get100g('energy-kcal');
  nutrients.protein_g = get100g('proteins');
  nutrients.fat_g = get100g('fat');
  nutrients.carbs_g = get100g('carbohydrates');

  // Fiber & Sugar
  nutrients.fiber_g = get100g('fiber');
  nutrients.sugar_g = get100g('sugars');
  nutrients.added_sugar_g = get100g('added-sugars');

  // Fat breakdown
  nutrients.sat_fat_g = get100g('saturated-fat');
  nutrients.mono_fat_g = get100g('monounsaturated-fat');
  nutrients.poly_fat_g = get100g('polyunsaturated-fat');
  nutrients.trans_fat_g = get100g('trans-fat');

  // Minerals (convert from g to mg where needed)
  const sodium_g = get100g('sodium');
  nutrients.sodium_mg = sodium_g !== undefined ? sodium_g * 1000 : undefined;

  const potassium_g = get100g('potassium');
  nutrients.potassium_mg = potassium_g !== undefined ? potassium_g * 1000 : undefined;

  const calcium_g = get100g('calcium');
  nutrients.calcium_mg = calcium_g !== undefined ? calcium_g * 1000 : undefined;

  const magnesium_g = get100g('magnesium');
  nutrients.magnesium_mg = magnesium_g !== undefined ? magnesium_g * 1000 : undefined;

  const iron_g = get100g('iron');
  nutrients.iron_mg = iron_g !== undefined ? iron_g * 1000 : undefined;

  const zinc_g = get100g('zinc');
  nutrients.zinc_mg = zinc_g !== undefined ? zinc_g * 1000 : undefined;

  // Vitamins
  nutrients.vitamin_d_ug = get100g('vitamin-d');
  nutrients.vitamin_a_rae = get100g('vitamin-a');
  nutrients.vitamin_e_mg = get100g('vitamin-e');
  nutrients.vitamin_k_ug = get100g('vitamin-k');
  nutrients.vitamin_c_mg = get100g('vitamin-c');
  nutrients.thiamin_b1_mg = get100g('vitamin-b1');
  nutrients.riboflavin_b2_mg = get100g('vitamin-b2');
  nutrients.niacin_b3_mg = get100g('vitamin-pp'); // niacin in OFF
  nutrients.vitamin_b6_mg = get100g('vitamin-b6');
  nutrients.folate_ug_dfe = get100g('vitamin-b9');
  nutrients.vitamin_b12_ug = get100g('vitamin-b12');

  // Other
  const cholesterol_g = get100g('cholesterol');
  nutrients.cholesterol_mg = cholesterol_g !== undefined ? cholesterol_g * 1000 : undefined;

  return nutrients;
}

// Parse serving size string (e.g., "30g", "1 cup (240ml)")
function parseServingSize(servingSize?: string): number | undefined {
  if (!servingSize) return undefined;

  // Try to extract grams
  const gramsMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*g/i);
  if (gramsMatch) {
    return parseFloat(gramsMatch[1]);
  }

  return undefined;
}

// Lookup product by barcode
export async function lookupBarcode(barcode: string): Promise<FoodWithNutrients | null> {
  const normalizedBarcode = normalizeBarcode(barcode);

  try {
    const response = await fetch(`${OFF_API_BASE}/product/${normalizedBarcode}.json`);

    if (!response.ok) {
      console.error('[OFF] Barcode lookup error:', response.status, response.statusText);
      return null;
    }

    const data: OFFResponse = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;
    const nutrients = product.nutriments ? mapOFFNutrients(product.nutriments) : {};

    // Determine confidence based on nutrient availability
    const hasFullNutrients = nutrients.kcal !== undefined && nutrients.protein_g !== undefined;
    const confidence = hasFullNutrients ? 'exact_db' : 'exact_db';

    const food: FoodWithNutrients = {
      id: uuidv4(),
      name: product.product_name || 'Unknown Product',
      brand: product.brands || undefined,
      source: 'OFF',
      source_key: normalizedBarcode,
      state: null,
      grams_per_serving: parseServingSize(product.serving_size),
      confidence,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_checked_at: new Date().toISOString(),
      country_hint: product.countries_tags?.[0],
      nutrients,
    };

    return food;
  } catch (error) {
    console.error('Error fetching from OFF:', error);
    return null;
  }
}

// Search products by text
export async function searchOFF(query: string, limit = 20): Promise<FoodWithNutrients[]> {
  try {
    // Use the search-a-licious API which has better full text search support
    const params = new URLSearchParams({
      q: query,
      page_size: limit.toString(),
      fields: 'product_name,brands,code,nutriments,serving_size',
    });

    const response = await fetch(`https://search.openfoodfacts.org/search?${params}`);

    if (!response.ok) {
      console.error('[OFF] Search error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('[OFF DEBUG] API Response:', {
      count: data.count,
      page: data.page,
      page_size: data.page_size,
      hits_length: data.hits?.length || 0,
      first_hit: data.hits?.[0],
    });

    // search-a-licious returns results in "hits" array, not "products"
    const hits = data.hits || [];

    // No need for strict filtering since search-a-licious has better relevance
    // Just filter out products without names
    return hits
      .filter((hit: any) => hit.product_name)
      .map((hit: any) => {
        const nutrients = hit.nutriments ? mapOFFNutrients(hit.nutriments) : {};

        const food: FoodWithNutrients = {
          id: uuidv4(),
          name: hit.product_name || 'Unknown Product',
          brand: hit.brands || undefined,
          source: 'OFF',
          source_key: hit.code,
          state: null,
          grams_per_serving: parseServingSize(hit.serving_size),
          confidence: 'exact_db',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          nutrients,
        };

        return food;
      });
  } catch (error) {
    console.error('Error searching OFF:', error);
    return [];
  }
}

// All nutrient keys as per the design doc
export type NutrientKey =
  // Macros
  | 'kcal'
  | 'protein_g'
  | 'fat_g'
  | 'carbs_g'
  // Fiber & Sugar
  | 'fiber_g'
  | 'sugar_g'
  | 'added_sugar_g'
  // Fats breakdown
  | 'sat_fat_g'
  | 'mono_fat_g'
  | 'poly_fat_g'
  | 'trans_fat_g'
  // Minerals
  | 'sodium_mg'
  | 'potassium_mg'
  | 'calcium_mg'
  | 'magnesium_mg'
  | 'iron_mg'
  | 'zinc_mg'
  // Vitamins
  | 'vitamin_d_ug'
  | 'vitamin_a_rae'
  | 'vitamin_e_mg'
  | 'vitamin_k_ug'
  | 'vitamin_c_mg'
  | 'thiamin_b1_mg'
  | 'riboflavin_b2_mg'
  | 'niacin_b3_mg'
  | 'vitamin_b6_mg'
  | 'folate_ug_dfe'
  | 'vitamin_b12_ug'
  // Other
  | 'cholesterol_mg';

// All nutrients are optional and per 100g
export type NutrientsPer100g = Partial<Record<NutrientKey, number>>;

// Display names for nutrients
export const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  kcal: 'Calories',
  protein_g: 'Protein',
  fat_g: 'Total Fat',
  carbs_g: 'Carbohydrates',
  fiber_g: 'Fiber',
  sugar_g: 'Sugar',
  added_sugar_g: 'Added Sugar',
  sat_fat_g: 'Saturated Fat',
  mono_fat_g: 'Monounsaturated Fat',
  poly_fat_g: 'Polyunsaturated Fat',
  trans_fat_g: 'Trans Fat',
  sodium_mg: 'Sodium',
  potassium_mg: 'Potassium',
  calcium_mg: 'Calcium',
  magnesium_mg: 'Magnesium',
  iron_mg: 'Iron',
  zinc_mg: 'Zinc',
  vitamin_d_ug: 'Vitamin D',
  vitamin_a_rae: 'Vitamin A',
  vitamin_e_mg: 'Vitamin E',
  vitamin_k_ug: 'Vitamin K',
  vitamin_c_mg: 'Vitamin C',
  thiamin_b1_mg: 'Thiamin (B1)',
  riboflavin_b2_mg: 'Riboflavin (B2)',
  niacin_b3_mg: 'Niacin (B3)',
  vitamin_b6_mg: 'Vitamin B6',
  folate_ug_dfe: 'Folate',
  vitamin_b12_ug: 'Vitamin B12',
  cholesterol_mg: 'Cholesterol',
};

// Units for display
export const NUTRIENT_UNITS: Record<NutrientKey, string> = {
  kcal: 'kcal',
  protein_g: 'g',
  fat_g: 'g',
  carbs_g: 'g',
  fiber_g: 'g',
  sugar_g: 'g',
  added_sugar_g: 'g',
  sat_fat_g: 'g',
  mono_fat_g: 'g',
  poly_fat_g: 'g',
  trans_fat_g: 'g',
  sodium_mg: 'mg',
  potassium_mg: 'mg',
  calcium_mg: 'mg',
  magnesium_mg: 'mg',
  iron_mg: 'mg',
  zinc_mg: 'mg',
  vitamin_d_ug: 'µg',
  vitamin_a_rae: 'µg RAE',
  vitamin_e_mg: 'mg',
  vitamin_k_ug: 'µg',
  vitamin_c_mg: 'mg',
  thiamin_b1_mg: 'mg',
  riboflavin_b2_mg: 'mg',
  niacin_b3_mg: 'mg',
  vitamin_b6_mg: 'mg',
  folate_ug_dfe: 'µg DFE',
  vitamin_b12_ug: 'µg',
  cholesterol_mg: 'mg',
};

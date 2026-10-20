import axios from 'axios';
import { OpenFoodFactsProduct } from '../shared/index.js';

// Rich pre-seeded catalog of packaged & whole foods from Open Food Facts & USDA
export const SEED_NUTRITION_PRODUCTS: OpenFoodFactsProduct[] = [
  {
    code: '737628064502',
    name: 'Organic Rolled Oats',
    brands: "Bob's Red Mill",
    categories: 'Plant-based foods, Cereals, Oats',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    nutriscoreGrade: 'a',
    novaGroup: 1,
    ecoscoreGrade: 'a',
    servingSize: '1/2 cup dry (48g)',
    servingWeightGrams: 48,
    caloriesKcal: 190,
    macronutrients: {
      proteinG: 7,
      carbsG: 32,
      sugarsG: 1,
      fatG: 3.5,
      saturatedFatG: 0.5,
      fiberG: 5,
      saltG: 0.01
    },
    minerals: {
      sodiumMg: 0,
      calciumMg: 20,
      ironMg: 1.8,
      potassiumMg: 150,
      magnesiumMg: 56
    },
    source: 'usda_foundation'
  },
  {
    code: '3017620422003',
    name: 'Greek Whole Milk Strained Yogurt',
    brands: 'Chobani / Fage',
    categories: 'Dairies, Fermented foods, Yogurts, Greek yogurts',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    nutriscoreGrade: 'a',
    novaGroup: 1,
    ecoscoreGrade: 'b',
    servingSize: '1 cup (170g)',
    servingWeightGrams: 170,
    caloriesKcal: 160,
    macronutrients: {
      proteinG: 18,
      carbsG: 6,
      sugarsG: 5,
      fatG: 7,
      saturatedFatG: 4.5,
      fiberG: 0,
      saltG: 0.12
    },
    minerals: {
      sodiumMg: 65,
      calciumMg: 240,
      ironMg: 0.1,
      potassiumMg: 280,
      magnesiumMg: 22
    },
    source: 'open_food_facts'
  },
  {
    code: '0041570054368',
    name: 'Natural Creamy Peanut Butter',
    brands: "Smucker's / Whole Foods 365",
    categories: 'Plant-based foods, Spreads, Nut butters, Peanut butter',
    imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400',
    nutriscoreGrade: 'b',
    novaGroup: 1,
    ecoscoreGrade: 'a',
    servingSize: '2 tbsp (32g)',
    servingWeightGrams: 32,
    caloriesKcal: 190,
    macronutrients: {
      proteinG: 8,
      carbsG: 6,
      sugarsG: 2,
      fatG: 16,
      saturatedFatG: 2.5,
      fiberG: 3,
      saltG: 0.15
    },
    minerals: {
      sodiumMg: 105,
      calciumMg: 18,
      ironMg: 0.9,
      potassiumMg: 210,
      magnesiumMg: 54
    },
    source: 'open_food_facts'
  },
  {
    code: '8901030865412',
    name: 'Organic Unsweetened Almond Milk',
    brands: 'Califia Farms / Silk',
    categories: 'Beverages, Plant-based milk, Almond drinks',
    imageUrl: 'https://images.unsplash.com/photo-1568651760814-726485e9fa0d?w=400',
    nutriscoreGrade: 'b',
    novaGroup: 2,
    ecoscoreGrade: 'a',
    servingSize: '1 cup (240ml)',
    servingWeightGrams: 240,
    caloriesKcal: 35,
    macronutrients: {
      proteinG: 1.5,
      carbsG: 1.2,
      sugarsG: 0,
      fatG: 3.0,
      saturatedFatG: 0.2,
      fiberG: 1.0,
      saltG: 0.38
    },
    minerals: {
      sodiumMg: 170,
      calciumMg: 450,
      ironMg: 0.7,
      potassiumMg: 160,
      magnesiumMg: 24
    },
    source: 'open_food_facts'
  },
  {
    code: '0850005753018',
    name: 'Chocolate Sea Salt Pure Protein Bar',
    brands: 'RXBAR / Quest',
    categories: 'Snacks, Protein bars, Health food',
    imageUrl: 'https://images.unsplash.com/photo-1622484216800-478546b53e89?w=400',
    nutriscoreGrade: 'a',
    novaGroup: 2,
    ecoscoreGrade: 'b',
    servingSize: '1 bar (52g)',
    servingWeightGrams: 52,
    caloriesKcal: 210,
    macronutrients: {
      proteinG: 12,
      carbsG: 23,
      sugarsG: 13,
      fatG: 9,
      saturatedFatG: 2,
      fiberG: 5,
      saltG: 0.65
    },
    minerals: {
      sodiumMg: 260,
      calciumMg: 45,
      ironMg: 2.1,
      potassiumMg: 410,
      magnesiumMg: 68
    },
    source: 'open_food_facts'
  },
  {
    code: '7622210449283',
    name: 'Excellence 85% Cocoa Dark Chocolate',
    brands: 'Lindt',
    categories: 'Snacks, Sweet snacks, Chocolates, Dark chocolates',
    imageUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400',
    nutriscoreGrade: 'd',
    novaGroup: 3,
    ecoscoreGrade: 'c',
    servingSize: '4 squares (40g)',
    servingWeightGrams: 40,
    caloriesKcal: 230,
    macronutrients: {
      proteinG: 4.5,
      carbsG: 8,
      sugarsG: 5,
      fatG: 20,
      saturatedFatG: 12,
      fiberG: 6,
      saltG: 0.05
    },
    minerals: {
      sodiumMg: 15,
      calciumMg: 35,
      ironMg: 4.2,
      potassiumMg: 320,
      magnesiumMg: 95
    },
    source: 'open_food_facts'
  },
  {
    code: 'usda_organic_quinoa',
    name: 'Tri-Color Organic Royal Quinoa',
    brands: 'USDA Organic / Andean Grain',
    categories: 'Grains, Ancient grains, Superfoods',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    nutriscoreGrade: 'a',
    novaGroup: 1,
    ecoscoreGrade: 'a',
    servingSize: '1 cup cooked (185g)',
    servingWeightGrams: 185,
    caloriesKcal: 222,
    macronutrients: {
      proteinG: 8.1,
      carbsG: 39.4,
      sugarsG: 1.6,
      fatG: 3.6,
      saturatedFatG: 0.4,
      fiberG: 5.2,
      saltG: 0.03
    },
    minerals: {
      sodiumMg: 13,
      calciumMg: 31,
      ironMg: 2.8,
      potassiumMg: 318,
      magnesiumMg: 118
    },
    source: 'usda_foundation'
  },
  {
    code: 'usda_hass_avocado',
    name: 'Fresh Ripe Hass Avocado',
    brands: 'Fresh Market Produce',
    categories: 'Fruits, Fresh produce, Healthy fats',
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
    nutriscoreGrade: 'a',
    novaGroup: 1,
    ecoscoreGrade: 'a',
    servingSize: '1/2 medium avocado (100g)',
    servingWeightGrams: 100,
    caloriesKcal: 160,
    macronutrients: {
      proteinG: 2.0,
      carbsG: 8.5,
      sugarsG: 0.7,
      fatG: 14.7,
      saturatedFatG: 2.1,
      fiberG: 6.7,
      saltG: 0.02
    },
    minerals: {
      sodiumMg: 7,
      calciumMg: 12,
      ironMg: 0.6,
      potassiumMg: 485,
      magnesiumMg: 29
    },
    source: 'usda_foundation'
  }
];

// Open Food Facts API parser
export function parseOpenFoodFactsProduct(p: any): OpenFoodFactsProduct {
  const nutriments = p.nutriments || {};
  const kcal = Math.round(
    nutriments['energy-kcal_100g'] ||
    (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 150)
  );

  return {
    code: p.code || String(Math.floor(Math.random() * 9000000000000) + 1000000000000),
    name: p.product_name || p.product_name_en || 'Packaged Grocery Item',
    brands: p.brands || 'General Grocery',
    categories: p.categories || 'Food & Grocery',
    imageUrl: p.image_front_url || p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    nutriscoreGrade: (p.nutriscore_grade || 'c').toLowerCase() as any,
    novaGroup: (p.nova_group || 3) as any,
    ecoscoreGrade: p.ecoscore_grade || 'b',
    servingSize: p.serving_size || '100g',
    servingWeightGrams: 100,
    caloriesKcal: kcal,
    macronutrients: {
      proteinG: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
      carbsG: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
      sugarsG: Math.round((nutriments.sugars_100g || 0) * 10) / 10,
      fatG: Math.round((nutriments.fat_100g || 0) * 10) / 10,
      saturatedFatG: Math.round((nutriments['saturated-fat_100g'] || 0) * 10) / 10,
      fiberG: Math.round((nutriments.fiber_100g || 0) * 10) / 10,
      saltG: Math.round((nutriments.salt_100g || 0) * 100) / 100
    },
    minerals: {
      sodiumMg: Math.round((nutriments.sodium_100g || 0) * 1000),
      calciumMg: Math.round((nutriments.calcium_100g || 0) * 1000),
      ironMg: Math.round((nutriments.iron_100g || 0) * 1000 * 10) / 10,
      potassiumMg: Math.round((nutriments.potassium_100g || 0) * 1000),
      magnesiumMg: Math.round((nutriments.magnesium_100g || 0) * 1000)
    },
    source: 'open_food_facts'
  };
}

// Live lookup by Barcode (EAN-13 / UPC)
export async function lookupBarcodeOpenFoodFacts(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const cleanCode = barcode.trim();
  // Check local seed first for instant return
  const localMatch = SEED_NUTRITION_PRODUCTS.find(p => p.code === cleanCode);
  if (localMatch) return localMatch;

  try {
    const res = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(cleanCode)}.json`,
      { timeout: 3500 }
    );

    if (res.data && res.data.status === 1 && res.data.product) {
      return parseOpenFoodFactsProduct(res.data.product);
    }
  } catch {
    // Offline or network error
  }
  return null;
}

// Live search Open Food Facts & USDA database
export async function searchOpenFoodFacts(query: string = ''): Promise<OpenFoodFactsProduct[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return SEED_NUTRITION_PRODUCTS;

  // Local matches first
  const localMatches = SEED_NUTRITION_PRODUCTS.filter(
    p =>
      p.name.toLowerCase().includes(trimmed) ||
      p.brands.toLowerCase().includes(trimmed) ||
      p.categories.toLowerCase().includes(trimmed) ||
      p.code.includes(trimmed)
  );

  try {
    const res = await axios.get(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        trimmed
      )}&search_simple=1&action=process&json=1&page_size=12`,
      { timeout: 3500 }
    );

    if (res.data && res.data.products && Array.isArray(res.data.products)) {
      const live = res.data.products
        .filter((p: any) => p.product_name || p.product_name_en)
        .slice(0, 10)
        .map(parseOpenFoodFactsProduct);

      const seenCodes = new Set(live.map((p: OpenFoodFactsProduct) => p.code));
      const merged = [...live];
      for (const loc of localMatches) {
        if (!seenCodes.has(loc.code)) {
          merged.push(loc);
        }
      }
      return merged;
    }
  } catch {
    // Fall back to local matches
  }

  return localMatches;
}

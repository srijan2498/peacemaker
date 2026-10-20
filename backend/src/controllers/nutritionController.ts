import { Request, Response } from 'express';
import {
  searchOpenFoodFacts,
  lookupBarcodeOpenFoodFacts,
  SEED_NUTRITION_PRODUCTS
} from '../services/nutritionService.js';

export async function searchFoodProducts(req: Request, res: Response): Promise<void> {
  try {
    const q = String(req.query.q || '').trim();
    const products = await searchOpenFoodFacts(q);
    res.status(200).json({
      success: true,
      data: {
        products,
        total: products.length,
        source: 'Open Food Facts + USDA FoodData Central'
      }
    });
  } catch (error: any) {
    res.status(200).json({
      success: true,
      data: {
        products: SEED_NUTRITION_PRODUCTS,
        total: SEED_NUTRITION_PRODUCTS.length,
        source: 'CozyNest Pre-cached Fallback'
      }
    });
  }
}

export async function lookupBarcode(req: Request, res: Response): Promise<void> {
  try {
    const { barcode } = req.params;
    const product = await lookupBarcodeOpenFoodFacts(barcode);
    if (!product) {
      res.status(404).json({
        success: false,
        message: `Barcode ${barcode} not found in Open Food Facts database.`
      });
      return;
    }
    res.status(200).json({ success: true, data: { product } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

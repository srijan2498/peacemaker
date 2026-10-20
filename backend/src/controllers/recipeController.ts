import { Request, Response } from 'express';
import { searchTheMealDb, getTheMealDbRecipeById, ALL_THEMEALDB_RECIPES } from '../services/mealDbService.js';

export async function searchRecipes(req: Request, res: Response): Promise<void> {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const cuisine = String(req.query.cuisine || '').trim();
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '24'), 10)));

    const result = await searchTheMealDb({ q, category, cuisine, page, limit });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(200).json({
      success: true,
      data: {
        recipes: ALL_THEMEALDB_RECIPES.slice(0, 24),
        total: ALL_THEMEALDB_RECIPES.length,
        page: 1,
        totalPages: Math.ceil(ALL_THEMEALDB_RECIPES.length / 24),
        limit: 24,
        categories: [],
        cuisines: [],
        source: 'CozyNest Pre-cached Fallback'
      }
    });
  }
}

export async function getRecipeById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const match = await getTheMealDbRecipeById(id);
    if (!match) {
      res.status(404).json({ success: false, message: 'Recipe not found' });
      return;
    }
    res.status(200).json({ success: true, data: { recipe: match } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

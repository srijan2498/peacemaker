import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { searchRecipes, getRecipeById } from '../controllers/recipeController.js';

const router = Router();

router.use(requireAuth);

router.get('/', searchRecipes);
router.get('/:id', getRecipeById);

export default router;

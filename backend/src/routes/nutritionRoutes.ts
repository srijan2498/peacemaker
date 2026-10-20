import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { searchFoodProducts, lookupBarcode } from '../controllers/nutritionController.js';

const router = Router();

router.use(requireAuth);

router.get('/search', searchFoodProducts);
router.get('/barcode/:barcode', lookupBarcode);

export default router;

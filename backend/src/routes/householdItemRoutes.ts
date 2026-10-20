import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getHouseholdItems,
  createHouseholdItem,
  adjustItemStock,
  updateHouseholdItem,
  deleteHouseholdItem
} from '../controllers/householdItemController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getHouseholdItems);
router.post('/', createHouseholdItem);
router.post('/:id/adjust', adjustItemStock);
router.put('/:id', updateHouseholdItem);
router.delete('/:id', deleteHouseholdItem);

export default router;

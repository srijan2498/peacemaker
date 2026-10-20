import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getHealthRecords,
  createOrUpdateHealthRecord,
  deleteHealthRecord,
  getHealthSummary
} from '../controllers/healthController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getHealthRecords);
router.post('/', createOrUpdateHealthRecord);
router.get('/summary', getHealthSummary);
router.delete('/:id', deleteHealthRecord);

export default router;

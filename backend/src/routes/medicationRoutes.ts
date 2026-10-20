import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getMedications,
  createMedication,
  updateMedication,
  toggleMedicationTaken,
  deleteMedication,
  refillMedication
} from '../controllers/medicationController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMedications);
router.post('/', createMedication);
router.put('/:id', updateMedication);
router.post('/:id/toggle-taken', toggleMedicationTaken);
router.post('/:id/refill', refillMedication);
router.delete('/:id', deleteMedication);

export default router;

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getBills,
  uploadBill,
  linkBillToExpense,
  deleteBill
} from '../controllers/billDocumentController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getBills);
router.post('/', uploadBill);
router.post('/:id/link-expense', linkBillToExpense);
router.delete('/:id', deleteBill);

export default router;

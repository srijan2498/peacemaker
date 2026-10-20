import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  addRepayment
} from '../controllers/moneyTrackerController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createMoneyTransactionSchema, createRepaymentSchema } from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', getTransactions);
router.post('/', validateBody(createMoneyTransactionSchema), createTransaction);
router.get('/:id', getTransactionById);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.post('/:id/repayments', validateBody(createRepaymentSchema), addRepayment);

export default router;

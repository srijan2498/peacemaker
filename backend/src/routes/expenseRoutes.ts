import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFamilyMember } from '../middleware/familyContext.js';
import { validateBody } from '../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema } from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.get('/:familyId/expenses', requireFamilyMember, getExpenses);
router.post('/:familyId/expenses', requireFamilyMember, validateBody(createExpenseSchema), createExpense);
router.get('/:familyId/expenses/:id', requireFamilyMember, getExpenseById);
router.patch('/:familyId/expenses/:id', requireFamilyMember, validateBody(updateExpenseSchema), updateExpense);
router.delete('/:familyId/expenses/:id', requireFamilyMember, deleteExpense);

export default router;

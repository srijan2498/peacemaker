import { Router } from 'express';
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  getCashflowSummary
} from '../controllers/incomeController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFamilyMember } from '../middleware/familyContext.js';
import { validateBody } from '../middleware/validate.js';
import { createIncomeSchema, updateIncomeSchema } from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.get('/:familyId/incomes', requireFamilyMember, getIncomes);
router.post('/:familyId/incomes', requireFamilyMember, validateBody(createIncomeSchema), createIncome);
router.patch('/:familyId/incomes/:id', requireFamilyMember, validateBody(updateIncomeSchema), updateIncome);
router.delete('/:familyId/incomes/:id', requireFamilyMember, deleteIncome);
router.get('/:familyId/cashflow', requireFamilyMember, getCashflowSummary);

export default router;

import { Router } from 'express';
import { getBudgets, setBudget, deleteBudget } from '../controllers/budgetController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFamilyMember, requireFamilyAdmin } from '../middleware/familyContext.js';
import { validateBody } from '../middleware/validate.js';
import { createBudgetSchema } from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.get('/:familyId/budgets', requireFamilyMember, getBudgets);
router.post('/:familyId/budgets', requireFamilyAdmin, validateBody(createBudgetSchema), setBudget);
router.delete('/:familyId/budgets/:id', requireFamilyAdmin, deleteBudget);

export default router;

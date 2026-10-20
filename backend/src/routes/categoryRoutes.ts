import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFamilyMember } from '../middleware/familyContext.js';
import { validateBody } from '../middleware/validate.js';
import { createCategorySchema } from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.get('/:familyId/categories', requireFamilyMember, getCategories);
router.post('/:familyId/categories', requireFamilyMember, validateBody(createCategorySchema), createCategory);
router.patch('/:familyId/categories/:id', requireFamilyMember, updateCategory);
router.delete('/:familyId/categories/:id', requireFamilyMember, deleteCategory);

export default router;

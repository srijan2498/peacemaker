import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFamilyMember } from '../middleware/familyContext.js';

const router = Router();

router.use(requireAuth);

router.get('/:familyId/analytics/summary', requireFamilyMember, getAnalyticsSummary);

export default router;

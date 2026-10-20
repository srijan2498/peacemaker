import { Router } from 'express';
import {
  createFamily,
  getMyFamilies,
  getFamilyDetails,
  updateFamily,
  createInvitation,
  joinFamily,
  getMembers,
  removeMember
} from '../controllers/familyController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFamilyMember, requireFamilyAdmin } from '../middleware/familyContext.js';
import { validateBody } from '../middleware/validate.js';
import {
  createFamilySchema,
  updateFamilySchema,
  joinFamilySchema,
  inviteFamilySchema
} from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createFamilySchema), createFamily);
router.get('/', getMyFamilies);
router.post('/join', validateBody(joinFamilySchema), joinFamily);

router.get('/:familyId', requireFamilyMember, getFamilyDetails);
router.patch('/:familyId', requireFamilyAdmin, validateBody(updateFamilySchema), updateFamily);
router.post('/:familyId/invitations', requireFamilyAdmin, validateBody(inviteFamilySchema), createInvitation);
router.get('/:familyId/members', requireFamilyMember, getMembers);
router.delete('/:familyId/members/:memberUserId', requireFamilyMember, removeMember);

export default router;

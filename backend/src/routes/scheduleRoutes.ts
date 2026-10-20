import { Router } from 'express';
import {
  getScheduleCategories,
  createScheduleCategory,
  getScheduleEvents,
  createScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
  toggleEventStatus
} from '../controllers/scheduleController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createScheduleSchema, updateScheduleSchema } from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.get('/categories', getScheduleCategories);
router.post('/categories', createScheduleCategory);

router.get('/', getScheduleEvents);
router.post('/', validateBody(createScheduleSchema), createScheduleEvent);
router.patch('/:id', validateBody(updateScheduleSchema), updateScheduleEvent);
router.delete('/:id', deleteScheduleEvent);
router.post('/:id/toggle-status', toggleEventStatus);

export default router;

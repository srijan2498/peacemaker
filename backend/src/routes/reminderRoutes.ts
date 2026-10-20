import { Router } from 'express';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  snoozeReminder,
  completeReminder
} from '../controllers/reminderController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createReminderSchema, updateReminderSchema } from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', getReminders);
router.post('/', validateBody(createReminderSchema), createReminder);
router.patch('/:id', validateBody(updateReminderSchema), updateReminder);
router.delete('/:id', deleteReminder);
router.post('/:id/snooze', snoozeReminder);
router.post('/:id/complete', completeReminder);

export default router;

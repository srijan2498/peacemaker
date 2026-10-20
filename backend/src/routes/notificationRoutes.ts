import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;

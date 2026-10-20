import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listMeditations,
  listGutenbergStories,
  getStoryDetails,
  saveReadingProgress,
  getReadingProgress
} from '../controllers/relaxationController.js';

const router = Router();

router.use(requireAuth);

router.get('/meditations', listMeditations);
router.get('/stories', listGutenbergStories);
router.get('/stories/:id', getStoryDetails);
router.post('/progress', saveReadingProgress);
router.get('/progress', getReadingProgress);

export default router;

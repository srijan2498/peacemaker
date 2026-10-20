import { Router } from 'express';
import {
  getAudioCatalog,
  searchJamendo,
  getUserAudioPreferences,
  toggleFavorite,
  saveMix,
  deleteMix
} from '../controllers/audioController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { saveMixSchema } from '../shared/index.js';

const router = Router();

// Catalog and search accessible to authenticated users
router.get('/catalog', requireAuth, getAudioCatalog);
router.get('/search', requireAuth, searchJamendo);
router.get('/preferences', requireAuth, getUserAudioPreferences);
router.post('/favorites/:trackId', requireAuth, toggleFavorite);
router.post('/mixes', requireAuth, validateBody(saveMixSchema), saveMix);
router.delete('/mixes/:mixId', requireAuth, deleteMix);

export default router;

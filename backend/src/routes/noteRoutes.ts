import { Router } from 'express';
import {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  restoreNote,
  togglePinNote
} from '../controllers/noteController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema } from '../shared/index.js';

const router = Router();

router.use(requireAuth);

router.get('/', getNotes);
router.post('/', validateBody(createNoteSchema), createNote);
router.get('/:id', getNoteById);
router.patch('/:id', validateBody(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/restore', restoreNote);
router.post('/:id/toggle-pin', togglePinNote);

export default router;

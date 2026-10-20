import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getWorkoutPlans, getWorkoutPlan } from '../controllers/workoutController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getWorkoutPlans);
router.get('/:id', getWorkoutPlan);

export default router;

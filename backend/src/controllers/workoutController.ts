import { Request, Response } from 'express';
import { getWgerWorkoutPlans, getWgerPlanById } from '../services/wgerService.js';

export async function getWorkoutPlans(req: Request, res: Response): Promise<void> {
  try {
    const plans = await getWgerWorkoutPlans();
    res.status(200).json({
      success: true,
      data: {
        plans,
        total: plans.length,
        source: 'wger Self-Hosted Workout & Routine Wiki'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getWorkoutPlan(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const plan = await getWgerPlanById(id);
    if (!plan) {
      res.status(404).json({ success: false, message: 'Workout plan not found' });
      return;
    }
    res.status(200).json({ success: true, data: { plan } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

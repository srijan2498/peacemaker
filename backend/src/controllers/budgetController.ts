import { Request, Response } from 'express';
import { Budget } from '../models/Budget.js';
import { toMinorUnits } from '../shared/index.js';

export async function getBudgets(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const budgets = await Budget.find({ familyId }).populate('categoryId', 'name icon color');
    res.status(200).json({ success: true, data: { budgets } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch budgets.' });
  }
}

export async function setBudget(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const { categoryId, amount, currency = 'INR', period = 'monthly', alertThresholds } = req.body;

    const amountMinor = toMinorUnits(amount);

    const budget = await Budget.findOneAndUpdate(
      { familyId, categoryId: categoryId || null },
      {
        familyId,
        categoryId: categoryId || null,
        amountMinor,
        currency,
        period,
        alertThresholds: alertThresholds || [50, 75, 90, 100]
      },
      { upsert: true, new: true }
    ).populate('categoryId', 'name icon color');

    res.status(200).json({
      success: true,
      message: 'Budget saved successfully!',
      data: { budget }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to save budget.' });
  }
}

export async function deleteBudget(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, id } = req.params;
    await Budget.findOneAndDelete({ _id: id, familyId });
    res.status(200).json({ success: true, message: 'Budget removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to remove budget.' });
  }
}

import { Request, Response } from 'express';
import { PaymentReminder } from '../models/PaymentReminder.js';
import { Expense } from '../models/Expense.js';
import { toMinorUnits } from '../shared/index.js';

export async function getReminders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { familyId, view = 'all', status } = req.query;

    const query: any = {
      $or: [
        { ownerId: userId },
        ...(familyId ? [{ familyId, visibility: 'family' }] : [])
      ]
    };

    if (status) {
      query.status = status;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (view === 'today') {
      query.dueAt = { $gte: startOfToday, $lte: endOfToday };
      query.status = { $ne: 'paid' };
    } else if (view === 'upcoming') {
      query.dueAt = { $gte: startOfToday };
      query.status = { $ne: 'paid' };
    } else if (view === 'overdue') {
      query.dueAt = { $lt: startOfToday };
      query.status = { $ne: 'paid' };
    } else if (view === 'completed') {
      query.status = 'paid';
    }

    const reminders = await PaymentReminder.find(query)
      .populate('categoryId', 'name icon color')
      .populate('ownerId', 'fullName nickname avatarUrl')
      .sort({ dueAt: 1, createdAt: -1, _id: -1 });

    res.status(200).json({ success: true, data: { reminders } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payment reminders.' });
  }
}

export async function createReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      amount = 0,
      currency = 'INR',
      dueAt,
      timezone = 'Asia/Kolkata',
      recurrenceRule = 'none',
      categoryId,
      visibility = 'private',
      familyId
    } = req.body;

    const amountMinor = toMinorUnits(amount);

    const reminder = await PaymentReminder.create({
      ownerId: userId,
      familyId: visibility === 'family' ? familyId : undefined,
      visibility,
      title,
      description: description || '',
      amountMinor,
      currency,
      dueAt: new Date(dueAt),
      timezone,
      recurrenceRule,
      categoryId: categoryId || undefined,
      status: 'pending'
    });

    const populated = await PaymentReminder.findById(reminder._id).populate('categoryId', 'name icon color');

    res.status(201).json({
      success: true,
      message: 'Reminder scheduled successfully! 🔔',
      data: { reminder: populated }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create reminder.' });
  }
}

export async function updateReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, amount, currency, dueAt, recurrenceRule, categoryId, visibility, status } = req.body;

    const reminder = await PaymentReminder.findOne({ _id: id, ownerId: userId });
    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found or unauthorized.' });
      return;
    }

    if (title) reminder.title = title;
    if (description !== undefined) reminder.description = description;
    if (amount !== undefined) reminder.amountMinor = toMinorUnits(amount);
    if (currency) reminder.currency = currency;
    if (dueAt) reminder.dueAt = new Date(dueAt);
    if (recurrenceRule) reminder.recurrenceRule = recurrenceRule;
    if (categoryId !== undefined) reminder.categoryId = categoryId;
    if (visibility) reminder.visibility = visibility;
    if (status) reminder.status = status;

    await reminder.save();

    res.status(200).json({
      success: true,
      message: 'Reminder updated successfully.',
      data: { reminder }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update reminder.' });
  }
}

export async function deleteReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const reminder = await PaymentReminder.findOneAndDelete({ _id: id, ownerId: userId });
    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Reminder removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete reminder.' });
  }
}

export async function snoozeReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { days = 1 } = req.body;

    const reminder = await PaymentReminder.findOne({ _id: id, ownerId: userId });
    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found.' });
      return;
    }

    const newDate = new Date(reminder.dueAt);
    newDate.setDate(newDate.getDate() + days);
    reminder.dueAt = newDate;
    reminder.status = 'snoozed';
    await reminder.save();

    res.status(200).json({
      success: true,
      message: `Reminder snoozed for ${days} day(s).`,
      data: { reminder }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to snooze reminder.' });
  }
}

export async function completeReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { recordAsExpense = false, familyId } = req.body;

    const reminder = await PaymentReminder.findOne({ _id: id, ownerId: userId });
    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found.' });
      return;
    }

    let createdExpense = null;

    if (recordAsExpense && familyId && reminder.amountMinor > 0) {
      createdExpense = await Expense.create({
        familyId,
        title: reminder.title,
        amountMinor: reminder.amountMinor,
        currency: reminder.currency,
        categoryId: reminder.categoryId,
        paidByUserId: userId,
        createdByUserId: userId,
        expenseDate: new Date(),
        paymentMethod: 'UPI',
        description: `Payment for reminder: ${reminder.title}`
      });
      reminder.paidExpenseId = createdExpense._id;
    }

    reminder.status = 'paid';
    await reminder.save();

    // If recurring, schedule the next occurrence
    if (reminder.recurrenceRule && reminder.recurrenceRule !== 'none') {
      const nextDue = new Date(reminder.dueAt);
      if (reminder.recurrenceRule === 'weekly') {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (reminder.recurrenceRule === 'monthly') {
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else if (reminder.recurrenceRule === 'yearly') {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      }

      await PaymentReminder.create({
        ownerId: reminder.ownerId,
        familyId: reminder.familyId,
        visibility: reminder.visibility,
        title: reminder.title,
        description: reminder.description,
        amountMinor: reminder.amountMinor,
        currency: reminder.currency,
        dueAt: nextDue,
        timezone: reminder.timezone,
        recurrenceRule: reminder.recurrenceRule,
        categoryId: reminder.categoryId,
        status: 'pending'
      });
    }

    res.status(200).json({
      success: true,
      message: recordAsExpense
        ? 'Marked as paid and added to family expenses! 🌷'
        : 'Reminder marked as completed! ✨',
      data: {
        reminder,
        createdExpense
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to complete reminder.' });
  }
}

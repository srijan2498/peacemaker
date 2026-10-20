import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { Income } from '../models/Income.js';
import { Family } from '../models/Family.js';
import { FamilyMembership } from '../models/FamilyMembership.js';
import { PaymentReminder } from '../models/PaymentReminder.js';
import { MoneyTransaction } from '../models/MoneyTransaction.js';
import { ScheduleEvent } from '../models/ScheduleEvent.js';
import { Note } from '../models/Note.js';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { familyId } = req.query;

    const now = new Date();
    const hour = now.getHours();
    let greetingTime = 'Good morning';
    let greetingEmoji = '☀️';
    if (hour >= 12 && hour < 17) {
      greetingTime = 'Good afternoon';
      greetingEmoji = '🌤️';
    } else if (hour >= 17 && hour < 22) {
      greetingTime = 'Good evening';
      greetingEmoji = '🌇';
    } else if (hour >= 22 || hour < 5) {
      greetingTime = 'Peaceful night';
      greetingEmoji = '🌙';
    }

    const userName = req.user?.fullName?.split(' ')[0] || 'Friend';
    const greeting = `${greetingTime}, ${userName}! ${greetingEmoji}`;

    // Target family context
    let activeFamily = null;
    let targetFamilyId = familyId as string;

    if (!targetFamilyId) {
      const firstMembership = await FamilyMembership.findOne({ userId, status: 'active' });
      if (firstMembership) {
        targetFamilyId = firstMembership.familyId.toString();
      }
    }

    let totalMonthlyExpenseMinor = 0;
    let totalMonthlyIncomeMinor = 0;
    let netMonthlySavingsMinor = 0;
    let familyMonthlyBudgetMinor = 0;
    let budgetRemainingMinor = 0;
    let budgetUsagePercentage = 0;
    let myMonthlyContributionMinor = 0;
    let myMonthlyContributionPercentage = 0;
    let recentExpenses: any[] = [];

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (targetFamilyId && mongoose.Types.ObjectId.isValid(targetFamilyId)) {
      activeFamily = await Family.findById(targetFamilyId);
      if (activeFamily) {
        familyMonthlyBudgetMinor = activeFamily.monthlyBudget || 0;

        const famObjId = new mongoose.Types.ObjectId(targetFamilyId);
        const [monthAgg, myAgg, incomeAgg] = await Promise.all([
          Expense.aggregate([
            {
              $match: {
                familyId: famObjId,
                deletedAt: null,
                expenseDate: { $gte: startOfMonth, $lte: endOfMonth }
              }
            },
            { $group: { _id: null, total: { $sum: '$amountMinor' } } }
          ]),
          Expense.aggregate([
            {
              $match: {
                familyId: famObjId,
                paidByUserId: new mongoose.Types.ObjectId(userId),
                deletedAt: null,
                expenseDate: { $gte: startOfMonth, $lte: endOfMonth }
              }
            },
            { $group: { _id: null, total: { $sum: '$amountMinor' } } }
          ]),
          Income.aggregate([
            {
              $match: {
                familyId: famObjId,
                deletedAt: null,
                receivedDate: { $gte: startOfMonth, $lte: endOfMonth }
              }
            },
            { $group: { _id: null, total: { $sum: '$amountMinor' } } }
          ])
        ]);

        totalMonthlyExpenseMinor = monthAgg[0]?.total || 0;
        myMonthlyContributionMinor = myAgg[0]?.total || 0;
        totalMonthlyIncomeMinor = incomeAgg[0]?.total || 0;
        netMonthlySavingsMinor = totalMonthlyIncomeMinor - totalMonthlyExpenseMinor;

        if (familyMonthlyBudgetMinor > 0) {
          budgetRemainingMinor = Math.max(0, familyMonthlyBudgetMinor - totalMonthlyExpenseMinor);
          budgetUsagePercentage = Math.round((totalMonthlyExpenseMinor / familyMonthlyBudgetMinor) * 100);
        }

        if (totalMonthlyExpenseMinor > 0) {
          myMonthlyContributionPercentage = Math.round((myMonthlyContributionMinor / totalMonthlyExpenseMinor) * 100);
        }

        recentExpenses = await Expense.find({ familyId: targetFamilyId, deletedAt: null })
          .populate('categoryId', 'name icon color')
          .populate('paidByUserId', 'fullName nickname avatarUrl')
          .sort({ expenseDate: -1, createdAt: -1, _id: -1 })
          .limit(6);
      }
    }

    // Money Tracker: Strictly private to user
    const [lentTxns, borrowedTxns] = await Promise.all([
      MoneyTransaction.find({ ownerId: userId, type: 'lent', status: { $ne: 'fully_paid' } }),
      MoneyTransaction.find({ ownerId: userId, type: 'borrowed', status: { $ne: 'fully_paid' } })
    ]);

    const moneyToReceiveMinor = lentTxns.reduce((sum, t) => sum + t.remainingMinor, 0);
    const moneyToPayMinor = borrowedTxns.reduce((sum, t) => sum + t.remainingMinor, 0);

    // Upcoming reminders: private or family shared
    const upcomingReminders = await PaymentReminder.find({
      $or: [
        { ownerId: userId },
        ...(targetFamilyId ? [{ familyId: targetFamilyId, visibility: 'family' }] : [])
      ],
      status: { $in: ['pending', 'snoozed'] },
      dueAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
    })
      .populate('categoryId', 'name icon color')
      .sort({ dueAt: 1 })
      .limit(5);

    const pendingPaymentsMinor = upcomingReminders.reduce((sum, r) => sum + (r.amountMinor || 0), 0);
    const upcomingRemindersCount = upcomingReminders.length;

    // Personal schedule preview: STRICT PRIVACY - ONLY FOR CURRENT USER
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todaySchedule = await ScheduleEvent.find({
      ownerId: userId,
      startAt: { $gte: startOfToday, $lte: endOfToday }
    })
      .populate('categoryId', 'name color icon')
      .sort({ startAt: 1 })
      .limit(6);

    // Quick notes preview: STRICT PRIVACY - ONLY FOR CURRENT USER
    const quickNotes = await Note.find({
      ownerId: userId,
      isDeleted: false,
      isArchived: false
    })
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(4);

    res.status(200).json({
      success: true,
      data: {
        greeting,
        totalMonthlyExpenseMinor,
        totalMonthlyIncomeMinor,
        netMonthlySavingsMinor,
        netSavingsMinor: netMonthlySavingsMinor,
        familyMonthlyBudgetMinor,
        budgetRemainingMinor,
        budgetUsagePercentage,
        pendingPaymentsMinor,
        moneyToReceiveMinor,
        moneyToPayMinor,
        myMonthlyContributionMinor,
        myMonthlyContributionPercentage,
        upcomingRemindersCount,
        activeFamily,
        recentExpenses,
        upcomingReminders,
        todaySchedule,
        quickNotes
      }
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard summary.' });
  }
}

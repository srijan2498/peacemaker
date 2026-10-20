import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Income } from '../models/Income.js';
import { Expense } from '../models/Expense.js';
import { FamilyMembership } from '../models/FamilyMembership.js';
import { toMinorUnits } from '../shared/index.js';

export async function getIncomes(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const userId = req.user!.id;

    // Verify membership
    const membership = await FamilyMembership.findOne({ familyId, userId, status: 'active' });
    if (!membership) {
      res.status(403).json({ success: false, message: 'You are not a member of this family workspace.' });
      return;
    }

    const { search, category, startDate, endDate, page = '1', limit = '50' } = req.query;

    const query: any = {
      familyId: new mongoose.Types.ObjectId(familyId),
      deletedAt: null
    };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { source: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.receivedDate = {};
      if (startDate) query.receivedDate.$gte = new Date(String(startDate));
      if (endDate) query.receivedDate.$lte = new Date(String(endDate));
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [incomes, totalCount] = await Promise.all([
      Income.find(query)
        .sort({ receivedDate: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'fullName nickname avatarUrl')
        .lean(),
      Income.countDocuments(query)
    ]);

    const formatted = incomes.map(inc => ({
      ...inc,
      user: inc.userId
    }));

    res.status(200).json({
      success: true,
      data: {
        incomes: formatted,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve incomes.' });
  }
}

export async function createIncome(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const userId = req.user!.id;

    const membership = await FamilyMembership.findOne({ familyId, userId, status: 'active' });
    if (!membership) {
      res.status(403).json({ success: false, message: 'You are not a member of this family workspace.' });
      return;
    }

    const {
      title,
      amount,
      currency = 'INR',
      source,
      category = 'Salary',
      receivedDate = new Date().toISOString(),
      paymentMethod = 'Bank Transfer',
      description = '',
      isRecurring = false,
      recurrenceRule = ''
    } = req.body;

    const amountMinor = toMinorUnits(amount, currency === 'JPY' ? 1 : 100);

    const income = await Income.create({
      familyId: new mongoose.Types.ObjectId(familyId),
      userId: new mongoose.Types.ObjectId(userId),
      title: title.trim(),
      amountMinor,
      currency,
      source: source.trim(),
      category,
      receivedDate: new Date(receivedDate),
      paymentMethod,
      description: description?.trim() || '',
      isRecurring,
      recurrenceRule
    });

    const populated = await Income.findById(income._id)
      .populate('userId', 'fullName nickname avatarUrl')
      .lean();

    res.status(201).json({
      success: true,
      message: `${title} recorded successfully! 💰`,
      data: {
        income: {
          ...populated,
          user: populated?.userId
        }
      }
    });
  } catch (error: any) {
    console.error('Error creating income:', error);
    res.status(500).json({ success: false, message: 'Failed to record income.' });
  }
}

export async function updateIncome(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, id } = req.params;
    const userId = req.user!.id;

    const membership = await FamilyMembership.findOne({ familyId, userId, status: 'active' });
    if (!membership) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const income = await Income.findOne({ _id: id, familyId, deletedAt: null });
    if (!income) {
      res.status(404).json({ success: false, message: 'Income record not found.' });
      return;
    }

    const { title, amount, source, category, receivedDate, paymentMethod, description, isRecurring } = req.body;

    if (title) income.title = title.trim();
    if (amount !== undefined) income.amountMinor = toMinorUnits(amount, income.currency === 'JPY' ? 1 : 100);
    if (source) income.source = source.trim();
    if (category) income.category = category;
    if (receivedDate) income.receivedDate = new Date(receivedDate);
    if (paymentMethod) income.paymentMethod = paymentMethod;
    if (description !== undefined) income.description = description.trim();
    if (isRecurring !== undefined) income.isRecurring = isRecurring;

    await income.save();

    const populated = await Income.findById(income._id)
      .populate('userId', 'fullName nickname avatarUrl')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Income record updated! 🌷',
      data: {
        income: {
          ...populated,
          user: populated?.userId
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update income.' });
  }
}

export async function deleteIncome(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, id } = req.params;
    const userId = req.user!.id;

    const membership = await FamilyMembership.findOne({ familyId, userId, status: 'active' });
    if (!membership) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const income = await Income.findOne({ _id: id, familyId, deletedAt: null });
    if (!income) {
      res.status(404).json({ success: false, message: 'Income record not found.' });
      return;
    }

    income.deletedAt = new Date();
    await income.save();

    res.status(200).json({
      success: true,
      message: 'Income record removed.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete income.' });
  }
}

/**
 * Complete Monthly Cashflow & Credit/Debit Ledger
 * Tracks:
 * - Total Credits (Salary & Money Received) & "From where money came"
 * - Total Debits (Expenses & Money Spent) & "Where it was done"
 * - Net Monthly Savings & Savings Rate
 * - Chronological Combined Transaction Ledger
 */
export async function getCashflowSummary(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const userId = req.user!.id;

    const membership = await FamilyMembership.findOne({ familyId, userId, status: 'active' });
    if (!membership) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const now = new Date();
    const year = parseInt(String(req.query.year || now.getFullYear()), 10);
    const month = parseInt(String(req.query.month || now.getMonth() + 1), 10); // 1-12

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthString = `${year}-${String(month).padStart(2, '0')}`;
    const monthName = `${monthNames[month - 1]} ${year}`;

    // Fetch Incomes (Credits) for the month
    const incomes = await Income.find({
      familyId: new mongoose.Types.ObjectId(familyId),
      receivedDate: { $gte: startOfMonth, $lte: endOfMonth },
      deletedAt: null
    })
      .populate('userId', 'fullName nickname avatarUrl')
      .lean();

    // Fetch Expenses (Debits) for the month
    const expenses = await Expense.find({
      familyId: new mongoose.Types.ObjectId(familyId),
      expenseDate: { $gte: startOfMonth, $lte: endOfMonth },
      deletedAt: null
    })
      .populate('paidByUserId', 'fullName nickname avatarUrl')
      .populate('categoryId', 'name icon color')
      .lean();

    // Sum Credits and Debits
    const totalCreditsMinor = incomes.reduce((acc, inc) => acc + inc.amountMinor, 0);
    const totalDebitsMinor = expenses.reduce((acc, exp) => acc + exp.amountMinor, 0);
    const netSavingsMinor = totalCreditsMinor - totalDebitsMinor;
    const savingsRatePercent = totalCreditsMinor > 0
      ? Math.max(0, Math.round((netSavingsMinor / totalCreditsMinor) * 100))
      : 0;

    // Aggregate Top Income Sources ("From where money came")
    const sourceMap = new Map<string, number>();
    incomes.forEach(inc => {
      const src = inc.source || inc.category || 'Other Inflow';
      sourceMap.set(src, (sourceMap.get(src) || 0) + inc.amountMinor);
    });
    const topIncomeSources = Array.from(sourceMap.entries())
      .map(([source, amountMinor]) => ({ source, amountMinor }))
      .sort((a, b) => b.amountMinor - a.amountMinor);

    // Aggregate Top Spending Destinations ("Where it was done")
    const destMap = new Map<string, number>();
    expenses.forEach(exp => {
      const dest = exp.merchant || (exp.categoryId as any)?.name || 'Direct Expense';
      destMap.set(dest, (destMap.get(dest) || 0) + exp.amountMinor);
    });
    const topExpenseDestinations = Array.from(destMap.entries())
      .map(([destination, amountMinor]) => ({ destination, amountMinor }))
      .sort((a, b) => b.amountMinor - a.amountMinor);

    // Build unified chronological ledger
    const ledger: any[] = [];

    incomes.forEach(inc => {
      ledger.push({
        id: inc._id.toString(),
        type: 'credit',
        title: inc.title,
        amountMinor: inc.amountMinor,
        currency: inc.currency,
        date: inc.receivedDate.toISOString(),
        sourceOrDestination: `From: ${inc.source} (${inc.category})`,
        category: inc.category,
        paymentMethod: inc.paymentMethod,
        member: inc.userId
      });
    });

    expenses.forEach(exp => {
      const categoryName = (exp.categoryId as any)?.name || 'Expense';
      const merchantText = exp.merchant ? `At: ${exp.merchant}` : `For: ${categoryName}`;
      ledger.push({
        id: exp._id.toString(),
        type: 'debit',
        title: exp.title,
        amountMinor: exp.amountMinor,
        currency: exp.currency,
        date: exp.expenseDate.toISOString(),
        sourceOrDestination: merchantText,
        category: categoryName,
        paymentMethod: exp.paymentMethod,
        member: exp.paidByUserId
      });
    });

    // Sort by date descending (newest first, with secondary tie-breaker)
    ledger.sort((a: any, b: any) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      const idDiff = String(b.id).localeCompare(String(a.id));
      return idDiff;
    });

    res.status(200).json({
      success: true,
      data: {
        month: monthString,
        monthName,
        totalCreditsMinor,
        totalDebitsMinor,
        netSavingsMinor,
        savingsRatePercent,
        creditsCount: incomes.length,
        debitsCount: expenses.length,
        topIncomeSources,
        topExpenseDestinations,
        ledger
      }
    });
  } catch (error: any) {
    console.error('Error fetching cashflow summary:', error);
    res.status(500).json({ success: false, message: 'Failed to compute monthly cashflow.' });
  }
}

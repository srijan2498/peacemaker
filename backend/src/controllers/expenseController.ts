import { Request, Response } from 'express';
import mongoose from 'express';
import { Expense } from '../models/Expense.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { toMinorUnits } from '../shared/index.js';

export async function getExpenses(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const {
      search,
      categoryId,
      paidByUserId,
      paymentMethod,
      startDate,
      endDate,
      sortBy = 'expenseDate',
      sortOrder = 'desc',
      page = '1',
      limit = '30'
    } = req.query;

    const query: any = {
      familyId,
      deletedAt: null
    };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (paidByUserId) {
      query.paidByUserId = paidByUserId;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate as string);
      if (endDate) query.expenseDate.$lte = new Date(endDate as string);
    }

    if (search) {
      const regex = new RegExp(search as string, 'i');
      query.$or = [{ title: regex }, { merchant: regex }, { description: regex }, { tags: regex }];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const direction = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: any = {};
    if (sortBy === 'expenseDate') {
      sortOptions.expenseDate = direction;
      sortOptions.createdAt = direction;
      sortOptions._id = direction;
    } else if (sortBy === 'createdAt') {
      sortOptions.createdAt = direction;
      sortOptions._id = direction;
    } else {
      sortOptions[sortBy as string] = direction;
      sortOptions.createdAt = direction;
      sortOptions._id = direction;
    }

    const [rawExpenses, totalCount] = await Promise.all([
      Expense.find(query)
        .populate('categoryId', 'name icon color')
        .populate('paidByUserId', 'fullName nickname avatarUrl')
        .populate('createdByUserId', 'fullName nickname avatarUrl')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Expense.countDocuments(query)
    ]);

    const expenses = rawExpenses.map((exp: any) => {
      const catObj = exp.categoryId && typeof exp.categoryId === 'object' ? exp.categoryId : null;
      const userObj = exp.paidByUserId && typeof exp.paidByUserId === 'object' ? exp.paidByUserId : null;
      const creatorObj = exp.createdByUserId && typeof exp.createdByUserId === 'object' ? exp.createdByUserId : null;

      return {
        ...exp,
        categoryId: catObj?._id?.toString() || exp.categoryId?.toString() || '',
        category: catObj || undefined,
        paidByUserId: userObj?._id?.toString() || exp.paidByUserId?.toString() || '',
        paidByUser: userObj || undefined,
        createdByUserId: creatorObj?._id?.toString() || exp.createdByUserId?.toString() || '',
        createdByUser: creatorObj || undefined
      };
    });

    res.status(200).json({
      success: true,
      data: {
        expenses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve expenses.' });
  }
}

export async function createExpense(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const userId = req.user!.id;
    const {
      title,
      amount,
      currency = 'INR',
      categoryId,
      paidByUserId,
      expenseDate,
      paymentMethod = 'UPI',
      merchant,
      description,
      receiptUrl,
      tags = [],
      isRecurring = false,
      recurrenceRule
    } = req.body;

    const amountMinor = toMinorUnits(amount);
    if (amountMinor <= 0) {
      res.status(400).json({ success: false, message: 'Expense amount must be greater than zero.' });
      return;
    }

    // Verify category exists
    const category = await ExpenseCategory.findById(categoryId);
    if (!category) {
      res.status(400).json({ success: false, message: 'Invalid expense category.' });
      return;
    }

    let finalExpenseDate = new Date();
    if (expenseDate) {
      const parsed = new Date(expenseDate);
      const now = new Date();
      if (parsed.toDateString() === now.toDateString()) {
        parsed.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      }
      finalExpenseDate = parsed;
    }

    const expense = await Expense.create({
      familyId,
      title,
      amountMinor,
      currency,
      categoryId,
      paidByUserId: paidByUserId || userId,
      createdByUserId: userId,
      expenseDate: finalExpenseDate,
      paymentMethod,
      merchant: merchant || '',
      description: description || '',
      receiptUrl: receiptUrl || '',
      tags,
      isRecurring,
      recurrenceRule: recurrenceRule || ''
    });

    const populated: any = await Expense.findById(expense._id)
      .populate('categoryId', 'name icon color')
      .populate('paidByUserId', 'fullName nickname avatarUrl')
      .lean();

    const catObj = populated?.categoryId && typeof populated.categoryId === 'object' ? populated.categoryId : null;
    const userObj = populated?.paidByUserId && typeof populated.paidByUserId === 'object' ? populated.paidByUserId : null;

    res.status(201).json({
      success: true,
      message: 'Expense added successfully! 🌷',
      data: {
        expense: {
          ...populated,
          categoryId: catObj?._id?.toString() || populated?.categoryId?.toString() || '',
          category: catObj || undefined,
          paidByUserId: userObj?._id?.toString() || populated?.paidByUserId?.toString() || '',
          paidByUser: userObj || undefined
        }
      }
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, message: 'Failed to record expense.' });
  }
}

export async function getExpenseById(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, id } = req.params;
    const raw: any = await Expense.findOne({ _id: id, familyId, deletedAt: null })
      .populate('categoryId', 'name icon color')
      .populate('paidByUserId', 'fullName nickname avatarUrl')
      .populate('createdByUserId', 'fullName nickname avatarUrl')
      .lean();

    if (!raw) {
      res.status(404).json({ success: false, message: 'Expense not found.' });
      return;
    }

    const catObj = raw.categoryId && typeof raw.categoryId === 'object' ? raw.categoryId : null;
    const userObj = raw.paidByUserId && typeof raw.paidByUserId === 'object' ? raw.paidByUserId : null;

    const expense = {
      ...raw,
      categoryId: catObj?._id?.toString() || raw.categoryId?.toString() || '',
      category: catObj || undefined,
      paidByUserId: userObj?._id?.toString() || raw.paidByUserId?.toString() || '',
      paidByUser: userObj || undefined
    };

    res.status(200).json({ success: true, data: { expense } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve expense.' });
  }
}

export async function updateExpense(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, id } = req.params;
    const userId = req.user!.id;
    const {
      title,
      amount,
      currency,
      categoryId,
      paidByUserId,
      expenseDate,
      paymentMethod,
      merchant,
      description,
      receiptUrl,
      tags,
      isRecurring,
      recurrenceRule
    } = req.body;

    const expense = await Expense.findOne({ _id: id, familyId, deletedAt: null });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found.' });
      return;
    }

    // Authorization: Creator, payer, or family admin
    const isAdmin = req.familyMembership?.role === 'admin';
    const isCreator = expense.createdByUserId.toString() === userId;
    const isPayer = expense.paidByUserId.toString() === userId;

    if (!isAdmin && !isCreator && !isPayer) {
      res.status(403).json({ success: false, message: 'You do not have permission to edit this expense.' });
      return;
    }

    if (title) expense.title = title;
    if (amount !== undefined) expense.amountMinor = toMinorUnits(amount);
    if (currency) expense.currency = currency;
    if (categoryId) {
      const cleanCatId = typeof categoryId === 'object' ? (categoryId as any)._id : categoryId;
      expense.categoryId = cleanCatId;
    }
    if (paidByUserId) {
      const cleanPayerId = typeof paidByUserId === 'object' ? (paidByUserId as any)._id : paidByUserId;
      expense.paidByUserId = cleanPayerId;
    }
    if (expenseDate) expense.expenseDate = new Date(expenseDate);
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (merchant !== undefined) expense.merchant = merchant;
    if (description !== undefined) expense.description = description;
    if (receiptUrl !== undefined) expense.receiptUrl = receiptUrl;
    if (tags !== undefined) expense.tags = tags;
    if (isRecurring !== undefined) expense.isRecurring = isRecurring;
    if (recurrenceRule !== undefined) expense.recurrenceRule = recurrenceRule;

    await expense.save();

    const populated: any = await Expense.findById(expense._id)
      .populate('categoryId', 'name icon color')
      .populate('paidByUserId', 'fullName nickname avatarUrl')
      .lean();

    const catObj = populated?.categoryId && typeof populated.categoryId === 'object' ? populated.categoryId : null;
    const userObj = populated?.paidByUserId && typeof populated.paidByUserId === 'object' ? populated.paidByUserId : null;

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully.',
      data: {
        expense: {
          ...populated,
          categoryId: catObj?._id?.toString() || populated?.categoryId?.toString() || '',
          category: catObj || undefined,
          paidByUserId: userObj?._id?.toString() || populated?.paidByUserId?.toString() || '',
          paidByUser: userObj || undefined
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update expense.' });
  }
}

export async function deleteExpense(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, id } = req.params;
    const userId = req.user!.id;

    const expense = await Expense.findOne({ _id: id, familyId, deletedAt: null });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found.' });
      return;
    }

    const isAdmin = req.familyMembership?.role === 'admin';
    const isCreator = expense.createdByUserId.toString() === userId;
    const isPayer = expense.paidByUserId.toString() === userId;

    if (!isAdmin && !isCreator && !isPayer) {
      res.status(403).json({ success: false, message: 'You do not have permission to delete this expense.' });
      return;
    }

    // Soft delete for financial audit trail
    expense.deletedAt = new Date();
    await expense.save();

    res.status(200).json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
}

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { Family } from '../models/Family.js';
import { Budget } from '../models/Budget.js';

export async function getAnalyticsSummary(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const { month, year } = req.query;

    const targetDate = new Date();
    const currentYear = year ? parseInt(year as string, 10) : targetDate.getFullYear();
    const currentMonth = month ? parseInt(month as string, 10) - 1 : targetDate.getMonth();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const prevStartOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const prevEndOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const famObjId = new mongoose.Types.ObjectId(familyId);

    // 1. Current Month Expenses Aggregate
    const currentMonthExpenses = await Expense.aggregate([
      {
        $match: {
          familyId: famObjId,
          deletedAt: null,
          expenseDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountMinor' }
        }
      }
    ]);
    const totalExpenseMinor = currentMonthExpenses[0]?.total || 0;

    // 2. Previous Month Expenses Aggregate
    const prevMonthExpenses = await Expense.aggregate([
      {
        $match: {
          familyId: famObjId,
          deletedAt: null,
          expenseDate: { $gte: prevStartOfMonth, $lte: prevEndOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amountMinor' }
        }
      }
    ]);
    const prevTotalExpenseMinor = prevMonthExpenses[0]?.total || 0;

    // 3. Category Breakdown for current month
    const categoryBreakdownAgg = await Expense.aggregate([
      {
        $match: {
          familyId: famObjId,
          deletedAt: null,
          expenseDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$categoryId',
          amountMinor: { $sum: '$amountMinor' }
        }
      },
      {
        $lookup: {
          from: 'expensecategories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $sort: { amountMinor: -1 } }
    ]);

    const categoryBreakdown = categoryBreakdownAgg.map(item => ({
      categoryId: item._id,
      name: item.category?.name || 'Uncategorized',
      icon: item.category?.icon || '🏷️',
      color: item.category?.color || '#A78BFA',
      amountMinor: item.amountMinor,
      percentage: totalExpenseMinor > 0 ? Math.round((item.amountMinor / totalExpenseMinor) * 100) : 0
    }));

    // 4. Monthly Trend (last 6 months)
    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
    const monthlyTrendAgg = await Expense.aggregate([
      {
        $match: {
          familyId: famObjId,
          deletedAt: null,
          expenseDate: { $gte: sixMonthsAgo, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' }
          },
          amountMinor: { $sum: '$amountMinor' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const found = monthlyTrendAgg.find(item => item._id.year === y && item._id.month === m);
      monthlyTrend.push({
        month: `${monthNames[m - 1]} ${y}`,
        amountMinor: found?.amountMinor || 0
      });
    }

    // 5. Member Contributions
    const memberContributionsAgg = await Expense.aggregate([
      {
        $match: {
          familyId: famObjId,
          deletedAt: null,
          expenseDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$paidByUserId',
          amountMinor: { $sum: '$amountMinor' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $sort: { amountMinor: -1 } }
    ]);

    const memberContributions = memberContributionsAgg.map(item => ({
      userId: item._id,
      name: item.user?.nickname || item.user?.fullName || 'Family Member',
      avatarUrl: item.user?.avatarUrl,
      amountMinor: item.amountMinor,
      percentage: totalExpenseMinor > 0 ? Math.round((item.amountMinor / totalExpenseMinor) * 100) : 0
    }));

    // 6. Family Budget
    const family = await Family.findById(familyId);
    const familyBudgetMinor = family?.monthlyBudget || 0;

    // Category Budgets
    const categoryBudgets = await Budget.find({ familyId }).populate('categoryId', 'name icon color');
    const budgetVsActual = categoryBudgets.map(b => {
      const spent = categoryBreakdown.find(c => c.categoryId?.toString() === b.categoryId?._id?.toString());
      const spentMinor = spent?.amountMinor || 0;
      const pct = b.amountMinor > 0 ? Math.round((spentMinor / b.amountMinor) * 100) : 0;
      const status = pct >= 100 ? 'exceeded' : pct >= 80 ? 'approaching' : 'under';
      const cat = b.categoryId as any;
      return {
        categoryName: cat?.name || 'Category',
        budgetMinor: b.amountMinor,
        actualMinor: spentMinor,
        percentage: pct,
        status: status as 'under' | 'approaching' | 'exceeded'
      };
    });

    // 7. Rule-based mathematical insights
    const insights: string[] = [];

    if (totalExpenseMinor > 0 && prevTotalExpenseMinor > 0) {
      const diff = totalExpenseMinor - prevTotalExpenseMinor;
      const pctChange = Math.abs(Math.round((diff / prevTotalExpenseMinor) * 100));
      if (diff < 0) {
        insights.push(`Your family spent ${pctChange}% less overall compared to last month.`);
      } else if (diff > 0) {
        insights.push(`Spending is ${pctChange}% higher than last month. Keep an eye on non-essentials.`);
      } else {
        insights.push(`Spending is consistent with last month.`);
      }
    } else if (totalExpenseMinor > 0 && prevTotalExpenseMinor === 0) {
      insights.push(`First tracked month of family expenses. Keep logging to build helpful trends.`);
    }

    if (categoryBreakdown.length > 0) {
      const topCat = categoryBreakdown[0];
      insights.push(`${topCat.name} is your largest expense category (${topCat.percentage}% of total).`);
    }

    if (familyBudgetMinor > 0) {
      const budgetPct = Math.round((totalExpenseMinor / familyBudgetMinor) * 100);
      if (budgetPct >= 100) {
        insights.push(`Your family has exceeded this month's budget target by ${budgetPct - 100}%.`);
      } else if (budgetPct >= 80) {
        insights.push(`Your family has utilized ${budgetPct}% of the monthly budget. Approaching target limit.`);
      } else {
        insights.push(`Your family is comfortably within budget (${budgetPct}% used so far).`);
      }
    }

    if (memberContributions.length > 0) {
      const topPayer = memberContributions[0];
      insights.push(`${topPayer.name} contributed the most this month (${topPayer.percentage}%).`);
    }

    if (insights.length === 0) {
      insights.push('Add a few more expenses this month to unlock personalized spending insights.');
    }

    res.status(200).json({
      success: true,
      data: {
        totalExpenseMinor,
        budgetMinor: familyBudgetMinor,
        categoryBreakdown,
        monthlyTrend,
        memberContributions,
        budgetVsActual,
        insights
      }
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate financial analytics.' });
  }
}

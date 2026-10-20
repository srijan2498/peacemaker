import { Request, Response } from 'express';
import { BillDocument } from '../models/BillDocument.js';
import { Expense } from '../models/Expense.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { FamilyMembership } from '../models/FamilyMembership.js';

async function verifyFamilyMember(familyId: string, userId: string): Promise<boolean> {
  const membership = await FamilyMembership.findOne({ familyId, userId });
  return !!membership;
}

export const getBills = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { familyId, billCategory, search } = req.query;

    if (!familyId) {
      res.status(400).json({ success: false, message: 'familyId is required' });
      return;
    }

    const isMember = await verifyFamilyMember(familyId as string, userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    const query: any = { familyId };
    if (billCategory && billCategory !== 'all') {
      query.billCategory = billCategory;
    }

    if (search) {
      const regex = new RegExp(search as string, 'i');
      query.$or = [{ storeName: regex }, { invoiceNumber: regex }, { fileName: regex }, { notes: regex }];
    }

    const bills = await BillDocument.find(query)
      .populate('userId', 'fullName nickname avatarUrl email')
      .populate('expenseId', 'title amountMinor currency')
      .sort({ billDate: -1, createdAt: -1 });

    res.status(200).json({ success: true, data: bills });
  } catch (error: any) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bills', error: error.message });
  }
};

export const uploadBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const {
      familyId,
      billCategory,
      storeName,
      billDate,
      amountMinor,
      currency,
      invoiceNumber,
      paymentMethod,
      fileName,
      fileFormat,
      mimeType,
      fileUrl,
      fileSizeBytes,
      notes,
      parsedItems,
      autoCreateExpense
    } = req.body;

    if (!familyId || !storeName || !billCategory || !fileName || !fileFormat) {
      res.status(400).json({
        success: false,
        message: 'familyId, storeName, billCategory, fileName, and fileFormat are required'
      });
      return;
    }

    const isMember = await verifyFamilyMember(familyId, userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    let createdExpenseId = null;

    // Optional: Auto-create linked Expense in CozyNest
    if (autoCreateExpense && amountMinor > 0) {
      // Find matching category name
      const categoryKeyword =
        billCategory === 'medicine'
          ? 'Healthcare & Medical'
          : billCategory === 'grocery'
          ? 'Groceries & Household'
          : 'Shopping & Clothing';

      let matchedCategory = await ExpenseCategory.findOne({
        familyId,
        name: { $regex: new RegExp(categoryKeyword, 'i') }
      });

      if (!matchedCategory) {
        matchedCategory = await ExpenseCategory.findOne({ familyId });
      }

      if (matchedCategory) {
        const expense = await Expense.create({
          familyId,
          title: `${storeName} (${billCategory === 'medicine' ? 'Medicine' : 'Grocery'} Bill)`,
          amountMinor: amountMinor || 0,
          currency: currency || 'INR',
          categoryId: matchedCategory._id,
          paidByUserId: userId,
          createdByUserId: userId,
          expenseDate: billDate ? new Date(billDate) : new Date(),
          paymentMethod: paymentMethod || 'UPI',
          merchant: storeName,
          description: `Bill uploaded via CozyNest Health Vault. File: ${fileName}. ${notes || ''}`.trim()
        });
        createdExpenseId = expense._id;
      }
    }

    const bill = await BillDocument.create({
      familyId,
      userId,
      billCategory,
      storeName,
      billDate: billDate || new Date().toISOString().split('T')[0],
      amountMinor: amountMinor || 0,
      currency: currency || 'INR',
      invoiceNumber: invoiceNumber || '',
      paymentMethod: paymentMethod || 'UPI',
      fileName,
      fileFormat,
      mimeType: mimeType || 'application/octet-stream',
      fileUrl: fileUrl || '',
      fileSizeBytes: fileSizeBytes || 0,
      notes: notes || '',
      expenseId: createdExpenseId,
      parsedItems: parsedItems || []
    });

    await bill.populate('userId', 'fullName nickname avatarUrl email');
    if (createdExpenseId) {
      await bill.populate('expenseId', 'title amountMinor currency');
    }

    res.status(201).json({ success: true, data: bill });
  } catch (error: any) {
    console.error('Error uploading bill document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload bill document', error: error.message });
  }
};

export const linkBillToExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    const bill = await BillDocument.findById(id);
    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found' });
      return;
    }

    const isMember = await verifyFamilyMember(bill.familyId.toString(), userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    if (bill.expenseId) {
      res.status(400).json({ success: false, message: 'This bill is already linked to an expense' });
      return;
    }

    // Determine category
    const categoryKeyword =
      bill.billCategory === 'medicine'
        ? 'Healthcare & Medical'
        : bill.billCategory === 'grocery'
        ? 'Groceries & Household'
        : 'Shopping & Clothing';

    let matchedCategory = await ExpenseCategory.findOne({
      familyId: bill.familyId,
      name: { $regex: new RegExp(categoryKeyword, 'i') }
    });

    if (!matchedCategory) {
      matchedCategory = await ExpenseCategory.findOne({ familyId: bill.familyId });
    }

    if (!matchedCategory) {
      res.status(400).json({ success: false, message: 'No suitable expense category found' });
      return;
    }

    const expense = await Expense.create({
      familyId: bill.familyId,
      title: `${bill.storeName} (${bill.billCategory === 'medicine' ? 'Medicine' : 'Grocery'} Bill)`,
      amountMinor: bill.amountMinor,
      currency: bill.currency,
      categoryId: matchedCategory._id,
      paidByUserId: userId,
      createdByUserId: userId,
      expenseDate: new Date(bill.billDate),
      paymentMethod: bill.paymentMethod || 'UPI',
      merchant: bill.storeName,
      description: `Bill linked from CozyNest Health Vault. File: ${bill.fileName}. ${bill.notes || ''}`.trim()
    });

    bill.expenseId = expense._id;
    await bill.save();
    await bill.populate('expenseId', 'title amountMinor currency');

    res.status(200).json({ success: true, data: bill, expense });
  } catch (error: any) {
    console.error('Error linking bill to expense:', error);
    res.status(500).json({ success: false, message: 'Failed to link bill to expense', error: error.message });
  }
};

export const deleteBill = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    const bill = await BillDocument.findById(id);
    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found' });
      return;
    }

    const isMember = await verifyFamilyMember(bill.familyId.toString(), userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    await bill.deleteOne();
    res.status(200).json({ success: true, message: 'Bill document deleted' });
  } catch (error: any) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ success: false, message: 'Failed to delete bill document', error: error.message });
  }
};

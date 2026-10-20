import { Request, Response } from 'express';
import { MoneyTransaction } from '../models/MoneyTransaction.js';
import { Repayment } from '../models/Repayment.js';
import { toMinorUnits } from '../shared/index.js';

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { type, status } = req.query;

    const query: any = { ownerId };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await MoneyTransaction.find(query).sort({ createdAt: -1 });

    // Calculate summary statistics
    let totalLentMinor = 0;
    let totalBorrowedMinor = 0;
    let outstandingReceivablesMinor = 0; // remaining from lent
    let outstandingPayablesMinor = 0; // remaining from borrowed
    let overdueMinor = 0;

    const now = new Date();

    const allUserTxns = await MoneyTransaction.find({ ownerId });
    allUserTxns.forEach(t => {
      if (t.type === 'lent') {
        totalLentMinor += t.principalMinor;
        outstandingReceivablesMinor += t.remainingMinor;
      } else {
        totalBorrowedMinor += t.principalMinor;
        outstandingPayablesMinor += t.remainingMinor;
      }

      if (t.dueDate && new Date(t.dueDate) < now && t.remainingMinor > 0) {
        overdueMinor += t.remainingMinor;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        transactions,
        summary: {
          totalLentMinor,
          totalBorrowedMinor,
          outstandingReceivablesMinor,
          outstandingPayablesMinor,
          overdueMinor
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve money transactions.' });
  }
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const {
      type,
      personName,
      contactReference,
      principalAmount,
      currency = 'INR',
      transactionDate,
      dueDate,
      notes,
      reminderDate,
      reminderFrequency = 'once'
    } = req.body;

    const principalMinor = toMinorUnits(principalAmount);
    if (principalMinor <= 0) {
      res.status(400).json({ success: false, message: 'Transaction amount must be positive.' });
      return;
    }

    const transaction = await MoneyTransaction.create({
      ownerId,
      type,
      personName,
      contactReference: contactReference || '',
      principalMinor,
      remainingMinor: principalMinor,
      totalRepaidMinor: 0,
      currency,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
      status: 'active',
      reminderDate: reminderDate ? new Date(reminderDate) : null,
      reminderFrequency
    });

    res.status(201).json({
      success: true,
      message: `Recorded ${type === 'lent' ? 'money lent to' : 'money borrowed from'} ${personName}!`,
      data: { transaction }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create money transaction.' });
  }
}

export async function getTransactionById(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const transaction = await MoneyTransaction.findOne({ _id: id, ownerId });
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
      return;
    }

    const repayments = await Repayment.find({ transactionId: id, ownerId }).sort({ paidAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        transaction,
        repayments
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve transaction details.' });
  }
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { personName, contactReference, dueDate, notes, status, reminderDate, reminderFrequency } = req.body;

    const transaction = await MoneyTransaction.findOne({ _id: id, ownerId });
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    if (personName) transaction.personName = personName;
    if (contactReference !== undefined) transaction.contactReference = contactReference;
    if (dueDate !== undefined) transaction.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (notes !== undefined) transaction.notes = notes;
    if (status) transaction.status = status;
    if (reminderDate !== undefined) transaction.reminderDate = reminderDate ? new Date(reminderDate) : undefined;
    if (reminderFrequency) transaction.reminderFrequency = reminderFrequency;

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction details updated.',
      data: { transaction }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update transaction.' });
  }
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const transaction = await MoneyTransaction.findOneAndDelete({ _id: id, ownerId });
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    await Repayment.deleteMany({ transactionId: id, ownerId });

    res.status(200).json({ success: true, message: 'Transaction removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete transaction.' });
  }
}

export async function addRepayment(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { amount, paidAt, notes } = req.body;

    const transaction = await MoneyTransaction.findOne({ _id: id, ownerId });
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found.' });
      return;
    }

    const repaymentMinor = toMinorUnits(amount);
    if (repaymentMinor <= 0) {
      res.status(400).json({ success: false, message: 'Repayment amount must be greater than zero.' });
      return;
    }

    if (repaymentMinor > transaction.remainingMinor) {
      res.status(400).json({
        success: false,
        message: `Repayment amount cannot exceed the remaining outstanding balance of ${(transaction.remainingMinor / 100).toFixed(2)}.`
      });
      return;
    }

    const repayment = await Repayment.create({
      transactionId: transaction._id,
      ownerId,
      amountMinor: repaymentMinor,
      currency: transaction.currency,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes: notes || ''
    });

    // Update transaction remaining & status without mutating original principal
    transaction.totalRepaidMinor += repaymentMinor;
    transaction.remainingMinor -= repaymentMinor;

    if (transaction.remainingMinor === 0) {
      transaction.status = 'fully_paid';
    } else {
      transaction.status = 'partially_paid';
    }

    await transaction.save();

    res.status(201).json({
      success: true,
      message:
        transaction.status === 'fully_paid'
          ? '🎉 Fully settled! Outstanding balance is now zero.'
          : 'Repayment recorded successfully.',
      data: {
        repayment,
        transaction
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to record repayment.' });
  }
}

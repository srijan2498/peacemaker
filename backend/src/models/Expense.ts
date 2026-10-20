import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  familyId: mongoose.Types.ObjectId;
  title: string;
  amountMinor: number;
  currency: string;
  categoryId: mongoose.Types.ObjectId;
  paidByUserId: mongoose.Types.ObjectId;
  createdByUserId: mongoose.Types.ObjectId;
  expenseDate: Date;
  paymentMethod: string;
  merchant?: string;
  description?: string;
  receiptUrl?: string;
  tags: string[];
  isRecurring: boolean;
  recurrenceRule?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true, index: true },
    paidByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expenseDate: { type: Date, required: true, index: true },
    paymentMethod: { type: String, default: 'UPI' },
    merchant: { type: String, default: '' },
    description: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    tags: { type: [String], default: [] },
    isRecurring: { type: Boolean, default: false },
    recurrenceRule: { type: String, default: '' },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

ExpenseSchema.index({ familyId: 1, expenseDate: -1 });
ExpenseSchema.index({ familyId: 1, deletedAt: 1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);

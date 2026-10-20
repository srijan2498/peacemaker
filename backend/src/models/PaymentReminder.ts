import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentReminder extends Document {
  ownerId: mongoose.Types.ObjectId;
  familyId?: mongoose.Types.ObjectId;
  visibility: 'private' | 'family';
  title: string;
  description?: string;
  amountMinor: number;
  currency: string;
  dueAt: Date;
  timezone: string;
  recurrenceRule: string;
  categoryId?: mongoose.Types.ObjectId;
  status: 'pending' | 'paid' | 'snoozed' | 'cancelled';
  paidExpenseId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentReminderSchema = new Schema<IPaymentReminder>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', index: true },
    visibility: { type: String, enum: ['private', 'family'], default: 'private' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    amountMinor: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    dueAt: { type: Date, required: true, index: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    recurrenceRule: { type: String, default: 'none' }, // none, weekly, monthly, yearly
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'snoozed', 'cancelled'],
      default: 'pending',
      index: true
    },
    paidExpenseId: { type: Schema.Types.ObjectId, ref: 'Expense' }
  },
  { timestamps: true }
);

PaymentReminderSchema.index({ dueAt: 1, status: 1 });

export const PaymentReminder = mongoose.model<IPaymentReminder>('PaymentReminder', PaymentReminderSchema);

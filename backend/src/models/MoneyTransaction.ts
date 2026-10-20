import mongoose, { Schema, Document } from 'mongoose';

export interface IMoneyTransaction extends Document {
  ownerId: mongoose.Types.ObjectId;
  type: 'lent' | 'borrowed';
  personName: string;
  contactReference?: string;
  principalMinor: number;
  remainingMinor: number;
  totalRepaidMinor: number;
  currency: string;
  transactionDate: Date;
  dueDate?: Date;
  notes?: string;
  status: 'active' | 'partially_paid' | 'fully_paid' | 'overdue' | 'cancelled';
  reminderDate?: Date;
  reminderFrequency: string;
  createdAt: Date;
  updatedAt: Date;
}

const MoneyTransactionSchema = new Schema<IMoneyTransaction>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['lent', 'borrowed'], required: true },
    personName: { type: String, required: true, trim: true },
    contactReference: { type: String, default: '' },
    principalMinor: { type: Number, required: true, min: 0 },
    remainingMinor: { type: Number, required: true, min: 0 },
    totalRepaidMinor: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    transactionDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'partially_paid', 'fully_paid', 'overdue', 'cancelled'],
      default: 'active',
      index: true
    },
    reminderDate: { type: Date, default: null },
    reminderFrequency: { type: String, default: 'once' }
  },
  { timestamps: true }
);

MoneyTransactionSchema.index({ ownerId: 1, dueDate: 1 });

export const MoneyTransaction = mongoose.model<IMoneyTransaction>('MoneyTransaction', MoneyTransactionSchema);

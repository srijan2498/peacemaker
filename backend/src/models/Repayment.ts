import mongoose, { Schema, Document } from 'mongoose';

export interface IRepayment extends Document {
  transactionId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  amountMinor: number;
  currency: string;
  paidAt: Date;
  notes?: string;
  createdAt: Date;
}

const RepaymentSchema = new Schema<IRepayment>(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: 'MoneyTransaction', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountMinor: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    paidAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Repayment = mongoose.model<IRepayment>('Repayment', RepaymentSchema);

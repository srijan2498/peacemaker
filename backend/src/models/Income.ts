import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  familyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  amountMinor: number;
  currency: string;
  source: string; // e.g. "Google", "Infosys", "Freelance Client", "Rental Property" (Where money came from)
  category: string; // e.g. "Salary", "Bonus", "Freelance", "Investment", "Rental", "Gift", "Other"
  receivedDate: Date;
  paymentMethod: string; // e.g. "Bank Transfer", "Direct Deposit", "UPI", "Cheque", "Cash"
  description?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    source: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'Salary', index: true },
    receivedDate: { type: Date, required: true, index: true },
    paymentMethod: { type: String, default: 'Bank Transfer' },
    description: { type: String, default: '' },
    isRecurring: { type: Boolean, default: false },
    recurrenceRule: { type: String, default: '' },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

IncomeSchema.index({ familyId: 1, receivedDate: -1 });
IncomeSchema.index({ familyId: 1, deletedAt: 1 });

export const Income = mongoose.model<IIncome>('Income', IncomeSchema);

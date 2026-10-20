import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  familyId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  period: string; // 'monthly'
  amountMinor: number;
  currency: string;
  alertThresholds: number[];
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory' },
    period: { type: String, default: 'monthly' },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    alertThresholds: { type: [Number], default: [50, 75, 90, 100] }
  },
  { timestamps: true }
);

BudgetSchema.index({ familyId: 1, categoryId: 1 });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);

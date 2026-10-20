import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseCategory extends Document {
  familyId?: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  description?: string;
  isDefault: boolean;
  scope: 'family' | 'private';
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategorySchema = new Schema<IExpenseCategory>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, default: '🏷️' },
    color: { type: String, default: '#A78BFA' },
    description: { type: String, default: '' },
    isDefault: { type: Boolean, default: false, index: true },
    scope: { type: String, enum: ['family', 'private'], default: 'family' },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ExpenseCategorySchema.index({ familyId: 1, name: 1 });

export const ExpenseCategory = mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);

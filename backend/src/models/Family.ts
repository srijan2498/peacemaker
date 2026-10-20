import mongoose, { Schema, Document } from 'mongoose';

export interface IFamily extends Document {
  name: string;
  description?: string;
  avatar: string;
  createdBy: mongoose.Types.ObjectId;
  defaultCurrency: string;
  timezone: string;
  monthlyBudget: number; // in minor units
  createdAt: Date;
  updatedAt: Date;
}

const FamilySchema = new Schema<IFamily>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    avatar: { type: String, default: '🏡' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    defaultCurrency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    monthlyBudget: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export const Family = mongoose.model<IFamily>('Family', FamilySchema);

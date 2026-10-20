import mongoose, { Schema, Document } from 'mongoose';
import { HouseholdItemCategory } from '../shared/index.js';

export interface IHouseholdItem extends Document {
  familyId: mongoose.Types.ObjectId;
  name: string;
  category: HouseholdItemCategory;
  quantity: number;
  unit: string;
  minThreshold: number;
  location?: string;
  expiryDate?: string;
  notes?: string;
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdItemSchema = new Schema<IHouseholdItem>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['pantry', 'kitchen', 'toiletries', 'cleaning', 'baby', 'medical', 'other'],
      default: 'pantry',
      index: true
    },
    quantity: { type: Number, required: true, default: 1, min: 0 },
    unit: { type: String, default: 'units', trim: true },
    minThreshold: { type: Number, default: 2, min: 0 },
    location: { type: String, default: 'Main Pantry' },
    expiryDate: { type: String },
    notes: { type: String, default: '' },
    lastRestockedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

HouseholdItemSchema.index({ familyId: 1, category: 1 });
HouseholdItemSchema.index({ familyId: 1, quantity: 1, minThreshold: 1 });

export const HouseholdItem = mongoose.model<IHouseholdItem>('HouseholdItem', HouseholdItemSchema);

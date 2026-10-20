import mongoose, { Schema, Document } from 'mongoose';
import { HealthRecordType } from '../shared/index.js';

export interface IHealthRecord extends Document {
  familyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: HealthRecordType;
  date: string; // YYYY-MM-DD
  data: Record<string, any>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HealthRecordSchema = new Schema<IHealthRecord>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['sleep', 'period', 'fever', 'steps', 'water', 'blood_pressure', 'weight'],
      index: true
    },
    date: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true, default: {} },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

HealthRecordSchema.index({ familyId: 1, type: 1, date: -1 });
HealthRecordSchema.index({ userId: 1, type: 1, date: -1 });

export const HealthRecord = mongoose.model<IHealthRecord>('HealthRecord', HealthRecordSchema);

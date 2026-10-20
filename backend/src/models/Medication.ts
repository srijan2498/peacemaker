import mongoose, { Schema, Document } from 'mongoose';
import { MedicationTimeSlot } from '../shared/index.js';

export interface IMedication extends Document {
  familyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  dosage: string;
  form: string;
  purpose?: string;
  frequencyType?: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  schedules: {
    timeSlot: MedicationTimeSlot;
    timeLabel: string;
    dosage: string;
    withFood: 'before' | 'with' | 'after' | 'any';
  }[];
  frequencyDescription: string;
  startDate: string;
  endDate?: string;
  totalPills: number;
  pillsRemaining: number;
  lowStockThreshold?: number;
  refillAlertDays: number;
  prescribingDoctor?: string;
  pharmacyName?: string;
  instructions?: string;
  isActive: boolean;
  takenLogs: {
    date: string;
    timeSlot: MedicationTimeSlot;
    taken: boolean;
    takenAt?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema = new Schema<IMedication>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    form: {
      type: String,
      default: 'tablet',
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'inhaler']
    },
    purpose: { type: String, default: '' },
    frequencyType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'as_needed'],
      default: 'daily'
    },
    daysOfWeek: [{ type: Number }],
    dayOfMonth: { type: Number },
    schedules: [
      {
        timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
        timeLabel: { type: String, default: '08:00 AM' },
        dosage: { type: String, default: '1' },
        withFood: { type: String, enum: ['before', 'with', 'after', 'any'], default: 'after' }
      }
    ],
    frequencyDescription: { type: String, default: 'Daily' },
    startDate: { type: String, required: true },
    endDate: { type: String },
    totalPills: { type: Number, default: 30 },
    pillsRemaining: { type: Number, default: 30 },
    lowStockThreshold: { type: Number, default: 5 },
    refillAlertDays: { type: Number, default: 5 },
    prescribingDoctor: { type: String, default: '' },
    pharmacyName: { type: String, default: '' },
    instructions: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    takenLogs: [
      {
        date: { type: String, required: true },
        timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
        taken: { type: Boolean, default: false },
        takenAt: { type: String }
      }
    ]
  },
  { timestamps: true }
);

MedicationSchema.index({ familyId: 1, isActive: 1 });
MedicationSchema.index({ userId: 1, isActive: 1 });

export const Medication = mongoose.model<IMedication>('Medication', MedicationSchema);

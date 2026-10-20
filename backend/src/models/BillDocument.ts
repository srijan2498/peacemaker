import mongoose, { Schema, Document } from 'mongoose';
import { BillCategory, BillFileFormat } from '../shared/index.js';

export interface IBillDocument extends Document {
  familyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  billCategory: BillCategory;
  storeName: string;
  billDate: string;
  amountMinor: number;
  currency: string;
  invoiceNumber?: string;
  paymentMethod: string;
  fileName: string;
  fileFormat: BillFileFormat;
  mimeType: string;
  fileUrl?: string; // Base64 Data URL or hosted storage URL
  fileSizeBytes: number;
  notes?: string;
  expenseId?: mongoose.Types.ObjectId;
  parsedItems: { name: string; quantity?: number; priceMinor?: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const BillDocumentSchema = new Schema<IBillDocument>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billCategory: {
      type: String,
      required: true,
      enum: ['medicine', 'grocery', 'diagnostic', 'other'],
      index: true
    },
    storeName: { type: String, required: true, trim: true },
    billDate: { type: String, required: true, index: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    invoiceNumber: { type: String, default: '' },
    paymentMethod: { type: String, default: 'UPI' },
    fileName: { type: String, required: true },
    fileFormat: {
      type: String,
      required: true,
      enum: ['pdf', 'image', 'word', 'excel']
    },
    mimeType: { type: String, required: true },
    fileUrl: { type: String, default: '' },
    fileSizeBytes: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    expenseId: { type: Schema.Types.ObjectId, ref: 'Expense', default: null },
    parsedItems: [
      {
        name: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        priceMinor: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

BillDocumentSchema.index({ familyId: 1, billCategory: 1, billDate: -1 });
BillDocumentSchema.index({ familyId: 1, createdAt: -1 });

export const BillDocument = mongoose.model<IBillDocument>('BillDocument', BillDocumentSchema);

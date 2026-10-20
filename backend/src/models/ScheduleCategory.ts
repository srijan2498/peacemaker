import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleCategory extends Document {
  ownerId?: mongoose.Types.ObjectId;
  name: string;
  color: string;
  icon: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleCategorySchema = new Schema<IScheduleCategory>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#93C5FD' },
    icon: { type: String, default: '✨' },
    description: { type: String, default: '' },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ScheduleCategory = mongoose.model<IScheduleCategory>('ScheduleCategory', ScheduleCategorySchema);

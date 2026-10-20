import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleEvent extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  categoryId?: mongoose.Types.ObjectId;
  startAt: Date;
  endAt?: Date;
  isAllDay: boolean;
  recurrenceRule: string;
  reminderMinutesBefore?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'skipped';
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleEventSchema = new Schema<IScheduleEvent>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ScheduleCategory' },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date },
    isAllDay: { type: Boolean, default: false },
    recurrenceRule: { type: String, default: 'none' }, // none, daily, weekdays, weekends, weekly
    reminderMinutesBefore: { type: Number, default: 0 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending', index: true }
  },
  { timestamps: true }
);

ScheduleEventSchema.index({ ownerId: 1, startAt: 1 });

export const ScheduleEvent = mongoose.model<IScheduleEvent>('ScheduleEvent', ScheduleEventSchema);

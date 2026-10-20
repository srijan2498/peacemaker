import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: 'reminder' | 'budget_alert' | 'repayment' | 'invitation' | 'system' | 'stock_alert' | 'health_alert';
  title: string;
  body: string;
  targetType?: string;
  targetId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['reminder', 'budget_alert', 'repayment', 'invitation', 'system', 'stock_alert', 'health_alert'],
      default: 'reminder'
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    targetType: { type: String, default: '' },
    targetId: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

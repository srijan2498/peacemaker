import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  nickname?: string;
  preferredCurrency: string;
  timezone: string;
  themePreference: 'light' | 'dark' | 'system';
  childMode: boolean;
  securityQuestion?: string;
  securityAnswerHash?: string;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    nickname: { type: String, default: '' },
    preferredCurrency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    childMode: { type: Boolean, default: false },
    securityQuestion: { type: String, default: '' },
    securityAnswerHash: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

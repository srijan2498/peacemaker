import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyMembership extends Document {
  familyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  status: 'active' | 'pending' | 'left';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyMembershipSchema = new Schema<IFamilyMembership>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    status: { type: String, enum: ['active', 'pending', 'left'], default: 'active' },
    joinedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

FamilyMembershipSchema.index({ familyId: 1, userId: 1 }, { unique: true });

export const FamilyMembership = mongoose.model<IFamilyMembership>('FamilyMembership', FamilyMembershipSchema);

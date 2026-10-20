import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyInvitation extends Document {
  familyId: mongoose.Types.ObjectId;
  code: string;
  createdBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  maximumUses: number;
  usedCount: number;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyInvitationSchema = new Schema<IFamilyInvitation>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    maximumUses: { type: Number, default: 10 },
    usedCount: { type: Number, default: 0 },
    isRevoked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const FamilyInvitation = mongoose.model<IFamilyInvitation>('FamilyInvitation', FamilyInvitationSchema);

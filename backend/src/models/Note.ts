import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  color: string;
  icon: string;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Untitled Note', trim: true },
    content: { type: String, default: '' },
    tags: { type: [String], default: [] },
    color: { type: String, default: '#FFFFFF' },
    icon: { type: String, default: '📝' },
    isPinned: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

NoteSchema.index({ ownerId: 1, isDeleted: 1, isPinned: -1, updatedAt: -1 });

export const Note = mongoose.model<INote>('Note', NoteSchema);

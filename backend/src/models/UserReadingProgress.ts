import mongoose, { Schema, Document } from 'mongoose';

export interface IUserReadingProgress extends Document {
  userId: mongoose.Types.ObjectId;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl?: string;
  coverGradient?: string;
  coverEmoji?: string;
  chapterIndex: number;
  chapterTitle: string;
  pageNumber: number;
  totalChapterPages: number;
  totalBookChapters: number;
  percentCompleted: number;
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserReadingProgressSchema = new Schema<IUserReadingProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    bookId: { type: String, required: true },
    bookTitle: { type: String, required: true },
    bookAuthor: { type: String, required: true },
    coverImageUrl: { type: String },
    coverGradient: { type: String },
    coverEmoji: { type: String },
    chapterIndex: { type: Number, default: 0 },
    chapterTitle: { type: String, default: '' },
    pageNumber: { type: Number, default: 1 },
    totalChapterPages: { type: Number, default: 1 },
    totalBookChapters: { type: Number, default: 1 },
    percentCompleted: { type: Number, default: 0 },
    lastReadAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const UserReadingProgress = mongoose.model<IUserReadingProgress>(
  'UserReadingProgress',
  UserReadingProgressSchema
);

import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAudioPreference extends Document {
  userId: mongoose.Types.ObjectId;
  favoriteTrackIds: string[];
  recentTrackIds: string[];
  savedMixes: {
    id: string;
    name: string;
    tracks: {
      id: string;
      soundType: string;
      volume: number;
    }[];
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserAudioPreferenceSchema = new Schema<IUserAudioPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    favoriteTrackIds: { type: [String], default: [] },
    recentTrackIds: { type: [String], default: [] },
    savedMixes: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        tracks: [
          {
            id: { type: String, required: true },
            soundType: { type: String, required: true },
            volume: { type: Number, required: true, min: 0, max: 100 }
          }
        ],
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const UserAudioPreference = mongoose.model<IUserAudioPreference>(
  'UserAudioPreference',
  UserAudioPreferenceSchema
);

import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipientSession extends Document {
  _id: mongoose.Types.ObjectId;
  experienceId: mongoose.Types.ObjectId;
  sessionId: string;
  completedModules: string[];
  discoveredSecrets: string[];
  gamesCompleted: string[];
  progress: number;
  lastVisitedAt: Date;
  createdAt: Date;
}

const RecipientSessionSchema = new Schema<IRecipientSession>(
  {
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    completedModules: {
      type: [String],
      default: [],
    },
    discoveredSecrets: {
      type: [String],
      default: [],
    },
    gamesCompleted: {
      type: [String],
      default: [],
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

RecipientSessionSchema.index({ experienceId: 1, sessionId: 1 }, { unique: true });

export const RecipientSession = mongoose.model<IRecipientSession>(
  'RecipientSession',
  RecipientSessionSchema
);

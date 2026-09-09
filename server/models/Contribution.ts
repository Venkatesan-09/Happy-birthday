import mongoose, { Schema, Document } from 'mongoose';

export interface IContribution extends Document {
  _id: mongoose.Types.ObjectId;
  experienceId: mongoose.Types.ObjectId;
  contributorId?: mongoose.Types.ObjectId;
  contributorName: string;
  relationship?: string;
  type: 'message' | 'photo' | 'video' | 'audio' | 'memory';
  message: string;
  media?: Record<string, any>;
  approved: boolean;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  creatorNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContributionSchema = new Schema<IContribution>(
  {
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      required: true,
      index: true,
    },
    contributorId: {
      type: Schema.Types.ObjectId,
      ref: 'Contributor',
      default: null,
      index: true,
    },
    contributorName: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['message', 'photo', 'video', 'audio', 'memory'],
      default: 'message',
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    media: {
      type: Schema.Types.Mixed,
      default: null,
    },
    approved: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    creatorNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

export const Contribution = mongoose.model<IContribution>('Contribution', ContributionSchema);

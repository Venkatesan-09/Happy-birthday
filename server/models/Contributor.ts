import mongoose, { Schema, Document } from 'mongoose';

export interface IContributor extends Document {
  _id: mongoose.Types.ObjectId;
  experienceId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  token: string;
  inviteToken?: string;
  tokenHash?: string;
  status: 'pending' | 'invited' | 'submitted' | 'expired';
  expiresAt?: Date;
  createdAt: Date;
}

const ContributorSchema = new Schema<IContributor>(
  {
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      default: '',
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    inviteToken: {
      type: String,
      required: false,
      index: true,
    },
    tokenHash: {
      type: String,
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'invited', 'submitted', 'expired'],
      default: 'invited',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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

export const Contributor = mongoose.model<IContributor>('Contributor', ContributorSchema);

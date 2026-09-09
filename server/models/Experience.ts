import mongoose, { Schema, Document } from 'mongoose';

export interface IExperience extends Document {
  _id: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  slug: string;
  recipient: {
    name: string;
    nickname?: string;
    relationship?: string;
    birthday?: string;
  };
  theme: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    font?: string;
    background?: string;
    animation?: string;
  };
  privacy: {
    type: 'public' | 'password' | 'unlisted';
    passwordHash?: string;
  };
  status: 'draft' | 'published' | 'archived';
  settings?: Record<string, any>;
  expiresAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExperienceSchema = new Schema<IExperience>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    recipient: {
      name: { type: String, required: true, trim: true },
      nickname: { type: String, default: '', trim: true },
      relationship: { type: String, default: '', trim: true },
      birthday: { type: String, default: '' },
    },
    theme: {
      name: { type: String, default: 'celestial-night' },
      primaryColor: { type: String, default: '#8B5CF6' },
      secondaryColor: { type: String, default: '#EC4899' },
      font: { type: String, default: 'Inter' },
      background: { type: String, default: 'deep-space' },
      animation: { type: String, default: 'gentle-float' },
    },
    privacy: {
      type: {
        type: String,
        enum: ['public', 'password', 'unlisted'],
        default: 'public',
      },
      passwordHash: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    settings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    expiresAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
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

export const Experience = mongoose.model<IExperience>('Experience', ExperienceSchema);

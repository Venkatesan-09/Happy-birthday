import mongoose, { Schema, Document } from 'mongoose';

export interface IModule extends Document {
  _id: mongoose.Types.ObjectId;
  experienceId: mongoose.Types.ObjectId;
  type: string;
  position: number;
  enabled: boolean;
  title: string;
  subtitle?: string;
  content: Record<string, any>;
  settings?: Record<string, any>;
  style?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    settings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    style: {
      type: Schema.Types.Mixed,
      default: () => ({}),
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

ModuleSchema.index({ experienceId: 1, position: 1 });

export const Module = mongoose.model<IModule>('Module', ModuleSchema);

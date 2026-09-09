import mongoose, { Schema, Document } from 'mongoose';

export interface IExperienceVersion extends Document {
  _id: mongoose.Types.ObjectId;
  experienceId: mongoose.Types.ObjectId;
  versionNumber: number;
  snapshot: Record<string, any>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ExperienceVersionSchema = new Schema<IExperienceVersion>(
  {
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      index: true,
    },
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
      immutable: true, // published versions must not be mutated
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

ExperienceVersionSchema.index({ experienceId: 1, versionNumber: -1 });

export const ExperienceVersion = mongoose.model<IExperienceVersion>(
  'ExperienceVersion',
  ExperienceVersionSchema
);

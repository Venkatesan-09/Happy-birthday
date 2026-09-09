import mongoose, { Schema, Document } from 'mongoose';

export interface IAIGeneration extends Document {
  _id: mongoose.Types.ObjectId;
  experienceId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  promptType: string;
  prompt: string;
  response: string;
  generationModel: string;
  tokensUsed?: number;
  createdAt: Date;
}

const AIGenerationSchema = new Schema<IAIGeneration>(
  {
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    promptType: {
      type: String,
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    generationModel: {
      type: String,
      default: 'gemini-2.5-flash',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AIGeneration = mongoose.model<IAIGeneration>(
  'AIGeneration',
  AIGenerationSchema
);

import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaCloudinary {
  publicId: string;
  resourceType: string;
  secureUrl: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
}

export interface IMediaUploadedBy {
  kind: 'CREATOR' | 'CONTRIBUTOR';
  userId?: mongoose.Types.ObjectId;
  contributorId?: mongoose.Types.ObjectId;
}

export interface IMediaMeta {
  altText?: string;
  caption?: string;
  title?: string;
}

export interface IMedia extends Document {
  _id: mongoose.Types.ObjectId;
  experienceId: mongoose.Types.ObjectId;
  moduleId?: mongoose.Types.ObjectId;
  /** DearYou semantic media type */
  type: 'image' | 'audio' | 'voice' | 'video';
  originalFilename: string;
  mimeType: string;
  size: number;
  cloudinary: IMediaCloudinary;
  uploadedBy: IMediaUploadedBy;
  metadata: IMediaMeta;
  status: 'active' | 'deleted';
  createdAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    experienceId: {
      type: Schema.Types.ObjectId,
      ref: 'Experience',
      required: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
    },
    type: {
      type: String,
      enum: ['image', 'audio', 'voice', 'video'],
      required: true,
    },
    originalFilename: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    cloudinary: {
      publicId:      { type: String, required: true },
      resourceType:  { type: String, default: 'image' },
      secureUrl:     { type: String, required: true },
      url:           { type: String, default: '' },
      format:        { type: String, default: '' },
      width:         { type: Number },
      height:        { type: Number },
      duration:      { type: Number },
      bytes:         { type: Number, default: 0 },
    },
    uploadedBy: {
      kind:          { type: String, enum: ['CREATOR', 'CONTRIBUTOR'], required: true },
      userId:        { type: Schema.Types.ObjectId, ref: 'User' },
      contributorId: { type: Schema.Types.ObjectId, ref: 'Contributor' },
    },
    metadata: {
      altText:  { type: String },
      caption:  { type: String },
      title:    { type: String },
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
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

// Compound indexes for common query patterns
MediaSchema.index({ experienceId: 1, type: 1 });
MediaSchema.index({ experienceId: 1, status: 1 });
MediaSchema.index({ experienceId: 1, moduleId: 1 });

export const Media = mongoose.model<IMedia>('Media', MediaSchema);

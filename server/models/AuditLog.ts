import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorType: 'user' | 'contributor' | 'recipient' | 'system';
  action: string;
  targetId?: mongoose.Types.ObjectId;
  targetType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    actorType: {
      type: String,
      enum: ['user', 'contributor', 'recipient', 'system'],
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    targetType: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

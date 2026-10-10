import mongoose, { Schema, Document } from 'mongoose';

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'fulfilled';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IStatusHistoryItem {
  status: RequestStatus;
  changedBy: mongoose.Types.ObjectId;
  note?: string;
  timestamp: Date;
}

export interface IResourceRequest extends Document {
  resourceId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  requestedQuantity: number;
  approvedQuantity: number;
  reason: string;
  urgency: UrgencyLevel;
  destinationAddress: string;
  contactPhone: string;
  status: RequestStatus;
  rejectionReason?: string;
  volunteerId?: mongoose.Types.ObjectId;
  statusHistory: IStatusHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const ResourceRequestSchema = new Schema<IResourceRequest>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: [1, 'Requested quantity must be at least 1'],
    },
    approvedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: 1000,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    destinationAddress: {
      type: String,
      required: [true, 'Destination address or pickup location is required'],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'fulfilled'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const ResourceRequest = mongoose.model<IResourceRequest>('ResourceRequest', ResourceRequestSchema);

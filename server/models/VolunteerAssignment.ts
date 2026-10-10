import mongoose, { Schema, Document } from 'mongoose';

export type AssignmentStatus = 'assigned' | 'collected' | 'delivered' | 'failed';

export interface IVolunteerAssignment extends Document {
  requestId: mongoose.Types.ObjectId;
  volunteerId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  status: AssignmentStatus;
  collectionLocation: string;
  dropoffLocation: string;
  collectionNotes?: string;
  deliveryNotes?: string;
  failureReason?: string;
  collectedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerAssignmentSchema = new Schema<IVolunteerAssignment>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'ResourceRequest',
      required: true,
      index: true,
    },
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'collected', 'delivered', 'failed'],
      default: 'assigned',
      index: true,
    },
    collectionLocation: {
      type: String,
      required: true,
    },
    dropoffLocation: {
      type: String,
      required: true,
    },
    collectionNotes: {
      type: String,
      default: '',
    },
    deliveryNotes: {
      type: String,
      default: '',
    },
    failureReason: {
      type: String,
      default: '',
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const VolunteerAssignment = mongoose.model<IVolunteerAssignment>(
  'VolunteerAssignment',
  VolunteerAssignmentSchema
);

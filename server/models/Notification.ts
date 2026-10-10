import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'request_created'
  | 'request_approved'
  | 'request_rejected'
  | 'request_cancelled'
  | 'request_fulfilled'
  | 'verification'
  | 'account_status'
  | 'system';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'request_created',
        'request_approved',
        'request_rejected',
        'request_cancelled',
        'request_fulfilled',
        'verification',
        'account_status',
        'system',
      ],
      default: 'system',
      index: true,
    },
    link: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

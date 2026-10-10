import mongoose, { Schema, Document } from 'mongoose';

export type InventoryTransactionType =
  | 'initial'
  | 'stock_adjustment'
  | 'reserved'
  | 'released'
  | 'fulfilled';

export interface IInventoryTransaction extends Document {
  resourceId: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  type: InventoryTransactionType;
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  requestId?: mongoose.Types.ObjectId;
  note: string;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['initial', 'stock_adjustment', 'reserved', 'released', 'fulfilled'],
      required: true,
      index: true,
    },
    quantityChanged: {
      type: Number,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'ResourceRequest',
      default: null,
      index: true,
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  'InventoryTransaction',
  InventoryTransactionSchema
);

import mongoose, { Schema, Document } from 'mongoose';

export type ResourceCategory =
  | 'food'
  | 'water'
  | 'medicine'
  | 'first_aid'
  | 'clothing'
  | 'shelter'
  | 'hygiene'
  | 'rescue'
  | 'other';

export type AvailabilityStatus =
  | 'available'
  | 'partially_available'
  | 'reserved'
  | 'unavailable';

export type ModerationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export interface IResource extends Document {
  title: string;
  category: ResourceCategory;
  description: string;
  quantityAvailable: number;
  quantityReserved: number;
  unit: string;
  condition: 'new' | 'good' | 'perishable';
  expiryDate?: Date;
  providerId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  locationName: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  availabilityStatus: AvailabilityStatus;
  moderationStatus: ModerationStatus;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: 120,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Resource category is required'],
      enum: ['food', 'water', 'medicine', 'first_aid', 'clothing', 'shelter', 'hygiene', 'rescue', 'other'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
      default: 0,
    },
    quantityReserved: {
      type: Number,
      required: true,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'units',
      trim: true,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'perishable'],
      default: 'new',
    },
    expiryDate: {
      type: Date,
      default: null,
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
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'partially_available', 'reserved', 'unavailable'],
      default: 'available',
      index: true,
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'approved',
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

ResourceSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema);

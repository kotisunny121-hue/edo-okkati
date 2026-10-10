export type UserRole =
  | 'guest'
  | 'provider'
  | 'seeker'
  | 'organization'
  | 'volunteer'
  | 'admin'
  | 'super_admin';

export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string | null;
  organization?: Organization | null;
  createdAt?: string;
}

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

export interface Resource {
  _id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  quantityAvailable: number;
  quantityReserved: number;
  unit: string;
  condition: 'new' | 'good' | 'perishable';
  expiryDate?: string | null;
  providerId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  organizationId?: {
    _id: string;
    name: string;
    status: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
  } | null;
  locationName: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  availabilityStatus: AvailabilityStatus;
  moderationStatus: ModerationStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'fulfilled';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface StatusHistoryItem {
  status: RequestStatus;
  changedBy: {
    _id: string;
    name: string;
    role?: string;
  };
  note?: string;
  timestamp: string;
}

export interface ResourceRequest {
  _id: string;
  resourceId: Resource | string;
  seekerId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  providerId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  organizationId?: string | null;
  requestedQuantity: number;
  approvedQuantity: number;
  reason: string;
  urgency: UrgencyLevel;
  destinationAddress: string;
  contactPhone: string;
  status: RequestStatus;
  rejectionReason?: string;
  volunteerId?: {
    _id: string;
    name: string;
    phone?: string;
  } | null;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  registrationNumber?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  createdBy: string;
  verifiedAt?: string;
  createdAt: string;
}

export type AssignmentStatus = 'assigned' | 'collected' | 'delivered' | 'failed';

export interface VolunteerAssignment {
  _id: string;
  requestId: ResourceRequest;
  volunteerId: string;
  assignedBy: string;
  status: AssignmentStatus;
  collectionLocation: string;
  dropoffLocation: string;
  collectionNotes?: string;
  deliveryNotes?: string;
  failureReason?: string;
  collectedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  userEmail?: string;
  role?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export interface AdminStats {
  summary: {
    totalUsers: number;
    totalResources: number;
    availableResources: number;
    unavailableResources: number;
    totalAvailableQuantity: number;
    pendingResources: number;
    totalRequests: number;
    pendingRequests: number;
    fulfilledRequests: number;
    pendingOrgs: number;
    verifiedOrgs: number;
  };
  categoryStats: Array<{ _id: string; count: number; totalQty: number }>;
  locationStats: Array<{ _id: string; count: number; totalQty: number }>;
  requestStatusStats: Array<{ _id: string; count: number }>;
  userRoleStats: Array<{ _id: string; count: number }>;
  recentResources: Resource[];
}

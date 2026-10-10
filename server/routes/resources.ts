import express, { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Resource, AvailabilityStatus } from '../models/Resource.js';
import { ResourceRequest } from '../models/ResourceRequest.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { authenticate, optionalAuth, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

const resourceCreateSchema = z.object({
  title: z.string().min(3).max(120),
  category: z.enum(['food', 'water', 'medicine', 'first_aid', 'clothing', 'shelter', 'hygiene', 'rescue', 'other']),
  description: z.string().min(5).max(2000),
  quantityAvailable: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1).max(30),
  condition: z.enum(['new', 'good', 'perishable']).default('new'),
  expiryDate: z.string().optional().nullable(),
  locationName: z.string().min(2),
  address: z.string().min(3),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  imageUrl: z.string().optional(),
});

// GET /api/resources or /api/v1/resources - Browse with filters, search, sorting, and pagination
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const skip = (page - 1) * limit;

    const { search, category, status, availability, location, owner, sortBy, sortOrder, lat, lng, radiusKm } = req.query;

    const query: Record<string, any> = {
      moderationStatus: 'approved',
    };

    if (search && typeof search === 'string' && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { locationName: { $regex: search.trim(), $options: 'i' } },
        { address: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category && typeof category === 'string' && category !== 'all') {
      query.category = category;
    }

    const targetStatus = status || availability;
    if (targetStatus && typeof targetStatus === 'string' && targetStatus !== 'all') {
      query.availabilityStatus = targetStatus;
    }

    if (location && typeof location === 'string' && location.trim() !== '') {
      const locRegex = { $regex: location.trim(), $options: 'i' };
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [{ locationName: locRegex }, { address: locRegex }] },
        ];
        delete query.$or;
      } else {
        query.$or = [{ locationName: locRegex }, { address: locRegex }];
      }
    }

    if (owner && typeof owner === 'string' && owner.trim() !== '') {
      if (mongoose.isValidObjectId(owner)) {
        query.providerId = owner;
      }
    }

    // Geolocation radius filter if coordinates provided
    if (lat && lng && radiusKm) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radKm = parseFloat(radiusKm as string);

      if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(radKm)) {
        const latDelta = radKm / 111;
        const lngDelta = radKm / (111 * Math.cos((latitude * Math.PI) / 180));

        query['coordinates.lat'] = { $gte: latitude - latDelta, $lte: latitude + latDelta };
        query['coordinates.lng'] = { $gte: longitude - lngDelta, $lte: longitude + lngDelta };
      }
    }

    // Sorting
    const sortField = typeof sortBy === 'string' ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortQuery: Record<string, any> = { [sortField]: sortDir };

    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .populate('providerId', 'name email phone role')
      .populate('organizationId', 'name status')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    // If user is guest, protect private contact numbers or addresses if preferred
    const sanitizedResources = resources.map((r) => {
      const doc = r.toObject();
      if (!req.user) {
        if (doc.providerId && typeof doc.providerId === 'object') {
          (doc.providerId as any).phone = undefined;
          (doc.providerId as any).email = undefined;
        }
      }
      return doc;
    });

    res.json({
      success: true,
      data: sanitizedResources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve resources' });
  }
});

// GET /api/v1/resources/mine - List logged-in provider's / org's resources
router.get('/mine', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const filter: Record<string, any> = {};

    if (user.role === 'organization' && user.organizationId) {
      filter.$or = [{ providerId: user._id }, { organizationId: user.organizationId }];
    } else {
      filter.providerId = user._id;
    }

    const resources = await Resource.find(filter)
      .populate('organizationId', 'name status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    console.error('Error fetching own resources:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve your listings' });
  }
});

// GET /api/v1/resources/:id - Get details of specific resource
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid resource ID format' });
      return;
    }

    const resource = await Resource.findById(req.params.id)
      .populate('providerId', 'name email phone role')
      .populate('organizationId', 'name status contactEmail contactPhone address');

    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    const doc = resource.toObject();
    if (!req.user) {
      // Hide direct phone from guest users for privacy
      if (doc.providerId && typeof doc.providerId === 'object') {
        (doc.providerId as any).phone = undefined;
      }
    }

    res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve resource details' });
  }
});

// POST /api/v1/resources - Create new resource
router.post('/', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = resourceCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid resource data',
        errors: parseResult.error.format(),
      });
      return;
    }

    const data = parseResult.data;
    const user = req.user!;

    const newResource = new Resource({
      ...data,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      providerId: user._id,
      organizationId: user.organizationId || null,
      quantityReserved: 0,
      availabilityStatus: data.quantityAvailable === 0 ? 'unavailable' : 'available',
      moderationStatus: 'approved', // Auto-approved for verified providers
    });

    await newResource.save();

    // Log initial inventory transaction
    await InventoryTransaction.create({
      resourceId: newResource._id,
      performedBy: user._id,
      type: 'initial',
      quantityChanged: data.quantityAvailable,
      previousQuantity: 0,
      newQuantity: data.quantityAvailable,
      note: 'Initial resource inventory addition',
    });

    await recordAuditLog(
      req,
      'RESOURCE_CREATED',
      'Resource',
      newResource._id.toString(),
      { title: newResource.title, category: newResource.category, quantity: data.quantityAvailable }
    );

    res.status(201).json({
      success: true,
      message: 'Resource published successfully.',
      data: newResource,
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ success: false, message: 'Failed to create resource listing' });
  }
});

// PUT /api/v1/resources/:id - Update resource
router.put('/:id', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid resource ID format' });
      return;
    }

    const user = req.user!;
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    // Authorization: owner or admin
    const isOwner = resource.providerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'You are not authorized to edit this resource' });
      return;
    }

    const {
      title,
      category,
      description,
      quantityAvailable,
      unit,
      condition,
      expiryDate,
      locationName,
      address,
      coordinates,
      availabilityStatus,
      imageUrl,
    } = req.body;

    if (quantityAvailable !== undefined && (typeof quantityAvailable !== 'number' || quantityAvailable < 0)) {
      res.status(400).json({ success: false, message: 'Quantity cannot be negative.' });
      return;
    }

    const prevQty = resource.quantityAvailable;

    if (title && typeof title === 'string') resource.title = title.trim();
    if (category && typeof category === 'string') resource.category = category as any;
    if (description && typeof description === 'string') resource.description = description.trim();
    if (unit && typeof unit === 'string') resource.unit = unit.trim();
    if (condition && ['new', 'good', 'perishable'].includes(condition)) resource.condition = condition;
    if (expiryDate !== undefined) resource.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
    if (locationName && typeof locationName === 'string') resource.locationName = locationName.trim();
    if (address && typeof address === 'string') resource.address = address.trim();
    if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
      resource.coordinates = coordinates;
    }
    if (imageUrl !== undefined) resource.imageUrl = imageUrl;

    if (typeof quantityAvailable === 'number') {
      const diff = quantityAvailable - prevQty;
      resource.quantityAvailable = quantityAvailable;

      // Update availability status automatically based on quantity
      if (quantityAvailable === 0 && resource.quantityReserved === 0) {
        resource.availabilityStatus = 'unavailable';
      } else if (quantityAvailable > 0 && resource.quantityReserved > 0) {
        resource.availabilityStatus = 'partially_available';
      } else if (quantityAvailable > 0 && resource.availabilityStatus === 'unavailable') {
        resource.availabilityStatus = 'available';
      }

      if (diff !== 0) {
        await InventoryTransaction.create({
          resourceId: resource._id,
          performedBy: user._id,
          type: 'stock_adjustment',
          quantityChanged: diff,
          previousQuantity: prevQty,
          newQuantity: quantityAvailable,
          note: `Manual quantity update by ${user.name}`,
        });
      }
    }

    if (availabilityStatus && ['available', 'partially_available', 'reserved', 'unavailable'].includes(availabilityStatus)) {
      resource.availabilityStatus = availabilityStatus as AvailabilityStatus;
    }

    await resource.save();

    await recordAuditLog(req, 'RESOURCE_UPDATED', 'Resource', resource._id.toString(), {
      title: resource.title,
    });

    res.json({
      success: true,
      message: 'Resource updated successfully.',
      data: resource,
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ success: false, message: 'Failed to update resource' });
  }
});

// PATCH /api/v1/resources/:id/availability - Update availability status
router.patch('/:id/availability', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid resource ID format' });
      return;
    }

    const { availabilityStatus } = req.body;
    const validStatuses: AvailabilityStatus[] = ['available', 'partially_available', 'reserved', 'unavailable'];
    if (!availabilityStatus || !validStatuses.includes(availabilityStatus)) {
      res.status(400).json({
        success: false,
        message: `Invalid availability status. Must be one of [${validStatuses.join(', ')}]`,
      });
      return;
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    const user = req.user!;
    const isOwner = resource.providerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'You are not authorized to update this resource' });
      return;
    }

    const previousStatus = resource.availabilityStatus;
    resource.availabilityStatus = availabilityStatus as AvailabilityStatus;
    await resource.save();

    await recordAuditLog(req, 'RESOURCE_AVAILABILITY_CHANGED', 'Resource', resource._id.toString(), {
      previousStatus,
      newStatus: availabilityStatus,
    });

    res.json({
      success: true,
      message: `Resource availability marked as '${availabilityStatus}'.`,
      data: resource,
    });
  } catch (error) {
    console.error('Error updating resource availability:', error);
    res.status(500).json({ success: false, message: 'Failed to update resource availability' });
  }
});

// PATCH /api/v1/resources/:id/quantity - Update available quantity
router.patch('/:id/quantity', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid resource ID format' });
      return;
    }

    const { quantityAvailable } = req.body;
    if (typeof quantityAvailable !== 'number' || quantityAvailable < 0) {
      res.status(400).json({ success: false, message: 'Quantity must be a non-negative number' });
      return;
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    const user = req.user!;
    const isOwner = resource.providerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'You are not authorized to update this resource' });
      return;
    }

    const prevQty = resource.quantityAvailable;
    const diff = quantityAvailable - prevQty;
    resource.quantityAvailable = quantityAvailable;

    if (quantityAvailable === 0 && resource.quantityReserved === 0) {
      resource.availabilityStatus = 'unavailable';
    } else if (quantityAvailable > 0 && resource.quantityReserved > 0) {
      resource.availabilityStatus = 'partially_available';
    } else if (quantityAvailable > 0 && resource.availabilityStatus === 'unavailable') {
      resource.availabilityStatus = 'available';
    }

    await resource.save();

    if (diff !== 0) {
      await InventoryTransaction.create({
        resourceId: resource._id,
        performedBy: user._id,
        type: 'stock_adjustment',
        quantityChanged: diff,
        previousQuantity: prevQty,
        newQuantity: quantityAvailable,
        note: `Direct quantity patch by ${user.name}`,
      });
    }

    await recordAuditLog(req, 'RESOURCE_QUANTITY_UPDATED', 'Resource', resource._id.toString(), {
      previousQuantity: prevQty,
      newQuantity: quantityAvailable,
    });

    res.json({
      success: true,
      message: 'Quantity updated successfully.',
      data: resource,
    });
  } catch (error) {
    console.error('Error updating resource quantity:', error);
    res.status(500).json({ success: false, message: 'Failed to update resource quantity' });
  }
});

// DELETE /api/v1/resources/:id - Delete resource
router.delete('/:id', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid resource ID format' });
      return;
    }

    const user = req.user!;
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    const isOwner = resource.providerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this resource' });
      return;
    }

    // Check if there are active pending or approved requests
    const activeRequests = await ResourceRequest.countDocuments({
      resourceId: resource._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (activeRequests > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete resource with ${activeRequests} active pending or approved request(s). Please fulfill or reject them first.`,
      });
      return;
    }

    await Resource.findByIdAndDelete(resource._id);

    await recordAuditLog(req, 'RESOURCE_DELETED', 'Resource', resource._id.toString(), {
      title: resource.title,
    });

    res.json({
      success: true,
      message: 'Resource deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ success: false, message: 'Failed to delete resource' });
  }
});

export default router;

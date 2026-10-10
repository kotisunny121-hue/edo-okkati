import express, { Response } from 'express';
import { z } from 'zod';
import { Resource } from '../models/Resource.js';
import { ResourceRequest, RequestStatus } from '../models/ResourceRequest.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { Notification } from '../models/Notification.js';
import { VolunteerAssignment } from '../models/VolunteerAssignment.js';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

const requestCreateSchema = z.object({
  resourceId: z.string().min(1),
  requestedQuantity: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(1000),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  destinationAddress: z.string().min(3, 'Destination or delivery address is required'),
  contactPhone: z.string().min(3, 'Contact phone is required'),
});

// GET /api/v1/requests/seeker - Requests submitted by the logged-in seeker
router.get('/seeker', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const requests = await ResourceRequest.find({ seekerId: user._id })
      .populate('resourceId', 'title category unit locationName address coordinates availabilityStatus')
      .populate('providerId', 'name email phone')
      .populate('volunteerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve your requests' });
  }
});

// GET /api/v1/requests/incoming - Requests received by the logged-in provider or org
router.get('/incoming', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const query: Record<string, any> = {};

    if (user.role === 'organization' && user.organizationId) {
      query.$or = [{ providerId: user._id }, { organizationId: user.organizationId }];
    } else if (user.role === 'provider') {
      query.providerId = user._id;
    }

    const requests = await ResourceRequest.find(query)
      .populate('resourceId', 'title category quantityAvailable quantityReserved unit locationName')
      .populate('seekerId', 'name email phone')
      .populate('volunteerId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve incoming requests' });
  }
});

// GET /api/v1/requests/:id - Get request details
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const request = await ResourceRequest.findById(req.params.id)
      .populate('resourceId')
      .populate('seekerId', 'name email phone')
      .populate('providerId', 'name email phone')
      .populate('volunteerId', 'name phone')
      .populate('statusHistory.changedBy', 'name role');

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // RBAC: Can view if seeker, provider, assigned volunteer, or admin
    const isSeeker = request.seekerId._id.toString() === user._id.toString();
    const isProvider = request.providerId._id.toString() === user._id.toString();
    const isVolunteer = request.volunteerId && request.volunteerId._id.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    if (!isSeeker && !isProvider && !isVolunteer && !isAdmin) {
      res.status(403).json({ success: false, message: 'You are not authorized to view this request' });
      return;
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve request details' });
  }
});

// POST /api/v1/requests - Submit a new resource request (Seeker or authorized user)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = requestCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid request parameters',
        errors: parseResult.error.format(),
      });
      return;
    }

    const { resourceId, requestedQuantity, reason, urgency, destinationAddress, contactPhone } = parseResult.data;
    const user = req.user!;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource listing not found' });
      return;
    }

    if (resource.moderationStatus !== 'approved') {
      res.status(400).json({ success: false, message: 'This resource is currently not approved for requests.' });
      return;
    }

    if (resource.availabilityStatus === 'unavailable' || resource.quantityAvailable < requestedQuantity) {
      res.status(400).json({
        success: false,
        message: `Requested quantity (${requestedQuantity}) exceeds available stock (${resource.quantityAvailable} ${resource.unit}).`,
      });
      return;
    }

    // Check for duplicate pending request from same seeker for same resource
    const existingPending = await ResourceRequest.findOne({
      resourceId: resource._id,
      seekerId: user._id,
      status: 'pending',
    });

    if (existingPending) {
      res.status(400).json({
        success: false,
        message: 'You already have an active pending request for this resource. Please wait for provider review.',
      });
      return;
    }

    const newRequest = new ResourceRequest({
      resourceId: resource._id,
      seekerId: user._id,
      providerId: resource.providerId,
      organizationId: resource.organizationId || null,
      requestedQuantity,
      approvedQuantity: 0,
      reason,
      urgency,
      destinationAddress,
      contactPhone,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedBy: user._id,
          note: 'Request created by seeker',
          timestamp: new Date(),
        },
      ],
    });

    await newRequest.save();

    // Create in-app notification for the provider
    await Notification.create({
      recipientId: resource.providerId,
      title: 'New Emergency Resource Request',
      message: `${user.name} requested ${requestedQuantity} ${resource.unit} of "${resource.title}". Urgency: ${urgency.toUpperCase()}.`,
      type: 'request_created',
      link: `/dashboard/provider`,
    });

    await recordAuditLog(
      req,
      'REQUEST_CREATED',
      'ResourceRequest',
      newRequest._id.toString(),
      { resourceId: resource._id, quantity: requestedQuantity, urgency }
    );

    res.status(201).json({
      success: true,
      message: 'Emergency request submitted successfully. The provider has been notified.',
      data: newRequest,
    });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ success: false, message: 'Failed to submit request' });
  }
});

// POST /api/v1/requests/:id/approve - Provider approves request and reserves inventory atomically
router.post('/:id/approve', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const request = await ResourceRequest.findById(req.params.id);

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Cannot approve request with status '${request.status}'.`,
      });
      return;
    }

    const isProvider = request.providerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isProvider && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to approve this request' });
      return;
    }

    const approvedQty = typeof req.body.approvedQuantity === 'number' && req.body.approvedQuantity > 0
      ? req.body.approvedQuantity
      : request.requestedQuantity;

    // ATOMIC RESERVATION UPDATE
    // Deducts quantityAvailable and adds to quantityReserved only if enough quantityAvailable exists!
    const updatedResource = await Resource.findOneAndUpdate(
      {
        _id: request.resourceId,
        quantityAvailable: { $gte: approvedQty },
      },
      {
        $inc: {
          quantityAvailable: -approvedQty,
          quantityReserved: approvedQty,
        },
      },
      { new: true }
    );

    if (!updatedResource) {
      res.status(400).json({
        success: false,
        message: 'Insufficient inventory available. Another request may have reserved these items first.',
      });
      return;
    }

    // Update resource availability status if zero left
    if (updatedResource.quantityAvailable === 0) {
      updatedResource.availabilityStatus = 'reserved';
      await updatedResource.save();
    } else {
      updatedResource.availabilityStatus = 'partially_available';
      await updatedResource.save();
    }

    // Update request state
    request.status = 'approved';
    request.approvedQuantity = approvedQty;
    request.statusHistory.push({
      status: 'approved',
      changedBy: user._id,
      note: req.body.note || `Approved for ${approvedQty} units`,
      timestamp: new Date(),
    });
    await request.save();

    // Log inventory transaction
    await InventoryTransaction.create({
      resourceId: updatedResource._id,
      performedBy: user._id,
      type: 'reserved',
      quantityChanged: approvedQty,
      previousQuantity: updatedResource.quantityAvailable + approvedQty,
      newQuantity: updatedResource.quantityAvailable,
      requestId: request._id,
      note: `Stock reserved for approved request ${request._id}`,
    });

    // Notify seeker
    await Notification.create({
      recipientId: request.seekerId,
      title: 'Resource Request Approved',
      message: `Your request for "${updatedResource.title}" has been approved (${approvedQty} ${updatedResource.unit}). Awaiting collection or handover.`,
      type: 'request_approved',
      link: '/dashboard/seeker',
    });

    await recordAuditLog(
      req,
      'REQUEST_APPROVED',
      'ResourceRequest',
      request._id.toString(),
      { approvedQuantity: approvedQty }
    );

    res.json({
      success: true,
      message: 'Request approved and stock reserved successfully.',
      data: request,
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
});

// POST /api/v1/requests/:id/reject - Provider rejects request
router.post('/:id/reject', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const request = await ResourceRequest.findById(req.params.id);

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Cannot reject request with status '${request.status}'.`,
      });
      return;
    }

    const isProvider = request.providerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isProvider && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to reject this request' });
      return;
    }

    const rejectionReason = req.body.rejectionReason || 'Provider unable to fulfill request at this time.';

    request.status = 'rejected';
    request.rejectionReason = rejectionReason;
    request.statusHistory.push({
      status: 'rejected',
      changedBy: user._id,
      note: rejectionReason,
      timestamp: new Date(),
    });
    await request.save();

    const resource = await Resource.findById(request.resourceId);

    // Notify seeker
    await Notification.create({
      recipientId: request.seekerId,
      title: 'Resource Request Declined',
      message: `Your request for "${resource?.title || 'Emergency Supplies'}" was declined. Reason: ${rejectionReason}`,
      type: 'request_rejected',
      link: '/dashboard/seeker',
    });

    await recordAuditLog(
      req,
      'REQUEST_REJECTED',
      'ResourceRequest',
      request._id.toString(),
      { rejectionReason }
    );

    res.json({
      success: true,
      message: 'Request rejected.',
      data: request,
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
});

// POST /api/v1/requests/:id/cancel - Seeker cancels their request (releases reserved stock if previously approved)
router.post('/:id/cancel', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const request = await ResourceRequest.findById(req.params.id);

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    const isSeeker = request.seekerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isSeeker && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to cancel this request' });
      return;
    }

    if (request.status === 'fulfilled' || request.status === 'cancelled' || request.status === 'rejected') {
      res.status(400).json({
        success: false,
        message: `Cannot cancel request in status '${request.status}'.`,
      });
      return;
    }

    const prevStatus = request.status;

    // If was approved, release the reserved stock back to available!
    if (prevStatus === 'approved' && request.approvedQuantity > 0) {
      const resource = await Resource.findByIdAndUpdate(
        request.resourceId,
        {
          $inc: {
            quantityAvailable: request.approvedQuantity,
            quantityReserved: -request.approvedQuantity,
          },
          $set: { availabilityStatus: 'available' },
        },
        { new: true }
      );

      if (resource) {
        await InventoryTransaction.create({
          resourceId: resource._id,
          performedBy: user._id,
          type: 'released',
          quantityChanged: request.approvedQuantity,
          previousQuantity: resource.quantityAvailable - request.approvedQuantity,
          newQuantity: resource.quantityAvailable,
          requestId: request._id,
          note: `Released reservation due to cancellation by ${user.name}`,
        });
      }
    }

    request.status = 'cancelled';
    request.statusHistory.push({
      status: 'cancelled',
      changedBy: user._id,
      note: req.body.reason || 'Cancelled by user',
      timestamp: new Date(),
    });
    await request.save();

    // Notify provider
    const resource = await Resource.findById(request.resourceId);
    await Notification.create({
      recipientId: request.providerId,
      title: 'Resource Request Cancelled',
      message: `${user.name} cancelled their request for "${resource?.title || 'Resource'}". Reserved stock has been released.`,
      type: 'request_cancelled',
      link: '/dashboard/provider',
    });

    await recordAuditLog(
      req,
      'REQUEST_CANCELLED',
      'ResourceRequest',
      request._id.toString(),
      { previousStatus: prevStatus }
    );

    res.json({
      success: true,
      message: 'Request cancelled and stock reservation released.',
      data: request,
    });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel request' });
  }
});

// POST /api/v1/requests/:id/fulfill - Provider or Volunteer completes handover/distribution
router.post('/:id/fulfill', authenticate, authorizeRoles('provider', 'organization', 'volunteer', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const request = await ResourceRequest.findById(req.params.id);

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (request.status !== 'approved') {
      res.status(400).json({
        success: false,
        message: `Only approved requests can be fulfilled. Current status: '${request.status}'.`,
      });
      return;
    }

    const isProvider = request.providerId.toString() === user._id.toString();
    const isAssignedVolunteer = request.volunteerId && request.volunteerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    if (!isProvider && !isAssignedVolunteer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to mark this request as fulfilled' });
      return;
    }

    // ATOMIC FULFILLMENT: decrement quantityReserved by approvedQuantity
    const resource = await Resource.findByIdAndUpdate(
      request.resourceId,
      {
        $inc: { quantityReserved: -request.approvedQuantity },
      },
      { new: true }
    );

    if (resource) {
      // If no available and no reserved left, mark unavailable
      if (resource.quantityAvailable === 0 && resource.quantityReserved === 0) {
        resource.availabilityStatus = 'unavailable';
        await resource.save();
      }

      await InventoryTransaction.create({
        resourceId: resource._id,
        performedBy: user._id,
        type: 'fulfilled',
        quantityChanged: request.approvedQuantity,
        previousQuantity: resource.quantityAvailable,
        newQuantity: resource.quantityAvailable,
        requestId: request._id,
        note: `Fulfillment confirmed by ${user.name} (${user.role})`,
      });
    }

    request.status = 'fulfilled';
    request.statusHistory.push({
      status: 'fulfilled',
      changedBy: user._id,
      note: req.body.note || 'Handover and distribution confirmed',
      timestamp: new Date(),
    });
    await request.save();

    // If there is an associated volunteer assignment, complete it as well
    await VolunteerAssignment.updateMany(
      { requestId: request._id, status: { $ne: 'delivered' } },
      { $set: { status: 'delivered', deliveredAt: new Date(), deliveryNotes: 'Marked fulfilled in distribution flow' } }
    );

    // Notify seeker
    await Notification.create({
      recipientId: request.seekerId,
      title: 'Supplies Distributed & Fulfilled',
      message: `Your emergency request for "${resource?.title || 'Supplies'}" (${request.approvedQuantity} ${resource?.unit}) has been successfully fulfilled.`,
      type: 'request_fulfilled',
      link: '/dashboard/seeker',
    });

    await recordAuditLog(
      req,
      'REQUEST_FULFILLED',
      'ResourceRequest',
      request._id.toString(),
      { quantityFulfilled: request.approvedQuantity }
    );

    res.json({
      success: true,
      message: 'Request fulfilled and inventory updated.',
      data: request,
    });
  } catch (error) {
    console.error('Error fulfilling request:', error);
    res.status(500).json({ success: false, message: 'Failed to mark request fulfilled' });
  }
});

// POST /api/v1/requests/:id/assign-volunteer - Assign volunteer to approved request
router.post('/:id/assign-volunteer', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { volunteerId, collectionNotes } = req.body;

    const request = await ResourceRequest.findById(req.params.id).populate('resourceId');
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (request.status !== 'approved') {
      res.status(400).json({ success: false, message: 'Can only assign volunteers to approved requests' });
      return;
    }

    request.volunteerId = volunteerId;
    await request.save();

    const resource = request.resourceId as any;

    const assignment = await VolunteerAssignment.create({
      requestId: request._id,
      volunteerId,
      assignedBy: user._id,
      status: 'assigned',
      collectionLocation: resource?.address || resource?.locationName || 'Distribution Depot',
      dropoffLocation: request.destinationAddress,
      collectionNotes: collectionNotes || 'Coordinate collection with provider',
    });

    // Notify the volunteer
    await Notification.create({
      recipientId: volunteerId,
      title: 'New Distribution Assignment',
      message: `You have been assigned to deliver "${resource?.title}" (${request.approvedQuantity} ${resource?.unit}) to ${request.destinationAddress}.`,
      type: 'system',
      link: '/dashboard/volunteer',
    });

    res.json({
      success: true,
      message: 'Volunteer assigned successfully',
      data: assignment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to assign volunteer' });
  }
});

export default router;

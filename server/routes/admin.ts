import express, { Response } from 'express';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { ResourceRequest } from '../models/ResourceRequest.js';
import { Organization } from '../models/Organization.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

// Apply auth and admin check to all admin routes
router.use(authenticate, authorizeRoles('admin', 'super_admin'));

// GET /api/v1/admin/stats - System-wide operational analytics
router.get('/stats', async (_req, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalResources,
      availableResources,
      unavailableResources,
      pendingResources,
      totalRequests,
      pendingRequests,
      fulfilledRequests,
      pendingOrgs,
      verifiedOrgs,
      recentResources,
    ] = await Promise.all([
      User.countDocuments(),
      Resource.countDocuments(),
      Resource.countDocuments({
        $or: [{ availabilityStatus: 'available' }, { availabilityStatus: 'partially_available' }],
      }),
      Resource.countDocuments({
        $or: [{ availabilityStatus: 'unavailable' }, { availabilityStatus: 'reserved' }, { quantityAvailable: 0 }],
      }),
      Resource.countDocuments({ moderationStatus: 'pending' }),
      ResourceRequest.countDocuments(),
      ResourceRequest.countDocuments({ status: 'pending' }),
      ResourceRequest.countDocuments({ status: 'fulfilled' }),
      Organization.countDocuments({ status: 'pending' }),
      Organization.countDocuments({ status: 'verified' }),
      Resource.find()
        .populate('providerId', 'name email phone')
        .sort({ updatedAt: -1 })
        .limit(6),
    ]);

    // Aggregate category distribution
    const categoryStats = await Resource.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalQty: { $sum: '$quantityAvailable' } } },
    ]);

    // Calculate total available quantity across all resources
    const totalAvailableQuantity = categoryStats.reduce((sum, c) => sum + (c.totalQty || 0), 0);

    // Aggregate resources grouped by location
    const locationStats = await Resource.aggregate([
      { $group: { _id: '$locationName', count: { $sum: 1 }, totalQty: { $sum: '$quantityAvailable' } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Aggregate request status distribution
    const requestStatusStats = await ResourceRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // User role distribution
    const userRoleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalResources,
          availableResources,
          unavailableResources,
          totalAvailableQuantity,
          pendingResources,
          totalRequests,
          pendingRequests,
          fulfilledRequests,
          pendingOrgs,
          verifiedOrgs,
        },
        categoryStats,
        locationStats,
        requestStatusStats,
        userRoleStats,
        recentResources,
      },
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve platform stats' });
  }
});

// GET /api/v1/admin/users - User management table
router.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;
    const query: Record<string, any> = {};

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .populate('organizationId', 'name status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
});

// PATCH /api/v1/admin/users/:id/status - Suspend or reactivate user
router.patch('/users/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const targetUserId = req.params.id;

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be active or suspended' });
      return;
    }

    if (targetUserId === req.user!._id.toString()) {
      res.status(400).json({ success: false, message: 'You cannot suspend your own account' });
      return;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (targetUser.role === 'super_admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Only Super Administrators can modify Super Admin accounts' });
      return;
    }

    targetUser.status = status;
    await targetUser.save();

    await recordAuditLog(req, 'USER_STATUS_CHANGE', 'User', targetUser._id.toString(), {
      email: targetUser.email,
      newStatus: status,
    });

    res.json({
      success: true,
      message: `User status changed to ${status}`,
      data: targetUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

// GET /api/v1/admin/moderation/resources - Listings requiring moderation
router.get('/moderation/resources', async (_req, res: Response): Promise<void> => {
  try {
    const resources = await Resource.find({ moderationStatus: { $in: ['pending', 'suspended'] } })
      .populate('providerId', 'name email phone')
      .populate('organizationId', 'name status')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch moderation queue' });
  }
});

// PATCH /api/v1/admin/moderation/resources/:id - Moderate resource listing
router.patch('/moderation/resources/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid moderation status' });
      return;
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    resource.moderationStatus = status;
    await resource.save();

    await recordAuditLog(req, 'RESOURCE_MODERATED', 'Resource', resource._id.toString(), {
      title: resource.title,
      moderationStatus: status,
    });

    res.json({
      success: true,
      message: `Resource marked as ${status}`,
      data: resource,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update resource moderation' });
  }
});

// GET /api/v1/admin/organizations/queue - Organizations waiting for verification
router.get('/organizations/queue', async (_req, res: Response): Promise<void> => {
  try {
    const organizations = await Organization.find({ status: 'pending' })
      .populate('createdBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: organizations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch org queue' });
  }
});

// PATCH /api/v1/admin/organizations/:id/verify - Verify or reject NGO
router.patch('/organizations/:id/verify', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, notes } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be verified or rejected' });
      return;
    }

    const org = await Organization.findById(req.params.id);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    org.status = status;
    org.verificationNotes = notes || '';
    org.verifiedBy = req.user!._id;
    org.verifiedAt = new Date();
    await org.save();

    await recordAuditLog(req, 'ORG_VERIFICATION_REVIEW', 'Organization', org._id.toString(), {
      status,
      notes,
    });

    res.json({
      success: true,
      message: `Organization has been ${status}`,
      data: org,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify organization' });
  }
});

// GET /api/v1/admin/audit-logs - Real system audit logs
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

export default router;

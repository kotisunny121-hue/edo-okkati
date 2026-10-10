import express, { Response } from 'express';
import { z } from 'zod';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { ResourceRequest } from '../models/ResourceRequest.js';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

const orgSchema = z.object({
  name: z.string().min(2).max(150),
  registrationNumber: z.string().optional().default(''),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(3),
  address: z.string().min(5),
  verificationNotes: z.string().optional().default(''),
});

// GET /api/v1/organizations - List verified organizations
router.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const orgs = await Organization.find({ status: 'verified' })
      .select('-__v')
      .sort({ name: 1 });
    res.json({ success: true, data: orgs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch organizations' });
  }
});

// GET /api/v1/organizations/my - Get current user's organization profile & stats
router.get('/my', authenticate, authorizeRoles('organization', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let org = null;

    if (user.organizationId) {
      org = await Organization.findById(user.organizationId);
    } else {
      org = await Organization.findOne({ createdBy: user._id });
    }

    if (!org) {
      res.status(404).json({ success: false, message: 'No organization linked to this account' });
      return;
    }

    // Members
    const members = await User.find({ organizationId: org._id }).select('name email role status createdAt');

    // Resources
    const resources = await Resource.find({ organizationId: org._id });

    // Requests
    const resourceIds = resources.map((r) => r._id);
    const incomingRequests = await ResourceRequest.find({ resourceId: { $in: resourceIds } })
      .populate('resourceId', 'title category unit')
      .populate('seekerId', 'name email phone')
      .sort({ createdAt: -1 });

    const totalStockAvailable = resources.reduce((sum, r) => sum + r.quantityAvailable, 0);
    const totalStockReserved = resources.reduce((sum, r) => sum + r.quantityReserved, 0);
    const fulfilledCount = incomingRequests.filter((r) => r.status === 'fulfilled').length;

    res.json({
      success: true,
      data: {
        organization: org,
        members,
        resources,
        requests: incomingRequests,
        stats: {
          totalListings: resources.length,
          totalStockAvailable,
          totalStockReserved,
          pendingRequests: incomingRequests.filter((r) => r.status === 'pending').length,
          fulfilledRequests: fulfilledCount,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching my organization:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch organization dashboard' });
  }
});

// POST /api/v1/organizations - Create or update organization
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = orgSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Validation error',
      });
      return;
    }

    const user = req.user!;
    const data = parseResult.data;

    const existing = await Organization.findOne({ createdBy: user._id });
    if (existing) {
      existing.name = data.name;
      existing.registrationNumber = data.registrationNumber;
      existing.contactEmail = data.contactEmail;
      existing.contactPhone = data.contactPhone;
      existing.address = data.address;
      existing.verificationNotes = data.verificationNotes;
      await existing.save();

      res.json({ success: true, message: 'Organization updated', data: existing });
      return;
    }

    const org = await Organization.create({
      ...data,
      status: 'pending',
      createdBy: user._id,
    });

    user.organizationId = org._id as any;
    if (user.role === 'seeker' || user.role === 'provider') {
      user.role = 'organization';
    }
    await user.save();

    await recordAuditLog(req, 'ORG_CREATED', 'Organization', org._id.toString(), { name: org.name });

    res.status(201).json({
      success: true,
      message: 'Organization registered. Pending administrator verification.',
      data: org,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register organization' });
  }
});

export default router;

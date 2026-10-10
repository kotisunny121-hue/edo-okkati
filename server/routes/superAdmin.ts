import express, { Response } from 'express';
import { User, UserRole } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

router.use(authenticate, authorizeRoles('super_admin'));

// GET /api/v1/super-admin/admins - List administrative users
router.get('/admins', async (_req, res: Response): Promise<void> => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('-passwordHash')
      .sort({ role: -1, createdAt: 1 });
    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve administrative users' });
  }
});

// PATCH /api/v1/super-admin/users/:id/role - Assign or change user role
router.patch('/users/:id/role', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    const allowedRoles: UserRole[] = ['seeker', 'provider', 'organization', 'volunteer', 'admin', 'super_admin'];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role specified' });
      return;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Safety check: Prevent removing the last super_admin
    if (user.role === 'super_admin' && role !== 'super_admin') {
      const superAdminCount = await User.countDocuments({ role: 'super_admin', status: 'active' });
      if (superAdminCount <= 1) {
        res.status(400).json({
          success: false,
          message: 'Cannot demote the platform super-administrator. At least one active super-admin is required.',
        });
        return;
      }
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await recordAuditLog(req, 'PRIVILEGE_ROLE_CHANGED', 'User', user._id.toString(), {
      email: user.email,
      oldRole,
      newRole: role,
    });

    res.json({
      success: true,
      message: `Role for ${user.email} updated from ${oldRole} to ${role}`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
});

// GET /api/v1/super-admin/privileged-logs - High security audit actions
router.get('/privileged-logs', async (_req, res: Response): Promise<void> => {
  try {
    const logs = await AuditLog.find({
      action: { $in: ['PRIVILEGE_ROLE_CHANGED', 'USER_STATUS_CHANGE', 'ORG_VERIFICATION_REVIEW'] },
    })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve privileged logs' });
  }
});

export default router;

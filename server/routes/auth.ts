import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, UserRole } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { authenticate, generateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional().default(''),
  role: z.enum(['seeker', 'provider', 'organization', 'volunteer']),
  organizationName: z.string().optional(),
  organizationAddress: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Set cookie helper
function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/v1/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Validation error',
        errors: parseResult.error.format(),
      });
      return;
    }

    const { name, email, password, phone, role, organizationName, organizationAddress } = parseResult.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      phone,
      role: role as UserRole,
      status: 'active',
    });

    await newUser.save();

    // If registering as organization, register pending organization
    if (role === 'organization' && organizationName) {
      const org = await Organization.create({
        name: organizationName,
        contactEmail: email,
        contactPhone: phone || 'Pending phone',
        address: organizationAddress || 'Disaster Relief Station',
        status: 'pending',
        createdBy: newUser._id,
      });
      newUser.organizationId = org._id as any;
      await newUser.save();
    }

    const token = generateToken(newUser);
    setAuthCookie(res, token);

    await recordAuditLog(
      { user: newUser } as any,
      'USER_REGISTERED',
      'User',
      newUser._id.toString(),
      { email, role }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        organizationId: newUser.organizationId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An internal error occurred during registration.',
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Validation error',
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'This account has been suspended by an administrator. Please contact emergency platform management.',
      });
      return;
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    await recordAuditLog(
      { user } as any,
      'USER_LOGIN',
      'User',
      user._id.toString(),
      { email: user.email, role: user.role }
    );

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
});

// POST /api/v1/auth/quick-login
// Allows 1-click test login for testing any role easily in evaluation
router.post('/quick-login', async (req, res): Promise<void> => {
  try {
    const { role } = req.body;
    const allowedRoles = ['provider', 'seeker', 'organization', 'volunteer', 'admin', 'super_admin'];
    if (!role || !allowedRoles.includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid quick login role requested' });
      return;
    }

    const user = await User.findOne({ role, status: 'active' });
    if (!user) {
      res.status(404).json({ success: false, message: `No demo account found for role ${role}` });
      return;
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: `Quick logged in as ${user.role}`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Quick login failed' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res): Promise<void> => {
  res.clearCookie('token');
  if (req.user) {
    await recordAuditLog(req, 'USER_LOGOUT', 'User', req.user._id.toString());
  }
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const user = req.user!;
    let organization = null;
    if (user.organizationId) {
      organization = await Organization.findById(user.organizationId);
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
        organization,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

// PUT /api/v1/auth/profile
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const user = req.user!;

    if (name && typeof name === 'string') user.name = name.trim();
    if (typeof phone === 'string') user.phone = phone.trim();

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// PUT /api/v1/auth/change-password
router.put('/change-password', authenticate, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password (min 6 chars) are required.',
      });
      return;
    }

    const user = await User.findById(req.user!._id).select('+passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password does not match.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await recordAuditLog(req, 'PASSWORD_CHANGED', 'User', user._id.toString());

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

export default router;

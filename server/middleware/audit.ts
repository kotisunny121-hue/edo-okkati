import { AuthenticatedRequest } from './auth.js';
import { AuditLog } from '../models/AuditLog.js';

export async function recordAuditLog(
  req: AuthenticatedRequest,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    await AuditLog.create({
      userId: req.user?._id || undefined,
      userEmail: req.user?.email || '',
      role: req.user?.role || 'guest',
      action,
      resourceType,
      resourceId: resourceId || '',
      details: details || {},
      ip,
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

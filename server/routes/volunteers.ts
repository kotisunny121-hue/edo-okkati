import express, { Response } from 'express';
import { VolunteerAssignment, AssignmentStatus } from '../models/VolunteerAssignment.js';
import { ResourceRequest } from '../models/ResourceRequest.js';
import { Resource } from '../models/Resource.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const router = express.Router();

// GET /api/v1/volunteers/assignments - Volunteer's own tasks
router.get('/assignments', authenticate, authorizeRoles('volunteer', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const filter = user.role === 'admin' || user.role === 'super_admin' ? {} : { volunteerId: user._id };

    const assignments = await VolunteerAssignment.find(filter)
      .populate({
        path: 'requestId',
        populate: [
          { path: 'resourceId', select: 'title category unit coordinates locationName address' },
          { path: 'seekerId', select: 'name phone' },
          { path: 'providerId', select: 'name phone' },
        ],
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve volunteer assignments' });
  }
});

// GET /api/v1/volunteers/list - List all active volunteers (for providers/NGOs to assign tasks)
router.get('/list', authenticate, authorizeRoles('provider', 'organization', 'admin', 'super_admin'), async (_req, res: Response): Promise<void> => {
  try {
    const volunteers = await User.find({ role: 'volunteer', status: 'active' }).select('name email phone');
    res.json({ success: true, data: volunteers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve volunteer list' });
  }
});

// PATCH /api/v1/volunteers/assignments/:id/status - Update assignment status
router.patch('/assignments/:id/status', authenticate, authorizeRoles('volunteer', 'admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, notes, failureReason } = req.body;

    const assignment = await VolunteerAssignment.findById(req.params.id).populate('requestId');
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    const isAssignedVolunteer = assignment.volunteerId.toString() === user._id.toString();
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isAssignedVolunteer && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to update this assignment' });
      return;
    }

    if (!['assigned', 'collected', 'delivered', 'failed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    assignment.status = status as AssignmentStatus;

    if (status === 'collected') {
      assignment.collectedAt = new Date();
      if (notes) assignment.collectionNotes = notes;
    } else if (status === 'delivered') {
      assignment.deliveredAt = new Date();
      if (notes) assignment.deliveryNotes = notes;

      // When delivery confirmed by volunteer, fulfill the underlying request!
      const request = await ResourceRequest.findById(assignment.requestId);
      if (request && request.status === 'approved') {
        const resource = await Resource.findByIdAndUpdate(
          request.resourceId,
          { $inc: { quantityReserved: -request.approvedQuantity } },
          { new: true }
        );

        if (resource) {
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
            note: `Delivery completed by volunteer ${user.name}`,
          });
        }

        request.status = 'fulfilled';
        request.statusHistory.push({
          status: 'fulfilled',
          changedBy: user._id,
          note: notes || 'Delivery completed by volunteer',
          timestamp: new Date(),
        });
        await request.save();

        // Notify seeker
        await Notification.create({
          recipientId: request.seekerId,
          title: 'Delivery Handover Completed',
          message: `Your emergency supplies have been delivered by coordinator ${user.name}.`,
          type: 'request_fulfilled',
          link: '/dashboard/seeker',
        });
      }
    } else if (status === 'failed') {
      assignment.failureReason = failureReason || notes || 'Distribution could not be completed';
    }

    await assignment.save();

    await recordAuditLog(req, 'ASSIGNMENT_STATUS_UPDATED', 'VolunteerAssignment', assignment._id.toString(), {
      newStatus: status,
    });

    res.json({
      success: true,
      message: `Assignment updated to ${status}`,
      data: assignment,
    });
  } catch (err) {
    console.error('Error updating assignment status:', err);
    res.status(500).json({ success: false, message: 'Failed to update assignment' });
  }
});

export default router;

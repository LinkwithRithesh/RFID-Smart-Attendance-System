const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');
const { getEffectiveRole } = require('../utils/roleMapper');
const notificationService = require('../services/notification.service');

const router = express.Router();
router.use(authenticate);

// List OD requests (students see own; faculty/admin see all/department)
router.get('/', async (req, res, next) => {
  try {
    const effectiveRole = getEffectiveRole(req.user.role);
    const where = {};
    if (effectiveRole === 'STUDENT') {
      where.userId = req.user.id;
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          include: {
            studentProfile: true,
            department: true,
          },
        },
        approver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = requests.map((r) => ({
      id: `OD-${r.id}`,
      studentId: r.userId,
      studentRoll: r.user.studentProfile?.rollNumber || r.user.email.split('@')[0],
      studentName: r.user.fullName,
      department: r.user.department?.name || 'Computer Science & Engineering',
      date: r.fromDate.toISOString().split('T')[0],
      endDate: r.toDate.toISOString().split('T')[0],
      category: r.category || 'Symposium',
      subject: r.subject || 'General Academic OD',
      reason: r.reason || 'Attending Academic Event',
      documentName: r.documentPath || 'OD_Approval_Form.pdf',
      status: r.status === 'PENDING' ? 'SUBMITTED' : r.status,
      facultyReviewer: r.approver?.fullName,
      submittedAt: r.createdAt.toISOString(),
    }));

    return success(res, 200, 'OD requests retrieved', data);
  } catch (err) {
    next(err);
  }
});

// Submit new OD/Leave Request
router.post('/', async (req, res, next) => {
  try {
    const { fromDate, toDate, reason, subject, category, documentPath } = req.body;
    const leave = await prisma.leaveRequest.create({
      data: {
        userId: req.user.id,
        fromDate: fromDate ? new Date(fromDate) : new Date(),
        toDate: toDate ? new Date(toDate) : new Date(),
        reason: reason || subject || 'Academic On-Duty Request',
        category: category || 'Symposium',
        subject: subject || 'General Academic OD',
        documentPath: documentPath || null,
        status: 'PENDING',
      },
    });

    return success(res, 201, 'OD Request submitted successfully', {
      id: `OD-${leave.id}`,
      status: 'SUBMITTED',
      submittedAt: leave.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Role-Gated Status Transition:
// - FACULTY_APPROVED requires effectiveRole = FACULTY
// - APPROVED or REJECTED requires effectiveRole = ADMIN
router.patch('/:id/status', async (req, res, next) => {
  try {
    const rawId = req.params.id.replace(/^OD-/, '');
    const id = Number(rawId);
    const { status, reason } = req.body;
    const effectiveRole = getEffectiveRole(req.user.role);

    if (status === 'FACULTY_APPROVED') {
      if (effectiveRole !== 'FACULTY' && effectiveRole !== 'ADMIN') {
        throw new ApiError(403, 'Only Faculty members or Administrators can provide first-level OD endorsement');
      }
    } else if (status === 'APPROVED' || status === 'REJECTED') {
      if (effectiveRole !== 'ADMIN') {
        throw new ApiError(403, 'Only Administrators/HOD can grant final OD approval or rejection');
      }
    } else {
      throw new ApiError(400, `Invalid OD status transition: ${status}`);
    }

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new ApiError(404, 'OD Request not found');

    const updateData = {
      status: status === 'FACULTY_APPROVED' ? 'FACULTY_APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
      approvedBy: req.user.id,
      decidedAt: new Date(),
    };

    if (status === 'FACULTY_APPROVED') {
      updateData.facultyApprovedBy = req.user.id;
      updateData.facultyApprovedAt = new Date();
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: updateData,
    });

    // Notification Trigger
    await notificationService.notifyUser(
      leave.userId,
      'GENERAL',
      `OD Request ${status.replace('_', ' ')}`,
      `Your On-Duty application has transitioned to ${status}. ${reason ? `Note: "${reason}"` : ''}`
    );

    return success(res, 200, `OD Request status updated to ${status}`, {
      id: `OD-${updated.id}`,
      status,
      reviewer: req.user.fullName,
    });
  } catch (err) {
    next(err);
  }
});

// Delete OD Request
router.delete('/:id', async (req, res, next) => {
  try {
    const rawId = req.params.id.replace(/^OD-/, '');
    const id = Number(rawId);
    
    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new ApiError(404, 'OD Request not found');

    const effectiveRole = getEffectiveRole(req.user.role);
    // Students can delete their own; Admins can delete any.
    if (effectiveRole !== 'ADMIN' && leave.userId !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to delete this OD request');
    }

    await prisma.leaveRequest.delete({ where: { id } });

    return success(res, 200, 'OD Request deleted successfully');
  } catch (err) {
    next(err);
  }
});

module.exports = router;


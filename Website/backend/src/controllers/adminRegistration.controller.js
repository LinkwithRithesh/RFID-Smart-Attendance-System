const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const auditLogRepository = require('../repositories/auditLog.repository');
const { success } = require('../utils/apiResponse');

async function getPendingRegistrations(req, res, next) {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      include: {
        role: true,
        department: true,
        studentProfile: { include: { course: true } },
        facultyProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = pendingUsers.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role.name,
      department: u.department ? u.department.name : 'N/A',
      registrationId: u.studentProfile?.rollNumber || u.facultyProfile?.employeeId || `USER-${u.id}`,
      submittedAt: u.createdAt,
      status: u.status,
      details: {
        rfidCardId: u.rfidCardId || null,
        courseName: u.studentProfile?.course?.name || null,
        currentSemester: u.studentProfile?.currentSemester || null,
        admissionYear: u.studentProfile?.admissionYear || null,
        designation: u.facultyProfile?.designation || null,
      },
    }));

    return success(res, 200, 'Pending registrations retrieved', formatted);
  } catch (err) {
    next(err);
  }
}

async function getPendingRegistrationById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
        studentProfile: { include: { course: true } },
        facultyProfile: true,
      },
    });

    if (!user || user.status !== 'PENDING') {
      throw new ApiError(404, 'Pending registration not found');
    }

    const registrationId = user.studentProfile?.rollNumber || user.facultyProfile?.employeeId || `USER-${user.id}`;

    return success(res, 200, 'Registration detail retrieved', {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      department: user.department ? user.department.name : 'N/A',
      departmentId: user.departmentId,
      registrationId,
      submittedAt: user.createdAt,
      status: user.status,
      rfidCardId: user.rfidCardId || null,
      studentProfile: user.studentProfile ? {
        rollNumber: user.studentProfile.rollNumber,
        courseId: user.studentProfile.courseId,
        courseName: user.studentProfile.course?.name,
        currentSemester: user.studentProfile.currentSemester,
        admissionYear: user.studentProfile.admissionYear,
      } : null,
      facultyProfile: user.facultyProfile ? {
        employeeId: user.facultyProfile.employeeId,
        designation: user.facultyProfile.designation,
      } : null,
    });
  } catch (err) {
    next(err);
  }
}

async function approveRegistration(req, res, next) {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.status !== 'PENDING') {
      throw new ApiError(404, 'Pending registration not found');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: 'APPROVED',
        isActive: true,
        rejectionReason: null,
      },
      include: { role: true },
    });

    await auditLogRepository.log({
      actorId: req.user.id,
      action: 'REGISTRATION_APPROVED',
      entityType: 'User',
      entityId: id,
      ipAddress: req.ip,
    });

    return success(res, 200, 'Registration approved successfully', {
      id: updated.id,
      status: updated.status,
    });
  } catch (err) {
    next(err);
  }
}

async function rejectRegistration(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body || {};
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.status !== 'PENDING') {
      throw new ApiError(404, 'Pending registration not found');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: 'REJECTED',
        isActive: false,
        rejectionReason: reason || null,
      },
      include: { role: true },
    });

    await auditLogRepository.log({
      actorId: req.user.id,
      action: 'REGISTRATION_REJECTED',
      entityType: 'User',
      entityId: id,
      metadata: { reason },
      ipAddress: req.ip,
    });

    return success(res, 200, 'Registration rejected successfully', {
      id: updated.id,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPendingRegistrations,
  getPendingRegistrationById,
  approveRegistration,
  rejectRegistration,
};

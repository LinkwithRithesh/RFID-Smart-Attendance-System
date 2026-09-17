const emailService = require('../services/email.service');
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
      registrationId: u.studentProfile?.enrollmentNumber || u.facultyProfile?.employeeId || `USER-${u.id}`,
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

    const registrationId = user.studentProfile?.enrollmentNumber || user.facultyProfile?.employeeId || `USER-${user.id}`;

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
    const { rfidCardId, rollNumber, employeeId, designation } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { id },
      include: { role: true, studentProfile: true, facultyProfile: true }
    });

    if (!user || user.status !== 'PENDING') {
      throw new ApiError(404, 'Pending registration not found');
    }

    const roleName = user.role.name.toUpperCase();
    let updatedProfileData = {};
    let initialPasswordSource = '';

    if (roleName === 'STUDENT') {
      if (!rollNumber) throw new ApiError(400, 'Roll Number is required to approve a student.');
      if (!rfidCardId) throw new ApiError(400, 'RFID ID is required to approve a student.');
      
      const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber: rollNumber } });
      if (existingRoll && existingRoll.userId !== id) throw new ApiError(409, 'Roll Number already exists.');
      
      const existingRfid = await prisma.user.findUnique({ where: { rfidCardId: rfidCardId } });
      if (existingRfid && existingRfid.id !== id) throw new ApiError(409, 'RFID Card ID already exists.');

      initialPasswordSource = rollNumber.toString();
      updatedProfileData = {
        studentProfile: {
          update: {
            rollNumber: rollNumber
          }
        }
      };
    } else if (roleName === 'FACULTY') {
      if (!employeeId) throw new ApiError(400, 'Employee ID is required to approve a faculty member.');
      if (!designation) throw new ApiError(400, 'Designation is required to approve a faculty member.');
      
      const existingEmp = await prisma.facultyProfile.findUnique({ where: { employeeId: employeeId } });
      if (existingEmp && existingEmp.userId !== id) throw new ApiError(409, 'Employee ID already exists.');

      // Check RFID if provided
      if (rfidCardId) {
          const existingRfid = await prisma.user.findUnique({ where: { rfidCardId: rfidCardId } });
          if (existingRfid && existingRfid.id !== id) throw new ApiError(409, 'RFID Card ID already exists.');
      }

      initialPasswordSource = employeeId.toString();
      updatedProfileData = {
        facultyProfile: {
          update: {
            employeeId: employeeId,
            designation: designation
          }
        }
      };
    } else {
        // other roles if any
    }

    let passwordHash = user.passwordHash;
    if (initialPasswordSource && initialPasswordSource.length >= 4) {
      const lastFour = initialPasswordSource.slice(-4);
      const bcrypt = require('bcrypt');
      passwordHash = await bcrypt.hash(lastFour, 10);
    } else if (initialPasswordSource) {
      const bcrypt = require('bcrypt');
      passwordHash = await bcrypt.hash(initialPasswordSource, 10);
    }

    const assignedEmail = roleName === 'STUDENT' ? `${rollNumber}@student.annauniv.edu` : `${employeeId}@faculty.annauniv.edu`;
    const updateData = {
      status: 'APPROVED',
      isActive: true,
      rejectionReason: null,
      passwordHash: passwordHash,
      email: assignedEmail,
      ...updatedProfileData
    };

    if (rfidCardId) {
        updateData.rfidCardId = rfidCardId;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    if (rfidCardId && user.faceEmbeddingPath) {
      const fs = require('fs');
      const path = require('path');
      
      const sourcePath = path.join(__dirname, '..', '..', user.faceEmbeddingPath);
      const targetDir = path.join(__dirname, '..', '..', '..', 'face-recognition', 'faces', rfidCardId);
      const targetPath = path.join(targetDir, 'face.jpg');

      if (fs.existsSync(sourcePath)) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, targetPath);
        // Update the user's faceEmbeddingPath to point to the new location (optional, or just leave it)
        // We'll also remove the temp file
        fs.unlinkSync(sourcePath);
        
        await prisma.user.update({
          where: { id },
          data: { faceEmbeddingPath: `face-recognition/faces/${rfidCardId}/face.jpg` }
        });
      }
    }

    await auditLogRepository.log({
      actorId: req.user.id,
      action: 'REGISTRATION_APPROVED',
      entityType: 'User',
      entityId: id,
      ipAddress: req.ip,
    });

    
    const emailTarget = updated.personalEmail || user.personalEmail || user.email;
    if (emailTarget) {
      const actualId = roleName === 'STUDENT' ? rollNumber : employeeId;
      const passText = (actualId && actualId.toString().length >= 4) ? actualId.toString().slice(-4) : actualId;
      
      const emailText = `Dear ${updated.fullName},

Congratulations! You have been successfully approved and selected as a ${roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()} in our institution. We are incredibly proud to welcome you to the Smart Campus!

Your official account has been provisioned. Below are your login credentials:

Login ID / Official Email: ${updated.email}
Assigned ${roleName === 'STUDENT' ? 'Enrollment Number' : 'Employee ID'}: ${actualId}
Password: ${passText}

Please log in to the SmartAttend portal using the credentials above. We highly recommend changing your password upon your first login.

Welcome aboard!
SmartAttend Admin Team`;

      await emailService.sendEmail({
        to: emailTarget,
        subject: `Application Approved - Welcome to SmartAttend!`,
        text: emailText
      });
    }

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

const express = require('express');
const authenticate = require('../middleware/authenticate');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');
const { getEffectiveRole } = require('../utils/roleMapper');

const router = express.Router();
router.use(authenticate);

// List tickets
router.get('/', async (req, res, next) => {
  try {
    const effectiveRole = getEffectiveRole(req.user.role);
    const where = {};
    if (effectiveRole === 'STUDENT') {
      where.userId = req.user.id;
    }

    const tickets = await prisma.helpDeskTicket.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, role: { select: { name: true } } },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, fullName: true, role: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tickets.map((t) => ({
      id: t.ticketCode || `HD-${t.id}`,
      dbId: t.id,
      creatorId: String(t.userId),
      creatorName: t.user?.fullName || 'Unknown',
      creatorRole: getEffectiveRole(t.user?.role?.name || 'STUDENT'),
      category: t.category,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      assignedTo: t.assignedTo ? String(t.assignedTo) : 'Support Desk',
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      messages: t.messages.map((m) => ({
        id: `MSG-${m.id}`,
        senderName: m.sender?.fullName || 'System',
        senderRole: getEffectiveRole(m.sender?.role?.name || 'USER'),
        message: m.content,
        timestamp: m.createdAt.toISOString(),
      })),
    }));

    return success(res, 200, 'Help Desk tickets retrieved', formatted);
  } catch (err) {
    next(err);
  }
});

// Create ticket
router.post('/', async (req, res, next) => {
  try {
    const { category, subject, priority, initialMessage, message } = req.body;
    const code = `HD-${Math.floor(1000 + Math.random() * 9000)}`;
    const msgContent = initialMessage || message || subject || 'Request initiated.';

    const ticket = await prisma.helpDeskTicket.create({
      data: {
        ticketCode: code,
        userId: req.user.id,
        category: category || 'Attendance Correction',
        subject: subject || 'General Query',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        messages: {
          create: {
            senderId: req.user.id,
            content: msgContent,
          },
        },
      },
      include: {
        user: { select: { fullName: true, role: { select: { name: true } } } },
        messages: true,
      },
    });

    const formatted = {
      id: ticket.ticketCode,
      dbId: ticket.id,
      creatorId: String(req.user.id),
      creatorName: req.user.fullName,
      creatorRole: getEffectiveRole(req.user.role),
      category: ticket.category,
      subject: ticket.subject,
      priority: ticket.priority,
      status: ticket.status,
      assignedTo: 'Systems Support Admin',
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: [
        {
          id: `MSG-${ticket.messages[0].id}`,
          senderName: req.user.fullName,
          senderRole: getEffectiveRole(req.user.role),
          message: msgContent,
          timestamp: ticket.createdAt.toISOString(),
        },
      ],
    };

    return success(res, 201, 'Ticket created', formatted);
  } catch (err) {
    next(err);
  }
});

// Update ticket status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const ticketParam = req.params.id;

    const existing = await prisma.helpDeskTicket.findFirst({
      where: {
        OR: [
          { ticketCode: ticketParam },
          ...(isNaN(Number(ticketParam)) ? [] : [{ id: Number(ticketParam) }]),
        ],
      },
    });

    if (!existing) throw new ApiError(404, 'Ticket not found');

    const updated = await prisma.helpDeskTicket.update({
      where: { id: existing.id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });

    return success(res, 200, 'Ticket status updated', {
      id: updated.ticketCode,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Add message to ticket
router.post('/:id/messages', async (req, res, next) => {
  try {
    const { message, content } = req.body;
    const msgContent = message || content;
    if (!msgContent) throw new ApiError(400, 'Message content is required');

    const ticketParam = req.params.id;
    const existing = await prisma.helpDeskTicket.findFirst({
      where: {
        OR: [
          { ticketCode: ticketParam },
          ...(isNaN(Number(ticketParam)) ? [] : [{ id: Number(ticketParam) }]),
        ],
      },
    });

    if (!existing) throw new ApiError(404, 'Ticket not found');

    const newMsg = await prisma.ticketMessage.create({
      data: {
        ticketId: existing.id,
        senderId: req.user.id,
        content: msgContent,
      },
    });

    await prisma.helpDeskTicket.update({
      where: { id: existing.id },
      data: { updatedAt: new Date() },
    });

    const formattedMsg = {
      id: `MSG-${newMsg.id}`,
      senderName: req.user.fullName,
      senderRole: getEffectiveRole(req.user.role),
      message: newMsg.content,
      timestamp: newMsg.createdAt.toISOString(),
    };

    return success(res, 201, 'Message added', formattedMsg);
  } catch (err) {
    next(err);
  }
});

module.exports = router;


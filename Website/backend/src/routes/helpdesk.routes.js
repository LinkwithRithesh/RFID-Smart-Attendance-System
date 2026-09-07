const express = require('express');
const authenticate = require('../middleware/authenticate');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const { getEffectiveRole } = require('../utils/roleMapper');

const router = express.Router();
router.use(authenticate);

let ticketsStore = [
  {
    id: 'HD-101',
    creatorId: 'STU-001',
    creatorName: 'RITHESHWARAN A',
    creatorRole: 'STUDENT',
    category: 'RFID Hardware',
    subject: 'Turnstile gate not reading RFID tag at North Entrance',
    priority: 'HIGH',
    status: 'OPEN',
    assignedTo: 'Hardware Operations Desk',
    createdAt: '2026-09-02 10:14:00',
    updatedAt: '2026-09-02 10:14:00',
    messages: [
      {
        id: 'MSG-1',
        senderName: 'RITHESHWARAN A',
        senderRole: 'STUDENT',
        message: 'My card was tapped 3 times at North Turnstile 2 but reader gave red LED.',
        timestamp: '2026-09-02 10:14:00',
      },
    ],
  },
  {
    id: 'HD-102',
    creatorId: 'FAC-101',
    creatorName: 'Dr. S. Meenakshi',
    creatorRole: 'FACULTY',
    category: 'Face Recognition',
    subject: 'High false mismatch rate in Room 302 morning period',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedTo: 'Biometrics Lab Desk',
    createdAt: '2026-09-03 09:30:00',
    updatedAt: '2026-09-03 11:15:00',
    messages: [
      {
        id: 'MSG-2',
        senderName: 'Dr. S. Meenakshi',
        senderRole: 'FACULTY',
        message: 'Camera lens in Room 302 appears out of focus under backlight.',
        timestamp: '2026-09-03 09:30:00',
      },
    ],
  },
];

// List tickets
router.get('/', (req, res) => {
  const effectiveRole = getEffectiveRole(req.user.role);
  let tickets = ticketsStore;
  if (effectiveRole === 'STUDENT') {
    tickets = ticketsStore.filter((t) => t.creatorName === req.user.fullName || t.creatorRole === 'STUDENT');
  }
  return success(res, 200, 'Help Desk tickets retrieved', tickets);
});

// Create ticket
router.post('/', (req, res) => {
  const { category, subject, priority, initialMessage } = req.body;
  const role = getEffectiveRole(req.user.role);
  const newTicket = {
    id: `HD-${Math.floor(100 + Math.random() * 900)}`,
    creatorId: String(req.user.id),
    creatorName: req.user.fullName,
    creatorRole: role,
    category: category || 'Attendance Correction',
    subject: subject || 'General Query',
    priority: priority || 'MEDIUM',
    status: 'OPEN',
    assignedTo: 'Systems Support Admin',
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString(),
    messages: [
      {
        id: `MSG-${Date.now()}`,
        senderName: req.user.fullName,
        senderRole: role,
        message: initialMessage || subject || 'Request initiated.',
        timestamp: new Date().toLocaleString(),
      },
    ],
  };

  ticketsStore.unshift(newTicket);
  return success(res, 201, 'Ticket created', newTicket);
});

// Update ticket status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const ticket = ticketsStore.find((t) => t.id === req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  ticket.status = status;
  ticket.updatedAt = new Date().toLocaleString();
  return success(res, 200, 'Ticket status updated', ticket);
});

// Add message to ticket
router.post('/:id/messages', (req, res) => {
  const { message } = req.body;
  const ticket = ticketsStore.find((t) => t.id === req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  const role = getEffectiveRole(req.user.role);
  const newMsg = {
    id: `MSG-${Date.now()}`,
    senderName: req.user.fullName,
    senderRole: role,
    message,
    timestamp: new Date().toLocaleString(),
  };

  ticket.messages.push(newMsg);
  ticket.updatedAt = new Date().toLocaleString();
  return success(res, 201, 'Message added', ticket);
});

module.exports = router;

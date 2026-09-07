const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const prisma = require('../config/database');
const { success } = require('../utils/apiResponse');

const router = express.Router();

/**
 * GET /api/v1/audit-logs
 * Fetch audit logs with pagination and role-filtering.
 * Query params: page, limit, actorId, action, entityType
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'ADMINISTRATOR', 'HOD', 'DEAN'),
  async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const where = {};
      if (req.query.actorId) {
        where.actorId = Number(req.query.actorId);
      }
      if (req.query.action) {
        where.action = req.query.action;
      }
      if (req.query.entityType) {
        where.entityType = req.query.entityType;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            actor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      const formatted = logs.map((log) => ({
        id: String(log.id),
        actorId: log.actorId,
        user: log.actor ? log.actor.fullName : 'SYSTEM',
        role: log.actor ? log.actor.role : 'SYSTEM',
        action: log.action,
        target: `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}`,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValue: log.metadata?.oldValue ?? null,
        newValue: log.metadata?.newValue ?? null,
        reason: log.metadata?.reason ?? null,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        timestamp: log.createdAt.toISOString(),
      }));

      return success(res, 200, 'Audit logs retrieved', {
        logs: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

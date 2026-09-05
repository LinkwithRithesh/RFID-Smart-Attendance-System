const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi.json');

const healthRoutes = require('./src/routes/health.routes');
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const roleRoutes = require('./src/routes/role.routes');
const deviceRoutes = require('./src/routes/device.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const timetableRoutes = require('./src/routes/timetable.routes');
const attendanceSessionRoutes = require('./src/routes/attendanceSession.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const reportsRoutes = require('./src/routes/reports.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const announcementRoutes = require('./src/routes/announcement.routes');
const documentRoutes = require('./src/routes/document.routes');
const courseRoutes = require('./src/routes/course.routes');
const sectionRoutes = require('./src/routes/section.routes');
const odRoutes = require('./src/routes/od.routes');
const helpdeskRoutes = require('./src/routes/helpdesk.routes');
const auditLogRoutes = require('./src/routes/auditLog.routes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();

// Security & parsing middleware. Helmet's default CSP blocks Swagger UI's
// inline scripts/styles, so /api-docs gets a relaxed CSP while every other
// route keeps the strict default.
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
        },
      },
    })(req, res, next);
  }
  return helmet()(req, res, next);
});

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Code', 'X-Device-Api-Key'],
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter for human clients
const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Dedicated rate limiter for hardware terminals (allows high frequency swipes/heartbeats)
const deviceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // 300 requests/min per IP for high-throughput IoT turnstiles
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting based on route
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/v1/devices/heartbeat') ||
    req.path.startsWith('/api/v1/attendance/mark') ||
    req.path.startsWith('/api/v1/attendance/sync')
  ) {
    return deviceLimiter(req, res, next);
  }
  return generalLimiter(req, res, next);
});

// Routes
app.use('/health', healthRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/attendance-sessions', attendanceSessionRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/sections', sectionRoutes);
app.use('/api/v1/od-requests', odRoutes);
app.use('/api/v1/helpdesk', helpdeskRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);

// 404 + centralized error handler (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

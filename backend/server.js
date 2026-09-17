require('dotenv').config();

const app = require('./app');
const logger = require('./src/config/logger');
const attendanceSessionService = require('./src/services/attendanceSession.service');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  
  // Start the session cleanup and auto-start task
  setInterval(async () => {
    try {
      const now = new Date();
      // Close expired sessions
      const closedCount = await attendanceSessionService.closeAllExpiredSessions(now);
      if (closedCount > 0) {
        logger.info(`Automatically closed ${closedCount} expired attendance session(s).`);
      }

      // Auto-start scheduled sessions for all departments
      const prisma = require('./src/config/database');
      const departments = await prisma.department.findMany({ select: { id: true } });
      for (const dept of departments) {
        await attendanceSessionService.resolveActiveSession(dept.id, now);
      }
    } catch (err) {
      logger.error('Error in scheduled session cleanup/auto-start task:', err);
    }
  }, 60 * 1000); // Check every minute
});

const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { error: sendError } = require('../utils/apiResponse');

/**
 * Centralized error handler. Every controller/service throws ApiError (or a
 * generic Error) and calls next(err); this is the single place responses
 * for failures get formatted and logged.
 */
function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : 'Internal server error';

  logger.error(err.message, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return sendError(
    res,
    statusCode,
    message,
    isApiError ? err.errorDetails : undefined
  );
}

function notFoundHandler(req, res) {
  return sendError(res, 404, `Route ${req.originalUrl} not found`);
}

module.exports = { errorHandler, notFoundHandler };

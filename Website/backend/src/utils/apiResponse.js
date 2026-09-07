/**
 * Standard response envelope used by every endpoint in the system:
 * { success, message, data, error }
 */
function success(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function error(res, statusCode, message, errorDetails = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails,
  });
}

module.exports = { success, error };

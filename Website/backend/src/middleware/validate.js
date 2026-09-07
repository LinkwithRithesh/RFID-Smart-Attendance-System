const ApiError = require('../utils/ApiError');

/**
 * Wraps a zod schema shaped like { body?, params?, query? } and validates
 * the matching parts of the request. Reused by every module going forward.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.flatten();
      return next(new ApiError(400, 'Validation failed', details));
    }

    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.params !== undefined) req.params = result.data.params;
    if (result.data.query !== undefined) req.query = result.data.query;

    next();
  };
}

module.exports = validate;

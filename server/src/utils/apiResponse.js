/**
 * Standardized Success Response
 */
export const successResponse = (res, data = null, message = 'Operation successful', statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

/**
 * Standardized Error Response
 */
export const errorResponse = (res, message = 'An error occurred', statusCode = 500, error = null, details = null) => {
  const payload = {
    success: false,
    message,
    error: error || 'Internal Server Error',
  };
  if (details) {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
};

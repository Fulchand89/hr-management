/**
 * Standardized API Response formatter
 */
class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
    const responsePayload = {
      success: true,
      message,
      data
    };

    if (meta) {
      responsePayload.meta = meta;
    }

    return res.status(statusCode).json(responsePayload);
  }

  static created(res, { message = 'Resource created successfully', data = null }) {
    return this.success(res, { statusCode: 201, message, data });
  }

  static error(res, { statusCode = 500, message = 'Internal Server Error', errors = null }) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors })
    });
  }
}

module.exports = ApiResponse;

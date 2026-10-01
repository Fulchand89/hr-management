class ApiError extends Error {
  constructor(statusCode, message, errors = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', errors = null) {
    super(400, message, errors);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized access', errors = null) {
    super(401, message, errors);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden: Insufficient permissions', errors = null) {
    super(403, message, errors);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', errors = null) {
    super(404, message, errors);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource already exists or conflict occurred', errors = null) {
    super(409, message, errors);
  }
}

class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', errors = null) {
    super(500, message, errors, false);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError
};

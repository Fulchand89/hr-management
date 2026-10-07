const { BadRequestError } = require('../utils/apiError');

/**
 * Higher-order middleware to validate incoming request body, query, or params with Joi
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'query'|'params'} source
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return next(new BadRequestError('Validation error', details));
    }

    // Replace original property with sanitised/stripped value
    req[source] = value;
    next();
  };
};

module.exports = validate;

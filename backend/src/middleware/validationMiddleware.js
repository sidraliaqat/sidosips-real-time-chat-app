/**
 * Generic Joi-schema validation middleware factory.
 * Usage: router.post('/x', validate(someSchema), controller)
 * Validates req.body by default; pass { source: 'query' } for query params.
 */
function validate(schema, { source = 'body' } = {}) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => d.message);
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req[source] = value;
    next();
  };
}

module.exports = { validate };

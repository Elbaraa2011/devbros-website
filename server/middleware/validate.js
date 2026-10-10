export class Validator {
  constructor() {}

  // The schema is computed per request from req.options.schema (set by routes),
  // because different routes need different zod schemas.
  middleware() {
    return (req, res, next) => {
      const schema = req.options?.schema;
      if (!schema) {
        return next(new Error('No validation schema configured for this route'));
      }

      const result = schema.safeParse(req.body);
      if (!result.success) {
        const fieldErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path.join('.') || '_form';
          if (!fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        return res.status(400).json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some fields need attention. Fix the highlighted fields and submit again.',
            fields: fieldErrors
          }
        });
      }

      req.validated = result.data;
      next();
    };
  }
}

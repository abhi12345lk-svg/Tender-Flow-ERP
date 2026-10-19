import { ZodError } from 'zod';

/**
 * Middleware factory for Zod validation
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req[source]);
      req[source] = validated;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errorDetails = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: errorDetails[0]?.message || 'Invalid input data',
          details: errorDetails,
        });
      }
      next(err);
    }
  };
};

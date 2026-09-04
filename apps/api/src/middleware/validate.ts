import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';

declare module 'express-serve-static-core' {
  interface Request {
    /** Populated by `validateQuery`; always the parsed, typed shape. */
    validatedQuery?: unknown;
  }
}

/**
 * Parses `req.query` with a zod schema. On failure the client gets
 * `400 { error, details }` naming the offending fields — never a stack trace.
 */
export function validateQuery<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        error: 'Those search options are not valid.',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || '(query)',
          message: issue.message,
        })),
      });
      return;
    }

    req.validatedQuery = result.data;
    next();
  };
}

/** Reads back what `validateQuery` stored, with the schema's type. */
export function validated<T extends ZodTypeAny>(req: Request, _schema: T): z.infer<T> {
  return req.validatedQuery as z.infer<T>;
}

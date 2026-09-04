import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logger.js';

/** Thrown by services when a lookup misses; becomes a 404 with a plain message. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }

  // Log the detail, return none of it — SQL never reaches the client.
  logger.error({ error }, 'unhandled error');
  res.status(500).json({ error: 'Something went wrong' });
}

import { Router } from 'express';
import { checkDatabase } from '../services/health.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res, next) => {
  try {
    const db = await checkDatabase();
    res.status(db === 'up' ? 200 : 503).json({ ok: db === 'up', db });
  } catch (error) {
    next(error);
  }
});

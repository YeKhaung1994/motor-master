import { Router } from 'express';
import { listClasses } from '../services/classes.js';

export const classesRouter = Router();

classesRouter.get('/classes', async (_req, res, next) => {
  try {
    res.json(await listClasses());
  } catch (error) {
    next(error);
  }
});

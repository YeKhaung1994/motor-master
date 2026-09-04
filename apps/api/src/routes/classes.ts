import { Router } from 'express';
import { z } from 'zod';
import { validateQuery, validated } from '../middleware/validate.js';
import { listClasses } from '../services/classes.js';

export const classesRouter = Router();

const classesQuerySchema = z.object({
  brand: z.string().min(1).max(80).optional(),
});

classesRouter.get('/classes', validateQuery(classesQuerySchema), async (req, res, next) => {
  try {
    const { brand } = validated(req, classesQuerySchema);
    res.json(await listClasses(brand));
  } catch (error) {
    next(error);
  }
});

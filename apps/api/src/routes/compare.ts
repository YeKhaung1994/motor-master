import { Router } from 'express';
import { z } from 'zod';
import { validateQuery, validated } from '../middleware/validate.js';
import { compareBikes } from '../services/compare.js';

export const compareRouter = Router();

const compareQuerySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(',').map((part) => part.trim()).filter(Boolean))
    .pipe(
      z
        .array(z.coerce.number().int().positive())
        .min(2, 'Pick at least two bikes to compare.')
        .max(3, 'Compare up to three bikes at a time.'),
    )
    .transform((ids) => Array.from(new Set(ids))),
});

compareRouter.get('/compare', validateQuery(compareQuerySchema), async (req, res, next) => {
  try {
    const { ids } = validated(req, compareQuerySchema);
    res.json(await compareBikes(ids));
  } catch (error) {
    next(error);
  }
});

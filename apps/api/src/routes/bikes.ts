import { Router } from 'express';
import { z } from 'zod';
import { validateQuery, validated } from '../middleware/validate.js';
import { getBikeBySlug, listBikes, searchBikes } from '../services/bikes.js';

export const bikesRouter = Router();

/** Query strings are always text; coerce, then bound. */
const numeric = z.coerce.number().nonnegative();

/** `class` accepts a repeated param (`class=Naked&class=Sport`) or one value. */
const classList = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .optional();

const listQuerySchema = z
  .object({
    brand: z.string().min(1).max(80).optional(),
    class: classList,
    ccMin: numeric.optional(),
    ccMax: numeric.optional(),
    priceMin: numeric.optional(),
    priceMax: numeric.optional(),
    sort: z.enum(['price_asc', 'price_desc', 'power_desc', 'weight_asc']).default('price_asc'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(60).default(24),
  })
  .refine((query) => query.ccMin === undefined || query.ccMax === undefined || query.ccMin <= query.ccMax, {
    message: 'The smallest engine size must not be larger than the largest.',
    path: ['ccMin'],
  })
  .refine(
    (query) =>
      query.priceMin === undefined || query.priceMax === undefined || query.priceMin <= query.priceMax,
    { message: 'The lowest price must not be higher than the highest.', path: ['priceMin'] },
  );

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Type at least one character to search.').max(80),
});

bikesRouter.get('/bikes', validateQuery(listQuerySchema), async (req, res, next) => {
  try {
    const query = validated(req, listQuerySchema);
    res.json(await listBikes(query));
  } catch (error) {
    next(error);
  }
});

bikesRouter.get('/search', validateQuery(searchQuerySchema), async (req, res, next) => {
  try {
    const { q } = validated(req, searchQuerySchema);
    res.json(await searchBikes(q));
  } catch (error) {
    next(error);
  }
});

bikesRouter.get('/bikes/:slug', async (req, res, next) => {
  try {
    res.json(await getBikeBySlug(req.params.slug));
  } catch (error) {
    next(error);
  }
});

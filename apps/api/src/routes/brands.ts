import { Router } from 'express';
import { listBrands } from '../services/brands.js';

export const brandsRouter = Router();

brandsRouter.get('/brands', async (_req, res, next) => {
  try {
    res.json(await listBrands());
  } catch (error) {
    next(error);
  }
});

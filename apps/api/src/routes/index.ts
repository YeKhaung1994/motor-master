import { Router } from 'express';
import { bikesRouter } from './bikes.js';
import { brandsRouter } from './brands.js';
import { compareRouter } from './compare.js';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(brandsRouter);
apiRouter.use(compareRouter);
// Registered last: /bikes/:slug must not shadow /bikes or /search.
apiRouter.use(bikesRouter);

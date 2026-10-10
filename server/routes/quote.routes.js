import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller.js';

export function buildQuoteRoutes({ quoteController, validator, rateLimiter }) {
  const router = Router();

  router.post(
    '/quote',
    rateLimiter.middleware({ max: 30 }),
    (req, res, next) => {
      req.options = { schema: QuoteController.schema() };
      next();
    },
    validator.middleware(),
    (req, res, next) => quoteController.create(req, res, next)
  );

  return router;
}

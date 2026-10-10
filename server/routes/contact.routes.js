import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller.js';

export function buildContactRoutes({ contactController, validator, rateLimiter }) {
  const router = Router();

  router.post(
    '/contact',
    rateLimiter.middleware(),
    (req, res, next) => {
      req.options = { schema: ContactController.schema() };
      next();
    },
    validator.middleware(),
    (req, res, next) => contactController.create(req, res, next)
  );

  return router;
}

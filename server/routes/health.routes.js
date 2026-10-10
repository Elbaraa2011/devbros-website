import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

export function buildHealthRoutes({ healthController }) {
  const router = Router();
  router.get('/health', (req, res) => healthController.check(req, res));
  return router;
}

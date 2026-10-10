import { Router } from 'express';
import { ProjectsController } from '../controllers/projects.controller.js';

export function buildProjectsRoutes({ projectsController }) {
  const router = Router();

  router.get('/projects', (req, res, next) => projectsController.list(req, res, next));

  return router;
}

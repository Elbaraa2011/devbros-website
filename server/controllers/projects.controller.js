import { HttpError } from '../middleware/errorHandler.js';

export class ProjectsController {
  constructor({ projectService }) {
    this.projectService = projectService;
  }

  async list(req, res, next) {
    try {
      const category = String(req.query.category ?? 'All').slice(0, 40);
      const validCategories = ['All', ...this.projectService.categories()];
      if (!validCategories.some((c) => c.toLowerCase() === category.toLowerCase())) {
        throw new HttpError(400, 'VALIDATION_ERROR', `Unknown category "${category}". Valid categories: ${validCategories.join(', ')}.`);
      }

      const projects = this.projectService.list(category);
      return res.json({ ok: true, category, projects });
    } catch (error) {
      return next(error);
    }
  }
}

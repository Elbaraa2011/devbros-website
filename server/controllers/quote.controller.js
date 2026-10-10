import { z } from 'zod';
import { ESTIMATOR } from '../config/pricing.js';

export class QuoteController {
  constructor({ quoteService }) {
    this.quoteService = quoteService;
  }

  static schema() {
    return z.object({
      page_count: z.coerce
        .number({ message: 'Select a page count.' })
        .int('Select a page count.')
        .min(1, 'Select a page count.')
        .max(50, 'Page count is too high. Contact us for a custom quote.'),
      features: z
        .array(z.enum(Object.keys(ESTIMATOR.featurePoints)))
        .max(10)
        .default([]),
      cms_needs: z
        .enum(['none', 'editable', 'migration'], { message: 'Select content\\u2009editing needs.' })
        .default('none'),
      timeline: z
        .enum(['standard', 'rushed'], { message: 'Select a timeline.' })
        .default('standard')
    });
  }

  async create(req, res, next) {
    try {
      const estimate = this.quoteService.calculate(req.validated);
      return res.json({ ok: true, ...estimate });
    } catch (error) {
      return next(error);
    }
  }
}

import { z } from 'zod';
import { BUDGET_RANGES, BUSINESS_TYPES } from '../config/pricing.js';
import { isHoneypotTripped, sanitizeText, sanitizeMultiline } from '../middleware/sanitize.js';

export class ContactController {
  constructor({ inquiryService }) {
    this.inquiryService = inquiryService;
  }

  // Shared validation rules, matching the front-end plugin's rules exactly.
  static schema() {
    return z
      .object({
        name: z
          .string({ message: 'Enter your name.' })
          .trim()
          .min(2, 'Name must be at least 2 characters.')
          .max(120, 'Name is too long.'),
        email: z
          .string({ message: 'Enter your email.' })
          .trim()
          .email('Enter a valid email address, like name@business.com.')
          .max(200),
        phone: z
          .union([z.string().trim(), z.literal('')])
          .optional()
          .transform((v) => (v ? v : null))
          .refine((v) => v === null || /^[+()\-.\s\d]{7,20}$/.test(v), {
            message: 'Enter a valid phone number, like (213) 555-0123.'
          }),
        business_type: z
          .string({ message: 'Select your business type.' })
          .refine((v) => BUSINESS_TYPES.includes(v), {
            message: 'Select a business type from the list.'
          }),
        interested_tier: z
          .union([z.string(), z.literal('')])
          .optional()
          .transform((v) => (v && ['$600', '$900', '$1250'].includes(v) ? v : null)),
        project_details: z
          .string({ message: 'Describe your project.' })
          .trim()
          .min(20, 'Tell us a bit more, at least 20 characters.')
          .max(4000, 'Project details are too long.'),
        budget_range: z
          .string({ message: 'Select a budget range.' })
          .refine((v) => BUDGET_RANGES.includes(v), {
            message: 'Select a budget range from the list.'
          }),
        // Honeypot: not validated, just checked for emptiness before parsing
        website: z.string().optional()
      })
      .strip();
  }

  async create(req, res, next) {
    try {
      if (isHoneypotTripped(req.body)) {
        // Return success-looking response so bots learn nothing
        return res.status(200).json({
          ok: true,
          message: 'Thanks. We will reply today.',
          inquiryId: null
        });
      }

      const inquiry = this.inquiryService.create(req.validated, req.ip);

      // Email first, always, with resilience handled in the service.
      try {
        await this.inquiryService.sendEmails(inquiry);
      } catch (emailError) {
        console.error(`[inquiry:${inquiry.id}] Email pipeline error (inquiry still saved): ${emailError.message}`);
      }

      return res.status(201).json({
        ok: true,
        message: 'Thanks. Your inquiry is in, and someone replies today.',
        inquiryId: inquiry.id
      });
    } catch (error) {
      return next(error);
    }
  }
}

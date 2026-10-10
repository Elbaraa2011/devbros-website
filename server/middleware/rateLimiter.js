import rateLimit from 'express-rate-limit';

export class RateLimiter {
  constructor({ windowMs = 15 * 60 * 1000, max = 5 } = {}) {
    this.windowMs = windowMs;
    this.max = max;
  }

  middleware(rateLimiterOptions = {}) {
    return rateLimit({
      windowMs: rateLimiterOptions.windowMs ?? this.windowMs,
      max: rateLimiterOptions.max ?? this.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many submissions from this address. Please try again in about 15 minutes.'
        }
      }
    });
  }
}

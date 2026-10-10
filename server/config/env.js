import 'dotenv/config';
import { z } from 'zod';

// The shell sets PORT=0 in this environment. Treat PORT=0 as "not set".
const raw = { ...process.env };
if (raw.PORT === '0') delete raw.PORT;

const parsed = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
    SITE_URL: z.string().url().default('http://localhost:3000'),
    SMTP_HOST: z.string().default(''),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    SMTP_USER: z.string().default(''),
    SMTP_PASSWORD: z.string().default(''),
    NOTIFICATION_EMAIL: z.string().email().default('devbros40@gmail.com'),
    SKIP_EMAIL: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true')
  })
  .safeParse(raw);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  smtpConfigured: Boolean(parsed.data.SMTP_HOST && parsed.data.SMTP_USER && parsed.data.SMTP_PASSWORD) && !parsed.data.SKIP_EMAIL
};

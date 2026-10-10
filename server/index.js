import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { createDatabase } from './db/database.js';
import { seedProjects } from './db/seed.js';
import { EmailService } from './services/email.service.js';
import { InquiryService } from './services/inquiry.service.js';
import { QuoteService } from './services/quote.service.js';
import { ProjectService } from './services/project.service.js';
import { ContactController } from './controllers/contact.controller.js';
import { QuoteController } from './controllers/quote.controller.js';
import { ProjectsController } from './controllers/projects.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { buildContactRoutes } from './routes/contact.routes.js';
import { buildQuoteRoutes } from './routes/quote.routes.js';
import { buildProjectsRoutes } from './routes/projects.routes.js';
import { buildHealthRoutes } from './routes/health.routes.js';
import { RateLimiter } from './middleware/rateLimiter.js';
import { Validator } from './middleware/validate.js';
import { ErrorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const startedAt = Date.now();
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://picsum.photos', 'https://fastly.picsum.photos'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

const siteOrigin = new URL(env.SITE_URL).origin;
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === siteOrigin) {
        return callback(null, true);
      }
      callback(null, false);
    }
  })
);

app.use(express.json({ limit: '32kb' }));

// Dependency injection: controllers get services, services get db/env/mailer.
const db = createDatabase();
seedProjects(db);

const emailService = new EmailService({ env });
const inquiryService = new InquiryService({ db, emailService, env });
const quoteService = new QuoteService({ db });
const projectService = new ProjectService({ db });

const rateLimiter = new RateLimiter();
const validator = new Validator();
const errorHandler = new ErrorHandler();

const contactController = new ContactController({ inquiryService });
const quoteController = new QuoteController({ quoteService });
const projectsController = new ProjectsController({ projectService });
const healthController = new HealthController({ startedAt, db });

app.use('/api', buildHealthRoutes({ healthController }));
app.use('/api', buildContactRoutes({ contactController, validator, rateLimiter }));
app.use('/api', buildQuoteRoutes({ quoteController, validator, rateLimiter }));
app.use('/api', buildProjectsRoutes({ projectsController }));

// Static front-end: five HTML pages at the project root.
const staticOptions = {
  etag: true,
  maxAge: 0
};
app.use(express.static(projectRoot, staticOptions));

app.use(errorHandler.middleware());

app.listen(env.PORT, () => {
  console.log(`Devbros running at ${env.SITE_URL} (listening on port ${env.PORT})`);
  console.log(emailService.env.smtpConfigured ? 'SMTP: configured' : 'SMTP: skipped (SKIP_EMAIL=true or not configured)');
});

# Devbros Agency Site

Five-page marketing site with a Node.js/Express backend. One command runs the
whole thing: static pages, REST API, SQLite storage.

## Setup

```bash
npm install
```

Copy the environment example and fill in SMTP settings (or leave them empty to
run email-free locally):

```bash
cp server/.env.example server/.env
```

Run the server:

```bash
npm start        # production
npm run dev      # watch mode
```

Open <http://localhost:3000>.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Hero, metrics bar, featured case studies, service summary |
| `services.html` | Tech stack, migration playbook, delivery process |
| `work.html` | Case studies loaded from `GET /api/projects` with category filter |
| `pricing.html` | Three tiers, delivery roadmap, live quote estimator |
| `contact.html` | Consultation form posting to `POST /api/contact` |

## API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/contact` | POST | Save inquiry, notify by email, send auto-reply |
| `/api/quote` | POST | Server-side tier estimate for the pricing widget |
| `/api/projects` | GET | Case study data, filterable by `?category=` |
| `/api/health` | GET | Status and uptime |

## Data

SQLite file at `server/data/devbros.db` (created on first run). Schema in
`server/db/schema.sql`. Seed the three case studies with:

```bash
npm run seed
```

## Email

Emails are sent through SMTP (`nodemailer`) using Gmail or any provider. If
SMTP is unconfigured or fails, inquiries are still saved and confirmed to the
visitor; failures are logged for retry.

## Stack

Express · better-sqlite3 · zod · helmet · cors · express-rate-limit · nodemailer · dotenv.
Front-end is HTML5 with modular ES6 class JavaScript, no framework, no build step.

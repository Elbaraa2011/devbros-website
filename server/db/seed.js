import { createDatabase } from './database.js';
import { TIERS } from '../config/pricing.js';

const PROJECTS = [
  {
    slug: 'bright-smile-dental',
    title: 'Bright Smile Dental',
    client_type: 'Dental practice',
    category: 'Healthcare',
    summary: 'Appointment booking rebuilt around how the front desk actually answers calls.',
    story:
      'Bright Smile was losing patients to a booking page that took eleven taps to reach a time slot. We rebuilt the flow around one question, which visit, and put it on the home page. The practice now answers digital inquiries with the same script the front desk uses on the phone, so nothing gets lost between the site and the calendar.',
    stack: ['Next.js', 'Tailwind CSS', 'PostgreSQL'],
    metrics: [
      { label: 'Digital appointment conversions', value: '+140%' },
      { label: 'Time to book a visit', value: '11 taps to 3' },
      { label: 'Page load', value: '1.2s' }
    ],
    services: ['UX audit', 'Booking flow rebuild', 'Local SEO', 'Ongoing support'],
    year: 2025,
    featured: 1
  },
  {
    slug: 'casa-cacao',
    title: 'Casa Cacao Chocolates',
    client_type: 'Artisan chocolatier',
    category: 'Retail',
    summary: 'Seasonal e-commerce catalog that sells out limited batches without phone spam.',
    story:
      'Casa Cacao releases four seasonal collections a year, and each drop used to overwhelm the shop with phone orders. We built a catalog that opens preorders by season, caps batch quantities, and consolidates pickup instructions into the confirmation email. The owner updates collections herself with an editor she learned in one afternoon.',
    stack: ['Shopify migration', 'Vue', 'Stripe'],
    metrics: [
      { label: 'Batch sell-out speed', value: '2.5x faster' },
      { label: 'Phone orders during drops', value: '-80%' },
      { label: 'Owner-edited catalogs', value: '4 seasons, no developer' }
    ],
    services: ['Shopify migration', 'Preorder logic', 'Checkout tuning'],
    year: 2024,
    featured: 1
  },
  {
    slug: 'marigold-bakery',
    title: 'Marigold Bakery',
    client_type: 'Neighborhood bakery',
    category: 'Food & Service',
    summary: 'Catering order engine and a daily menu the bakers update from a tablet.',
    story:
      'Marigold handles twenty to thirty catering orders a week, nearly all by phone before 7am. We built an order form that works on the bakery wifi, prints prep tickets in the kitchen, and sends the same order to the owner by email. The daily menu board is now edited from a tablet between trays.',
    stack: ['ASP.NET Core', 'SQL Server', 'HTML5'],
    metrics: [
      { label: 'Phone hours reclaimed', value: '6+ per week' },
      { label: 'Catering orders processed', value: '3x volume' },
      { label: 'Menu update time', value: 'From a tablet, 2 minutes' }
    ],
    services: ['Catering order engine', 'Kitchen ticket printing', 'Tablet menu editor'],
    year: 2025,
    featured: 1
  }
];

export function seedProjects(db) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO projects
      (slug, title, client_type, category, summary, story, stack, metrics, services, year, featured)
    VALUES
      (@slug, @title, @client_type, @category, @summary, @story, @stack, @metrics, @services, @year, @featured)
  `);

  for (const project of PROJECTS) {
    insert.run({
      ...project,
      stack: JSON.stringify(project.stack),
      metrics: JSON.stringify(project.metrics),
      services: JSON.stringify(project.services)
    });
  }
}

// The seed script can also be run standalone: npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  const db = createDatabase();
  seedProjects(db);
  const tierInfo = TIERS.map((t) => `${t.name} $${t.price}`).join(', ');
  console.log(`Seeded ${PROJECTS.length} projects. Prices available server-side: ${tierInfo}`);
  db.close();
}

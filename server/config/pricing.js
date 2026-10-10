// Single source of truth for tier pricing and estimator rules.
// The front-end holds no pricing logic of its own; pricing.html reads
// tier data from here via the API-driven UI copy only where numbers appear.

export const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 600,
    deliveryDays: [5, 8],
    includes: [
      'Up to 4 pages, built to match your brand',
      'Mobile-friendly, tested on real devices',
      'Contact form with spam filtering',
      'Google Maps and business hours integration',
      'Basic SEO: titles, descriptions, sitemap',
      'Free SSL setup and deployment',
      '30 days of bug fixes after launch'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 900,
    deliveryDays: [8, 14],
    includesEverythingIn: 'Starter',
    includes: [
      'Everything in Starter',
      'Up to 8 pages',
      'Blog or news section you can edit yourself',
      'Google Analytics and Search Console setup',
      'Booking or quote-request form with email routing',
      'Image gallery or service showcase',
      'Social media feed integration',
      '60 days of bug fixes after launch'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1250,
    deliveryDays: [14, 20],
    includesEverythingIn: 'Growth',
    includes: [
      'Everything in Growth',
      'Up to 15 pages',
      'Online store or service catalog (up to 30 products)',
      'Payment checkout (Stripe or PayPal)',
      'Legacy migration: WordPress, Shopify, Vue, or ASP.NET',
      'Customer accounts and order tracking',
      'Speed tuning for large sites',
      '90 days of bug fixes after launch'
    ]
  }
];

// Estimator scoring rules. Points decide which tier fits the request.
export const ESTIMATOR = {
  basePoints: 0,
  pageCountPoints: [
    { max: 4, points: 0, label: '1 to 4 pages' },
    { max: 8, points: 2, label: '5 to 8 pages' },
    { max: 15, points: 4, label: '9 to 15 pages' }
  ],
  featurePoints: {
    ecommerce: 3,
    booking: 2,
    blog: 1,
    gallery: 1,
    payments: 3,
    analytics: 1,
    accounts: 3
  },
  cmsPoints: {
    none: 0,
    editable: 2,
    migration: 4
  },
  timelinePoints: {
    standard: 0, // 2 to 3 weeks
    rushed: 2 // inside the 20-day cap
  },
  // Points thresholds mapped back to tiers
  tierThresholds: [
    { max: 2, tier: 'starter' },
    { max: 7, tier: 'growth' },
    { max: Infinity, tier: 'premium' }
  ]
};

export const BUDGET_RANGES = [
  'Under $600',
  '$600 to $900',
  '$900 to $1250',
  'Above $1250',
  'Not sure yet'
];

export const BUSINESS_TYPES = [
  'Dental or medical practice',
  'Food business (bakery, restaurant, cafe)',
  'Artisan or retail shop',
  'Trades and home services',
  'Professional services',
  'Other'
];

export const PROJECT_SIZES = [
  { pageCount: 3, days: 5 },
  { pageCount: 5, days: 8 },
  { pageCount: 8, days: 12 },
  { pageCount: 15, days: 20 }
];

export function daysForPageCount(pageCount) {
  const size = PROJECT_SIZES.find((s) => s.pageCount >= pageCount) ?? PROJECT_SIZES[PROJECT_SIZES.length - 1];
  return size.days;
}

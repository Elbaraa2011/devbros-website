import { TIERS, ESTIMATOR, daysForPageCount } from '../config/pricing.js';

export class QuoteService {
  constructor({ db }) {
    this.db = db;
    this.insertStmt = db.prepare(`
      INSERT INTO quotes (page_count, features, cms_needs, timeline, estimate_cents, recommended_tier, delivery_days)
      VALUES (@page_count, @features, @cms_needs, @timeline, @estimate_cents, @recommended_tier, @delivery_days)
    `);
  }

  // The front-end sends raw selections; all pricing logic lives here.
  calculate({ page_count, features = [], cms_needs = 'none', timeline = 'standard' }) {
    const pageCount = Number(page_count);
    let points = ESTIMATOR.basePoints;

    const pageCountRule = ESTIMATOR.pageCountPoints.find((r) => pageCount <= r.max);
    points += pageCountRule?.points ?? 0;

    for (const feature of features) {
      points += ESTIMATOR.featurePoints[feature] ?? 0;
    }

    points += ESTIMATOR.cmsPoints[cms_needs] ?? 0;
    points += ESTIMATOR.timelinePoints[timeline] ?? 0;

    const threshold = ESTIMATOR.tierThresholds.find((t) => points <= t.max);
    const tier = TIERS.find((t) => t.id === threshold.tier) ?? TIERS[0];
    const nextTier = TIERS[TIERS.indexOf(tier) + 1];

    const services = features.map((f) => f.replace(/_/g, ' '));
    if (cms_needs !== 'none') {
      services.push(cms_needs === 'migration' ? 'framework migration' : 'self-editable pages');
    }

    const lineItems = [
      { label: `${pageCount > 8 ? `${pageCount} pages` : pageCountRule?.label ?? `${pageCount} pages`}`, amount_cents: tier.price * 100 },
      ...(services.length
        ? [{ label: `Includes build for: ${services.join(', ')}`, amount_cents: 0 }]
        : []
      )
    ];

    const deliveryDays = Math.min(
      Math.max(daysForPageCount(pageCount), tier.deliveryDays[0]),
      tier.deliveryDays[1]
    );

    // Store the estimate
    try {
      this.insertStmt.run({
        page_count: pageCount,
        features: JSON.stringify(features),
        cms_needs,
        timeline,
        estimate_cents: tier.price * 100,
        recommended_tier: tier.id,
        delivery_days: deliveryDays
      });
    } catch {
      // Quote persistence is best-effort; the response still returns.
    }

    return {
      recommended_tier: {
        id: tier.id,
        name: tier.name,
        price: tier.price,
        priceLabel: `$${tier.price}`
      },
      estimate_cents: tier.price * 100,
      estimateLabel: `From $${tier.price}`,
      delivery_days: deliveryDays,
      delivery_label: tier.deliveryDays[0] === deliveryDays
        ? `${tier.deliveryDays[0]} days`
        : `${tier.deliveryDays[0]} to ${tier.deliveryDays[1]} days`,
      points,
      upscore_hint: nextTier
        ? `Additional features like ${['online store', 'payments', 'customer accounts'].find((f) => !features.includes('ecommerce'))} would move this to the ${nextTier.name} tier ($${nextTier.price}).`
        : null,
      line_items: lineItems
    };
  }
}

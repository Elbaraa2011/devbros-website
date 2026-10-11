/**
 * ApiClient: all server communication goes through this class.
 * Provides timeout, JSON parsing, and normalized error handling with static fallbacks.
 */
export class ApiClient {
  constructor({ baseUrl = '', timeoutMs = 12000 } = {}) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async request(path, { method = 'GET', body, headers = {}, signal } = {}) {
    const fallbackData = this.getStaticFallback(path, method, body);

    // Use fallback data only when the API is unavailable on static deployments.
    if (fallbackData) {
      try {
        const response = await fetch(this.baseUrl + path, {
          method,
          headers: body
            ? { 'Content-Type': 'application/json', ...headers }
            : headers,
          body: body ? JSON.stringify(body) : undefined,
          signal
        });

        if (!response.ok) return fallbackData;

        return await response.json();
      } catch {
        return fallbackData;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const abortFromCaller = () => controller.abort(signal?.reason);

    if (signal) {
      if (signal.aborted) {
        controller.abort(signal.reason);
      } else {
        signal.addEventListener('abort', abortFromCaller, { once: true });
      }
    }

    try {
      const response = await fetch(this.baseUrl + path, {
        method,
        headers: body
          ? { 'Content-Type': 'application/json', ...headers }
          : headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        // Response was not JSON.
      }

      if (!response.ok) {
        throw new ApiError(data, response.status);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      if (error.name === 'AbortError') {
        throw new ApiError(
          null,
          0,
          'The request timed out. Check your connection and try again.'
        );
      }

      throw new ApiError(
        null,
        0,
        'Network error. Check your connection and try again.'
      );
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromCaller);
    }
  }

  get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options = {}) {
    return this.request(path, { ...options, method: 'POST', body });
  }

  // Static fallback data for deployments where API routes are unavailable.
  getStaticFallback(path, method, body) {
    if (path.includes('/api/projects') && method === 'GET') {
      return {
        ok: true,
        projects: [
          {
            id: 'bright-smile-dental',
            title: 'Bright Smile Dental',
            client: 'Dental practice, 2025',
            category: 'Healthcare',
            summary:
              'Appointment booking rebuilt around how the front desk actually answers calls.',
            stack: ['Next.js', 'Tailwind CSS', 'PostgreSQL'],
            metrics: [
              { value: '+140%', label: 'Digital appointment conversions' },
              { value: '11 to 3', label: 'Time to book a visit' },
              { value: '1.2s', label: 'Page load' }
            ],
            description:
              'Bright Smile was losing patients to a booking page that took eleven taps to reach a time slot. We rebuilt the flow around one question, which visit, and put it on the home page.',
            services: [
              'UX audit',
              'Booking flow rebuild',
              'Local SEO',
              'Ongoing support'
            ]
          },
          {
            id: 'casa-cacao',
            title: 'Casa Cacao Chocolates',
            client: 'Artisan chocolatier, 2024',
            category: 'Retail',
            summary:
              'Seasonal e-commerce catalog that sells out limited batches without phone spam.',
            stack: ['Shopify migration', 'Vue', 'Stripe'],
            metrics: [
              { value: '2.5x faster', label: 'Batch sell-out speed' },
              { value: '-80%', label: 'Phone orders during drops' },
              { value: '4 seasons', label: 'Owner-edited catalogs' }
            ],
            description:
              'Casa Cacao releases four seasonal collections a year. We built a catalog that opens preorders by season, caps batch quantities, and consolidates pickup instructions.',
            services: [
              'Shopify migration',
              'Preorder logic',
              'Checkout tuning'
            ]
          },
          {
            id: 'marigold-bakery',
            title: 'Marigold Bakery',
            client: 'Neighborhood bakery, 2025',
            category: 'Food & Service',
            summary:
              'Catering order engine and a daily menu the bakers update from a tablet.',
            stack: ['ASP.NET Core', 'SQL Server', 'HTML5'],
            metrics: [
              { value: '6+ hrs', label: 'Phone hours reclaimed' },
              { value: '3x', label: 'Catering orders processed' },
              { value: '2 min', label: 'Menu update time' }
            ],
            description:
              'Marigold handles twenty to thirty catering orders a week. We built an order form that works on the bakery wifi and prints prep tickets directly in the kitchen.',
            services: [
              'Catering order engine',
              'Kitchen ticket printing',
              'Tablet menu editor'
            ]
          }
        ]
      };
    }

    if (path.includes('/api/quote') && method === 'POST') {
      // Match the backend estimator rules when API routes are unavailable.
      const tiers = [
        { id: 'starter', name: 'Starter', price: 600, deliveryDays: [5, 8] },
        { id: 'growth', name: 'Growth', price: 900, deliveryDays: [8, 14] },
        { id: 'premium', name: 'Premium', price: 1250, deliveryDays: [14, 20] }
      ];

      const pageCountPoints = [
        { max: 4, points: 0, label: '1 to 4 pages' },
        { max: 8, points: 2, label: '5 to 8 pages' },
        { max: 15, points: 4, label: '9 to 15 pages' }
      ];

      const featurePoints = {
        ecommerce: 3,
        booking: 2,
        blog: 1,
        gallery: 1,
        payments: 3,
        analytics: 1,
        accounts: 3
      };

      const cmsPoints = { none: 0, editable: 2, migration: 4 };
      const timelinePoints = { standard: 0, rushed: 2 };
      const tierThresholds = [
        { max: 2, tier: 'starter' },
        { max: 7, tier: 'growth' },
        { max: Infinity, tier: 'premium' }
      ];

      const pageCount = Math.max(1, Number(body?.page_count) || 1);
      const features = Array.isArray(body?.features) ? body.features : [];
      const cmsNeeds = body?.cms_needs ?? 'none';
      const timeline = body?.timeline ?? 'standard';

      let points = 0;
      const pageRule = pageCountPoints.find((rule) => pageCount <= rule.max);
      points += pageRule?.points ?? 0;

      for (const feature of features) {
        points += featurePoints[feature] ?? 0;
      }

      points += cmsPoints[cmsNeeds] ?? 0;
      points += timelinePoints[timeline] ?? 0;

      const threshold = tierThresholds.find((rule) => points <= rule.max);
      const tier = tiers.find((item) => item.id === threshold?.tier) ?? tiers[0];
      const nextTier = tiers[tiers.indexOf(tier) + 1];

      const projectSizes = [
        { pageCount: 3, days: 5 },
        { pageCount: 5, days: 8 },
        { pageCount: 8, days: 12 },
        { pageCount: 15, days: 20 }
      ];
      const projectSize =
        projectSizes.find((size) => size.pageCount >= pageCount) ??
        projectSizes[projectSizes.length - 1];

      const deliveryDays = Math.min(
        Math.max(projectSize.days, tier.deliveryDays[0]),
        tier.deliveryDays[1]
      );

      const services = features.map((feature) => feature.replace(/_/g, ' '));
      if (cmsNeeds !== 'none') {
        services.push(
          cmsNeeds === 'migration' ? 'framework migration' : 'self-editable pages'
        );
      }

      const lineItems = [
        {
          label:
            pageCount > 8
              ? `${pageCount} pages`
              : pageRule?.label ?? `${pageCount} pages`,
          amount_cents: tier.price * 100
        },
        ...(services.length
          ? [
              {
                label: `Includes build for: ${services.join(', ')}`,
                amount_cents: 0
              }
            ]
          : [])
      ];

      return {
        success: true,
        recommended_tier: {
          id: tier.id,
          name: tier.name,
          price: tier.price,
          priceLabel: `$${tier.price}`
        },
        estimate_cents: tier.price * 100,
        estimateLabel: `From $${tier.price}`,
        delivery_days: deliveryDays,
        delivery_label:
          tier.deliveryDays[0] === deliveryDays
            ? `${tier.deliveryDays[0]} days`
            : `${tier.deliveryDays[0]} to ${tier.deliveryDays[1]} days`,
        points,
        upscore_hint: nextTier
          ? `Additional features could move this to the ${nextTier.name} tier ($${nextTier.price}).`
          : null,
        line_items: lineItems
      };
    }

    return null;
  }
}

/** Normalized error shape shared by every caller. */
export class ApiError extends Error {
  constructor(payload, status, fallbackMessage) {
    const message =
      payload?.error?.message ??
      fallbackMessage ??
      'Something went wrong. Please try again.';

    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload?.error?.code ?? 'UNKNOWN';
    this.fields = payload?.error?.fields ?? null;
  }
}

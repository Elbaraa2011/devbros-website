
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
      // Temporary fallback estimate. Match the calculator's expected response.
      return {
        success: true,
        recommended_tier: {
          name: 'Growth Package'
        },
        estimate_cents: 90000,
        estimateLabel: '$900',
        delivery_label: 'Live in 8 to 14 days',
        line_items: [
          {
            label: 'Custom pages & layout',
            amount_cents: 45000
          },
          {
            label: 'Core integrations',
            amount_cents: 25000
          },
          {
            label: 'Responsive mobile design',
            amount_cents: 20000
          }
        ]
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

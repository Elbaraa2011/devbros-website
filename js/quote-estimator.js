/**
 * QuoteEstimator: interactive widget on pricing.html. Debounced, sends
 * real selections to POST /api/quote, shows loading state while the
 * estimate updates. The front-end holds no pricing logic.
 */
import { formatCurrency } from './tools.js';

export class QuoteEstimator {
  constructor({ apiClient, uiController, root } = {}) {
    this.api = apiClient;
    this.ui = uiController;
    this.root = root ?? document.querySelector('[data-estimator]');
    this.debounceMs = 350;
    this.debounceTimer = null;
    this.loadId = 0;

    if (this.root) this.init();
  }

  init() {
    this.root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', () => this.scheduleUpdate());
      if (el.type === 'checkbox') {
        el.addEventListener('input', () => this.scheduleUpdate());
      }
    });

    // Initial estimate with current defaults
    this.update();
  }

  scheduleUpdate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.update(), this.debounceMs);
  }

  collect() {
    const pageCount = Number(this.root.querySelector('[data-est-pages]').value);
    const features = [...this.root.querySelectorAll('[data-est-feature]:checked')].map((c) => c.dataset.estFeature);
    const cmsNeeds = this.root.querySelector('[data-est-cms]:checked')?.value ?? 'none';
    const timeline = this.root.querySelector('[data-est-timeline]:checked')?.value ?? 'standard';

    return { page_count: pageCount, features, cms_needs: cmsNeeds, timeline };
  }

  setEstimateLoading(isLoading) {
    const priceEl = this.root.querySelector('[data-est-price]');
    const tierEl = this.root.querySelector('[data-est-tier]');
    const daysEl = this.root.querySelector('[data-est-days]');
    priceEl?.classList.toggle('is-loading', isLoading);
    if (isLoading) {
      if (tierEl) tierEl.textContent = '\u2026';
      if (priceEl) priceEl.textContent = '\u2026';
      if (daysEl) daysEl.textContent='\u2026';
    }
  }

  async update() {
    const loadId = ++this.loadId;
    this.setEstimateLoading(true);

    try {
      const payload = this.collect();
      const data = await this.api.post('/api/quote', payload);
      if (loadId !== this.loadId) return; // stale
      this.renderEstimate(data);
    } catch (error) {
      if (loadId !== this.loadId) return;
      const priceEl = this.root.querySelector('[data-est-price]');
      if (priceEl) priceEl.textContent = 'Unavailable';
      this.ui?.toast(`Could not calculate estimate. ${error.message}`, { type: 'error' });
    }
  }

  renderEstimate(data) {
    const tierEl = this.root.querySelector('[data-est-tier]');
    const priceEl = this.root.querySelector('[data-est-price]');
    const daysEl = this.root.querySelector('[data-est-days]');
    const hintEl = this.root.querySelector('[data-est-hint]');
    const breakdownEl = this.root.querySelector('[data-est-breakdown]');

    if (tierEl) tierEl.textContent = data.recommended_tier?.name ?? '';
    if (priceEl) priceEl.textContent = data.estimateLabel ?? formatCurrency(data.estimate_cents);
    if (daysEl) daysEl.textContent = data.delivery_label ?? '';
    if (hintEl) {
      hintEl.textContent = data.upscore_hint ?? 'This is the most complete tier. Nothing is left out.';
    }

    if (breakdownEl) {
      breakdownEl.innerHTML = (data.line_items ?? [])
        .map((item) => `<li>${item.label}</li>`)
        .join('');
    }
  }
}

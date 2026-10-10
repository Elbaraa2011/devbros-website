/**
 * PortfolioFilter: category filtering on work.html. Loads projects via
 * ApiClient. Skeleton cards cover the real pending request, and an error
 * state with retry covers failure.
 */
export class PortfolioFilter {
  constructor({ apiClient, uiController, container, filterBar } = {}) {
    this.api = apiClient;
    this.ui = uiController;
    this.container = container ?? document.querySelector('[data-projects-container]');
    this.filterBar = filterBar ?? document.querySelector('[data-filter-bar]');
    this.activeCategory = 'All';
    this.loadId = 0;

    this.init();
  }

  init() {
    if (!this.container) return;

    this.filterBar?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      this.setActiveTab(btn);
      this.activeCategory = btn.dataset.category;
      this.render();
      // Reflect state in URL so filters are deep-linkable
      const url = new URL(window.location.href);
      if (this.activeCategory === 'All') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', this.activeCategory);
      }
      window.history.replaceState({}, '', url);
    });

    // Restore category from URL for deep links
    const initial = new URLSearchParams(window.location.search).get('category');
    if (initial) {
      const tab = this.filterBar?.querySelector(`[data-category="${CSS.escape(initial)}"]`);
      if (tab) {
        this.setActiveTab(tab);
        this.activeCategory = initial;
      }
    }

    this.render();
  }

  setActiveTab(btn) {
    this.filterBar?.querySelectorAll('.filter-tab').forEach((t) => {
      t.classList.remove('is-active');
      t.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');
  }

  showSkeletons() {
    const count = 2;
    this.container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'skeleton-card';
      card.setAttribute('aria-hidden', 'true');
      card.innerHTML = `
        <div class="skeleton" style="width:90px;height:24px;margin-bottom:12px;"></div>
        <div class="skeleton" style="width:60%;height:28px;margin-bottom:16px;"></div>
        <div class="skeleton" style="width:100%;height:16px;margin-bottom:8px;"></div>
        <div class="skeleton" style="width:85%;height:16px;margin-bottom:20px;"></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
          <div class="skeleton" style="height:48px;"></div>
          <div class="skeleton" style="height:48px;"></div>
          <div class="skeleton" style="height:48px;"></div>
        </div>
      `;
      this.container.appendChild(card);
    }
  }

  renderError(message, retryCallback) {
    this.container.innerHTML = `
      <div class="error-state" role="alert">
        <h3>Could not load projects</h3>
        <p>${message}</p>
        <button type="button" class="btn btn--coral" data-retry>Try Again</button>
      </div>
    `;
    this.container.querySelector('[data-retry]').addEventListener('click', retryCallback);
  }

  async render() {
    const loadId = ++this.loadId;

    this.showSkeletons();

    try {
      const query = this.activeCategory === 'All' ? '' : `?category=${encodeURIComponent(this.activeCategory)}`;
      const data = await this.api.get(`/api/projects${query}`);
      if (loadId !== this.loadId) return; // stale response from a previous filter

      if (!data.projects?.length) {
        this.container.innerHTML = `
          <div class="error-state">
            <h3>No projects in this category yet</h3>
            <p>We keep the portfolio focused on recent work. Try another category, or ask us about the kind of build you need.</p>
            <button type="button" class="btn" data-reset>View All Projects</button>
          </div>
        `;
        this.container.querySelector('[data-reset]').addEventListener('click', () => {
          const all = this.filterBar?.querySelector('[data-category="All"]');
          if (all) all.click();
        });
        return;
      }

      this.container.innerHTML = data.projects.map((p, i) => this.renderProject(p, i)).join('');
      this.animateIn();
    } catch (error) {
      if (loadId !== this.loadId) return;
      this.renderError(error.message, () => this.render());
      this.ui?.toast(error.message, { type: 'error' });
    }
  }

  renderProject(p, index) {
    const metrics = (p.metrics ?? [])
      .map((m) => `<div><div class="metric__value">${m.value}</div><div class="metric__label">${m.label}</div></div>`)
      .join('');

    const services = (p.services ?? []).map((s) => `<span>${s}</span>`).join('');
    const stack = (p.stack ?? []).join(', ');

    return `
      <article class="project-card reveal" style="--stagger-index:${index}">
        <div class="project-card__top">
          <div>
            <div class="project-card__client">${p.clientType}, ${p.year}</div>
            <h3 style="margin-bottom:8px;">${p.title}</h3>
            <div class="project-card__stack">
              <span class="card__tag">${p.category}</span>
              <span class="card__tag">${stack}</span>
            </div>
          </div>
        </div>
        <p style="font-size:1rem;color:var(--color-body-strong);">${p.summary}</p>
        <div class="project-card__metrics">${metrics}</div>
        <p style="margin-bottom:16px;">${p.story}</p>
        <div class="project-card__services">${services}</div>
      </article>
    `;
  }

  animateIn() {
    this.container.querySelectorAll('.reveal').forEach((el) => {
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')));
    });
  }
}

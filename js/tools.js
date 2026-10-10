/**
 * Small shared helpers. Keep in one file to avoid module sprawl for
 * tiny utilities.
 */

/** Reveal-on-scroll via IntersectionObserver. Never window scroll listeners. */
export class RevealObserver {
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
  }

  observeAll(selector = '.reveal') {
    document.querySelectorAll(selector).forEach((el) => this.observer.observe(el));
  }
}

/** Formats currency using Intl (no hardcoded formats). */
export function formatCurrency(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(cents / 100);
}

/** Builds a tiny SVG icon. Only minimal set used across pages. */
export const icons = {
  code: '<path d="M8 6l-5 6 5 6"/><path d="M16 6l5 6-5 6"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  migrate: '<path d="M4 7h13M17 7l-3-3M17 7l-3 3"/><path d="M20 17H7M7 17l3-3M7 17l3 3"/>',
  form: '<path d="M4 6h16M4 10h16M4 14h10M4 18h7"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.4 11h11.2l2-8H6"/>',
  speed: '<path d="M12 20a8 8 0 1 1 8-8"/><path d="M12 12l4-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  shield: '<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/>'
};

/** Inline SVG helper */
export function svg(name, label) {
  const hidden = label ? '' : ' aria-hidden="true"';
  const role = label ? ` role="img" aria-label="${label}"` : '';
  return `<svg class="feature__icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${role}${hidden}>${icons[name]}</svg>`;
}

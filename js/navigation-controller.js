/**
 * NavigationController: sticky header scroll blur + mobile slide-out drawer.
 * Header uses rAF-batched scroll reads. No scroll listeners in hot paths.
 */
export class NavigationController {
  constructor({ header, toggle, drawer, activeLink } = {}) {
    this.header = header ?? document.querySelector('.site-header');
    this.toggle = toggle ?? document.querySelector('.nav-toggle');
    this.drawer = drawer ?? document.querySelector('.mobile-drawer');
    this.activeLink = activeLink; // marked by DevbrosApp before construction

    this.scrollTicking = false;
    this.bind();
  }

  bind() {
    // Active route highlighting: mark the link matching the current path.
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a, .mobile-drawer a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === current || (window.location.pathname.endsWith('/') && href === 'index.html')) {
        link.setAttribute('aria-current', 'page');
      }
    });

    if (this.header) {
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      this.onScroll();
    }

    if (this.toggle && this.drawer) {
      this.toggle.addEventListener('click', () => this.drawerOpen() ? this.close() : this.open());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.drawerOpen()) this.close();
      });
      this.drawer.querySelectorAll('a, button').forEach((el) => {
        el.addEventListener('click', () => this.close());
      });
    }
  }

  onScroll() {
    if (this.scrollTicking) return;
    this.scrollTicking = true;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY > 8;
      this.header?.classList.toggle('is-scrolled', scrolled);
      this.scrollTicking = false;
    });
  }

  drawerOpen() {
    return this.drawer?.classList.contains('is-open') ?? false;
  }

  open() {
    this.drawer?.classList.add('is-open');
    this.toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.drawer?.classList.remove('is-open');
    this.toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

/**
 * UIController: dynamic toast alert feed with auto-dismiss + modal dialogs.
 * Toasts are announced via aria-live polite region.
 */

const TOAST_ICONS = {
  success: '<svg class="toast__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12.5l2.5 2.5L16 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  error: '<svg class="toast__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.25" fill="currentColor"/></svg>',
  info: '<svg class="toast__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8" r="1.25" fill="currentColor"/></svg>'
};

export class UIController {
  constructor({ toastDuration = 5000 } = {}) {
    this.toastDuration = toastDuration;
    this.ensureLiveRegion();
  }

  ensureLiveRegion() {
    if (document.getElementById('toast-live-region')) return;
    const region = document.createElement('div');
    region.id = 'toast-live-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    region.className = 'visually-hidden';
    region.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;';
    document.body.appendChild(region);
  }

  toast(message, { type = 'info', duration } = {}) {
    let feed = document.querySelector('.toast-feed');
    if (!feed) {
      feed = document.createElement('div');
      feed.className = 'toast-feed';
      document.body.appendChild(feed);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');

    const icon = document.createElement('span');
    icon.innerHTML = TOAST_ICONS[type] ?? TOAST_ICONS.info;

    const text = document.createElement('span');
    text.textContent = message;

    const close = document.createElement('button');
    close.className = 'toast__close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    close.addEventListener('click', () => this.dismiss(toast));

    toast.append(icon, text, close);
    feed.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('is-visible'));
    });

    this.announce(message);
    const timeout = setTimeout(() => this.dismiss(toast), duration ?? this.toastDuration);
    toast.dataset.timeoutId = String(timeout);
    return toast;
  }

  dismiss(toast) {
    if (!toast || toast.dataset.dismissed === 'true') return;
    toast.dataset.dismissed = 'true';
    clearTimeout(Number(toast.dataset.timeoutId));
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }

  announce(message) {
    document.getElementById('toast-live-region')?.append(this.announceNode(message));
  }

  announceNode(message) {
    const p = document.createElement('p');
    p.textContent = message;
    setTimeout(() => p.remove(), 1000);
    return p;
  }

  /**
   * Modal. `builder` returns { title, body, actions: [{ label, onClick, variant }] }.
   * Focus is trapped inside; Escape closes; returns overlay element.
   */
  modal(builder) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const box = document.createElement('div');
    box.className = 'modal';

    const data = builder();
    const titleEl = document.createElement('h3');
    titleEl.textContent = data.title;
    const bodyEl = document.createElement('div');
    if (typeof data.body === 'string') {
      bodyEl.innerHTML = data.body; // only from trusted internal builders
    } else {
      bodyEl.append(data.body);
    }

    const actionRow = document.createElement('div');
    actionRow.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:24px;flex-wrap:wrap;';

    for (const action of data.actions ?? []) {
      const btn = document.createElement('button');
      btn.className = `btn ${action.variant === 'primary' ? 'btn--coral' : 'btn--ghost'}`;
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        action.onClick?.();
        if (action.closeOnClick ?? true) this.closeModal(overlay);
      });
      actionRow.appendChild(btn);
    }

    box.append(titleEl, bodyEl, actionRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const previouslyFocused = document.activeElement;
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal(overlay);
    });

    const keydown = (e) => {
      if (e.key === 'Escape') {
        this.closeModal(overlay);
      } else if (e.key === 'Tab') {
        // Simple focus trap
        const focusable = box.querySelectorAll('button, a, input, select, textarea');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    overlay.dataset.cleanup = '';

    // Focus first action by default
    setTimeout(() => (data.actions?.[0] ? box.querySelector('button')?.focus() : box.focus()), 100);
    overlay._previousFocus = previouslyFocused;
    overlay._keydown = keydown;
    return overlay;
  }

  closeModal(overlay) {
    overlay?.classList.remove('is-open');
    document.removeEventListener('keydown', overlay._keydown);
    setTimeout(() => {
      overlay?._previousFocus?.focus?.();
      overlay?.remove();
    }, 260);
  }
}

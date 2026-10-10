/**
 * ContactFormHandler: real-time input validation, error states, submission
 * loading states. Submits through ApiClient. Surfaces server-side field
 * errors inline. Fires UIController toasts on success or failure.
 */
export class ContactFormHandler {
  constructor({ form, apiClient, uiController } = {}) {
    this.form = form ?? document.querySelector('[data-contact-form]');
    this.api = apiClient;
    this.ui = uiController;
    this.submitBtn = this.form?.querySelector('button[type="submit"]');
    this.fields = {};
    this.validators = {
      name: (v) =>
        v.trim().length === 0 ? 'Enter your name.' :
        v.trim().length < 2 ? 'Name must be at least 2 characters.' : '',
      email: (v) =>
        v.trim().length === 0 ? 'Enter your email.' :
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address, like name@business.com.',
      phone: (v) => {
        const val = v.trim();
        if (val.length === 0) return '';
        return /^[+()\-.\s\d]{7,20}$/.test(val) ? '' : 'Enter a valid phone number, like (213) 555-0123.';
      },
      business_type: (v) => (v ? '' : 'Select your business type.'),
      project_details: (v) =>
        v.trim().length === 0 ? 'Describe your project.' :
        v.trim().length < 20 ? 'Tell us a bit more, at least 20 characters.' : '',
      budget_range: (v) => (v ? '' : 'Select a budget range.')
    };

    this.init();
  }

  init() {
    if (!this.form) return;

    this.form.querySelectorAll('input, select, textarea').forEach((el) => {
      const name = el.name;
      if (!name || name === 'website') return; // honeypot stays out of validation
      this.fields[name] = el;

      const eventName = el.tagName === 'SELECT' || el.type === 'email' ? 'change' : 'input';
      if (el.tagName === 'SELECT') {
        el.addEventListener('change', () => this.validateField(el));
      } else {
        // Real-time validation: on blur for focus-out, on input only when
        // the field already shows an error (progressive strictness).
        el.addEventListener('blur', () => this.validateField(el));
        el.addEventListener('input', () => {
          if (el.closest('.field')?.classList.contains('has-error')) {
            this.validateField(el);
          }
        });
      }
    });

    this.form.addEventListener('submit', (e) => this.onSubmit(e));
  }

  validateField(el) {
    const validator = this.validators[el.name];
    if (!validator) return true;
    const message = validator(el.value);
    this.renderFieldError(el, message);
    return message.length === 0;
  }

  renderFieldError(el, message) {
    const field = el.closest('.field');
    if (!field) return;
    const errorEl = field.querySelector('.error-message');
    field.classList.toggle('has-error', Boolean(message));
    if (errorEl) errorEl.textContent = message;
  }

  validateAll() {
    let firstInvalid = null;
    for (const [name, el] of Object.entries(this.fields)) {
      if (!this.validateField(el) && !firstInvalid) firstInvalid = el;
    }
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return !firstInvalid;
  }

  setLoading(isLoading) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = isLoading;
    this.submitBtn.setAttribute('aria-busy', String(isLoading));

    if (isLoading) {
      this.originalLabel = this.submitBtn.textContent;
      this.submitBtn.dataset.originalLabel = this.originalLabel;
      this.submitBtn.innerHTML =
        '<span class="btn__spinner" aria-hidden="true"></span> Sending\u2026';
    } else {
      this.submitBtn.textContent = this.submitBtn.dataset.originalLabel ?? 'Send Inquiry';
      this.submitBtn.removeAttribute('aria-busy');
    }
  }

  async onSubmit(event) {
    event.preventDefault();
    if (this.isSubmitting) return;

    // Honeypot field stays hidden from humans; if filled, pretend success
    const honeypot = this.form.querySelector('[name="website"]');
    if (honeypot?.value) {
      this.ui?.toast('Thanks. We will reply today.', { type: 'success' });
      this.form.reset();
      return;
    }

    if (!this.validateAll()) return;

    const payload = {
      name: this.fields.name.value,
      email: this.fields.email.value,
      phone: this.fields.phone?.value ?? '',
      business_type: this.fields.business_type.value,
      interested_tier: this.fields.interested_tier?.value ?? '',
      project_details: this.fields.project_details.value,
      budget_range: this.fields.budget_range.value
    };

    this.isSubmitting = true;
    this.setLoading(true);

    try {
      const data = await this.api.post('/api/contact', payload);
      this.ui?.toast(data.message ?? 'Thanks. Your inquiry is in.', { type: 'success' });
      this.form.reset();
      this.form.querySelector('.field.has-error')?.classList.remove('has-error');
    } catch (error) {
      if (error.fields) {
        for (const [fieldName, message] of Object.entries(error.fields)) {
          const el = this.fields[fieldName];
          if (el) {
            this.renderFieldError(el, message);
          }
        }
        this.ui?.toast('Fix the highlighted fields and submit again.', { type: 'error' });
      } else {
        this.ui?.toast(error.message ?? 'Submission failed. Try again, or email devbros40@gmail.com.', { type: 'error' });
      }
    } finally {
      this.isSubmitting = false;
      this.setLoading(false);
    }
  }
}

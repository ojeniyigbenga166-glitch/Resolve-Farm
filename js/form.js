/**
 * RESOLVEFARM - Form Validation & Interactive FAQ Module
 * Handles frontend contact form validation, toast alert notifications, and interactive FAQ accordions.
 */

class FormValidator {
  constructor(formElement) {
    if (!formElement) return;
    this.form = formElement;
    this.nameInput = this.form.querySelector('#name');
    this.emailInput = this.form.querySelector('#email');
    this.subjectSelect = this.form.querySelector('#subject');
    this.messageInput = this.form.querySelector('#message');
    this.submitBtn = this.form.querySelector('.btn-send-message, .btn-submit-form');
    this.alertToast = document.querySelector('#form-toast');

    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Clear validation error state when user types or changes input
    [this.nameInput, this.emailInput, this.messageInput].forEach(input => {
      if (input) {
        input.addEventListener('input', () => {
          input.classList.remove('is-invalid');
        });
      }
    });

    if (this.subjectSelect) {
      this.subjectSelect.addEventListener('change', () => {
        this.subjectSelect.classList.remove('is-invalid');
      });
    }
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  handleSubmit(e) {
    e.preventDefault();

    let isValid = true;

    // Name check
    if (!this.nameInput || this.nameInput.value.trim().length < 2) {
      this.showError(this.nameInput);
      isValid = false;
    }

    // Email check
    if (!this.emailInput || !this.validateEmail(this.emailInput.value.trim())) {
      this.showError(this.emailInput);
      isValid = false;
    }

    // Message check
    if (!this.messageInput || this.messageInput.value.trim().length < 10) {
      this.showError(this.messageInput);
      isValid = false;
    }

    if (!isValid) {
      this.showToast('error', 'Please fill in all required fields accurately.');
      return;
    }

    // Simulate submission loading state
    const originalText = this.submitBtn.innerHTML;
    this.submitBtn.disabled = true;
    this.submitBtn.innerHTML = `
      <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
      Sending Message...
    `;

    setTimeout(() => {
      this.submitBtn.disabled = false;
      this.submitBtn.innerHTML = originalText;
      this.form.reset();
      this.showToast('success', 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.');
    }, 1200);
  }

  showError(input) {
    if (input) {
      input.classList.add('is-invalid');
      input.style.borderColor = '#D94A38';
      input.style.backgroundColor = '#FFF8F7';
      input.focus();
      // Auto clear style after user types
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        input.style.borderColor = '';
        input.style.backgroundColor = '';
      }, { once: true });
    }
  }

  showToast(type, message) {
    if (!this.alertToast) return;

    this.alertToast.className = `form-alert-toast ${type}`;
    this.alertToast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span>${message}</span>
    `;

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      this.alertToast.className = 'form-alert-toast';
    }, 6000);
  }
}

/* FAQ Accordion Controller */
class FAQAccordion {
  constructor() {
    this.items = document.querySelectorAll('.faq-item');
    this.init();
  }

  init() {
    this.items.forEach(item => {
      const questionBtn = item.querySelector('.faq-question');
      if (questionBtn) {
        questionBtn.addEventListener('click', () => {
          const isActive = item.classList.contains('active');

          // Close other items
          this.items.forEach(other => other.classList.remove('active'));

          // Toggle current item
          if (!isActive) {
            item.classList.add('active');
          }
        });
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) new FormValidator(contactForm);
  new FAQAccordion();
});

// Keyframe animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

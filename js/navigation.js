/**
 * RESOLVEFARM - Navigation Module
 * Responsible for mobile navigation, header state on scroll, active navigation state.
 */

class Navigation {
  constructor() {
    this.header = document.querySelector('header');
    this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkScroll();
  }

  bindEvents() {
    window.addEventListener('scroll', () => this.checkScroll());
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
    }
  }

  checkScroll() {
    if (window.scrollY > 50) {
      this.header?.classList.add('is-sticky');
    } else {
      this.header?.classList.remove('is-sticky');
    }
  }

  toggleMobileMenu() {
    // Implementation for mobile menu toggle
  }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => new Navigation());

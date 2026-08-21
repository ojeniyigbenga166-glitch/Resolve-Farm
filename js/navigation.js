/**
 * RESOLVEFARM - Navigation Module
 * Responsible for mobile navigation, header state on scroll, active navigation state.
 */

class Navigation {
  constructor() {
    this.header = document.querySelector('.site-header');
    this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    this.mobileCloseBtn = document.querySelector('.mobile-nav-close');
    this.mobileNav = document.querySelector('.mobile-nav');
    this.mobileOverlay = document.querySelector('.mobile-nav-overlay');
    this.mobileNavLinks = document.querySelectorAll('.mobile-nav a');
    this.isOpen = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkScroll();
    this.setActiveLink();
  }

  bindEvents() {
    window.addEventListener('scroll', () => this.checkScroll());

    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
    }

    if (this.mobileCloseBtn) {
      this.mobileCloseBtn.addEventListener('click', () => this.closeMobileMenu());
    }

    // Close on overlay click
    if (this.mobileOverlay) {
      this.mobileOverlay.addEventListener('click', () => this.closeMobileMenu());
    }

    // Close on nav link click
    this.mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => this.closeMobileMenu());
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.closeMobileMenu();
    });
  }

  checkScroll() {
    if (window.scrollY > 50) {
      this.header?.classList.add('is-sticky');
    } else {
      this.header?.classList.remove('is-sticky');
    }
  }

  toggleMobileMenu() {
    this.isOpen ? this.closeMobileMenu() : this.openMobileMenu();
  }

  openMobileMenu() {
    this.isOpen = true;
    this.mobileMenuBtn?.classList.add('is-active');
    this.mobileNav?.classList.add('is-open');
    this.mobileOverlay?.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  closeMobileMenu() {
    this.isOpen = false;
    this.mobileMenuBtn?.classList.remove('is-active');
    this.mobileNav?.classList.remove('is-open');
    this.mobileOverlay?.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  setActiveLink() {
    let currentPage = window.location.pathname.split('/').pop() || 'index';
    if (currentPage === 'index.html') currentPage = 'index';

    document.querySelectorAll('.site-header nav a, .mobile-nav a').forEach(link => {
      let linkPage = link.getAttribute('href')?.split('/').pop() || '';
      if (linkPage === 'index.html' || linkPage === '') linkPage = 'index';
      if (linkPage === currentPage) {
        link.classList.add('active');
      }
    });
  }
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => new Navigation());

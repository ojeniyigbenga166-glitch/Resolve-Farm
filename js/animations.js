/**
 * RESOLVEFARM - Animations Module
 * Responsible for scroll reveal, IntersectionObserver animations.
 * Uses progressive enhancement: elements are visible by default,
 * and the .js-animate class is added to <body> to enable animations.
 */

class Animations {
  constructor() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.prefersReducedMotion) {
      // Reduced motion: don't hide elements, skip animations entirely
      return;
    }

    // Mark body so CSS knows JS animations are active
    // This causes .fade-in elements to become opacity: 0
    document.body.classList.add('js-animate');

    // Use requestAnimationFrame to ensure layout is painted before observing
    requestAnimationFrame(() => {
      this.initScrollReveal();
    });
  }

  initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Once revealed, unobserve to avoid the element disappearing on scroll back
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -30px 0px" });

    const selectors = '.fade-in, .scale-in, .slide-in-left, .slide-in-right';
    document.querySelectorAll(selectors).forEach(el => observer.observe(el));
  }
}

document.addEventListener('DOMContentLoaded', () => new Animations());


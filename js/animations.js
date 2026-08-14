/**
 * RESOLVEFARM - Animations Module
 * Responsible for scroll reveal, IntersectionObserver animations.
 */

class Animations {
  constructor() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.prefersReducedMotion) {
      this.init();
    }
  }

  init() {
    this.initScrollReveal();
  }

  initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          // Remove the class when out of view so the animation replays when scrolling back
          entry.target.classList.remove('is-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    const selectors = '.fade-in, .scale-in, .slide-in-left, .slide-in-right';
    document.querySelectorAll(selectors).forEach(el => observer.observe(el));
  }
}

document.addEventListener('DOMContentLoaded', () => new Animations());

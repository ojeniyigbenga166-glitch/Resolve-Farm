/**
 * RESOLVEFARM - Hero Banner Carousel Controller
 * Controls auto-play, slide transitions, navigation arrows, dot indicators, and mobile touch swipe.
 */

export class HeroCarousel {
  constructor(carouselId = 'hero-carousel', autoPlayInterval = 7000) {
    this.container = document.getElementById(carouselId);
    if (!this.container) return;

    this.slides = Array.from(this.container.querySelectorAll('.hero-slide'));
    this.dots = Array.from(this.container.querySelectorAll('.hero-dot'));
    this.prevBtn = this.container.querySelector('.hero-carousel-prev');
    this.nextBtn = this.container.querySelector('.hero-carousel-next');

    if (!this.slides.length) return;

    this.currentIndex = 0;
    this.autoPlayInterval = autoPlayInterval;
    this.timer = null;

    // Touch variables
    this.touchStartX = 0;
    this.touchEndX = 0;

    this.init();
  }

  init() {
    this.showSlide(this.currentIndex);
    this.startAutoPlay();

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.prev();
        this.resetAutoPlay();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.next();
        this.resetAutoPlay();
      });
    }

    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.goTo(index);
        this.resetAutoPlay();
      });
    });

    // Touch events for mobile swiping
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  showSlide(index) {
    if (index < 0) {
      this.currentIndex = this.slides.length - 1;
    } else if (index >= this.slides.length) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = index;
    }

    this.slides.forEach((slide, idx) => {
      const isActive = idx === this.currentIndex;
      slide.classList.toggle('is-active', isActive);
    });

    this.dots.forEach((dot, idx) => {
      const isActive = idx === this.currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  }

  next() {
    this.showSlide(this.currentIndex + 1);
  }

  prev() {
    this.showSlide(this.currentIndex - 1);
  }

  goTo(index) {
    this.showSlide(index);
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.timer = setInterval(() => this.next(), this.autoPlayInterval);
  }

  stopAutoPlay() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resetAutoPlay() {
    this.startAutoPlay();
  }

  handleSwipe() {
    const swipeThreshold = 40;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
      this.resetAutoPlay();
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new HeroCarousel());
} else {
  new HeroCarousel();
}

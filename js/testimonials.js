/**
 * RESOLVEFARM - Testimonials Module
 * Handles the rotation and interaction of the testimonials section.
 */

class Testimonials {
  constructor() {
    this.testimonials = [
      {
        quote: "RESOLVEFARM peppers are always fresh, clean and full of flavour. I highly recommend them to anyone looking for quality produce!",
        author: "Adewale A.",
        role: "Restaurant Owner"
      },
      {
        quote: "Their commitment to organic farming is evident in the taste. The tomatoes are the best I've ever had!",
        author: "Sarah L.",
        role: "Home Chef"
      },
      {
        quote: "Reliable delivery and consistently amazing quality. RESOLVEFARM has transformed our weekly grocery shopping.",
        author: "Michael T.",
        role: "Local Grocer"
      }
    ];

    this.currentIndex = 0;
    this.init();
  }

  init() {
    this.card = document.getElementById('testimonial-card');
    if (!this.card) return; // Only run if we are on a page with testimonials

    this.quoteEl = this.card.querySelector('.testimonial-body');
    this.authorEl = this.card.querySelector('.author-name');
    this.roleEl = this.card.querySelector('.author-role');
    
    this.prevBtn = document.querySelector('.testimonial-prev');
    this.nextBtn = document.querySelector('.testimonial-next');
    this.dots = document.querySelectorAll('.testimonial-dots .dot');

    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());

    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goTo(index));
    });

    // Auto rotate every 5 seconds
    this.startAutoRotate();
    
    // Pause auto-rotation on hover
    this.card.addEventListener('mouseenter', () => this.stopAutoRotate());
    this.card.addEventListener('mouseleave', () => this.startAutoRotate());
  }

  updateUI() {
    const data = this.testimonials[this.currentIndex];
    
    // Add a quick fade out/in effect
    this.quoteEl.style.opacity = 0;
    this.authorEl.style.opacity = 0;
    this.roleEl.style.opacity = 0;

    setTimeout(() => {
      this.quoteEl.innerHTML = `&ldquo;${data.quote}&rdquo;`;
      this.authorEl.innerHTML = `— ${data.author}`;
      this.roleEl.innerHTML = data.role;
      
      this.quoteEl.style.opacity = 1;
      this.authorEl.style.opacity = 1;
      this.roleEl.style.opacity = 1;
    }, 300);

    // Add transitions for smooth fade
    this.quoteEl.style.transition = 'opacity 0.3s ease';
    this.authorEl.style.transition = 'opacity 0.3s ease';
    this.roleEl.style.transition = 'opacity 0.3s ease';

    // Update dots
    this.dots.forEach((dot, index) => {
      if (index === this.currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
    this.updateUI();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
    this.updateUI();
  }

  goTo(index) {
    this.currentIndex = index;
    this.updateUI();
  }

  startAutoRotate() {
    this.interval = setInterval(() => this.next(), 5000);
  }

  stopAutoRotate() {
    clearInterval(this.interval);
  }
}

document.addEventListener('DOMContentLoaded', () => new Testimonials());

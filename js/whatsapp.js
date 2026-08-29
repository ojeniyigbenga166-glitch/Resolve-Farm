/**
 * RESOLVEFARM - WhatsApp Floating Widget Module
 * Dynamically injects a premium floating WhatsApp button at the bottom-right of the site,
 * and updates any empty/placeholder WhatsApp links in the footer to point to the active WhatsApp number.
 */

class WhatsAppWidget {
  constructor(phoneNumber = '15146297097') {
    this.phoneNumber = phoneNumber;
    this.init();
  }

  init() {
    // 1. Inject the floating WhatsApp widget
    this.createWidget();
    
    // 2. Update existing WhatsApp links in the footer/social areas
    this.updateFooterLinks();
  }

  createWidget() {
    // Prevent duplicate injections
    if (document.getElementById('whatsapp-floating-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'whatsapp-floating-widget';
    widget.className = 'whatsapp-widget';

    // Premium WhatsApp icon (SVG)
    const svgIcon = `
      <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.551 4.101 1.517 5.832L0 24l6.335-1.485C8.016 23.46 9.957 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.805 0-3.561-.476-5.111-1.378l-.367-.212-3.793.889.907-3.694-.233-.377A9.955 9.955 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
      </svg>
    `;

    const message = encodeURIComponent("Hello RESOLVEFARM, I'm visiting your website and would like to make an inquiry.");
    const waUrl = `https://wa.me/${this.phoneNumber}?text=${message}`;

    widget.innerHTML = `
      <a href="${waUrl}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="whatsapp-btn" 
         aria-label="Chat with us on WhatsApp">
        <span class="whatsapp-pulse"></span>
        <span class="whatsapp-icon-wrap">${svgIcon}</span>
        <span class="whatsapp-tooltip">Chat with us</span>
      </a>
    `;

    document.body.appendChild(widget);
  }

  updateFooterLinks() {
    const message = encodeURIComponent("Hello RESOLVEFARM, I'm visiting your website and would like to make an inquiry.");
    const waUrl = `https://wa.me/${this.phoneNumber}?text=${message}`;

    // Find all social icons / footer links that target WhatsApp and point to the real link
    const waLinks = document.querySelectorAll('a[aria-label="WhatsApp"], a[href*="whatsapp"], a[href*="wa.me"]');
    waLinks.forEach(link => {
      link.href = waUrl;
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new WhatsAppWidget());
} else {
  new WhatsAppWidget();
}

import { supabase } from './supabaseClient.js';

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadGalleryLogs() {
  try {
    const { data: logs, error } = await supabase
      .from('gallery_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!logs || logs.length === 0) return;

    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    const logsHtml = logs
      .map((log) => {
        let category = 'crops';
        const dbCat = (log.category || '').toLowerCase();
        if (dbCat.includes('farm') || dbCat.includes('fields')) {
          category = 'farm';
        } else if (dbCat.includes('video')) {
          category = 'video';
        }

        const title = log.title || 'Farm Update';
        const caption = log.description || `Log for ${log.crop || 'produce'}.`;
        const img = log.img || '/assets/images/produce/placeholder.jpg';
        const author = log.author_name || 'Resolve Farm';

        let telemetryHtml = '';
        if (log.telemetry && typeof log.telemetry === 'object') {
          const t = log.telemetry;
          const telItems = [];
          if (t.stage && t.stage !== 'N/A') telItems.push(`Stage: ${t.stage}`);
          if (t.moisture && t.moisture !== 'N/A') telItems.push(`Moisture: ${t.moisture}`);
          if (t.ph && t.ph !== 'N/A') telItems.push(`pH: ${t.ph}`);
          if (t.temp && t.temp !== 'N/A') telItems.push(`Temp: ${t.temp}`);
          if (telItems.length > 0) {
            telemetryHtml = ` | Telemetry: [${telItems.join(', ')}]`;
          }
        }

        return `
          <div class="gallery-item fade-in is-visible" data-category="${category}" data-title="${escapeHtml(title)}" data-caption="${escapeHtml(caption)} - by ${escapeHtml(author)}${escapeHtml(telemetryHtml)}" data-full-src="${escapeHtml(img)}">
            <div class="gallery-thumb-wrap">
              <img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy">
              <div class="gallery-overlay">
                <span class="gallery-badge">${escapeHtml(log.category || 'Crops & Harvest')}</span>
                <div class="gallery-overlay-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                </div>
              </div>
            </div>
            <div class="gallery-card-info">
              <h3>${escapeHtml(title)}</h3>
              <p>${escapeHtml(caption)} - by ${escapeHtml(author)}</p>
            </div>
          </div>
        `;
      })
      .join('');

    grid.insertAdjacentHTML('afterbegin', logsHtml);
  } catch (err) {
    console.error('Failed to load gallery logs from Supabase:', err);
  }
}

class Gallery {
  constructor() {
    this.items = Array.from(document.querySelectorAll('.gallery-item'));
    this.filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
    this.lightbox = document.getElementById('gallery-lightbox');
    this.lightboxMediaContainer = document.querySelector('.lightbox-media-container');
    this.lightboxTitle = document.querySelector('.lightbox-info h4');
    this.lightboxDesc = document.querySelector('.lightbox-info p');
    this.lightboxCounter = document.querySelector('.lightbox-counter');
    this.lightboxClose = document.querySelector('.lightbox-close-btn');
    this.lightboxPrev = document.querySelector('.lightbox-prev');
    this.lightboxNext = document.querySelector('.lightbox-next');

    this.activeFilter = 'all';
    this.visibleItems = [...this.items];
    this.currentIndex = 0;

    this.init();
  }

  init() {
    if (!this.items.length) return;

    this.updateFilterCounts();
    this.bindFilterEvents();
    this.bindLightboxEvents();
    this.bindKeyboardEvents();
  }

  updateFilterCounts() {
    const counts = {
      all: this.items.length,
      crops: 0,
      farm: 0,
      video: 0
    };

    this.items.forEach(item => {
      const cat = item.dataset.category;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });

    this.filterBtns.forEach(btn => {
      const filter = btn.dataset.filter;
      const countSpan = btn.querySelector('.filter-count');
      if (countSpan && counts[filter] !== undefined) {
        countSpan.textContent = counts[filter];
      }
    });
  }

  bindFilterEvents() {
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        if (filter === this.activeFilter) return;

        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = filter;

        this.filterItems(filter);
      });
    });
  }

  filterItems(category) {
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
    if (this.cleanTimeout) clearTimeout(this.cleanTimeout);

    // 1. Fade out all items
    this.items.forEach(item => {
      item.style.transition = 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
      item.style.opacity = '0';
      item.style.transform = 'scale(0.95) translateY(10px)';
    });

    // 2. Wait for fade-out, then update visibility and fade back in
    this.filterTimeout = setTimeout(() => {
      this.visibleItems = [];

      this.items.forEach(item => {
        const itemCat = item.dataset.category;
        const shouldShow = (category === 'all' || itemCat === category);

        if (shouldShow) {
          item.classList.remove('hidden');
          this.visibleItems.push(item);
          
          // Force layout reflow
          void item.offsetHeight;
          
          // Fade and scale in
          item.style.opacity = '1';
          item.style.transform = 'scale(1) translateY(0)';
        } else {
          item.classList.add('hidden');
        }
      });
      
      // Clean up styles after transition to let hover styles take over properly
      this.cleanTimeout = setTimeout(() => {
        this.items.forEach(item => {
          if (!item.classList.contains('hidden')) {
            item.style.transition = '';
            item.style.opacity = '';
            item.style.transform = '';
          }
        });
        this.filterTimeout = null;
        this.cleanTimeout = null;
      }, 250);
      
    }, 200);
  }

  bindLightboxEvents() {
    this.items.forEach(item => {
      item.addEventListener('click', (e) => {
        // Find current index in visible items
        const index = this.visibleItems.indexOf(item);
        if (index !== -1) {
          this.openLightbox(index);
        }
      });
    });

    if (this.lightboxClose) {
      this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    }

    if (this.lightbox) {
      this.lightbox.addEventListener('click', (e) => {
        if (e.target === this.lightbox) {
          this.closeLightbox();
        }
      });
    }

    if (this.lightboxPrev) {
      this.lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigate(-1);
      });
    }

    if (this.lightboxNext) {
      this.lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigate(1);
      });
    }
  }

  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox || !this.lightbox.classList.contains('active')) return;

      if (e.key === 'Escape') {
        this.closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        this.navigate(-1);
      } else if (e.key === 'ArrowRight') {
        this.navigate(1);
      }
    });
  }

  openLightbox(index) {
    this.currentIndex = index;
    this.updateLightboxContent();
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    if (!this.lightbox) return;

    // Pause video if playing in lightbox
    const video = this.lightboxMediaContainer.querySelector('video');
    if (video) {
      video.pause();
    }

    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  navigate(direction) {
    if (!this.visibleItems.length) return;

    // Pause current video if any
    const video = this.lightboxMediaContainer.querySelector('video');
    if (video) {
      video.pause();
    }

    this.currentIndex = (this.currentIndex + direction + this.visibleItems.length) % this.visibleItems.length;
    this.updateLightboxContent();
  }

  updateLightboxContent() {
    const item = this.visibleItems[this.currentIndex];
    if (!item) return;

    const title = item.dataset.title || '';
    const desc = item.dataset.caption || '';
    const category = item.dataset.category || '';
    const imageSrc = item.dataset.fullSrc || item.querySelector('img')?.src;
    const videoSrc = item.dataset.videoSrc;

    this.lightboxMediaContainer.innerHTML = '';

    if (videoSrc) {
      const videoEl = document.createElement('video');
      videoEl.src = videoSrc;
      videoEl.controls = true;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.setAttribute('controlsList', 'nodownload');
      this.lightboxMediaContainer.appendChild(videoEl);
    } else if (imageSrc) {
      const imgEl = document.createElement('img');
      imgEl.src = imageSrc;
      imgEl.alt = title;
      this.lightboxMediaContainer.appendChild(imgEl);
    }

    if (this.lightboxTitle) this.lightboxTitle.textContent = title;
    if (this.lightboxDesc) this.lightboxDesc.textContent = desc;
    if (this.lightboxCounter) {
      this.lightboxCounter.textContent = `${this.currentIndex + 1} of ${this.visibleItems.length}`;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await loadGalleryLogs();
    new Gallery();
  });
} else {
  (async () => {
    await loadGalleryLogs();
    new Gallery();
  })();
}

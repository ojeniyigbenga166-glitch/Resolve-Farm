import os
import re

project_dir = r"c:\Users\Administrator\Desktop\Resolve Farm canada"
html_files = []

# Collect all html files
for root, dirs, files in os.walk(project_dir):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git')]
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

# Mobile nav markup to inject — paths differ for root vs pages/
mobile_nav_root = '''
  <!-- MOBILE NAV OVERLAY -->
  <div class="mobile-nav-overlay"></div>

  <!-- MOBILE NAV DRAWER -->
  <nav class="mobile-nav" aria-label="Mobile Navigation">
    <div class="mobile-nav-header">
      <div class="logo">
        <a href="index.html">
          <div class="logo-top">
            <span class="logo-res" style="color:#fff;">RES</span>
            <span class="logo-tomato">
              <svg viewBox="0 0 24 24" fill="var(--color-tomato)" width="16" height="16">
                <path d="M12 21.5c-4.4 0-8-3.6-8-8 0-3.3 2-6.2 5-7.4v-1.1c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v1.1c3 1.2 5 4.1 5 7.4 0 4.4-3.6 8-8 8z"/>
              </svg>
            </span>
            <span class="logo-lve" style="color:#fff;">LVE</span>
          </div>
          <div class="logo-bottom"><span class="logo-farms" style="font-size:0.65rem;">FARMS</span></div>
        </a>
      </div>
      <button class="mobile-nav-close" aria-label="Close menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <ul class="mobile-nav-links">
      <li><a href="index.html">Home</a></li>
      <li><a href="pages/about.html">About</a></li>
      <li><a href="pages/farm.html">Our Farm</a></li>
      <li><a href="pages/gallery.html">Gallery</a></li>
      <li><a href="pages/contact.html">Contact</a></li>
    </ul>
    <div class="mobile-nav-cta">
      <a href="pages/contact.html" class="btn btn-primary">Get In Touch
        <span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
      </a>
    </div>
  </nav>'''

mobile_nav_pages = '''
  <!-- MOBILE NAV OVERLAY -->
  <div class="mobile-nav-overlay"></div>

  <!-- MOBILE NAV DRAWER -->
  <nav class="mobile-nav" aria-label="Mobile Navigation">
    <div class="mobile-nav-header">
      <div class="logo">
        <a href="../index.html">
          <div class="logo-top">
            <span class="logo-res" style="color:#fff;">RES</span>
            <span class="logo-tomato">
              <svg viewBox="0 0 24 24" fill="var(--color-tomato)" width="16" height="16">
                <path d="M12 21.5c-4.4 0-8-3.6-8-8 0-3.3 2-6.2 5-7.4v-1.1c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v1.1c3 1.2 5 4.1 5 7.4 0 4.4-3.6 8-8 8z"/>
              </svg>
            </span>
            <span class="logo-lve" style="color:#fff;">LVE</span>
          </div>
          <div class="logo-bottom"><span class="logo-farms" style="font-size:0.65rem;">FARMS</span></div>
        </a>
      </div>
      <button class="mobile-nav-close" aria-label="Close menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <ul class="mobile-nav-links">
      <li><a href="../index.html">Home</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="farm.html">Our Farm</a></li>
      <li><a href="gallery.html">Gallery</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>
    <div class="mobile-nav-cta">
      <a href="contact.html" class="btn btn-primary">Get In Touch
        <span class="btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
      </a>
    </div>
  </nav>'''

updated = 0
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already injected
    if 'mobile-nav-overlay' in content:
        print(f"SKIP (already has mobile nav): {os.path.relpath(filepath, project_dir)}")
        continue

    # Determine which version to use
    is_pages = os.path.dirname(filepath).endswith('pages')
    nav_html = mobile_nav_pages if is_pages else mobile_nav_root

    # Inject right after </header>
    new_content = content.replace('</header>', '</header>' + nav_html, 1)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"UPDATED: {os.path.relpath(filepath, project_dir)}")
        updated += 1
    else:
        print(f"NO CHANGE: {os.path.relpath(filepath, project_dir)}")

print(f"\nDone. {updated} files updated.")

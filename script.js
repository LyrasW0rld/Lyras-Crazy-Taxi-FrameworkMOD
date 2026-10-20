/* =============================================
   Crazy Taxi Ultimate Mod Menu & Restoration Suite
   Interactive Script (v0.85)
   ============================================= */

(function () {
  'use strict';

  // ----------------------------------------------------
  // 1. Navigation Scroll Effect & Mobile Hamburger
  // ----------------------------------------------------
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', function () {
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }
  }, { passive: true });

  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // Helper to generate Google Drive video preview URL with 1080p quality parameters
  function buildDriveVideoUrl(videoId) {
    return 'https://drive.google.com/file/d/' + videoId + '/preview?vq=hd1080&hd=1';
  }

  // ----------------------------------------------------
  // 2. Feature Matrix: Table Expandable Cinema Players
  // ----------------------------------------------------
  const demoButtons = document.querySelectorAll('.demo-trigger-btn');
  const drawerRows = document.querySelectorAll('.video-drawer-row');
  const featureRows = document.querySelectorAll('.feature-row');

  function closeAllDrawers() {
    drawerRows.forEach(function (drawer) {
      drawer.classList.remove('open');
      const iframe = drawer.querySelector('iframe');
      if (iframe) {
        iframe.removeAttribute('src');
      }
    });

    featureRows.forEach(function (row) {
      row.classList.remove('row-active');
    });

    demoButtons.forEach(function (btn) {
      btn.classList.remove('active');
      const textSpan = btn.querySelector('.btn-text');
      if (textSpan) textSpan.textContent = 'Watch Video';
    });
  }

  demoButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();

      const videoId = btn.getAttribute('data-video-id');
      const parentRow = btn.closest('.feature-row');
      const featureId = parentRow ? parentRow.getAttribute('data-feature-id') : null;
      const targetDrawer = document.getElementById('drawer-' + featureId);

      if (!targetDrawer || !videoId) return;

      const isAlreadyOpen = targetDrawer.classList.contains('open');

      // Close all active drawers first
      closeAllDrawers();

      if (!isAlreadyOpen) {
        // Open the selected drawer
        targetDrawer.classList.add('open');
        parentRow.classList.add('row-active');
        btn.classList.add('active');
        const textSpan = btn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = 'Close Video ✕';

        const iframe = targetDrawer.querySelector('iframe');
        if (iframe) {
          // Set stream URL requesting 1080p resolution
          iframe.src = buildDriveVideoUrl(videoId);
        }

        // Smooth scroll to position player nicely in view
        setTimeout(function () {
          const navOffset = (nav ? nav.offsetHeight : 88) + 16;
          const rect = targetDrawer.getBoundingClientRect();
          const targetY = window.pageYOffset + rect.top - navOffset;

          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });
        }, 120);
      }
    });
  });

  // Drawer Close Buttons
  document.querySelectorAll('.drawer-close-btn').forEach(function (closeBtn) {
    closeBtn.addEventListener('click', function () {
      closeAllDrawers();
    });
  });

  // ----------------------------------------------------
  // 3. Feature Matrix: Category Filtering
  // ----------------------------------------------------
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      const selectedFilter = btn.getAttribute('data-filter');

      // Close open video players when switching filters to prevent misalignment
      closeAllDrawers();

      featureRows.forEach(function (row) {
        const rowCategory = row.getAttribute('data-category');
        const featureId = row.getAttribute('data-feature-id');
        const drawer = document.getElementById('drawer-' + featureId);

        if (selectedFilter === 'all' || rowCategory === selectedFilter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
          if (drawer) drawer.style.display = 'none';
        }
      });
    });
  });

  // ----------------------------------------------------
  // 4. Installation Walkthrough Large Cinema Player
  // ----------------------------------------------------
  const launchInstallBtn = document.getElementById('launch-install-video-btn');
  const installContainer = document.getElementById('install-video-container');
  const installIframe = document.getElementById('install-video-iframe');

  if (launchInstallBtn && installContainer && installIframe) {
    launchInstallBtn.addEventListener('click', function () {
      const videoId = launchInstallBtn.getAttribute('data-video-id');
      const isVisible = installContainer.style.display !== 'none';

      if (!isVisible) {
        // Set stream URL requesting 1080p resolution
        installIframe.src = buildDriveVideoUrl(videoId);
        installContainer.style.display = 'block';
        launchInstallBtn.textContent = '✕ Close Video Player';
        launchInstallBtn.classList.remove('btn-primary');
        launchInstallBtn.classList.add('btn-ghost');

        setTimeout(function () {
          const navOffset = (nav ? nav.offsetHeight : 88) + 16;
          const rect = installContainer.getBoundingClientRect();
          window.scrollTo({
            top: window.pageYOffset + rect.top - navOffset,
            behavior: 'smooth'
          });
        }, 100);
      } else {
        installIframe.removeAttribute('src');
        installContainer.style.display = 'none';
        launchInstallBtn.textContent = '▶ Load Video Player';
        launchInstallBtn.classList.add('btn-primary');
        launchInstallBtn.classList.remove('btn-ghost');
      }
    });
  }

  // ----------------------------------------------------
  // 5. Technical Tabs Navigation (Memory Engine)
  // ----------------------------------------------------
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabButtons.forEach(function (t) { t.classList.remove('active'); });
      tabPanes.forEach(function (p) { p.classList.remove('active'); });

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // ----------------------------------------------------
  // 6. Active Nav Highlighting on Scroll
  // ----------------------------------------------------
  const observedSections = document.querySelectorAll('section[id], header[id]');
  const navAnchorLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 140;
    let currentId = '';

    observedSections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) {
        currentId = sec.getAttribute('id');
      }
    });

    navAnchorLinks.forEach(function (anchor) {
      const href = anchor.getAttribute('href');
      if (href === '#' + currentId) {
        anchor.style.color = '#f5c518';
      } else {
        anchor.style.color = '';
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

})();

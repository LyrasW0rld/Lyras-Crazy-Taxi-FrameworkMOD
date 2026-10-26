

(function () {
  'use strict';

  
  
  
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

  
  function buildDriveVideoUrl(videoId) {
    return 'https://drive.google.com/file/d/' + videoId + '/preview?vq=hd1080&hd=1';
  }

  
  
  
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

      
      closeAllDrawers();

      if (!isAlreadyOpen) {
        
        targetDrawer.classList.add('open');
        parentRow.classList.add('row-active');
        btn.classList.add('active');
        const textSpan = btn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = 'Close Video ✕';

        const iframe = targetDrawer.querySelector('iframe');
        if (iframe) {
          
          iframe.src = buildDriveVideoUrl(videoId);
        }

        
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

  
  document.querySelectorAll('.drawer-close-btn').forEach(function (closeBtn) {
    closeBtn.addEventListener('click', function () {
      closeAllDrawers();
    });
  });

  
  
  
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      const selectedFilter = btn.getAttribute('data-filter');

      
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

  
  
  
  const launchInstallBtn = document.getElementById('launch-install-video-btn');
  const installContainer = document.getElementById('install-video-container');
  const installIframe = document.getElementById('install-video-iframe');

  if (launchInstallBtn && installContainer && installIframe) {
    launchInstallBtn.addEventListener('click', function () {
      const videoId = launchInstallBtn.getAttribute('data-video-id');
      const isVisible = installContainer.style.display !== 'none';

      if (!isVisible) {
        
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

  
  
  
  const offsetSearchInput = document.getElementById('offset-search-input');
  const offsetFilterBtns = document.querySelectorAll('.offset-filter-btn');
  let activeOffsetCategory = 'all';

  function filterOffsets() {
    const term = offsetSearchInput ? offsetSearchInput.value.toLowerCase().trim() : '';
    const rows = document.querySelectorAll('#offsets-table tbody tr');

    rows.forEach(function (row) {
      if (row.classList.contains('category-header-row')) {
        return;
      }
      const cat = row.getAttribute('data-offset-cat');
      const text = row.textContent.toLowerCase();

      const matchesCat = (activeOffsetCategory === 'all' || cat === activeOffsetCategory);
      const matchesSearch = (term === '' || text.indexOf(term) !== -1);

      row.style.display = (matchesCat && matchesSearch) ? '' : 'none';
    });

    const catRows = document.querySelectorAll('#offsets-table .category-header-row');
    catRows.forEach(function (catRow) {
      const catId = catRow.getAttribute('data-cat-header');
      if (activeOffsetCategory !== 'all' && catId !== activeOffsetCategory) {
        catRow.style.display = 'none';
        return;
      }
      let next = catRow.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('category-header-row')) {
        if (next.style.display !== 'none') {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }
      catRow.style.display = hasVisible ? '' : 'none';
    });
  }

  if (offsetSearchInput) {
    offsetSearchInput.addEventListener('input', filterOffsets);
  }

  if (offsetFilterBtns.length > 0) {
    offsetFilterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        offsetFilterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeOffsetCategory = btn.getAttribute('data-cat') || 'all';
        filterOffsets();
      });
    });
  }

  
  
  
  document.querySelectorAll('.copy-code-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const codeText = targetEl.innerText || targetEl.textContent;
      navigator.clipboard.writeText(codeText).then(function () {
        const origText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(function () {
          btn.textContent = origText;
        }, 2000);
      }).catch(function () {
        btn.textContent = 'Press Ctrl+C';
      });
    });
  });

})();


/* =====================================================================
   DEDUPLICATED VISIT COUNTER (once per visitor per calendar day)
   GitHub Pages is fully static, so the counter lives in localStorage:
   - counted at most once per local calendar day per browser profile
   - site-wide daily cap: visiting any page of the project consumes the
     day (index -> contact -> downloads on the same day = +1 visit)
   ===================================================================== */
var CTM_KEY_TOTAL = 'lyra_ctm_total_visits';
var CTM_KEY_LAST = 'lyra_ctm_last_visit_day';

function ctmToday() { return new Date().toISOString().slice(0, 10); }

(function ctmCountVisit() {
  try {
    var lastDay = localStorage.getItem(CTM_KEY_LAST);
    if (lastDay !== ctmToday()) {
      localStorage.setItem(CTM_KEY_LAST, ctmToday());
      var total = parseInt(localStorage.getItem(CTM_KEY_TOTAL) || '0', 10) + 1;
      localStorage.setItem(CTM_KEY_TOTAL, String(total));
    }
  } catch (e) { /* private mode — skip counting */ }
})();

function ctmGetTotalVisits() {
  try { return parseInt(localStorage.getItem(CTM_KEY_TOTAL) || '0', 10); } catch (e) { return 0; }
}

function ctmRenderVisitCounts() {
  var nodes = document.querySelectorAll('[data-visit-count]');
  if (!nodes.length) return;
  var visits = ctmGetTotalVisits();
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].textContent = visits.toLocaleString();
  }
}

/* =====================================================================
   DOWNLOAD COUNTERS (per file, deduplicated per visitor per day).
   Displayed value on /counts = static baseline (data-baseline attr)
   + locally tracked download clicks. Edit baselines by hand in
   counts/index.html to merge in external analytics numbers.
   ===================================================================== */
function ctmDlKey(f) { return 'lyra_ctm_dl_' + f; }
function ctmDlDayKey(f) { return 'lyra_ctm_dlday_' + f; }

function ctmTrackDownload(file) {
  try {
    if (localStorage.getItem(ctmDlDayKey(file)) === ctmToday()) return; // max +1 per day
    localStorage.setItem(ctmDlDayKey(file), ctmToday());
    var n = parseInt(localStorage.getItem(ctmDlKey(file)) || '0', 10) + 1;
    localStorage.setItem(ctmDlKey(file), String(n));
  } catch (e) { }
}

function ctmLocalDownloads(file) {
  try { return parseInt(localStorage.getItem(ctmDlKey(file)) || '0', 10); } catch (e) { return 0; }
}

function ctmRenderDownloadCounts() {
  var nodes = document.querySelectorAll('[data-download-count-for]');
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    var file = el.getAttribute('data-download-count-for');
    var baseline = parseInt(el.getAttribute('data-baseline') || '0', 10);
    el.textContent = (baseline + ctmLocalDownloads(file)).toLocaleString();
  }
}

document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
  if (!a) return;
  var href = decodeURIComponent(a.getAttribute('href') || '');
  var files = [
    'Lyras Framwork MOD.zip', 'LyrasTextureMod.zip',
    'Open Source CODE.7z', 'TextureMod_SRC.7z',
    'offset.md', 'Crazy Taxi Texture Modding Guide.pdf',
    'SUBMOD_DEVELOPMENT_GUIDE.md', 'MANUAL_INSTALL.md'
  ];
  for (var i = 0; i < files.length; i++) {
    if (href.indexOf(files[i]) !== -1) { ctmTrackDownload(files[i]); break; }
  }
});


/* ---- render deduplicated counters after DOM is ready ---- */
ctmRenderVisitCounts();
var ctmStatUnique = document.getElementById('stat-unique-visits');
if (ctmStatUnique) ctmStatUnique.textContent = ctmGetTotalVisits().toLocaleString();
ctmRenderDownloadCounts();

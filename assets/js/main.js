/* ==========================================================================
   Dr. Nitishikha Sharma - Birthday Memory Album & Countdown Main Logic
   ========================================================================== */

// Elegant placeholder SVG for memories without an uploaded photo
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450'%3E%3Crect fill='%23EDE4D8' width='600' height='450'/%3E%3Cpath d='M260 180 h-30 l-15 -25 h170 l-15 25 h-30 v0' fill='none' stroke='%23C4A882' stroke-width='4' stroke-linejoin='round' stroke-linecap='round'/%3E%3Crect x='215' y='180' width='170' height='100' rx='8' fill='none' stroke='%23C4A882' stroke-width='4'/%3E%3Ccircle cx='300' cy='230' r='30' fill='none' stroke='%23C4A882' stroke-width='4'/%3E%3Ctext x='300' y='330' font-family='Georgia, serif' font-style='italic' font-size='18' fill='%239E8464' text-anchor='middle'%3EMemory Photo Pending%3C/text%3E%3C/svg%3E`;

// State
let albumData = null;
let currentReelIndex = 0;
let reelSlides = [];
let isInitialized = false;

// --------------------------------------------------------------------------
// Date Helpers & Indian Standard Time (IST) Synchronization
// --------------------------------------------------------------------------
// Synchronized to Indian Standard Time (IST, UTC+5:30)
// This ensures memories unlock at precisely 12:00 AM midnight in India,
// regardless of where in the world the visitor is (e.g. Sydney, Nova Scotia).
function getIndiaDateStr() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch (e) {
    // Robust mathematical UTC+5:30 fallback
    const now = new Date();
    const istMs = now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 3600000);
    const istDate = new Date(istMs);
    const y = istDate.getFullYear();
    const m = String(istDate.getMonth() + 1).padStart(2, '0');
    const d = String(istDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

function getActiveDateStr() {
  const urlParams = new URLSearchParams(window.location.search);
  const sim = urlParams.get('simulateDate');
  if (sim && /^\d{4}-\d{2}-\d{2}$/.test(sim)) {
    return sim;
  }
  return getIndiaDateStr();
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDaysToDateStr(baseDateStr, days) {
  const d = parseLocalDate(baseDateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr) {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysDiff(fromStr, toStr) {
  const f = parseLocalDate(fromStr);
  const t = parseLocalDate(toStr);
  const diffTime = t - f;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// --------------------------------------------------------------------------
// Preview Mode Authentication Gate (Unlock All Memories)
// --------------------------------------------------------------------------
const AUTH_USER = 'aryaman';
const AUTH_PASS = 'nitudidbday';

function promptPreviewLogin() {
  const modal = document.getElementById('previewAuthModal');
  if (modal) modal.classList.add('active');
  document.body.classList.add('modal-open');
}

window.handlePreviewLogin = function(e) {
  e.preventDefault();
  const u = document.getElementById('previewUser').value.trim();
  const p = document.getElementById('previewPass').value;
  const err = document.getElementById('previewLoginError');

  if (u === AUTH_USER && p === AUTH_PASS) {
    sessionStorage.setItem('bday_preview_auth', 'true');
    err.style.display = 'none';
    document.getElementById('previewAuthModal').classList.remove('active');
    document.body.classList.remove('modal-open');
    const banner = document.getElementById('previewModeBanner');
    if (banner) banner.classList.remove('hidden');
    renderMemoryGrid(getActiveDateStr(), true);
  } else {
    err.style.display = 'block';
  }
};

window.cancelPreviewLogin = function() {
  document.getElementById('previewAuthModal').classList.remove('active');
  document.body.classList.remove('modal-open');
  const url = new URL(window.location);
  url.searchParams.delete('unlockAll');
  window.history.replaceState({}, '', url);
  renderMemoryGrid(getActiveDateStr(), false);
};

window.exitPreviewMode = function() {
  sessionStorage.removeItem('bday_preview_auth');
  const banner = document.getElementById('previewModeBanner');
  if (banner) banner.classList.add('hidden');
  const url = new URL(window.location);
  url.searchParams.delete('unlockAll');
  window.history.replaceState({}, '', url);
  renderMemoryGrid(getActiveDateStr(), false);
};

// --------------------------------------------------------------------------
// Initialization
// --------------------------------------------------------------------------
async function initAlbum() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const res = await fetch('memories.json');
    if (!res.ok) throw new Error(`Could not load memories.json: ${res.status}`);
    albumData = await res.json();
  } catch (err) {
    console.error('Failed to load memories:', err);
    return;
  }

  const AUTH_USER = 'aryaman';
  const AUTH_PASS = 'nitudidbday';

  const currentDate = getActiveDateStr();
  const urlParams = new URLSearchParams(window.location.search);
  const requestedUnlockAll = urlParams.get('unlockAll') === 'true';

  let unlockAll = false;
  if (requestedUnlockAll) {
    if (sessionStorage.getItem('bday_preview_auth') === 'true') {
      unlockAll = true;
      const banner = document.getElementById('previewModeBanner');
      if (banner) banner.classList.remove('hidden');
    } else {
      // Prompt credentials before unlocking future memories!
      promptPreviewLogin();
    }
  }

  // Update dynamic texts
  document.getElementById('headerTitle').textContent = albumData.config.fullName || "Dr. Nitishikha Sharma";
  document.getElementById('splashName').textContent = albumData.config.fullName || "Dr. Nitishikha Sharma";
  document.getElementById('splashTagline').textContent = albumData.config.tagline || "";
  document.getElementById('heroSubtitle').textContent = "To our dearest Nitu Didi";
  document.getElementById('footerNote').textContent = albumData.config.footer || "";

  // Render Memories Grid
  renderMemoryGrid(currentDate, unlockAll);

  // Check Birthday Status
  const isBday = currentDate >= albumData.config.birthday || urlParams.get('bday') === 'true';
  if (isBday) {
    setupBirthdayCelebration();
  }

  // Live India Midnight Checker: automatically unlocks new day memory when midnight strikes in India
  let trackedDate = currentDate;
  setInterval(() => {
    const freshDate = getActiveDateStr();
    if (freshDate !== trackedDate) {
      trackedDate = freshDate;
      renderMemoryGrid(freshDate, unlockAll);
      if (freshDate >= albumData.config.birthday) {
        setupBirthdayCelebration();
      }
    }
  }, 20000);

  // Setup Guestbook
  initGuestbook();

  // Setup Event Listeners
  setupEventListeners();
}

// Helper: Extract valid images array from memory item
function getMemoryImages(mem) {
  if (Array.isArray(mem.images) && mem.images.length > 0) {
    const valid = mem.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
    if (valid.length > 0) return valid;
  }
  if (mem.image && typeof mem.image === 'string' && mem.image.trim() !== '') {
    return [mem.image];
  }
  return [];
}

// --------------------------------------------------------------------------
// Memory Grid Rendering
// --------------------------------------------------------------------------
function renderMemoryGrid(currentDate, unlockAll) {
  const grid = document.getElementById('memoryGrid');
  grid.innerHTML = '';

  const startDate = albumData.config.startDate;
  const birthdayDate = albumData.config.birthday;
  let unlockedCount = 0;

  // Gentle random tilt angles for realistic scrapbook polaroid look
  const tilts = [-2.5, 1.8, -1.2, 2.2, -1.8, 1.4, -2.2, 2.0, -1.5, 1.2, -2.0, 1.6, -1.4, 2.1, -1.0];

  albumData.memories.forEach((mem, idx) => {
    const unlockDate = addDaysToDateStr(startDate, idx);
    const isUnlocked = unlockAll || currentDate >= unlockDate;
    const isToday = !unlockAll && currentDate === unlockDate;

    if (isUnlocked) unlockedCount++;

    const card = document.createElement('div');
    card.className = `memory-card ${isUnlocked ? 'unlocked' : 'locked'} ${isToday ? 'today' : ''}`;
    card.style.setProperty('--rot', `${tilts[idx % tilts.length]}deg`);

    const images = getMemoryImages(mem);

    if (isUnlocked) {
      const hasSlideshow = images.length > 1;
      let photoHtml = '';

      if (images.length === 0) {
        photoHtml = `<img src="${PLACEHOLDER_SVG}" alt="${mem.title}" loading="lazy">`;
      } else if (images.length === 1) {
        photoHtml = `<img src="${images[0]}" alt="${mem.title}" loading="lazy" onerror="this.src='${PLACEHOLDER_SVG}'">`;
      } else {
        // Multi-photo Slideshow with dots-to-dashes indicator
        photoHtml = `
          <div class="card-slideshow">
            ${images.map((src, sIdx) => `
              <div class="card-slide ${sIdx === 0 ? 'active' : ''}" data-idx="${sIdx}">
                <img src="${src}" alt="${mem.title} - photo ${sIdx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_SVG}'">
              </div>
            `).join('')}
          </div>
          <button class="card-slide-nav prev" type="button" aria-label="Previous photo">‹</button>
          <button class="card-slide-nav next" type="button" aria-label="Next photo">›</button>
          <div class="card-slideshow-dots" aria-label="Slideshow indicator">
            ${images.map((_, sIdx) => `<span class="card-slide-indicator ${sIdx === 0 ? 'active' : ''}" data-idx="${sIdx}" title="Photo ${sIdx + 1}"></span>`).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="card-photo-wrap ${hasSlideshow ? 'has-slideshow' : ''}">
          ${photoHtml}
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="card-day">Day ${mem.day}</span>
            <span class="card-era">${mem.yearsAgo || ''}</span>
          </div>
          <h3 class="card-title">${mem.title}</h3>
          <p class="card-snippet">${mem.story}</p>
        </div>
      `;

      const photoWrap = card.querySelector('.card-photo-wrap');

      // Initialize automatic card slideshow if more than 1 image
      if (hasSlideshow && photoWrap) {
        initCardSlideshow(photoWrap, images.length);
      }

      card.addEventListener('click', () => openModal(mem));
    } else {
      card.innerHTML = `
        <div class="card-photo-wrap">
          <div class="locked-placeholder">
            <div class="wax-seal"><span>✦</span></div>
            <div class="locked-date-badge">Opens ${formatDisplayDate(unlockDate)}</div>
            <div class="locked-hint">Unlocks 12:00 AM India Time (IST)</div>
          </div>
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="card-day">Day ${mem.day}</span>
            <span class="card-era">✦ Locked ✦</span>
          </div>
          <h3 class="card-title" style="color: var(--brown-mid); opacity: 0.7;">Secret Memory #${mem.day}</h3>
          <p class="card-snippet" style="opacity: 0.5;">This special memory will bloom open automatically on ${formatDisplayDate(unlockDate)} at 12:00 AM India Time.</p>
        </div>
      `;
      card.addEventListener('click', () => {
        alert(`✦ This memory unlocks on ${formatDisplayDate(unlockDate)} at 12:00 AM IST (Midnight in India)! Check back then.`);
      });
    }

    grid.appendChild(card);
  });

  // Update Header Badges
  document.getElementById('unlockedCount').textContent = `${unlockedCount} of ${albumData.memories.length} Revealed`;

  const daysLeft = daysDiff(currentDate, birthdayDate);
  const countdownBadge = document.getElementById('countdownBadge');
  if (daysLeft > 1) {
    countdownBadge.textContent = `🎂 ${daysLeft} days until Birthday`;
  } else if (daysLeft === 1) {
    countdownBadge.textContent = `🎂 Tomorrow is the big day!`;
    countdownBadge.classList.add('highlight');
  } else if (daysLeft === 0) {
    countdownBadge.textContent = `🎉 Today is Birthday!`;
    countdownBadge.classList.add('highlight');
  } else {
    countdownBadge.textContent = `🎂 Celebrating Nitu Didi!`;
    countdownBadge.classList.add('highlight');
  }
}

// Card Slideshow Controller: Auto-advance, infinite looping & live loading pellet
function initCardSlideshow(wrapEl, total) {
  if (total <= 1) return;
  const SLIDE_DURATION = 2400; // Snappy 2.4s duration per photo
  let currentIdx = 0;
  const slides = wrapEl.querySelectorAll('.card-slide');
  const dots = wrapEl.querySelectorAll('.card-slide-indicator');
  let timer = null;
  let startTime = Date.now();
  let remainingTime = SLIDE_DURATION;
  let isHovered = false;

  function goToSlide(nextIdx) {
    // Infinite looping: wraps cleanly in both directions
    const targetIdx = ((nextIdx % total) + total) % total;
    if (!slides[targetIdx]) return;

    slides.forEach((s, idx) => {
      s.classList.toggle('active', idx === targetIdx);
    });

    dots.forEach((d, idx) => {
      d.classList.remove('paused');
      if (idx === targetIdx) {
        // Trigger reflow so progress bar restarts smoothly from 0%
        d.classList.remove('active');
        void d.offsetWidth;
        d.classList.add('active');
        if (isHovered) d.classList.add('paused');
      } else {
        d.classList.remove('active');
      }
    });

    currentIdx = targetIdx;
    remainingTime = SLIDE_DURATION;
    startTime = Date.now();

    clearTimeout(timer);
    if (!isHovered) {
      timer = setTimeout(() => {
        goToSlide(currentIdx + 1);
      }, SLIDE_DURATION);
    }
  }

  // Pause on hover so viewer can admire
  wrapEl.addEventListener('mouseenter', () => {
    isHovered = true;
    clearTimeout(timer);
    const elapsed = Date.now() - startTime;
    remainingTime = Math.max(100, remainingTime - elapsed);
    const activeDot = wrapEl.querySelector('.card-slide-indicator.active');
    if (activeDot) activeDot.classList.add('paused');
  });

  wrapEl.addEventListener('mouseleave', () => {
    isHovered = false;
    const activeDot = wrapEl.querySelector('.card-slide-indicator.active');
    if (activeDot) activeDot.classList.remove('paused');
    startTime = Date.now();
    clearTimeout(timer);
    timer = setTimeout(() => {
      goToSlide(currentIdx + 1);
    }, remainingTime);
  });

  dots.forEach((dot, dIdx) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent modal opening on dot click
      goToSlide(dIdx);
    });
  });

  const prevBtn = wrapEl.querySelector('.card-slide-nav.prev');
  const nextBtn = wrapEl.querySelector('.card-slide-nav.next');
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentIdx - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToSlide(currentIdx + 1);
    });
  }

  // Start with slide 0 and animate its progress bar
  goToSlide(0);
}

// --------------------------------------------------------------------------
// Modal View & Modal Slideshow
// --------------------------------------------------------------------------
let modalSlideshowTimer = null;

function openModal(mem) {
  const modal = document.getElementById('memoryModal');
  const photoContainer = document.getElementById('modalPhotoContainer');
  const images = getMemoryImages(mem);

  clearTimeout(modalSlideshowTimer);

  if (images.length <= 1) {
    photoContainer.classList.remove('has-slideshow');
    const imgSrc = images[0] || PLACEHOLDER_SVG;
    photoContainer.innerHTML = `<img id="modalImage" src="${imgSrc}" alt="${mem.title}" onerror="this.src='${PLACEHOLDER_SVG}'">`;
  } else {
    // Multi-photo Modal Slideshow with live progress pellet & infinite looping
    photoContainer.classList.add('has-slideshow');
    photoContainer.innerHTML = `
      <div class="modal-slideshow">
        ${images.map((src, idx) => `
          <div class="modal-slide ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
            <img src="${src}" alt="${mem.title} (Photo ${idx + 1})" onerror="this.src='${PLACEHOLDER_SVG}'">
          </div>
        `).join('')}
      </div>
      <button class="modal-slide-nav prev" type="button" aria-label="Previous photo">‹</button>
      <button class="modal-slide-nav next" type="button" aria-label="Next photo">›</button>
      <div class="modal-slideshow-dots" aria-label="Slideshow position and length">
        ${images.map((_, idx) => `<span class="modal-slide-indicator ${idx === 0 ? 'active' : ''}" data-idx="${idx}" title="Photo ${idx + 1}"></span>`).join('')}
      </div>
    `;

    const count = images.length;
    const slides = photoContainer.querySelectorAll('.modal-slide');
    const dots = photoContainer.querySelectorAll('.modal-slide-indicator');
    const MODAL_DURATION = 2400; // Snappy 2.4s stay
    let currentModalIdx = 0;
    let modalStartTime = Date.now();
    let modalRemainingTime = MODAL_DURATION;
    let isModalHovered = false;

    function switchModalSlide(nextIdx) {
      // Infinite looping
      const targetIdx = ((nextIdx % count) + count) % count;
      if (!slides[targetIdx]) return;

      slides.forEach((s, idx) => {
        s.classList.toggle('active', idx === targetIdx);
      });

      dots.forEach((d, idx) => {
        d.classList.remove('paused');
        if (idx === targetIdx) {
          d.classList.remove('active');
          void d.offsetWidth; // restart progress bar fill from 0%
          d.classList.add('active');
          if (isModalHovered) d.classList.add('paused');
        } else {
          d.classList.remove('active');
        }
      });

      currentModalIdx = targetIdx;
      modalRemainingTime = MODAL_DURATION;
      modalStartTime = Date.now();

      clearTimeout(modalSlideshowTimer);
      if (!isModalHovered) {
        modalSlideshowTimer = setTimeout(() => {
          switchModalSlide(currentModalIdx + 1);
        }, MODAL_DURATION);
      }
    }

    photoContainer.addEventListener('mouseenter', () => {
      isModalHovered = true;
      clearTimeout(modalSlideshowTimer);
      const elapsed = Date.now() - modalStartTime;
      modalRemainingTime = Math.max(100, modalRemainingTime - elapsed);
      const activeDot = photoContainer.querySelector('.modal-slide-indicator.active');
      if (activeDot) activeDot.classList.add('paused');
    });

    photoContainer.addEventListener('mouseleave', () => {
      isModalHovered = false;
      const activeDot = photoContainer.querySelector('.modal-slide-indicator.active');
      if (activeDot) activeDot.classList.remove('paused');
      modalStartTime = Date.now();
      clearTimeout(modalSlideshowTimer);
      modalSlideshowTimer = setTimeout(() => {
        switchModalSlide(currentModalIdx + 1);
      }, modalRemainingTime);
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        switchModalSlide(idx);
      });
    });

    const prevBtn = photoContainer.querySelector('.modal-slide-nav.prev');
    const nextBtn = photoContainer.querySelector('.modal-slide-nav.next');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchModalSlide(currentModalIdx - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchModalSlide(currentModalIdx + 1);
      });
    }

    switchModalSlide(0);
  }

  document.getElementById('modalDay').textContent = mem.day ? `Day ${mem.day}` : "Birthday Exclusive ✦";
  document.getElementById('modalTitle').textContent = mem.title;
  document.getElementById('modalEra').textContent = mem.yearsAgo || "A beautiful memory";
  document.getElementById('modalStory').textContent = mem.story;

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal() {
  clearTimeout(modalSlideshowTimer);
  const modal = document.getElementById('memoryModal');
  modal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

// --------------------------------------------------------------------------
// Birthday Celebration & Cinematic Reel Mode
// --------------------------------------------------------------------------
function setupBirthdayCelebration() {
  const bdaySection = document.getElementById('birthdaySection');
  if (bdaySection) {
    bdaySection.classList.remove('hidden');
    launchConfetti();
  }

  // Prepare full reel slides (15 daily memories + 1 grand birthday finale)
  reelSlides = [
    ...albumData.memories.map(m => {
      const imgs = getMemoryImages(m);
      return {
        day: m.day,
        label: `Day ${m.day} of 15`,
        era: m.yearsAgo || `Day ${m.day} Memory`,
        title: m.title || `Day ${m.day}`,
        story: m.story || '',
        images: imgs,
        image: imgs[0] || PLACEHOLDER_SVG
      };
    }),
    {
      isFinale: true,
      day: 15,
      label: "Birthday Grand Finale ✦",
      title: "Happy Birthday, Nitu Didi! 🎂",
      story: "Dr. Nitishikha Sharma — dentist with a heart of gold, serene yoga guide at the YMCA, and the most loving big sister anyone could ever have. May your 32nd year bring you thriving wellness, deep peace on the mat, and endless smiles in Nova Scotia!\n\nFrom Delhi and Chandigarh all the way across the Atlantic — we love you always! 💛",
      images: []
    }
  ];

  const playBtn = document.getElementById('playReelBtn');
  if (playBtn) {
    playBtn.onclick = startReel;
  }
}

function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#C4974A', '#E8C87A', '#C24538', '#E6A15C', '#88B04B', '#92A8D1', '#F7CAC9'];

  for (let i = 0; i < 75; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 3.5}s`;
    piece.style.animationDuration = `${3 + Math.random() * 2.5}s`;
    container.appendChild(piece);
  }
}

// --------------------------------------------------------------------------
// Cinematic Reel Engine & Web Audio API Soundtrack
// --------------------------------------------------------------------------
const REEL_DURATION = 5500; // 5.5s per memory story
let reelTimer = null;
let reelProgressRaf = null;
let reelStartTime = 0;
let reelElapsedBeforePause = 0;
let isReelPaused = false;
let isHoldingDown = false;
let internalPhotoTimer = null;
let currentPhotoSubIndex = 0;

// Web Audio API Gentle Music-Box Birthday Melody
let reelAudioCtx = null;
let reelAudioPlaying = false;
let reelAudioMuted = false;
let melodyTimer = null;

function initReelAudio() {
  if (reelAudioCtx) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    reelAudioCtx = new AudioContext();
  } catch (e) {
    console.warn('Web Audio not supported:', e);
  }
}

function playKalimbaTone(freq, time, duration = 0.8) {
  if (!reelAudioCtx || reelAudioMuted) return;
  try {
    const osc = reelAudioCtx.createOscillator();
    const gain = reelAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Soft music-box bell pluck envelope
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.075, time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(reelAudioCtx.destination);

    osc.start(time);
    osc.stop(time + duration);
  } catch (e) {}
}

// Nostalgic, heartwarming pentatonic lullaby motif (C-major / F-major feel)
const REEL_MELODY = [
  261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 392.00,
  261.63, 329.63, 392.00, 523.25, 587.33, 523.25, 440.00, 392.00,
  349.23, 440.00, 523.25, 659.25, 587.33, 523.25, 440.00, 349.23,
  329.63, 392.00, 523.25, 659.25, 587.33, 523.25, 440.00, 392.00
];

function startMelody() {
  initReelAudio();
  if (!reelAudioCtx) return;
  if (reelAudioCtx.state === 'suspended') {
    reelAudioCtx.resume();
  }
  stopMelody();
  reelAudioPlaying = true;
  let step = 0;
  const tempo = 360;

  function tick() {
    if (!reelAudioPlaying) return;
    const now = reelAudioCtx.currentTime;
    const freq = REEL_MELODY[step % REEL_MELODY.length];
    playKalimbaTone(freq, now, 0.9);
    if (step % 4 === 0) {
      playKalimbaTone(freq / 2, now, 1.3); // Warm root note
    }
    step++;
    melodyTimer = setTimeout(tick, tempo);
  }
  tick();
}

function stopMelody() {
  reelAudioPlaying = false;
  if (melodyTimer) {
    clearTimeout(melodyTimer);
    melodyTimer = null;
  }
}

function toggleReelAudio() {
  reelAudioMuted = !reelAudioMuted;
  const icon = document.getElementById('reelAudioIcon');
  if (icon) {
    icon.textContent = reelAudioMuted ? '🔇' : '🎵';
  }
}

// Start & Close Reel
function startReel() {
  if (!reelSlides || reelSlides.length === 0) {
    setupBirthdayCelebration();
  }
  currentReelIndex = 0;
  isReelPaused = false;
  isHoldingDown = false;
  reelElapsedBeforePause = 0;

  const overlay = document.getElementById('reelOverlay');
  overlay.classList.remove('hidden');
  document.body.classList.add('modal-open');

  buildReelSegmentBars();
  setupReelInteractivity();
  startMelody();
  renderReelSlide();
}

function closeReel() {
  clearTimeout(reelTimer);
  clearTimeout(internalPhotoTimer);
  cancelAnimationFrame(reelProgressRaf);
  stopMelody();

  const overlay = document.getElementById('reelOverlay');
  overlay.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

// Build segmented progress bars (Story segments)
function buildReelSegmentBars() {
  const container = document.getElementById('reelSegmentBars');
  if (!container) return;
  container.innerHTML = '';

  reelSlides.forEach((_, idx) => {
    const seg = document.createElement('div');
    seg.className = 'reel-segment';
    seg.dataset.index = idx;
    seg.innerHTML = `<div class="reel-segment-fill" id="reelSegFill-${idx}"></div>`;
    seg.addEventListener('click', (e) => {
      e.stopPropagation();
      goToReelSlide(idx);
    });
    container.appendChild(seg);
  });
}

function updateReelSegments() {
  reelSlides.forEach((_, idx) => {
    const seg = document.querySelector(`.reel-segment[data-index="${idx}"]`);
    const fill = document.getElementById(`reelSegFill-${idx}`);
    if (!seg || !fill) return;

    if (idx < currentReelIndex) {
      seg.classList.add('completed');
      seg.classList.remove('active');
      fill.style.width = '100%';
    } else if (idx === currentReelIndex) {
      seg.classList.add('active');
      seg.classList.remove('completed');
      fill.style.width = '0%';
    } else {
      seg.classList.remove('active', 'completed');
      fill.style.width = '0%';
    }
  });
}

// Render active story slide
function renderReelSlide() {
  clearTimeout(reelTimer);
  clearTimeout(internalPhotoTimer);
  cancelAnimationFrame(reelProgressRaf);

  const slide = reelSlides[currentReelIndex];
  const container = document.getElementById('reelCardContainer');
  const ambientBg = document.getElementById('reelAmbientBg');
  const stepLabel = document.getElementById('reelStepIndicator');

  updateReelSegments();

  if (slide.isFinale) {
    if (stepLabel) stepLabel.textContent = "Grand Celebration 🎉";
    if (ambientBg) ambientBg.style.backgroundImage = 'none';

    container.innerHTML = `
      <div class="reel-finale-card">
        <div class="reel-finale-emojis">🎂 ✨ 💛</div>
        <h2 class="reel-finale-title">${escapeHtml(slide.title)}</h2>
        <p class="reel-finale-story">${escapeHtml(slide.story).replace(/\n\n/g, '<br><br>')}</p>
        <div class="reel-finale-route">From Delhi &amp; Chandigarh ➔ Sydney, Nova Scotia with all our love!</div>
        <div class="reel-finale-actions">
          <button class="reel-action-btn primary" type="button" onclick="startReel()">
            🔁 Replay Memory Reel
          </button>
          <button class="reel-action-btn secondary" type="button" onclick="closeReel()">
            ✦ Back to Scrapbook
          </button>
        </div>
      </div>
    `;
    launchConfetti();
    return; // Finale pauses indefinitely until user chooses
  }

  // Normal Memory Slide (Days 1–15)
  if (stepLabel) stepLabel.textContent = slide.label;
  const images = slide.images && slide.images.length > 0 ? slide.images : [slide.image || PLACEHOLDER_SVG];
  currentPhotoSubIndex = 0;

  // Set ambient background
  if (ambientBg) {
    ambientBg.style.backgroundImage = `url("${images[0]}")`;
  }

  const multiPhotoBadge = images.length > 1
    ? `<div class="reel-photo-counter-badge" id="reelPhotoBadge">📷 1/${images.length} Photos</div>`
    : '';

  // Random gentle polaroid tilt (-1.5deg to +1.5deg)
  const tilts = [-1.4, 1.2, -0.8, 1.5, -1.2, 0.9, -1.5, 1.4];
  const tilt = tilts[currentReelIndex % tilts.length];

  container.innerHTML = `
    <div class="reel-polaroid-frame" style="transform: rotate(${tilt}deg);">
      <div class="reel-photo-viewport">
        ${multiPhotoBadge}
        <img src="${images[0]}" id="reelPhotoImg" class="reel-photo-img" alt="${escapeHtml(slide.title)}" onerror="this.src='${PLACEHOLDER_SVG}'">
      </div>
      <div class="reel-caption-card">
        <div class="reel-caption-meta">
          <span class="reel-caption-day">Day ${slide.day}</span>
          <span class="reel-caption-era">${escapeHtml(slide.era || '')}</span>
        </div>
        <h3 class="reel-caption-title">${escapeHtml(slide.title)}</h3>
        <p class="reel-caption-story">${escapeHtml(slide.story)}</p>
      </div>
    </div>
  `;

  // Cycle through sub-photos if memory has multiple photos
  if (images.length > 1) {
    const subPhotoInterval = Math.max(1800, Math.floor(REEL_DURATION / images.length));
    function nextSubPhoto() {
      if (isReelPaused || isHoldingDown) return;
      currentPhotoSubIndex = (currentPhotoSubIndex + 1) % images.length;
      const imgEl = document.getElementById('reelPhotoImg');
      const badgeEl = document.getElementById('reelPhotoBadge');
      if (imgEl) {
        imgEl.src = images[currentPhotoSubIndex];
        // Restart smooth Ken Burns animation on sub-photo
        imgEl.style.animation = 'none';
        void imgEl.offsetWidth;
        imgEl.style.animation = 'kenBurnsMotion 5s cubic-bezier(0.25, 1, 0.5, 1) forwards';
      }
      if (badgeEl) {
        badgeEl.textContent = `📷 ${currentPhotoSubIndex + 1}/${images.length} Photos`;
      }
      if (ambientBg) {
        ambientBg.style.backgroundImage = `url("${images[currentPhotoSubIndex]}")`;
      }
      internalPhotoTimer = setTimeout(nextSubPhoto, subPhotoInterval);
    }
    internalPhotoTimer = setTimeout(nextSubPhoto, subPhotoInterval);
  }

  // Start live progress animation
  startSlideProgress(REEL_DURATION);
}

// Smooth Progress Animation for the active segment bar
function startSlideProgress(duration) {
  reelStartTime = performance.now();
  reelElapsedBeforePause = 0;
  const fill = document.getElementById(`reelSegFill-${currentReelIndex}`);

  function step(timestamp) {
    if (!fill) return;
    if (!isReelPaused && !isHoldingDown) {
      const elapsed = (timestamp - reelStartTime) + reelElapsedBeforePause;
      const progress = Math.min(100, (elapsed / duration) * 100);
      fill.style.width = `${progress}%`;

      if (elapsed >= duration) {
        nextReelSlide();
        return;
      }
    }
    reelProgressRaf = requestAnimationFrame(step);
  }

  reelProgressRaf = requestAnimationFrame(step);
}

function pauseReel() {
  if (isReelPaused) return;
  isReelPaused = true;
  const now = performance.now();
  reelElapsedBeforePause += (now - reelStartTime);
  const icon = document.getElementById('reelPlayPauseIcon');
  if (icon) icon.textContent = '▶';
}

function resumeReel() {
  if (!isReelPaused || isHoldingDown) return;
  isReelPaused = false;
  reelStartTime = performance.now();
  const icon = document.getElementById('reelPlayPauseIcon');
  if (icon) icon.textContent = '⏸';
}

function toggleReelPlayPause() {
  if (isReelPaused) {
    resumeReel();
  } else {
    pauseReel();
  }
}

function nextReelSlide() {
  if (currentReelIndex < reelSlides.length - 1) {
    goToReelSlide(currentReelIndex + 1);
  } else {
    closeReel();
  }
}

function prevReelSlide() {
  if (currentReelIndex > 0) {
    goToReelSlide(currentReelIndex - 1);
  }
}

function goToReelSlide(idx) {
  if (idx < 0 || idx >= reelSlides.length) return;
  currentReelIndex = idx;
  renderReelSlide();
}

// Touch, Hold & Tap Setup
let holdDownTimer = null;

function setupReelInteractivity() {
  const stage = document.getElementById('reelStage');
  const tapLeft = document.getElementById('reelTapLeft');
  const tapRight = document.getElementById('reelTapRight');
  const playPauseBtn = document.getElementById('reelPlayPauseBtn');
  const audioBtn = document.getElementById('reelAudioBtn');
  const prevBtn = document.getElementById('reelPrevBtn');
  const nextBtn = document.getElementById('reelNextBtn');

  if (playPauseBtn) playPauseBtn.onclick = toggleReelPlayPause;
  if (audioBtn) audioBtn.onclick = toggleReelAudio;
  if (prevBtn) prevBtn.onclick = prevReelSlide;
  if (nextBtn) nextBtn.onclick = nextReelSlide;

  // Press & Hold to pause anywhere on stage
  if (stage) {
    const handleHoldStart = (e) => {
      if (e.target.closest('.reel-action-btn') || e.target.closest('.reel-icon-btn')) return;
      isHoldingDown = true;
      const now = performance.now();
      reelElapsedBeforePause += (now - reelStartTime);
    };

    const handleHoldEnd = () => {
      if (isHoldingDown) {
        isHoldingDown = false;
        reelStartTime = performance.now();
      }
    };

    stage.onpointerdown = handleHoldStart;
    window.onpointerup = handleHoldEnd;
    window.onpointercancel = handleHoldEnd;
  }

  // Taps for quick slide switching
  if (tapLeft) {
    tapLeft.onclick = (e) => {
      e.stopPropagation();
      prevReelSlide();
    };
  }
  if (tapRight) {
    tapRight.onclick = (e) => {
      e.stopPropagation();
      nextReelSlide();
    };
  }
}

// --------------------------------------------------------------------------
// Guestbook (Firestore + LocalStorage Seamless Mode)
// --------------------------------------------------------------------------
const LOCAL_STORAGE_KEY = 'nitishikha_bday_guestbook';

const DEFAULT_WISHES = [
  {
    name: "Mummy & Papa",
    message: "Happy Birthday Nitishikha beti! May your gentle healing touch and bright smile keep bringing light to everyone in Canada. Proud of you always!",
    date: "From Delhi"
  },
  {
    name: "From Chandigarh",
    message: "Missing you so much this side of the world! Keep shining as a doctor and yogi. Sydney is blessed to have you!",
    date: "Chandigarh, India"
  },
  {
    name: "YMCA Sydney Friends",
    message: "Happy Birthday to our favorite yoga teacher! Thank you for bringing so much peace and positive vibes to Cape Breton!",
    date: "Sydney, NS"
  }
];

async function initGuestbook() {
  await loadGuestbookEntries();

  const form = document.getElementById('guestbookForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('guestName');
    const msgInput = document.getElementById('guestMessage');

    const name = nameInput.value.trim();
    const message = msgInput.value.trim();
    if (!name || !message) return;

    const submitBtn = form.querySelector('.submit-wish-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Pinning your wish...';

    try {
      if (window.isFirebaseConfigured() && window.firebaseDB) {
        const { collection, addDoc, serverTimestamp } = window.firestoreFunctions;
        await addDoc(collection(window.firebaseDB, 'guestbook'), {
          name,
          message,
          timestamp: serverTimestamp()
        });
      } else {
        // LocalStorage Fallback
        const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        saved.unshift({ name, message, date: todayStr });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saved));
      }

      nameInput.value = '';
      msgInput.value = '';
      await loadGuestbookEntries();
      alert('✦ Your lovely wish has been pinned to the scrapbook board!');
    } catch (err) {
      console.error('Failed to save guestbook entry:', err);
      alert('Could not pin wish right now. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Pin Your Wish 💌';
    }
  });
}

async function loadGuestbookEntries() {
  const board = document.getElementById('guestbookBoard');
  let messages = [];

  try {
    if (window.isFirebaseConfigured() && window.firebaseDB) {
      const { collection, getDocs, query, orderBy } = window.firestoreFunctions;
      const q = query(collection(window.firebaseDB, 'guestbook'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      snap.forEach(doc => {
        const data = doc.data();
        let dateStr = 'Recently';
        if (data.timestamp && data.timestamp.toDate) {
          dateStr = data.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        messages.push({ name: data.name, message: data.message, date: dateStr });
      });
    }
  } catch (err) {
    console.warn('Firebase guestbook fetch error, falling back to local storage:', err);
  }

  if (messages.length === 0) {
    const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    messages = local.length > 0 ? local : DEFAULT_WISHES;
  }

  board.innerHTML = '';
  messages.forEach(msg => {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.innerHTML = `
      <p class="sticky-msg">"${escapeHtml(msg.message)}"</p>
      <div class="sticky-author">— ${escapeHtml(msg.name)}</div>
      <span class="sticky-date">${escapeHtml(msg.date || '')}</span>
    `;
    board.appendChild(note);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --------------------------------------------------------------------------
// Event Listeners Setup
// --------------------------------------------------------------------------
function setupEventListeners() {
  // Splash Screen Enter
  const enterBtn = document.getElementById('enterAlbumBtn');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      const splash = document.getElementById('splash');
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        document.getElementById('mainContent').classList.remove('hidden');
      }, 650);
    });
  }

  // Modal Closers
  const modalClose = document.getElementById('modalCloseBtn');
  if (modalClose) modalClose.addEventListener('click', closeModal);

  const modalOverlay = document.getElementById('memoryModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Reel Navigation is handled dynamically in setupReelInteractivity()
  const closeReelBtn = document.getElementById('reelCloseBtn');
  if (closeReelBtn) closeReelBtn.onclick = closeReel;

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    const isReelOpen = document.getElementById('reelOverlay') && !document.getElementById('reelOverlay').classList.contains('hidden');
    if (e.key === 'Escape') {
      closeModal();
      closeReel();
    } else if (isReelOpen && (e.key === 'ArrowRight' || e.key === 'PageDown')) {
      nextReelSlide();
    } else if (isReelOpen && (e.key === 'ArrowLeft' || e.key === 'PageUp')) {
      prevReelSlide();
    } else if (isReelOpen && e.code === 'Space') {
      e.preventDefault();
      toggleReelPlayPause();
    }
  });
}

// Auto-run when DOM is ready
window.appInit = initAlbum;
document.addEventListener('DOMContentLoaded', () => {
  initAlbum();
});

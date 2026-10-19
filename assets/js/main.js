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
// Date Helpers & Simulation Mode
// --------------------------------------------------------------------------
function getActiveDateStr() {
  const urlParams = new URLSearchParams(window.location.search);
  const sim = urlParams.get('simulateDate');
  if (sim && /^\d{4}-\d{2}-\d{2}$/.test(sim)) {
    return sim;
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  const currentDate = getActiveDateStr();
  const urlParams = new URLSearchParams(window.location.search);
  const unlockAll = urlParams.get('unlockAll') === 'true';

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
            <div class="locked-hint">A cherished memory waits inside</div>
          </div>
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="card-day">Day ${mem.day}</span>
            <span class="card-era">✦ Locked ✦</span>
          </div>
          <h3 class="card-title" style="color: var(--brown-mid); opacity: 0.7;">Secret Memory #${mem.day}</h3>
          <p class="card-snippet" style="opacity: 0.5;">This special memory will bloom open automatically on ${formatDisplayDate(unlockDate)}.</p>
        </div>
      `;
      card.addEventListener('click', () => {
        alert(`✦ This memory unlocks on ${formatDisplayDate(unlockDate)}! Check back then.`);
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

// Card Slideshow Controller: Auto-advance & dots-becoming-dashes
function initCardSlideshow(wrapEl, total) {
  if (total <= 1) return;
  let currentIdx = 0;
  const slides = wrapEl.querySelectorAll('.card-slide');
  const dots = wrapEl.querySelectorAll('.card-slide-indicator');

  function goToSlide(nextIdx) {
    if (!slides[currentIdx] || !slides[nextIdx]) return;
    slides[currentIdx].classList.remove('active');
    dots[currentIdx].classList.remove('active');
    currentIdx = (nextIdx + total) % total;
    slides[currentIdx].classList.add('active');
    dots[currentIdx].classList.add('active'); // expands into dash!
  }

  let timer = setInterval(() => {
    goToSlide(currentIdx + 1);
  }, 3500);

  // Pause on hover so viewer can admire
  wrapEl.addEventListener('mouseenter', () => clearInterval(timer));
  wrapEl.addEventListener('mouseleave', () => {
    clearInterval(timer);
    timer = setInterval(() => goToSlide(currentIdx + 1), 3500);
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
}

// --------------------------------------------------------------------------
// Modal View & Modal Slideshow
// --------------------------------------------------------------------------
let modalSlideshowInterval = null;

function openModal(mem) {
  const modal = document.getElementById('memoryModal');
  const photoContainer = document.getElementById('modalPhotoContainer');
  const images = getMemoryImages(mem);

  clearInterval(modalSlideshowInterval);

  if (images.length <= 1) {
    photoContainer.classList.remove('has-slideshow');
    const imgSrc = images[0] || PLACEHOLDER_SVG;
    photoContainer.innerHTML = `<img id="modalImage" src="${imgSrc}" alt="${mem.title}" onerror="this.src='${PLACEHOLDER_SVG}'">`;
  } else {
    // Multi-photo Modal Slideshow with dots becoming dashes
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

    let currentModalIdx = 0;
    const count = images.length;
    const slides = photoContainer.querySelectorAll('.modal-slide');
    const dots = photoContainer.querySelectorAll('.modal-slide-indicator');

    function switchModalSlide(nextIdx) {
      if (!slides[currentModalIdx] || !slides[nextIdx]) return;
      slides[currentModalIdx].classList.remove('active');
      dots[currentModalIdx].classList.remove('active');
      currentModalIdx = (nextIdx + count) % count;
      slides[currentModalIdx].classList.add('active');
      dots[currentModalIdx].classList.add('active'); // transforms dot into dash!
    }

    modalSlideshowInterval = setInterval(() => {
      switchModalSlide(currentModalIdx + 1);
    }, 4000);

    photoContainer.addEventListener('mouseenter', () => clearInterval(modalSlideshowInterval));
    photoContainer.addEventListener('mouseleave', () => {
      clearInterval(modalSlideshowInterval);
      modalSlideshowInterval = setInterval(() => switchModalSlide(currentModalIdx + 1), 4000);
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
  }

  document.getElementById('modalDay').textContent = mem.day ? `Day ${mem.day}` : "Birthday Exclusive ✦";
  document.getElementById('modalTitle').textContent = mem.title;
  document.getElementById('modalEra').textContent = mem.yearsAgo || "A beautiful memory";
  document.getElementById('modalStory').textContent = mem.story;

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal() {
  clearInterval(modalSlideshowInterval);
  const modal = document.getElementById('memoryModal');
  modal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

// --------------------------------------------------------------------------
// Birthday Celebration & Reel Mode
// --------------------------------------------------------------------------
function setupBirthdayCelebration() {
  const bdaySection = document.getElementById('birthdaySection');
  bdaySection.classList.remove('hidden');

  launchConfetti();

  // Render 3 exclusive birthday memories
  const container = document.getElementById('exclusiveMemoriesGrid');
  container.innerHTML = '';

  (albumData.exclusives || []).forEach(exc => {
    const card = document.createElement('div');
    card.className = 'memory-card unlocked';
    card.style.setProperty('--rot', '0deg');
    const images = getMemoryImages(exc);
    const hasSlideshow = images.length > 1;

    let photoHtml = '';
    if (images.length === 0) {
      photoHtml = `<img src="${PLACEHOLDER_SVG}" alt="${exc.title}" loading="lazy">`;
    } else if (images.length === 1) {
      photoHtml = `<img src="${images[0]}" alt="${exc.title}" loading="lazy" onerror="this.src='${PLACEHOLDER_SVG}'">`;
    } else {
      photoHtml = `
        <div class="card-slideshow">
          ${images.map((src, sIdx) => `
            <div class="card-slide ${sIdx === 0 ? 'active' : ''}" data-idx="${sIdx}">
              <img src="${src}" alt="${exc.title} - photo ${sIdx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_SVG}'">
            </div>
          `).join('')}
        </div>
        <button class="card-slide-nav prev" type="button" aria-label="Previous photo">‹</button>
        <button class="card-slide-nav next" type="button" aria-label="Next photo">›</button>
        <div class="card-slideshow-dots" aria-label="Slideshow indicator">
          ${images.map((_, sIdx) => `<span class="card-slide-indicator ${sIdx === 0 ? 'active' : ''}" data-idx="${sIdx}"></span>`).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-photo-wrap ${hasSlideshow ? 'has-slideshow' : ''}">
        ${photoHtml}
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-day">Exclusive ✦</span>
          <span class="card-era">Nov 4 Special</span>
        </div>
        <h3 class="card-title">${exc.title}</h3>
        <p class="card-snippet">${exc.story}</p>
      </div>
    `;

    const photoWrap = card.querySelector('.card-photo-wrap');
    if (hasSlideshow && photoWrap) {
      initCardSlideshow(photoWrap, images.length);
    }

    card.addEventListener('click', () => openModal(exc));
    container.appendChild(card);
  });

  // Prepare full reel slides (15 memories + 3 exclusives + 1 grand finale)
  reelSlides = [
    ...albumData.memories.map(m => {
      const imgs = getMemoryImages(m);
      return {
        label: `Day ${m.day} of 15`,
        title: m.title,
        story: m.story,
        image: imgs[0] || PLACEHOLDER_SVG
      };
    }),
    ...(albumData.exclusives || []).map(e => {
      const imgs = getMemoryImages(e);
      return {
        label: "Birthday Exclusive",
        title: e.title,
        story: e.story,
        image: imgs[0] || PLACEHOLDER_SVG
      };
    }),
    {
      isFinale: true,
      title: "Happy Birthday, Nitu Didi! 🎂",
      story: "Dr. Nitishikha Sharma — dentist, yogi, dreamer, and the most incredible big sister in the world. May your year ahead be as luminous, peaceful, and joyful as you are!\n\nWith all our love, always. 💛"
    }
  ];

  document.getElementById('playReelBtn').addEventListener('click', startReel);
}

function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#C4974A', '#E8C87A', '#C24538', '#E6A15C', '#88B04B', '#92A8D1', '#F7CAC9'];

  for (let i = 0; i < 65; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 3.5}s`;
    piece.style.animationDuration = `${3 + Math.random() * 2.5}s`;
    container.appendChild(piece);
  }
}

// Reel Slideshow Logic
function startReel() {
  currentReelIndex = 0;
  const overlay = document.getElementById('reelOverlay');
  overlay.classList.remove('hidden');
  document.body.classList.add('modal-open');
  renderReelSlide();
}

function closeReel() {
  const overlay = document.getElementById('reelOverlay');
  overlay.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function renderReelSlide() {
  const slide = reelSlides[currentReelIndex];
  const slideBox = document.getElementById('reelSlideBox');

  if (slide.isFinale) {
    slideBox.className = 'reel-slide-wrapper finale-slide';
    slideBox.innerHTML = `
      <div style="max-width: 650px; margin: 0 auto;">
        <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">🎂 ✨ 💛</div>
        <h2 class="reel-title" style="font-size: 2.8rem; margin-bottom: 1rem; color: var(--gold);">${slide.title}</h2>
        <p class="reel-story" style="font-size: 1.25rem; line-height: 1.8;">${slide.story}</p>
        <div style="margin-top: 2rem; font-family: var(--font-hand); font-size: 1.8rem; color: var(--brown-mid);">
          From Chandigarh to Sydney, Nova Scotia with all our hearts!
        </div>
      </div>
    `;
    launchConfetti();
  } else {
    slideBox.className = 'reel-slide-wrapper';
    slideBox.innerHTML = `
      <div class="reel-img-box">
        <img src="${slide.image}" alt="${slide.title}" onerror="this.src='${PLACEHOLDER_SVG}'">
      </div>
      <div class="reel-content-box">
        <span class="reel-step-label">${slide.label}</span>
        <h2 class="reel-title">${slide.title}</h2>
        <p class="reel-story">${slide.story}</p>
      </div>
    `;
  }

  // Render Dots
  const dotsContainer = document.getElementById('reelDots');
  dotsContainer.innerHTML = '';
  reelSlides.forEach((_, idx) => {
    const dot = document.createElement('span');
    dot.className = `reel-dot ${idx === currentReelIndex ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      currentReelIndex = idx;
      renderReelSlide();
    });
    dotsContainer.appendChild(dot);
  });

  document.getElementById('reelPrevBtn').style.visibility = currentReelIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('reelNextBtn').textContent = currentReelIndex === reelSlides.length - 1 ? 'Finish ✦' : 'Next →';
}

function nextReelSlide() {
  if (currentReelIndex < reelSlides.length - 1) {
    currentReelIndex++;
    renderReelSlide();
  } else {
    closeReel();
  }
}

function prevReelSlide() {
  if (currentReelIndex > 0) {
    currentReelIndex--;
    renderReelSlide();
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

  // Reel Navigation
  document.getElementById('reelCloseBtn').addEventListener('click', closeReel);
  document.getElementById('reelNextBtn').addEventListener('click', nextReelSlide);
  document.getElementById('reelPrevBtn').addEventListener('click', prevReelSlide);

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeReel();
    } else if (e.key === 'ArrowRight' && !document.getElementById('reelOverlay').classList.contains('hidden')) {
      nextReelSlide();
    } else if (e.key === 'ArrowLeft' && !document.getElementById('reelOverlay').classList.contains('hidden')) {
      prevReelSlide();
    }
  });
}

// Auto-run when DOM is ready
window.appInit = initAlbum;
document.addEventListener('DOMContentLoaded', () => {
  initAlbum();
});

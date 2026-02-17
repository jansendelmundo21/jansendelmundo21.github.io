/* app.js — FIXED
   ✅ Dark theme cards on localhost (no white background)
   ✅ Watch Demo opens Google Drive links in new tab
   ✅ Image slider with lightbox
   ✅ Fixed var(--soft2) broken references removed
   ✅ Projects grid renders full-width cards properly
*/

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let ALL_PROJECTS = [];
let ACTIVE_TAG = "All";

function setYear() {
  const y = new Date().getFullYear();
  const el = $("#year");
  if (el) el.textContent = y;
}

function lockBody(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

/* ============================================================
   NAV
   ============================================================ */
function setupNav() {
  const navToggle = $("#navToggle");
  const drawer = $("#drawer");
  const drawerClose = $("#drawerClose");

  const open = () => {
    if (!drawer) return;
    drawer.style.display = "block";
    drawer.setAttribute("aria-hidden", "false");
    navToggle?.setAttribute("aria-expanded", "true");
    lockBody(true);
  };

  const close = () => {
    if (!drawer) return;
    drawer.style.display = "none";
    drawer.setAttribute("aria-hidden", "true");
    navToggle?.setAttribute("aria-expanded", "false");
    lockBody(false);
  };

  navToggle?.addEventListener("click", open);
  drawerClose?.addEventListener("click", close);
  drawer?.addEventListener("click", (e) => { if (e.target === drawer) close(); });
  drawer?.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawer?.getAttribute("aria-hidden") === "false") close();
      closeModals();
    }
  });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
let lightboxImages = [];
let lightboxCurrentIndex = 0;

function openLightbox(src, allImages = []) {
  const modal = $("#lightbox");
  const img = $("#lightboxImg");
  const dl = $("#lightboxDownload");
  if (!modal || !img || !dl) return;

  lightboxImages = allImages.length > 0 ? allImages : [src];
  lightboxCurrentIndex = lightboxImages.indexOf(src);
  if (lightboxCurrentIndex === -1) lightboxCurrentIndex = 0;

  updateLightboxImage();
  modal.setAttribute("aria-hidden", "false");
  lockBody(true);
  updateLightboxNav();
}

function updateLightboxImage() {
  const img = $("#lightboxImg");
  const dl = $("#lightboxDownload");
  const counter = $("#lightboxCounter");
  if (!img || lightboxCurrentIndex < 0 || lightboxCurrentIndex >= lightboxImages.length) return;
  const currentSrc = lightboxImages[lightboxCurrentIndex];
  img.src = currentSrc;
  dl.href = currentSrc;
  if (counter && lightboxImages.length > 1) {
    counter.innerHTML = `<span class="current">${lightboxCurrentIndex + 1}</span> / ${lightboxImages.length}`;
  }
}

function updateLightboxNav() {
  const prevBtn = $("#lightboxPrev");
  const nextBtn = $("#lightboxNext");
  const counter = $("#lightboxCounter");
  if (lightboxImages.length > 1) {
    if (prevBtn) { prevBtn.style.display = "flex"; prevBtn.disabled = lightboxCurrentIndex === 0; }
    if (nextBtn) { nextBtn.style.display = "flex"; nextBtn.disabled = lightboxCurrentIndex === lightboxImages.length - 1; }
    if (counter) counter.style.display = "block";
  } else {
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    if (counter) counter.style.display = "none";
  }
}

function lightboxPrev() {
  if (lightboxCurrentIndex > 0) { lightboxCurrentIndex--; updateLightboxImage(); updateLightboxNav(); }
}
function lightboxNext() {
  if (lightboxCurrentIndex < lightboxImages.length - 1) { lightboxCurrentIndex++; updateLightboxImage(); updateLightboxNav(); }
}

/* ============================================================
   VIDEO
   ============================================================ */
function isHttpUrl(u) { return /^https?:\/\//i.test(u || ""); }
function isGoogleDrive(u) { return /drive\.google\.com/i.test(u || ""); }

function openVideo(src) {
  if (!src) return;
  if (isHttpUrl(src) || isGoogleDrive(src)) {
    window.open(src, "_blank", "noopener");
    return;
  }
  const modal = $("#videoModal");
  const player = $("#videoPlayer");
  const dl = $("#videoDownload");
  if (!modal || !player || !dl) return;
  player.src = src;
  dl.href = src;
  modal.setAttribute("aria-hidden", "false");
  lockBody(true);
  player.play().catch(() => {});
}

function closeModals() {
  const lightbox = $("#lightbox");
  if (lightbox) lightbox.setAttribute("aria-hidden", "true");
  const videoModal = $("#videoModal");
  const player = $("#videoPlayer");
  if (player) { player.pause(); player.removeAttribute("src"); player.load(); }
  if (videoModal) videoModal.setAttribute("aria-hidden", "true");
  lightboxImages = [];
  lightboxCurrentIndex = 0;
  lockBody(false);
}

function setupModals() {
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target?.dataset?.close) closeModals();
    const lb = target?.dataset?.lightbox;
    if (lb) {
      const allImages = target?.dataset?.lightboxImages;
      openLightbox(lb, allImages ? JSON.parse(allImages) : []);
    }
    const v = target?.dataset?.video;
    if (v) openVideo(v);
    if (target?.id === "lightboxPrev") lightboxPrev();
    if (target?.id === "lightboxNext") lightboxNext();
  });

  document.addEventListener("keydown", (e) => {
    const lightbox = $("#lightbox");
    if (lightbox?.getAttribute("aria-hidden") === "false") {
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    }
  });
}

/* ============================================================
   SLIDER
   ============================================================ */
function buildImageCandidates(project) {
  const out = [];
  (project.imageSets || []).forEach((set) => {
    const { folder, prefix, start, end, ext } = set;
    for (let i = start; i <= end; i++) out.push(`${folder}/${prefix}${i}.${ext}`);
  });
  (project.extraImages || []).forEach((p) => out.push(p));
  return out;
}

function createSlider(images) {
  if (!images || images.length === 0) return null;

  const wrapper = document.createElement("div");
  wrapper.className = "slider-wrapper";

  const container = document.createElement("div");
  container.className = "slider-container";

  const track = document.createElement("div");
  track.className = "slider-track";

  images.forEach((src, index) => {
    const slide = document.createElement("div");
    slide.className = "slider-slide";
    const img = document.createElement("img");
    img.className = "slider-image";
    img.src = src;
    img.alt = `Screenshot ${index + 1}`;
    img.loading = index === 0 ? "eager" : "lazy";
    img.style.cursor = "pointer";
    img.setAttribute("data-lightbox", src);
    img.setAttribute("data-lightbox-images", JSON.stringify(images));
    slide.appendChild(img);
    track.appendChild(slide);
  });

  container.appendChild(track);

  if (images.length > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.className = "slider-btn prev";
    prevBtn.innerHTML = "‹";
    prevBtn.setAttribute("aria-label", "Previous image");

    const nextBtn = document.createElement("button");
    nextBtn.className = "slider-btn next";
    nextBtn.innerHTML = "›";
    nextBtn.setAttribute("aria-label", "Next image");

    container.appendChild(prevBtn);
    container.appendChild(nextBtn);

    const hint = document.createElement("div");
    hint.className = "slider-hint";
    hint.textContent = "🔍 Click to enlarge";
    container.appendChild(hint);
  }

  wrapper.appendChild(container);

  if (images.length > 1) {
    const indicators = document.createElement("div");
    indicators.className = "slider-indicators";
    images.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "slider-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
      indicators.appendChild(dot);
    });
    wrapper.appendChild(indicators);

    const counter = document.createElement("div");
    counter.className = "slider-counter";
    counter.innerHTML = `<span class="current">1</span> / ${images.length}`;
    wrapper.appendChild(counter);
  }

  let currentSlide = 0;

  const updateSlider = () => {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    const dots = wrapper.querySelectorAll(".slider-dot");
    dots.forEach((dot, i) => dot.classList.toggle("active", i === currentSlide));
    const counterEl = wrapper.querySelector(".slider-counter .current");
    if (counterEl) counterEl.textContent = currentSlide + 1;
    const prevBtn = wrapper.querySelector(".slider-btn.prev");
    const nextBtn = wrapper.querySelector(".slider-btn.next");
    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === images.length - 1;
  };

  const nextSlide = () => { if (currentSlide < images.length - 1) { currentSlide++; updateSlider(); } };
  const prevSlide = () => { if (currentSlide > 0) { currentSlide--; updateSlider(); } };
  const goToSlide = (index) => { currentSlide = index; updateSlider(); };

  const prevBtn = wrapper.querySelector(".slider-btn.prev");
  const nextBtn = wrapper.querySelector(".slider-btn.next");
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);

  const dots = wrapper.querySelectorAll(".slider-dot");
  dots.forEach((dot, index) => dot.addEventListener("click", () => goToSlide(index)));

  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevSlide();
    if (e.key === "ArrowRight") nextSlide();
  });

  let touchStartX = 0;
  let touchEndX = 0;
  container.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  container.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) { if (diff > 0) nextSlide(); else prevSlide(); }
  }, { passive: true });

  updateSlider();
  return wrapper;
}

/* ============================================================
   PROJECT CARD — dark theme enforced
   ============================================================ */
function createProjectCard(project) {
  const card = document.createElement("article");
  card.className = "card project-card";

  const badgeClass = project.statusBadge === "done" ? "badge done" : "badge wip";
  const highlights = (project.highlights || []).map((h) => `<li>${h}</li>`).join("");
  const tagText = (project.tags || []).join(" • ");
  const candidates = buildImageCandidates(project);
  const hasImages = candidates.length > 0;

  const demoLink =
    project.video && isHttpUrl(project.video)
      ? `<div class="row" style="margin-top:14px">
           <a class="btn sm demo" href="${project.video}" target="_blank" rel="noopener">Watch Demo</a>
         </div>`
      : project.video && !hasImages
      ? `<div class="video-cta-wrapper">
           <div class="video-cta-icon">🎬</div>
           <div class="video-cta-text">This project features a live demo recording</div>
           <a class="btn demo" href="${project.video}" target="_blank" rel="noopener">Watch Full Demo Video</a>
         </div>`
      : project.video
      ? `<div class="row" style="margin-top:14px">
           <a class="btn sm demo" href="${project.video}" target="_blank" rel="noopener">Watch Demo</a>
         </div>`
      : "";

  const noteHtml = project.note
    ? `<p class="muted" style="margin-top:12px; font-size:12px; font-style:italic; opacity:0.75;">${project.note}</p>`
    : "";

  card.innerHTML = `
    <div class="kicker">Project</div>
    <h3>${project.title}</h3>

    <div class="project-meta">
      <span class="${badgeClass}">${project.status}</span>
      ${tagText ? `<span class="badge">${tagText}</span>` : ""}
    </div>

    <p class="muted" style="margin:10px 0 0; line-height:1.8; font-weight:500;">${project.summary}</p>

    ${highlights ? `
      <div style="margin-top:14px">
        <div class="kicker" style="margin-bottom:8px;">Highlights</div>
        <ul class="list">${highlights}</ul>
      </div>` : ""}

    ${demoLink}
    ${noteHtml}

    <div class="slider-placeholder" data-slider="1"></div>
  `;

  const sliderPlaceholder = card.querySelector("[data-slider]");

  if (hasImages) {
    const validImages = [];
    let loadedCount = 0;

    const checkAllLoaded = () => {
      if (loadedCount === candidates.length) {
        if (validImages.length > 0) {
          const slider = createSlider(validImages);
          if (slider) sliderPlaceholder.replaceWith(slider);
          else sliderPlaceholder.remove();
        } else {
          sliderPlaceholder.remove();
        }
      }
    };

    candidates.forEach((src) => {
      const testImg = new Image();
      testImg.onload = () => { validImages.push(src); loadedCount++; checkAllLoaded(); };
      testImg.onerror = () => { loadedCount++; checkAllLoaded(); };
      testImg.src = src;
    });

    // Fallback timeout
    setTimeout(() => {
      if (loadedCount < candidates.length) {
        loadedCount = candidates.length;
        checkAllLoaded();
      }
    }, 2500);
  } else {
    sliderPlaceholder.remove();
  }

  return card;
}

/* ============================================================
   RENDER
   ============================================================ */
function renderProjects(list) {
  const grid = $("#projectsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="card" style="text-align:center; padding:40px 20px;">
        <h3 style="margin-bottom:8px;">No matching projects</h3>
        <p class="muted">Try clearing filters or searching a different keyword.</p>
      </div>`;
    return;
  }

  list.forEach((p) => grid.appendChild(createProjectCard(p)));
}

function uniqueTags(projects) {
  const set = new Set();
  projects.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
  return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

function setupProjectFiltering() {
  const search = $("#projectSearch");
  const tagWrap = $("#tagFilters");
  if (!tagWrap) return;

  const tags = uniqueTags(ALL_PROJECTS);
  const makeTag = (name) => {
    const btn = document.createElement("button");
    btn.className = "filter-chip" + (name === "All" ? " active" : "");
    btn.type = "button";
    btn.textContent = name;
    btn.addEventListener("click", () => {
      ACTIVE_TAG = name;
      $$("#tagFilters .filter-chip").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });
    return btn;
  };

  tagWrap.innerHTML = "";
  tags.forEach((t) => tagWrap.appendChild(makeTag(t)));
  search?.addEventListener("input", applyFilters);
}

function applyFilters() {
  const q = ($("#projectSearch")?.value || "").trim().toLowerCase();
  const filtered = ALL_PROJECTS.filter((p) => {
    const matchTag = ACTIVE_TAG === "All" || (p.tags || []).includes(ACTIVE_TAG);
    const blob = [p.title, p.summary, (p.tags || []).join(" "), (p.highlights || []).join(" ")].join(" ").toLowerCase();
    const matchQuery = !q || blob.includes(q);
    return matchTag && matchQuery;
  });
  renderProjects(filtered);
}

/* ============================================================
   LOAD PROJECTS
   ============================================================ */
async function loadProjects() {
  const grid = $("#projectsGrid");

  // Show loading state
  if (grid) {
    grid.innerHTML = `
      <div class="card" style="text-align:center; padding:40px 20px;">
        <p class="muted" style="font-family:var(--font-mono); font-size:13px; letter-spacing:0.06em;">
          Loading projects…
        </p>
      </div>`;
  }

  try {
    const res = await fetch("projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    ALL_PROJECTS = data.projects || [];
    setupProjectFiltering();
    renderProjects(ALL_PROJECTS);
  } catch (err) {
    console.warn("projects.json fetch failed:", err);
    if (grid) {
      grid.innerHTML = `
        <div class="card" style="text-align:center; padding:40px 20px;">
          <h3 style="margin-bottom:12px;">⚠️ Projects failed to load</h3>
          <p class="muted" style="margin-bottom:12px;">
            Make sure <code style="background:var(--canvas-raised); padding:3px 8px; border-radius:6px; font-family:var(--font-mono);">projects.json</code>
            is in the same folder as <code style="background:var(--canvas-raised); padding:3px 8px; border-radius:6px; font-family:var(--font-mono);">index.html</code>.
          </p>
          <p class="muted" style="font-size:13px;">
            Run locally with:
            <code style="background:var(--canvas-raised); padding:3px 8px; border-radius:6px; font-family:var(--font-mono);">python -m http.server 8000</code>
          </p>
        </div>`;
    }
  }
}

/* ============================================================
   SCROLL SPY
   ============================================================ */
function setupScrollSpy() {
  const links = $$("#nav a");
  const ids = links.map((a) => a.getAttribute("href")).filter((h) => h && h.startsWith("#"));
  const sections = ids.map((id) => document.querySelector(id)).filter(Boolean);
  const byId = new Map();
  links.forEach((a) => byId.set(a.getAttribute("href"), a));

  const obs = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const id = "#" + visible.target.id;
      links.forEach((l) => l.classList.remove("active"));
      byId.get(id)?.classList.add("active");
    },
    { threshold: [0.25, 0.5, 0.75] }
  );

  sections.forEach((s) => obs.observe(s));
}

/* ============================================================
   ADD projects-grid CSS override at runtime
   (ensures single-column layout for wide project cards)
   ============================================================ */
function injectGridStyle() {
  const style = document.createElement("style");
  style.textContent = `
    .projects-grid {
      grid-template-columns: 1fr !important;
    }
  `;
  document.head.appendChild(style);
}

/* ============================================================
   INIT
   ============================================================ */
injectGridStyle();
setYear();
setupNav();
setupModals();
setupScrollSpy();
loadProjects();
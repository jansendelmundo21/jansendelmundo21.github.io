
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
    // Use indexed slots so images always appear in original number order
    // regardless of which image finishes loading first
    const imageSlots = new Array(candidates.length).fill(null);
    let loadedCount = 0;

    const checkAllLoaded = () => {
      if (loadedCount === candidates.length) {
        // Filter out failed images but keep original order
        const validImages = imageSlots.filter(Boolean);
        if (validImages.length > 0) {
          const slider = createSlider(validImages);
          if (slider) sliderPlaceholder.replaceWith(slider);
          else sliderPlaceholder.remove();
        } else {
          sliderPlaceholder.remove();
        }
      }
    };

    candidates.forEach((src, index) => {
      const testImg = new Image();
      testImg.onload = () => {
        imageSlots[index] = src; // slot into correct position
        loadedCount++;
        checkAllLoaded();
      };
      testImg.onerror = () => {
        // leave slot as null — filtered out later
        loadedCount++;
        checkAllLoaded();
      };
      testImg.src = src;
    });

    // Fallback timeout — force render with whatever loaded
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

  // Filter UI is optional — if elements don't exist, skip setup but still render
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
   LOAD PROJECTS — data embedded directly, no fetch needed
   Works on Cloudflare Pages, GitHub Pages, any host, file://
   ============================================================ */
async function loadProjects() {
  const grid = $("#projectsGrid");

  // Project data embedded directly — no fetch, works everywhere
  const PROJECTS_DATA = {
    "projects": [
      {
        "id": "qris",
        "title": "QR Information System (QRIS)",
        "status": "Completed",
        "statusBadge": "done",
        "tags": ["Python", "QR Contact Cards", "Employee Management", "Real-Time Updates", "Internal Tool"],
        "summary": "An internal QR contact-card and employee management system built for quick access to staff details. Generates branded QR codes that link to a web-based contact card (phone, email, location, and website), enabling scan-to-view access and real-time updates when employee information changes.",
        "highlights": [
          "Generates branded QR contact cards that link directly to a web-based profile",
          "Employee management module for adding and updating staff information",
          "Real-time updates: changes reflect immediately when the QR is scanned",
          "Supports contact details such as phone, email, location, and website links",
          "Designed for quick-response use cases and faster internal communication",
          "Improves accessibility of staff information without manual searching"
        ],
        "imageSets": [
          { "folder": "images/projects", "prefix": "qr", "start": 1, "end": 14, "ext": "png" }
        ],
        "extraImages": ["images/projects/qr11.png"],
        "video": "https://drive.google.com/file/d/1fR33KxPBGL9SSk6007WwnLnTSl9Gfhsp/view?usp=drive_link",
        "note": "Screenshots use fictional sample data for demonstration purposes only."
      },
      {
        "id": "inventory",
        "title": "Inventory Management System",
        "status": "In Progress",
        "statusBadge": "wip",
        "tags": ["Inventory Management", "Requisition & Issuance", "Asset Accountability", "Operational Systems", "Internal System"],
        "summary": "An internal inventory management system designed to support organization-wide inventory operations, including real-time item availability viewing, employee requests, and issuance tracking. Supports both consumable items and non-consumable assets through structured requisition and issuance workflows aligned with operational processes.",
        "highlights": [
          "Real-time inventory tracking for consumable items and non-consumable assets",
          "Live item availability visibility and request submission for employees",
          "Synchronized requisition and issuance workflows with automatic inventory updates",
          "Automated generation of request, issuance, and receipt documentation",
          "Role-based workflows for supply officers and employee users",
          "Designed for daily operations, monitoring, and audit accountability"
        ],
        "imageSets": [
          { "folder": "images/projects", "prefix": "inventory", "start": 1, "end": 13, "ext": "png" }
        ],
        "extraImages": ["images/projects/inventory13resultview.png"],
        "video": "https://drive.google.com/file/d/1ZgKHFBwk69K8mI2Ow7Ir8FSeXfnyssGq/view?usp=drive_link",
        "note": "Project is in progress and currently used for internal testing and workflow validation based on operational requirements. Screenshots use fictional sample data for demonstration purposes only."
      },
      {
        "id": "centraldeployment",
        "title": "Central Deployment System",
        "status": "In Progress",
        "statusBadge": "wip",
        "tags": ["Endpoint Management", "Remote Administration", "Software Deployment", "IT Operations", "Automation Scripts"],
        "summary": "A centralized deployment and remote management system designed to support software installation, maintenance, and basic remote administrative actions on employee laptops and desktops. Built to improve response time, standardize fixes, and support daily IT operations through controlled automation and remote commands.",
        "highlights": [
          "Centralized install/uninstall of approved software across employee workstations",
          "Remote administrative actions including lock, restart, shutdown, and user notifications",
          "Remote troubleshooting support to speed up issue resolution and reduce onsite handling",
          "Automation scripts for common fixes (e.g., restarting print spooler, disk health checks)",
          "Controlled command execution using command-line and Bash-based scripts",
          "Designed to standardize IT support actions and reduce repetitive manual intervention"
        ],
        "imageSets": [
          { "folder": "images/projects", "prefix": "s", "start": 1, "end": 6, "ext": "png" }
        ],
        "extraImages": [],
        "video": "https://drive.google.com/file/d/1KY8G28P9ox-cvGHwOvrE2zJy3SttlEOK/view?usp=drive_link",
        "note": "Prototype stage; features are being refined and validated based on internal operational requirements."
      },
      {
        "id": "automation",
        "title": "Python Automation Scripts",
        "status": "Completed",
        "statusBadge": "done",
        "tags": ["Python Automation", "Heavy Data Processing", "Data Validation", "Operational Reporting", "Workflow Automation"],
        "summary": "Python automation scripts created to handle ad hoc data requests, including heavy datasets. Used for data cleaning, validation, consolidation, and generating report-ready outputs based on operational requirements and supervisor requests.",
        "highlights": [
          "Built flexible scripts that adapt to different data formats and changing requirements",
          "Handled heavy datasets by automating cleaning, validation, and consolidation workflows",
          "Reduced repetitive manual processing by converting multi-step tasks into repeatable scripts",
          "Improved data consistency through validation checks and structured output generation",
          "Delivered report-ready files aligned with operational and supervisor data requests"
        ],
        "imageSets": [
          { "folder": "images/projects", "prefix": "script", "start": 1, "end": 4, "ext": "png" }
        ],
        "extraImages": [],
        "video": "https://drive.google.com/file/d/1Bs9qXwHjcYDsJ2y_xBmt4GL8Wn-Zoz3X/view?usp=drive_link",
        "note": "Demo video shows a representative automation workflow. Scripts vary depending on dataset size and request requirements."
      }
    ]
  };

  ALL_PROJECTS = PROJECTS_DATA.projects || [];
  renderProjects(ALL_PROJECTS);   // render immediately — always works
  setupProjectFiltering();        // optional filter UI setup after
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
      display: grid;
      grid-template-columns: 1fr;
      gap: 18px;
    }
  `;
  document.head.appendChild(style);
}

/* ============================================================
   INJECT EMAILS — bypasses Cloudflare obfuscation completely
   Emails are built at runtime so Cloudflare never sees them
   ============================================================ */
function injectEmails() {
  const at = "\x40";
  const myEmail = "jansencyrelle.cd" + at + "gmail.com";
  const graham  = "codegnash"        + at + "gmail.com";
  const melvin  = "mbernas"          + at + "ched.gov.ph";

  const make = (addr, cls) =>
    `<a class="${cls}" href="mailto:${addr}">${addr}</a>`;

  const heroEl   = document.getElementById("heroEmail");
  const grahamEl = document.getElementById("grahamEmail");
  const melvinEl = document.getElementById("melvinEmail");
  const footerEl = document.getElementById("footerEmail");

  if (heroEl)   heroEl.innerHTML   = make(myEmail, "mini-link");
  if (grahamEl) grahamEl.innerHTML = make(graham,  "ref-value link");
  if (melvinEl) melvinEl.innerHTML = make(melvin,  "ref-value link");
  if (footerEl) footerEl.innerHTML = make(myEmail, "");
}

/* ============================================================
   TOPBAR SCROLL STATE
   ============================================================ */
function setupTopbarScroll() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;
  const onScroll = () => {
    topbar.classList.toggle("scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   INIT — wrapped in DOMContentLoaded to guarantee DOM is ready
   ============================================================ */
function init() {
  injectGridStyle();
  injectEmails();
  setYear();
  setupNav();
  setupModals();
  setupScrollSpy();
  setupTopbarScroll();
  loadProjects();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init(); // DOM already ready (script loaded deferred/at bottom)
}
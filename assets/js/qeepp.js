/* =======================================================
   QEEPP Global Scripts
   Version: 1.5
   ======================================================= */

/* =======================================================
   Partial Loader
   ======================================================= */
async function loadPartial(targetId, url) {
  const el = document.getElementById(targetId);
  if (!el) return;

  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      console.warn(`Failed to load ${url}: ${res.status}`);
      return;
    }
    el.innerHTML = await res.text();
  } catch (err) {
    console.warn(`Fetch failed for ${url}`, err);
  }
}

/* =======================================================
   Sticky Header Shadow
   ======================================================= */
function initStickyShadow() {
  const headerWrap = document.getElementById("site-header");
  if (!headerWrap) return;

  function onScroll() {
    if (window.scrollY > 10) headerWrap.classList.add("is-scrolled");
    else headerWrap.classList.remove("is-scrolled");
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* =======================================================
   Mobile Menu
   Expects:
   - #menuToggle
   - #primaryNav
   ======================================================= */
function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("primaryNav");
  const headerRoot = document.getElementById("site-header");

  if (!toggle || !nav || !headerRoot) return;
  if (toggle.dataset.bound === "1") return;
  toggle.dataset.bound = "1";

  function isMobile() {
    return window.matchMedia("(max-width: 940px)").matches;
  }

  function closeAllSubmenus() {
    nav.querySelectorAll(".nav-item.has-submenu.open").forEach((item) => {
      item.classList.remove("open");
      const btn = item.querySelector(".submenu-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function openMenu() {
    nav.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    closeAllSubmenus();
  }

  function toggleMenu() {
    if (nav.classList.contains("open")) closeMenu();
    else openMenu();
  }

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMobile()) return;
    toggleMenu();
  });

  nav.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    if (!isMobile()) return;
    closeMenu();
  });

  document.addEventListener("click", (e) => {
    if (!isMobile()) return;
    if (!nav.classList.contains("open")) return;

    const clickedInsideNav = nav.contains(e.target);
    const clickedToggle = toggle.contains(e.target);

    if (!clickedInsideNav && !clickedToggle) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      closeMenu();
    }
  });
}

/* =======================================================
   Submenus
   Supports:
   - .nav-item.has-submenu
   - .submenu-toggle
   - desktop hover via CSS
   - mobile click via JS
   ======================================================= */
function initSubmenus() {
  const nav = document.getElementById("primaryNav");
  if (!nav) return;

  const submenuItems = nav.querySelectorAll(".nav-item.has-submenu");
  if (!submenuItems.length) return;

  function isMobile() {
    return window.matchMedia("(max-width: 980px)").matches;
  }

  function closeItem(item) {
    item.classList.remove("open");
    const toggle = item.querySelector(".submenu-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function openItem(item) {
    item.classList.add("open");
    const toggle = item.querySelector(".submenu-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }

  function closeAll(exceptItem = null) {
    submenuItems.forEach((item) => {
      if (item !== exceptItem) closeItem(item);
    });
  }

  submenuItems.forEach((item) => {
    const toggle = item.querySelector(".submenu-toggle");
    if (!toggle) return;
    if (toggle.dataset.bound === "1") return;
    toggle.dataset.bound = "1";

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!isMobile()) {
        const isOpen = item.classList.contains("open");
        closeAll();
        if (!isOpen) openItem(item);
        return;
      }

      const isOpen = item.classList.contains("open");
      closeAll(item);
      if (isOpen) closeItem(item);
      else openItem(item);
    });
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("#primaryNav")) return;
    closeAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      closeAll();
    }
  });
}

/* =======================================================
   Contact Forms (supports modal + page)
   - Prefer: form[data-contact-form]
   - Fallback: #contactForm
   ======================================================= */
function initContactForms() {
  const forms = Array.from(document.querySelectorAll("form[data-contact-form]"));
  const fallback = document.getElementById("contactForm");
  if (forms.length === 0 && fallback) forms.push(fallback);
  if (forms.length === 0) return;

  forms.forEach((form) => {
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const statusEl =
        form.querySelector("[data-contact-status]") ||
        document.getElementById("contactStatus");

      const setStatus = (msg, isError = false) => {
        if (!statusEl) return;
        statusEl.style.display = "block";
        statusEl.textContent = msg;
        statusEl.style.color = isError
          ? "rgba(248,113,113,.95)"
          : "rgba(169,182,198,.95)";
      };

      try {
        const data = new FormData(form);
        const response = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" }
        });

        if (response.ok) {
          setStatus("Thank you. Your message has been sent.");
          form.reset();
        } else {
          setStatus("Something went wrong. Please try again.", true);
        }
      } catch (err) {
        console.warn(err);
        setStatus("Network error. Please try again.", true);
      }
    });
  });
}

/* =======================================================
   Modals (Slide Kit + PDFs + Contact)
   Exposes:
   - window.QEEPP.openContact() for deep links (#contact)
   ======================================================= */
function initModals() {
  const slideModal = document.getElementById("slideKitModal");
  const slideFrameWrap = document.getElementById("slideKitFrameWrap");
  const slideFrame = document.getElementById("slideKitFrame");

  const pdfModal = document.getElementById("pdfModal");
  const pdfFrameWrap = document.getElementById("pdfFrameWrap");
  const pdfFrame = document.getElementById("pdfFrame");
  const pdfTitle = document.getElementById("pdfTitle");
  const pdfOpenNew = document.getElementById("pdfOpenNew");

  const contactModal = document.getElementById("contactModal");

  if (!slideModal && !pdfModal && !contactModal) return;

  function openModal(el) {
    if (!el) return;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(el) {
    if (!el) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openPdf(url, titleText) {
    if (!pdfModal) return;
    if (pdfTitle) pdfTitle.textContent = titleText || "Document";
    if (pdfOpenNew) pdfOpenNew.href = url;
    if (pdfFrame) pdfFrame.src = url;
    openModal(pdfModal);
  }

  function closePdf() {
    if (!pdfModal) return;
    closeModal(pdfModal);
    if (pdfFrame) pdfFrame.src = "";
  }

  function openSlideKit() {
    if (!slideModal) return;
    openModal(slideModal);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slideFrame?.focus?.({ preventScroll: true });
      });
    });
  }

  function closeSlideKit() {
    if (!slideModal) return;
    closeModal(slideModal);
  }

  function openContact() {
    if (!contactModal) return;
    openModal(contactModal);
    requestAnimationFrame(() => {
      const first = contactModal.querySelector("input, textarea, button");
      first?.focus?.({ preventScroll: true });
    });
  }

  function closeContact() {
    if (!contactModal) return;
    closeModal(contactModal);
  }

  window.QEEPP = window.QEEPP || {};
  window.QEEPP.openContact = openContact;

  document.addEventListener(
    "click",
    async (e) => {
      const slideTrigger = e.target.closest('[data-modal="slidekit"], #openSlideKit');
      if (slideTrigger) {
        e.preventDefault();
        openSlideKit();
        return;
      }

      const contactTrigger = e.target.closest('[data-modal="contact"]');
      if (contactTrigger) {
        e.preventDefault();
        openContact();
        return;
      }

      const pdfTrigger = e.target.closest("[data-pdf]");
      if (pdfTrigger) {
        e.preventDefault();
        const url = pdfTrigger.getAttribute("data-pdf");
        const titleText = pdfTrigger.getAttribute("data-title") || "Document";
        openPdf(url, titleText);
        return;
      }

      if (e.target && e.target.dataset && e.target.dataset.close === "true") {
        if (slideModal?.classList.contains("is-open")) closeSlideKit();
        if (pdfModal?.classList.contains("is-open")) closePdf();
        if (contactModal?.classList.contains("is-open")) closeContact();
        return;
      }

      const actionEl = e.target.closest("[data-modal-action]");
      const action = actionEl ? actionEl.getAttribute("data-modal-action") : null;

      if (action === "slidekit-close" || e.target.id === "slideKitClose") {
        e.preventDefault();
        closeSlideKit();
        return;
      }

      if (action === "pdf-close" || e.target.id === "pdfClose") {
        e.preventDefault();
        closePdf();
        return;
      }

      if (action === "contact-close") {
        e.preventDefault();
        closeContact();
        return;
      }

      if (action === "slidekit-fullscreen" || e.target.id === "slideKitFullscreen") {
        e.preventDefault();
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else await slideFrameWrap?.requestFullscreen?.();
        } catch (_) {}
        return;
      }

      if (action === "pdf-fullscreen" || e.target.id === "pdfFullscreen") {
        e.preventDefault();
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else await pdfFrameWrap?.requestFullscreen?.();
        } catch (_) {}
        return;
      }
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (slideModal?.classList.contains("is-open")) closeSlideKit();
    if (pdfModal?.classList.contains("is-open")) closePdf();
    if (contactModal?.classList.contains("is-open")) closeContact();
  });
}

/* =======================================================
   Interactive Starfish
   Expects:
   - .star-inner
   - #qualityScore
   - #effectivenessScore
   - #efficiencyScore
   - #performanceScore
   - #productivityScore
   ======================================================= */
function initInteractiveStarfish() {
  const starInner = document.querySelector(".star-inner");
  if (!starInner) return;

  const fields = {
    quality: document.getElementById("qualityScore"),
    effectiveness: document.getElementById("effectivenessScore"),
    efficiency: document.getElementById("efficiencyScore"),
    performance: document.getElementById("performanceScore"),
    productivity: document.getElementById("productivityScore")
  };

  const hasAllFields = Object.values(fields).every(Boolean);
  if (!hasAllFields) return;

  const points = {
    quality: {
      5: "50% 100%",
      4: "50% 90%",
      3: "50% 80%",
      2: "50% 70%",
      1: "50% 60%"
    },
    effectiveness: {
      5: "20.61% 9.55%",
      4: "26.49% 17.64%",
      3: "32.37% 25.73%",
      2: "38.24% 33.82%",
      1: "44.12% 41.91%"
    },
    efficiency: {
      5: "97.55% 65.45%",
      4: "88.04% 62.36%",
      3: "78.53% 59.27%",
      2: "69.02% 56.18%",
      1: "59.51% 53.09%"
    },
    performance: {
      5: "2.45% 65.45%",
      4: "11.96% 62.36%",
      3: "21.47% 59.27%",
      2: "30.98% 56.18%",
      1: "40.49% 53.09%"
    },
    productivity: {
      5: "79.39% 9.55%",
      4: "73.51% 17.64%",
      3: "67.63% 25.73%",
      2: "61.76% 33.82%",
      1: "55.88% 41.91%"
    }
  };

  function updateStarfish() {
    const q = fields.quality.value;
    const e1 = fields.effectiveness.value;
    const e2 = fields.efficiency.value;
    const p1 = fields.performance.value;
    const p2 = fields.productivity.value;

    const polygon = [
      points.quality[q],
      points.effectiveness[e1],
      points.efficiency[e2],
      points.performance[p1],
      points.productivity[p2]
    ].join(", ");

    starInner.style.clipPath = `polygon(${polygon})`;
    starInner.style.webkitClipPath = `polygon(${polygon})`;
  }

  Object.values(fields).forEach((field) => {
    if (field.dataset.boundStarfish === "1") return;
    field.dataset.boundStarfish = "1";
    field.addEventListener("change", updateStarfish);
    field.addEventListener("input", updateStarfish);
  });

  updateStarfish();
}

/* =======================================================
   Hash Handler (deep links)
   - Supports: #contact
   ======================================================= */
function handleHashOpen() {
  if (location.hash === "#contact") {
    window.QEEPP?.openContact?.();
  }
}

/* =======================================================
   Boot
   Ensure partials are loaded before initializing features
   ======================================================= */
(async function initSite() {
  await loadPartial("site-header", "partials/header.html");
  await loadPartial("site-footer", "partials/footer.html");
  await loadPartial("site-modals", "partials/modals.html");

  initStickyShadow();
  initMobileMenu();
  initSubmenus();
  initModals();
  initContactForms();

  initInteractiveStarfish();
  requestAnimationFrame(() => {
    initInteractiveStarfish();
  });

  handleHashOpen();
  window.addEventListener("hashchange", handleHashOpen);
})();

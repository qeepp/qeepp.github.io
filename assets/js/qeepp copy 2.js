/* =======================================================
   QEEPP Global Scripts
   Version: 1.2
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
    // Prevent double-binding
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
          headers: { Accept: "application/json" },
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
  // Slide kit modal elements
  const slideModal = document.getElementById("slideKitModal");
  const slideFrameWrap = document.getElementById("slideKitFrameWrap");
  const slideFrame = document.getElementById("slideKitFrame");

  // PDF modal elements
  const pdfModal = document.getElementById("pdfModal");
  const pdfFrameWrap = document.getElementById("pdfFrameWrap");
  const pdfFrame = document.getElementById("pdfFrame");
  const pdfTitle = document.getElementById("pdfTitle");
  const pdfOpenNew = document.getElementById("pdfOpenNew");

  // Contact modal elements
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

  // Expose for deep link handler
  window.QEEPP = window.QEEPP || {};
  window.QEEPP.openContact = openContact;

  document.addEventListener(
    "click",
    async (e) => {
      // Open slide kit modal
      const slideTrigger = e.target.closest('[data-modal="slidekit"], #openSlideKit');
      if (slideTrigger) {
        e.preventDefault();
        openSlideKit();
        return;
      }

      // Open contact modal
      const contactTrigger = e.target.closest('[data-modal="contact"]');
      if (contactTrigger) {
        e.preventDefault();
        openContact();
        return;
      }

      // Open PDF modal
      const pdfTrigger = e.target.closest("[data-pdf]");
      if (pdfTrigger) {
        e.preventDefault();
        const url = pdfTrigger.getAttribute("data-pdf");
        const titleText = pdfTrigger.getAttribute("data-title") || "Document";
        openPdf(url, titleText);
        return;
      }

      // Backdrop closes whichever modal is open
      if (e.target && e.target.dataset && e.target.dataset.close === "true") {
        if (slideModal?.classList.contains("is-open")) closeSlideKit();
        if (pdfModal?.classList.contains("is-open")) closePdf();
        if (contactModal?.classList.contains("is-open")) closeContact();
        return;
      }

      // Modal action buttons
      const actionEl = e.target.closest("[data-modal-action]");
      const action = actionEl ? actionEl.getAttribute("data-modal-action") : null;

      // Close actions
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

      // Fullscreen actions
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

  // ESC closes whichever modal is open
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (slideModal?.classList.contains("is-open")) closeSlideKit();
    if (pdfModal?.classList.contains("is-open")) closePdf();
    if (contactModal?.classList.contains("is-open")) closeContact();
  });
}

/* =======================================================
   Hash handler (deep links)
   - Supports: #contact
   ======================================================= */
function handleHashOpen() {
  if (location.hash === "#contact") {
    // Open directly (does not depend on a trigger button existing)
    window.QEEPP?.openContact?.();
  }
}

/* =======================================================
   Boot
   Ensure modals are loaded before initModals/initContactForms.
   IMPORTANT: hash handler runs after initModals so window.QEEPP exists.
   ======================================================= */
(async function initSite() {
  await loadPartial("site-header", "partials/header.html");
  await loadPartial("site-footer", "partials/footer.html");
  await loadPartial("site-modals", "partials/modals.html");

  initStickyShadow();
  initModals();
  initContactForms();

  // Deep link support
  handleHashOpen();
  window.addEventListener("hashchange", handleHashOpen);
})();

const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  nav.classList.toggle("open");
});
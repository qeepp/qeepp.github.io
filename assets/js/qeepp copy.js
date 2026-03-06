/* =======================================================
   QEEPP Global Scripts
   Version: 1.0
   ======================================================= */

/*console.log("qeepp.js loaded on:", location.pathname);*/

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

// Contact form (only on pages that have it)
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        alert("Thank you for your message.");
        form.reset();
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
      console.warn(err);
    }
  });
}

function initModals() {
  // --- Slide kit modal elements (exist only after modals partial is loaded) ---
  const slideModal = document.getElementById("slideKitModal");
  const slideFrameWrap = document.getElementById("slideKitFrameWrap");
  const slideFrame = document.getElementById("slideKitFrame");

  // --- PDF modal elements ---
  const pdfModal = document.getElementById("pdfModal");
  const pdfFrameWrap = document.getElementById("pdfFrameWrap");
  const pdfFrame = document.getElementById("pdfFrame");
  const pdfTitle = document.getElementById("pdfTitle");
  const pdfOpenNew = document.getElementById("pdfOpenNew");

  // If modals are not present on the page, exit safely
  if (!slideModal && !pdfModal) return;

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
    if (pdfTitle) pdfTitle.textContent = titleText || "Document";
    if (pdfOpenNew) pdfOpenNew.href = url;
    if (pdfFrame) pdfFrame.src = url;
    openModal(pdfModal);
  }

  function closePdf() {
    closeModal(pdfModal);
    if (pdfFrame) pdfFrame.src = "";
  }

  function closeSlide() {
    closeModal(slideModal);
  }

  // One delegated click handler for the whole site (capture-phase so other scripts can't block)
  document.addEventListener(
    "click",
    async (e) => {
      // Open slide kit modal (any button/link with data-modal="slidekit" OR legacy #openSlideKit)
      const slideTrigger = e.target.closest('[data-modal="slidekit"], #openSlideKit');
      if (slideTrigger) {
        e.preventDefault();
        openModal(slideModal);

        // best-effort focus into iframe
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (slideFrame && slideFrame.focus) {
              slideFrame.focus({ preventScroll: true });
            }
          });
        });
        return;
      }

      // Open PDF modal (any element with data-pdf)
      const pdfTrigger = e.target.closest("[data-pdf]");
      if (pdfTrigger) {
        e.preventDefault();
        const url = pdfTrigger.getAttribute("data-pdf");
        const titleText = pdfTrigger.getAttribute("data-title") || "Document";
        openPdf(url, titleText);
        return;
      }

      // Backdrop closes (either modal)
      if (e.target && e.target.dataset && e.target.dataset.close === "true") {
        if (slideModal && slideModal.classList.contains("is-open")) closeSlide();
        if (pdfModal && pdfModal.classList.contains("is-open")) closePdf();
        return;
      }

      // Buttons inside modal (support both data-modal-action and ids)
      const actionEl = e.target.closest("[data-modal-action]");
      const action = actionEl ? actionEl.getAttribute("data-modal-action") : null;

      if (action === "slidekit-close" || e.target.id === "slideKitClose") {
        e.preventDefault();
        closeSlide();
        return;
      }

      if (action === "pdf-close" || e.target.id === "pdfClose") {
        e.preventDefault();
        closePdf();
        return;
      }

      if (action === "slidekit-fullscreen" || e.target.id === "slideKitFullscreen") {
        e.preventDefault();
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else if (slideFrameWrap && slideFrameWrap.requestFullscreen) await slideFrameWrap.requestFullscreen();
        } catch (_) {}
        return;
      }

      if (action === "pdf-fullscreen" || e.target.id === "pdfFullscreen") {
        e.preventDefault();
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else if (pdfFrameWrap && pdfFrameWrap.requestFullscreen) await pdfFrameWrap.requestFullscreen();
        } catch (_) {}
        return;
      }
    },
    true
  );

  // ESC closes whichever is open
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (slideModal && slideModal.classList.contains("is-open")) closeSlide();
    if (pdfModal && pdfModal.classList.contains("is-open")) closePdf();
  });
}

(async function initSite() {
  await loadPartial("site-header", "partials/header.html");
  await loadPartial("site-footer", "partials/footer.html");
  await loadPartial("site-modals", "partials/modals.html"); // IMPORTANT: load modals before initModals

  initStickyShadow();
  initContactForm();
  initModals();
})();
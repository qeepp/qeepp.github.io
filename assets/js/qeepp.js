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

(async function initSite() {
  await loadPartial("site-header", "partials/header.html");
  await loadPartial("site-footer", "partials/footer.html");

  initStickyShadow();
  initContactForm();
})();
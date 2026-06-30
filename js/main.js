/* ============================================================
   Top Flight Comedy — interactions
   ============================================================ */
(function () {
  "use strict";

  var LINKTREE = "https://linktr.ee/topflightcomedy";
  var shows = (window.TFC_SHOWS || []).slice().sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });

  /* ---------- helpers ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function fmtDate(iso, opts) {
    return new Date(iso).toLocaleDateString("en-US", opts || { weekday: "short", month: "short", day: "numeric" });
  }
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  function money(n) { return "$" + Number(n).toFixed(Number(n) % 1 ? 2 : 0); }

  var ICONS = {
    cal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    pin: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>'
  };

  function badgeFor(s) {
    if (s.status === "soldout") return '<span class="badge badge--soldout">Sold Out</span>';
    if (s.status === "few") return '<span class="badge badge--few">Few Left</span>';
    return '<span class="badge badge--soon">On Sale</span>';
  }

  /* ---------- render shows ---------- */
  var grid = $("#shows-grid");

  function render(filter) {
    if (!grid) return;
    var list = shows.filter(function (s) { return filter === "all" || s.type === filter; });
    if (!list.length) {
      grid.innerHTML = '<p class="shows-empty">No shows in this category yet — check back soon or <a href="' + LINKTREE + '" style="color:var(--gold)">see all upcoming dates</a>.</p>';
      return;
    }
    grid.innerHTML = list.map(function (s) {
      var priceLabel = s.fromPrice > 0
        ? '<span class="price">' + money(s.fromPrice) + ' <small>from</small></span>'
        : '<span class="price" style="font-size:1.05rem">Custom <small>quote</small></span>';
      var poster = s.image
        ? '<img src="' + s.image + '" alt="' + s.title + ' at ' + s.venue + '" loading="lazy" width="400" height="250">'
        : "";
      return '' +
        '<article class="show-card reveal" data-id="' + s.id + '">' +
          '<div class="poster">' + poster +
            '<div class="date-chip"><b>' + fmtDate(s.date, { day: "numeric" }) + '</b><span>' + fmtDate(s.date, { month: "short" }) + '</span></div>' +
            badgeFor(s) +
          '</div>' +
          '<div class="body">' +
            '<h3>' + s.title + '</h3>' +
            '<div class="meta">' +
              '<span>' + ICONS.cal + fmtDate(s.date, { weekday: "long", month: "long", day: "numeric" }) + '</span>' +
              '<span>' + ICONS.clock + fmtTime(s.date) + ' &middot; doors ' + (s.doors || "") + '</span>' +
              '<span>' + ICONS.pin + s.venue + '</span>' +
            '</div>' +
            '<div class="price-row">' + priceLabel +
              '<button class="btn btn--primary btn--sm" data-open="' + s.id + '">' +
                (s.type === "corporate" ? "Inquire" : (s.status === "soldout" ? "Join Waitlist" : "Get Tickets")) +
              '</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join("");
    observeReveals();
  }

  /* ---------- filters ---------- */
  $$(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $$(".chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      chip.setAttribute("aria-pressed", "true");
      render(chip.dataset.filter);
    });
  });

  /* ---------- ticket modal ---------- */
  var modal = $("#ticket-modal");
  var state = { show: null, tier: 0, qty: 1 };

  function openModal(id) {
    var s = shows.find(function (x) { return x.id === id; });
    if (!s) return;
    state = { show: s, tier: 0, qty: 1 };
    paintModal();
    modal.setAttribute("data-open", "true");
    document.body.classList.add("no-scroll");
    var close = $(".modal-close", modal);
    if (close) close.focus();
  }
  function closeModal() {
    modal.setAttribute("data-open", "false");
    document.body.classList.remove("no-scroll");
  }

  function paintModal() {
    var s = state.show;
    var sold = s.status === "soldout";
    var corp = s.type === "corporate" || s.fromPrice === 0;
    var tier = s.tiers[state.tier];
    var total = tier.price * state.qty;

    var poster = s.image ? '<img src="' + s.image + '" alt="' + s.title + '">' : "";
    var tiersHtml = s.tiers.map(function (t, i) {
      return '<div class="tier ' + (i === state.tier ? "is-active" : "") + '" data-tier="' + i + '" role="button" tabindex="0">' +
        '<div class="tier-info"><b>' + t.name + '</b><small>' + (t.note || "") + '</small></div>' +
        '<div class="tier-price">' + (t.price > 0 ? money(t.price) : "—") + '</div>' +
      '</div>';
    }).join("");

    var action;
    if (corp) {
      action = '<a class="btn btn--primary btn--block" href="#contact" data-modal-link>Request a Quote</a>';
    } else if (sold) {
      action = '<div class="soldout-note">This show is sold out.</div>' +
        '<a class="btn btn--ghost btn--block" href="#newsletter" data-modal-link>Join the waitlist</a>';
    } else {
      action = '<button class="btn btn--primary btn--block" id="checkout-btn">Continue to Secure Checkout</button>';
    }

    var summary = (!corp && !sold)
      ? '<div class="modal-summary"><div><small>' + state.qty + ' × ' + tier.name + '</small><span class="total">' + money(total) + '</span></div>' +
        '<div class="qty">' +
          '<button id="q-minus" aria-label="Decrease quantity"' + (state.qty <= 1 ? " disabled" : "") + '>−</button>' +
          '<output aria-live="polite">' + state.qty + '</output>' +
          '<button id="q-plus" aria-label="Increase quantity"' + (state.qty >= 10 ? " disabled" : "") + '>+</button>' +
        '</div></div>'
      : "";

    $(".modal-card", modal).innerHTML =
      '<button class="modal-close" aria-label="Close">×</button>' +
      '<div class="modal-poster">' + poster + '</div>' +
      '<div class="modal-body">' +
        '<h3 id="modal-title">' + s.title + '</h3>' +
        '<div class="modal-meta">' +
          '<span>' + ICONS.cal + fmtDate(s.date, { weekday: "long", month: "long", day: "numeric" }) + '</span>' +
          '<span>' + ICONS.clock + fmtTime(s.date) + '</span>' +
          '<span>' + ICONS.pin + s.venue + '</span>' +
        '</div>' +
        '<p class="modal-desc">' + s.blurb + '</p>' +
        (corp ? "" : '<div role="radiogroup" aria-label="Ticket type">' + tiersHtml + '</div>') +
        summary + action +
        (!corp && !sold ? '<div class="secure-note">' + ICONS.lock + ' Secure checkout — powered by Stripe</div>' : "") +
      '</div>';

    wireModal();
  }

  function wireModal() {
    var close = $(".modal-close", modal);
    if (close) close.addEventListener("click", closeModal);

    $$(".tier", modal).forEach(function (el) {
      function pick() { state.tier = +el.dataset.tier; state.qty = 1; paintModal(); }
      el.addEventListener("click", pick);
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
    var minus = $("#q-minus"), plus = $("#q-plus");
    if (minus) minus.addEventListener("click", function () { if (state.qty > 1) { state.qty--; paintModal(); } });
    if (plus) plus.addEventListener("click", function () { if (state.qty < 10) { state.qty++; paintModal(); } });

    var checkout = $("#checkout-btn");
    if (checkout) checkout.addEventListener("click", function () {
      var tier = state.show.tiers[state.tier];
      var url = tier.checkoutUrl && tier.checkoutUrl.trim() ? tier.checkoutUrl.trim() : LINKTREE;
      window.open(url, "_blank", "noopener");
    });

    $$("[data-modal-link]", modal).forEach(function (a) {
      a.addEventListener("click", closeModal);
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open]");
    if (t && t.dataset.open && t.dataset.open !== "true" && t.dataset.open !== "false") {
      e.preventDefault(); openModal(t.dataset.open);
    }
    if (e.target.classList && e.target.classList.contains("modal-overlay")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.getAttribute("data-open") === "true") closeModal();
  });

  /* ---------- inject Event structured data (SEO / AI citation) ---------- */
  function injectEventSchema() {
    var events = shows
      .filter(function (s) { return s.type !== "corporate"; })
      .map(function (s) {
        return {
          "@context": "https://schema.org",
          "@type": "ComedyEvent",
          "name": s.title + " — Top Flight Comedy",
          "startDate": s.date,
          "eventStatus": s.status === "soldout" ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "description": s.blurb,
          "image": [new URL(s.image, location.href).href],
          "location": {
            "@type": "Place",
            "name": s.venue,
            "address": { "@type": "PostalAddress", "addressLocality": "Austin", "addressRegion": "TX", "addressCountry": "US" }
          },
          "organizer": { "@type": "Organization", "name": "Top Flight Comedy", "url": "https://topflightcomedy.com/" },
          "performer": { "@type": "PerformingGroup", "name": "Top Flight Comedy" },
          "offers": {
            "@type": "Offer",
            "price": String(s.fromPrice || 0),
            "priceCurrency": "USD",
            "availability": s.status === "soldout" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            "url": "https://topflightcomedy.com/#shows"
          }
        };
      });
    if (!events.length) return;
    var el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(events);
    document.head.appendChild(el);
  }

  /* ---------- FAQ accordion ---------- */
  $$(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var open = q.getAttribute("aria-expanded") === "true";
      var ans = q.nextElementSibling;
      q.setAttribute("aria-expanded", String(!open));
      ans.style.maxHeight = open ? "0" : ans.scrollHeight + 24 + "px";
    });
  });

  /* ---------- header scroll + mobile nav ---------- */
  var header = $(".site-header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }, { passive: true });

  var nav = $(".nav"), toggle = $(".nav-toggle");
  if (toggle) toggle.addEventListener("click", function () {
    var open = nav.getAttribute("data-open") === "true";
    nav.setAttribute("data-open", String(!open));
    toggle.setAttribute("aria-expanded", String(!open));
  });
  $$(".nav-links a").forEach(function (a) {
    a.addEventListener("click", function () { nav.setAttribute("data-open", "false"); });
  });

  /* ---------- newsletter (front-end only) ---------- */
  var form = $("#newsletter-form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#nl-email").value.trim();
    var msg = $("#form-msg");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.textContent = "Please enter a valid email.";
      msg.className = "form-msg"; return;
    }
    msg.textContent = "You're on the list — first dibs on every show. ✈️";
    msg.className = "form-msg ok";
    form.reset();
    /* TODO: connect to Mailchimp/Beehiiv/ConvertKit action endpoint */
  });

  /* ---------- scroll reveal ---------- */
  var io;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach(function (el) { el.classList.add("in"); }); return; }
    if (!io) io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$(".reveal:not(.in)").forEach(function (el) { io.observe(el); });
  }

  /* ---------- footer year ---------- */
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* init */
  render("all");
  injectEventSchema();
  observeReveals();
})();

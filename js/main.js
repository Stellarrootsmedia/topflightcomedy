/* ============================================================
   Top Flight Comedy — interactions (Eventbrite + calendar)
   ============================================================ */
(function () {
  "use strict";

  var LINKS = window.TFC_LINKS || {};
  var FALLBACK = LINKS.eventbrite || "https://linktr.ee/topflightcomedy";
  var shows = (window.TFC_SHOWS || []).slice();

  /* ---------- helpers ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var now = new Date();

  function parse(iso) { return new Date(iso); }
  function nextDate(show) {
    var up = (show.dates || []).map(parse).filter(function (d) { return d >= now; }).sort(function (a, b) { return a - b; });
    return up.length ? up[0] : null;
  }
  function fmt(d, opts) { return d.toLocaleDateString("en-US", opts); }
  function fmtTime(d) { return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }

  // sort shows by their next date; corporate / dateless go last
  shows.sort(function (a, b) {
    var na = nextDate(a), nb = nextDate(b);
    if (na && nb) return na - nb;
    if (na) return -1;
    if (nb) return 1;
    return 0;
  });

  var ICONS = {
    cal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    pin: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    tix: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9a3 3 0 010-6h18a3 3 0 010 6 3 3 0 000 6 3 3 0 010 6H3a3 3 0 010-6 3 3 0 000-6z"/></svg>'
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
      grid.innerHTML = '<p class="shows-empty">No shows in this category yet — <a href="' + FALLBACK + '" style="color:var(--gold-bright);font-weight:800">see all dates on Eventbrite</a>.</p>';
      return;
    }
    grid.innerHTML = list.map(function (s) {
      var nd = nextDate(s);
      var corp = s.type === "corporate";
      var poster = s.image ? '<img src="' + s.image + '" alt="Flyer for ' + s.title + '" loading="lazy" width="400" height="250">' : "";
      var dateChip = nd ? '<div class="date-chip"><b>' + fmt(nd, { day: "numeric" }) + '</b><span>' + fmt(nd, { month: "short" }) + '</span></div>' : "";
      var metaLines = corp
        ? '<span>' + ICONS.pin + 'Austin &amp; nationwide</span>'
        : (nd
            ? '<span>' + ICONS.cal + fmt(nd, { weekday: "long", month: "long", day: "numeric" }) + '</span>' +
              '<span>' + ICONS.clock + fmtTime(nd) + '</span>' +
              '<span>' + ICONS.pin + s.venue + '</span>'
            : '<span>' + ICONS.pin + s.venue + '</span>');
      var cta = corp
        ? '<span class="price">Custom<small>get a quote</small></span><button class="btn btn--ghost btn--sm" data-open="' + s.id + '">Inquire</button>'
        : '<span class="price">Eventbrite<small>secure tickets</small></span><button class="btn btn--primary btn--sm" data-open="' + s.id + '">Get Tickets</button>';
      return '' +
        '<article class="show-card reveal" data-id="' + s.id + '">' +
          '<div class="poster">' + poster + dateChip + (corp ? "" : badgeFor(s)) + '</div>' +
          '<div class="body">' +
            '<h3>' + s.title + '</h3>' +
            '<div class="meta">' + metaLines + '</div>' +
            '<div class="price-row">' + cta + '</div>' +
          '</div>' +
        '</article>';
    }).join("");
    observeReveals();
  }

  $$(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $$(".chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      chip.setAttribute("aria-pressed", "true");
      render(chip.dataset.filter);
    });
  });

  /* ---------- modal ---------- */
  var modal = $("#ticket-modal");

  function openModal(id) {
    var s = shows.find(function (x) { return x.id === id; });
    if (!s) return;
    var corp = s.type === "corporate";
    var upcoming = (s.dates || []).map(parse).filter(function (d) { return d >= now; }).sort(function (a, b) { return a - b; });

    var recurring = (s.type === "weekly" || s.type === "showcase");
    var datesHtml = upcoming.length
      ? '<div class="modal-dates">' + upcoming.map(function (d) {
          return '<a class="d" href="' + s.ticketUrl + '" target="_blank" rel="noopener">' +
            '<b>' + fmt(d, { weekday: "short", month: "short", day: "numeric" }) + '</b>' +
            '<small>' + fmtTime(d) + ' · Get tickets →</small></a>';
        }).join("") +
        (recurring ? '<p style="font-size:.82rem;color:var(--muted);margin-top:.2rem">Recurring show — see the full schedule &amp; all dates on Eventbrite.</p>' : "") +
        '</div>'
      : "";

    var cta = corp
      ? '<a class="btn btn--accent btn--block" href="#contact" data-modal-link>Request a Quote</a>'
      : '<a class="btn btn--primary btn--block" href="' + s.ticketUrl + '" target="_blank" rel="noopener">' + ICONS.tix + ' Get Tickets on Eventbrite</a>';

    var poster = s.image ? '<img src="' + s.image + '" alt="Flyer for ' + s.title + '">' : "";
    var meta = corp
      ? '<span>' + ICONS.pin + 'Your venue or ours · Austin &amp; nationwide</span>'
      : '<span>' + ICONS.pin + s.venue + ' · ' + s.address + '</span>';

    $(".modal-card", modal).innerHTML =
      '<button class="modal-close" aria-label="Close">×</button>' +
      '<div class="modal-poster">' + poster + '</div>' +
      '<div class="modal-body">' +
        '<h3 id="modal-title">' + s.title + '</h3>' +
        '<div class="modal-meta">' + meta + '</div>' +
        '<p class="modal-desc">' + s.blurb + '</p>' +
        (upcoming.length ? '<div class="eyebrow" style="margin-bottom:.6rem">Next date</div>' + datesHtml : "") +
        cta +
        (corp ? "" : '<div class="secure-note">' + ICONS.tix + ' Tickets &amp; checkout handled securely on Eventbrite</div>') +
      '</div>';

    $(".modal-close", modal).addEventListener("click", closeModal);
    $$("[data-modal-link]", modal).forEach(function (a) { a.addEventListener("click", closeModal); });

    modal.setAttribute("data-open", "true");
    document.body.classList.add("no-scroll");
    $(".modal-close", modal).focus();
  }
  function closeModal() { modal.setAttribute("data-open", "false"); document.body.classList.remove("no-scroll"); }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open]");
    if (t && t.dataset.open && t.dataset.open !== "true" && t.dataset.open !== "false") { e.preventDefault(); openModal(t.dataset.open); }
    if (e.target.classList && e.target.classList.contains("modal-overlay")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.getAttribute("data-open") === "true") closeModal();
  });

  /* ---------- calendar ---------- */
  // Build a map of "YYYY-M-D" -> [show, ...]
  var dayMap = {};
  shows.forEach(function (s) {
    (s.dates || []).forEach(function (iso) {
      var d = parse(iso);
      if (d < now) return;
      var key = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
      (dayMap[key] = dayMap[key] || []).push({ show: s, date: d });
    });
  });

  var calRoot = $("#cal-root");
  // open the calendar on the month of the next upcoming show (fall back to this month)
  var firstUpcoming = null;
  shows.forEach(function (s) { var d = nextDate(s); if (d && (!firstUpcoming || d < firstUpcoming)) firstUpcoming = d; });
  var calView = firstUpcoming ? new Date(firstUpcoming.getFullYear(), firstUpcoming.getMonth(), 1)
                              : new Date(now.getFullYear(), now.getMonth(), 1);
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function renderCalendar() {
    if (!calRoot) return;
    var y = calView.getFullYear(), m = calView.getMonth();
    var first = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();
    var cells = "";
    DOW.forEach(function (d) { cells += '<div class="cal-dow">' + d + '</div>'; });
    for (var i = 0; i < first; i++) cells += '<div class="cal-cell empty"></div>';
    for (var day = 1; day <= days; day++) {
      var key = y + "-" + m + "-" + day;
      var has = dayMap[key];
      var isToday = (y === now.getFullYear() && m === now.getMonth() && day === now.getDate());
      var cls = "cal-cell" + (isToday ? " today" : "") + (has ? " has-show" : "");
      var attr = has ? ' data-open="' + has[0].show.id + '" role="button" tabindex="0" title="' + has.map(function (x){return x.show.title;}).join(", ") + '"' : "";
      cells += '<div class="' + cls + '"' + attr + '>' + day + (has ? '<span class="pip"></span>' : "") + '</div>';
    }
    calRoot.innerHTML =
      '<div class="cal-head"><h3>' + MONTHS[m] + " " + y + '</h3>' +
        '<div class="cal-nav"><button id="cal-prev" aria-label="Previous month">‹</button><button id="cal-next" aria-label="Next month">›</button></div>' +
      '</div><div class="cal-grid">' + cells + '</div>';
    $("#cal-prev").addEventListener("click", function () { calView.setMonth(calView.getMonth() - 1); renderCalendar(); });
    $("#cal-next").addEventListener("click", function () { calView.setMonth(calView.getMonth() + 1); renderCalendar(); });
    $$(".cal-cell.has-show", calRoot).forEach(function (el) {
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(el.dataset.open); } });
    });
  }

  function renderUpcomingList() {
    var box = $("#cal-list");
    if (!box) return;
    var all = [];
    shows.forEach(function (s) {
      (s.dates || []).forEach(function (iso) { var d = parse(iso); if (d >= now) all.push({ show: s, date: d }); });
    });
    all.sort(function (a, b) { return a.date - b.date; });
    var html = '<h3>Next up</h3>';
    if (!all.length) { box.innerHTML = html + '<p style="color:var(--muted)">New dates dropping soon — follow on <a href="' + FALLBACK + '" style="color:var(--gold-bright);font-weight:800">Eventbrite</a>.</p>'; return; }
    html += all.slice(0, 6).map(function (e) {
      return '<button class="cal-event" data-open="' + e.show.id + '">' +
        '<span class="cal-date"><b>' + fmt(e.date, { day: "numeric" }) + '</b><span>' + fmt(e.date, { month: "short" }) + '</span></span>' +
        '<span class="cal-info"><b>' + e.show.title + '</b><span>' + fmt(e.date, { weekday: "long" }) + ' · ' + fmtTime(e.date) + ' · ' + e.show.venue + '</span></span>' +
      '</button>';
    }).join("");
    box.innerHTML = html;
  }

  /* ---------- Event structured data (SEO / AI citation) ---------- */
  function injectEventSchema() {
    var events = [];
    shows.filter(function (s) { return s.type !== "corporate"; }).forEach(function (s) {
      (s.dates || []).forEach(function (iso) {
        if (parse(iso) < now) return;
        events.push({
          "@context": "https://schema.org", "@type": "ComedyEvent",
          "name": s.title + " — Top Flight Comedy", "startDate": iso,
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "eventStatus": "https://schema.org/EventScheduled",
          "description": s.blurb,
          "image": [new URL(s.image, location.href).href],
          "location": { "@type": "Place", "name": s.venue, "address": { "@type": "PostalAddress", "streetAddress": "2505 East 6th Street, Suite D", "addressLocality": "Austin", "addressRegion": "TX", "postalCode": "78702", "addressCountry": "US" } },
          "organizer": { "@type": "Organization", "name": "Top Flight Comedy", "url": "https://topflightcomedy.com/" },
          "performer": { "@type": "PerformingGroup", "name": "Top Flight Comedy" },
          "offers": { "@type": "Offer", "url": s.ticketUrl, "availability": s.status === "soldout" ? "https://schema.org/SoldOut" : "https://schema.org/InStock", "priceCurrency": "USD" }
        });
      });
    });
    if (!events.length) return;
    var el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = JSON.stringify(events);
    document.head.appendChild(el);
  }

  /* ---------- FAQ ---------- */
  $$(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var open = q.getAttribute("aria-expanded") === "true";
      var ans = q.nextElementSibling;
      q.setAttribute("aria-expanded", String(!open));
      ans.style.maxHeight = open ? "0" : ans.scrollHeight + 24 + "px";
    });
  });

  /* ---------- header + nav ---------- */
  var header = $(".site-header");
  window.addEventListener("scroll", function () { header.classList.toggle("is-scrolled", window.scrollY > 10); }, { passive: true });
  var nav = $(".nav"), toggle = $(".nav-toggle");
  if (toggle) toggle.addEventListener("click", function () {
    var open = nav.getAttribute("data-open") === "true";
    nav.setAttribute("data-open", String(!open));
    toggle.setAttribute("aria-expanded", String(!open));
  });
  $$(".nav-links a").forEach(function (a) { a.addEventListener("click", function () { nav.setAttribute("data-open", "false"); }); });

  /* ---------- newsletter / contact (delivers via FormSubmit) ---------- */
  var CONTACT_ENDPOINT = "https://formsubmit.co/ajax/contact@topflightcomedy.com";
  var form = $("#newsletter-form");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#nl-email").value.trim(), msg = $("#form-msg");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "Please enter a valid email."; msg.className = "form-msg"; return; }
    var btn = form.querySelector("button"), orig = btn.textContent;
    btn.disabled = true; btn.textContent = "Sending…";
    msg.textContent = ""; msg.className = "form-msg";
    fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        email: email,
        _subject: "New newsletter signup — topflightcomedy.com",
        message: "New subscriber from the Top Flight Comedy website: " + email,
        _template: "table"
      })
    }).then(function (r) { return r.json(); }).then(function () {
      msg.textContent = "You're on the list — first dibs on every show. ✈️";
      msg.className = "form-msg ok"; form.reset();
    }).catch(function () {
      msg.textContent = "That didn't go through — email contact@topflightcomedy.com and we'll add you.";
      msg.className = "form-msg";
    }).finally(function () { btn.disabled = false; btn.textContent = orig; });
  });

  /* ---------- reveal ---------- */
  var io;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach(function (el) { el.classList.add("in"); }); return; }
    if (!io) io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$(".reveal:not(.in)").forEach(function (el) { io.observe(el); });
  }

  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* init */
  render("all");
  renderCalendar();
  renderUpcomingList();
  injectEventSchema();
  observeReveals();
})();

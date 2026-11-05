/* Top Flight Comedy: shared behavior for subpages (nav, FAQ, reveal, next show dates) */
(function () {
  "use strict";
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var header = document.querySelector(".site-header");
  if (header) window.addEventListener("scroll", function () { header.classList.toggle("is-scrolled", window.scrollY > 10); }, { passive: true });
  var nav = document.querySelector(".nav"), toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) toggle.addEventListener("click", function () {
    var open = nav.getAttribute("data-open") === "true";
    nav.setAttribute("data-open", String(!open));
    toggle.setAttribute("aria-expanded", String(!open));
  });

  $$(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var open = q.getAttribute("aria-expanded") === "true", ans = q.nextElementSibling;
      q.setAttribute("aria-expanded", String(!open));
      ans.style.maxHeight = open ? "0" : ans.scrollHeight + 24 + "px";
    });
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else { $$(".reveal").forEach(function (el) { el.classList.add("in"); }); }

  /* Next show date, read from js/shows.js (kept fresh by scripts/sync-eventbrite.py) */
  var shows = window.TFC_SHOWS || [], now = new Date();
  $$("[data-next-show]").forEach(function (el) {
    var s = shows.filter(function (x) { return x.id === el.getAttribute("data-next-show"); })[0];
    if (!s) return;
    var next = (s.dates || []).map(function (d) { return new Date(d); })
      .filter(function (d) { return d >= now; }).sort(function (a, b) { return a - b; })[0];
    if (!next) return;
    el.textContent = next.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + " at " +
      next.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  });

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

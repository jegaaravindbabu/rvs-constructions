/* RVS Constructions: projects filter + gallery lightbox. */
(function () {
  "use strict";
  var reduce = window.RVS && window.RVS.reduce;
  var grid = document.querySelector(".proj-grid");
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".proj-card"));

  /* ---------- Filter ---------- */
  var buttons = document.querySelectorAll(".filters button");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.getAttribute("data-filter");
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var first = {};
      if (window.gsap && !reduce) cards.forEach(function (c) { if (!c.classList.contains("is-hidden")) first[c.dataset.slug] = c.getBoundingClientRect(); });
      grid.classList.toggle("is-filtered", f !== "all");
      cards.forEach(function (c) {
        var show = f === "all" || c.getAttribute("data-type") === f;
        c.classList.toggle("is-hidden", !show);
        c.classList.toggle("is-feature", show && f === "all" && c.hasAttribute("data-feature"));
      });
      if (window.gsap && !reduce) {
        cards.forEach(function (c) {
          if (c.classList.contains("is-hidden")) return;
          gsap.set(c, { opacity: 1 });
          var a = first[c.dataset.slug], b = c.getBoundingClientRect();
          if (a) gsap.fromTo(c, { x: a.left - b.left, y: a.top - b.top }, { x: 0, y: 0, duration: 0.7, ease: "expo.out" });
          else gsap.fromTo(c, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" });
        });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
      var live = document.getElementById("filter-status");
      var n = cards.filter(function (c) { return !c.classList.contains("is-hidden"); }).length;
      if (live) live.textContent = n + (n === 1 ? " project shown" : " projects shown");
    });
  });

  /* ---------- Lightbox ---------- */
  var box = document.querySelector(".lightbox");
  var img = box.querySelector(".lightbox__stage img");
  var title = box.querySelector("#lb-title");
  var meta = box.querySelector(".lightbox__bar p");
  var counter = box.querySelector(".lightbox__nav span");
  var prevBtn = box.querySelector("[data-prev]");
  var nextBtn = box.querySelector("[data-next]");
  var closeBtn = box.querySelector("[data-close]");
  var list = [], alts = [], idx = 0, opener = null;

  function show(i) {
    idx = (i + list.length) % list.length;
    var go = function () {
      img.src = list[idx];
      img.alt = alts[idx] || title.textContent;
      counter.textContent = (idx + 1) + " / " + list.length;
      if (window.gsap && !reduce) gsap.fromTo(img, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" });
    };
    go();
    var single = list.length < 2;
    prevBtn.hidden = single; nextBtn.hidden = single;
  }
  function open(card) {
    opener = card;
    list = JSON.parse(card.getAttribute("data-images"));
    alts = JSON.parse(card.getAttribute("data-alts") || "[]");
    title.textContent = card.getAttribute("data-name");
    meta.textContent = card.getAttribute("data-meta");
    show(0);
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    if (window.RVS && window.RVS.lenis) window.RVS.lenis.stop();
    closeBtn.focus();
  }
  function close() {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    if (window.RVS && window.RVS.lenis) window.RVS.lenis.start();
    if (opener) opener.focus();
  }
  cards.forEach(function (c) { c.addEventListener("click", function () { open(c); }); });
  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () { show(idx - 1); });
  nextBtn.addEventListener("click", function () { show(idx + 1); });
  box.addEventListener("click", function (e) { if (e.target === box || e.target.classList.contains("lightbox__stage")) close(); });
  document.addEventListener("keydown", function (e) {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(idx + 1);
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "Tab") {
      var f = Array.prototype.slice.call(box.querySelectorAll("button:not([hidden])"));
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // swipe
  var sx = null;
  var stage = box.querySelector(".lightbox__stage");
  stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });
})();

/* RVS Constructions: shared behaviour for every page.
   GSAP + ScrollTrigger drive scroll motion, Lenis smooths wheel scrolling.
   Everything degrades to a static page under prefers-reduced-motion. */
(function () {
  "use strict";

  var RVS = (window.RVS = window.RVS || {});
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  RVS.reduce = reduce;
  RVS.ready = false;

  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Static data ---------- */
  var FOUNDED = 2013;
  var years = new Date().getFullYear() - FOUNDED;
  document.querySelectorAll("[data-years]").forEach(function (el) { el.textContent = years + "+"; el.setAttribute("data-count", years); });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- GSAP / Lenis ---------- */
  var lenis = null;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduce && typeof window.Lenis !== "undefined") {
      lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }
  RVS.lenis = lenis;

  /* ---------- Header: solid after 80px, hide on scroll down ---------- */
  var header = document.querySelector(".site-header");
  if (header && hasGsap) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: function (self) {
        var y = self.scroll();
        header.classList.toggle("is-solid", y > 80);
        var hide = self.direction === 1 && y > 320 && !document.documentElement.classList.contains("menu-open");
        header.classList.toggle("is-hidden", hide);
        document.documentElement.classList.toggle("header-hidden", hide);
      }
    });
  } else if (header) {
    header.classList.add("is-solid");
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    document.documentElement.classList.toggle("menu-open", open);
    document.body.classList.toggle("is-locked", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    if (open) { var first = menu.querySelector("a"); if (first) setTimeout(function () { first.focus(); }, 60); }
    else { toggle.focus(); }
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.documentElement.classList.contains("menu-open")) setMenu(false);
    });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { if (a.hash && a.pathname === location.pathname) setMenu(false); }); });
  }

  /* ---------- In-page anchor links through Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = -(header ? header.offsetHeight : 0) - 56;
      if (lenis) lenis.scrollTo(target, { offset: offset });
      else window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset + offset, behavior: reduce ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Page transition veil ---------- */
  var veil = document.querySelector(".veil");
  function isInternal(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    var href = a.getAttribute("href") || "";
    if (/^(#|tel:|mailto:|https?:|\/\/|javascript:)/i.test(href)) return false;
    return /\.html($|[?#])/.test(href) || href === "./" || href === "/";
  }
  if (veil && hasGsap && !reduce) {
    if (store.get("rvs-veil") === "1") {
      gsap.set(veil, { yPercent: 0 });
      gsap.to(veil, { yPercent: -100, duration: 0.8, ease: "expo.inOut", delay: 0.05, onComplete: function () { gsap.set(veil, { yPercent: 100 }); } });
      store.set("rvs-veil", "0");
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!isInternal(a) || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      store.set("rvs-veil", "1");
      gsap.fromTo(veil, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "expo.inOut", onComplete: function () { location.href = a.href; } });
    });
    window.addEventListener("pageshow", function (e) { if (e.persisted) gsap.set(veil, { yPercent: 100 }); });
  }

  /* ---------- Preloader (home, first visit per session) ---------- */
  var loader = document.querySelector(".loader");
  function markReady() {
    RVS.ready = true;
    document.dispatchEvent(new CustomEvent("rvs:ready"));
  }
  if (loader && hasGsap && !reduce && store.get("rvs-loaded") !== "1" && store.get("rvs-veil") !== "1") {
    store.set("rvs-loaded", "1");
    if (lenis) lenis.stop();
    var arcs = loader.querySelectorAll("circle");
    arcs.forEach(function (c) {
      var len = c.getTotalLength ? c.getTotalLength() : 620;
      c.style.strokeDasharray = len;
      c.style.strokeDashoffset = len;
    });
    var tl = gsap.timeline({
      onComplete: function () { loader.remove(); if (lenis) lenis.start(); markReady(); }
    });
    tl.to(arcs, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.12 })
      .to(loader.querySelector("img"), { opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.5")
      .to(loader.querySelector(".loader__inner"), { scale: 1.08, opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0.25")
      .to(loader, { yPercent: -100, duration: 0.8, ease: "expo.inOut" }, "-=0.15");
  } else {
    if (loader) loader.remove();
    requestAnimationFrame(markReady);
  }

  /* ---------- Reveals ---------- */
  if (hasGsap && !reduce) {
    document.documentElement.classList.add("js");
    var fades = gsap.utils.toArray('[data-reveal]:not([data-reveal="clip"])');
    if (fades.length) {
      ScrollTrigger.batch(fades, {
        start: "top 88%",
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true });
        }
      });
    }
    gsap.utils.toArray('[data-reveal="clip"]').forEach(function (el) {
      var img = el.querySelector("img");
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 86%", once: true } });
      tl.to(el, { clipPath: "inset(0% 0 0 0)", duration: 1.3, ease: "expo.inOut" });
      if (img) tl.to(img, { scale: 1, duration: 1.6, ease: "expo.out" }, 0.1);
    });
    gsap.utils.toArray("[data-speed]").forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-speed")) || 0;
      gsap.fromTo(el, { yPercent: speed * 10 }, {
        yPercent: speed * -10, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
    // Rotating gold rings
    gsap.utils.toArray("[data-ring-spin]").forEach(function (el) {
      gsap.to(el, { rotate: parseFloat(el.getAttribute("data-ring-spin")) || 90, ease: "none",
        scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* ---------- Count-up numbers ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var end = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (!hasGsap || reduce || isNaN(end)) { el.textContent = end + suffix; return; }
    var from = end > 1000 ? end - 40 : 0;
    var obj = { v: from };
    el.textContent = from + suffix;
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: function () {
        gsap.to(obj, { v: end, duration: 1.8, ease: "power3.out", onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; } });
      }
    });
  });

  /* ---------- Play muted videos only while visible ---------- */
  var vids = document.querySelectorAll("video[data-autoplay]");
  if (vids.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* ---------- Enquiry form (WhatsApp / email, no server needed) ---------- */
  var form = document.getElementById("enquiry");
  if (form) {
    var WA = "919500091626";
    var MAIL = "rvsconstructions.0123@gmail.com";
    var fields = {
      name: { el: form.elements.name, test: function (v) { return v.trim().length >= 2; } },
      phone: { el: form.elements.phone, test: function (v) { return /^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(v.trim()); } },
      email: { el: form.elements.email, test: function (v) { return v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } }
    };
    function check(key) {
      var f = fields[key];
      var ok = f.test(f.el.value);
      f.el.closest(".field").classList.toggle("has-error", !ok);
      f.el.setAttribute("aria-invalid", String(!ok));
      return ok;
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener("blur", function () { if (fields[k].el.value !== "") check(k); });
      fields[k].el.addEventListener("input", function () { if (fields[k].el.closest(".field").classList.contains("has-error")) check(k); });
    });
    function compose() {
      var e = form.elements;
      var lines = [
        "Hello RVS Constructions, I'd like to book a site visit.",
        "",
        "Name: " + e.name.value.trim(),
        "Phone: " + e.phone.value.trim()
      ];
      if (e.email.value.trim()) lines.push("Email: " + e.email.value.trim());
      if (e.type.value) lines.push("Project: " + e.type.value);
      if (e.location.value.trim()) lines.push("Plot location: " + e.location.value.trim());
      if (e.size.value.trim()) lines.push("Plot size: " + e.size.value.trim() + " sq ft");
      if (e.budget.value) lines.push("Budget: " + e.budget.value);
      if (e.message.value.trim()) { lines.push(""); lines.push(e.message.value.trim()); }
      return lines.join("\n");
    }
    function validate() {
      var bad = Object.keys(fields).filter(function (k) { return !check(k); });
      if (bad.length) { fields[bad[0]].el.focus(); return false; }
      return true;
    }
    function done(channel) {
      var ok = document.querySelector(".form-success");
      form.hidden = true;
      ok.querySelector("[data-channel]").textContent = channel;
      ok.classList.add("is-shown");
      ok.setAttribute("tabindex", "-1");
      ok.focus();
      if (hasGsap && !reduce) {
        var c = ok.querySelector("circle"), p = ok.querySelector("path");
        [c, p].forEach(function (el) { var l = el.getTotalLength(); el.style.strokeDasharray = l; el.style.strokeDashoffset = l; });
        gsap.to([c, p], { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.35 });
      }
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.company && form.elements.company.value) return; // honeypot
      if (!validate()) return;
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(compose()), "_blank", "noopener");
      done("WhatsApp");
    });
    var mailBtn = document.getElementById("send-email");
    if (mailBtn) mailBtn.addEventListener("click", function () {
      if (!validate()) return;
      location.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("Site visit request from " + form.elements.name.value.trim()) + "&body=" + encodeURIComponent(compose());
      done("email");
    });
    var again = document.getElementById("form-again");
    if (again) again.addEventListener("click", function () {
      document.querySelector(".form-success").classList.remove("is-shown");
      form.hidden = false;
      form.elements.name.focus();
    });
  }

  /* Refresh positions once fonts and images settle */
  if (hasGsap) {
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();

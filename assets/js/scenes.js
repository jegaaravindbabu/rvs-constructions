/* RVS Constructions: home page choreography.
   1. Hero: the full-resolution house film plays in a framed cinematic panel,
      revealed with a curtain wipe; the caption follows the facade as it
      changes from contemporary to traditional and back.
   2. Statement: words light up as you read.
   3. Selected homes: vertical scroll pans the gallery sideways (desktop).
   4. Process: the gold line draws through each step. */
(function () {
  "use strict";
  if (typeof gsap === "undefined") return;
  var reduce = window.RVS && window.RVS.reduce;

  /* ---------- 1. Cinematic video hero ---------- */
  var hero = document.querySelector(".hero");
  var media = document.querySelector(".hero__media");
  var video = document.querySelector(".hero__video");
  var styleEl = document.querySelector(".hero__style");
  var toggleBtn = document.querySelector(".hero__toggle");

  if (video) {
    var small = window.matchMedia("(max-width: 860px)").matches;
    var webm = video.canPlayType('video/webm; codecs="vp9"') === "probably";
    var base = small ? video.getAttribute("data-src-sm") : video.getAttribute("data-src");
    video.src = base + (webm ? ".webm" : ".mp4");
    video.muted = true;
    if (!reduce) {
      var p = video.play();
      if (p && p.catch) p.catch(function () { setPaused(true); });
    } else {
      setPaused(true);
    }
    // Loop timing: forward 0-6.0s, hold to 7.2s, reverse to 13.3s, hold to 14.5s.
    video.addEventListener("timeupdate", function () {
      var t = video.currentTime;
      var traditional = t > 4.1 && t < 9.15;
      if (styleEl) styleEl.classList.toggle("is-traditional", traditional);
    });
  }

  function setPaused(paused) {
    if (!toggleBtn) return;
    toggleBtn.setAttribute("aria-pressed", String(paused));
    toggleBtn.setAttribute("aria-label", paused ? "Play background video" : "Pause background video");
    toggleBtn.querySelector("i").className = "ph " + (paused ? "ph-play" : "ph-pause");
  }
  if (toggleBtn && video) {
    toggleBtn.addEventListener("click", function () {
      if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); setPaused(false); }
      else { video.pause(); setPaused(true); }
    });
  }

  function heroIntro() {
    if (reduce || !hero) return;
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(media, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "expo.inOut" }, 0)
      .from(video, { scale: 1.25, duration: 2.4, ease: "expo.out" }, 0.3)
      .from(".hero__title .line > span", { yPercent: 110, duration: 1.3, stagger: 0.12 }, 0.55)
      .from(".hero__label, .hero__sub, .hero .btn-row", { opacity: 0, y: 22, duration: 1.1, stagger: 0.09 }, 0.9)
      .from(".hero__frame", { opacity: 0, scale: 1.04, duration: 1.4 }, 1.2)
      .from(".hero__style, .hero__toggle", { opacity: 0, y: 12, duration: 1 }, 1.5);
  }
  if (window.RVS && window.RVS.ready) heroIntro();
  else document.addEventListener("rvs:ready", heroIntro, { once: true });

  if (hero && !reduce) {
    var st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    gsap.to(video, { yPercent: 9, scale: 1.06, ease: "none", scrollTrigger: st });
    gsap.to(".hero__copy", { yPercent: -18, opacity: 0.15, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom 30%", scrub: true } });
    // Pause the film when the hero is off screen to save battery.
    ScrollTrigger.create({
      trigger: hero, start: "top bottom", end: "bottom top",
      onLeave: function () { if (video && toggleBtn.getAttribute("aria-pressed") !== "true") video.pause(); },
      onEnterBack: function () { if (video && toggleBtn.getAttribute("aria-pressed") !== "true") { var p = video.play(); if (p && p.catch) p.catch(function () {}); } }
    });
  }

  /* ---------- 2. Statement word reveal ---------- */
  var statement = document.querySelector(".statement p");
  if (statement && !reduce) {
    var words = statement.textContent.trim().split(/\s+/);
    statement.setAttribute("aria-label", statement.textContent.trim());
    statement.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
    gsap.to(statement.querySelectorAll(".w"), {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: statement, start: "top 78%", end: "bottom 42%", scrub: true }
    });
  }

  /* ---------- 3. Selected homes horizontal pan ---------- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 861px) and (prefers-reduced-motion: no-preference)", function () {
    var pan = document.querySelector(".pan");
    var track = document.querySelector(".pan__track");
    if (!pan || !track) return;
    function distance() { return Math.max(0, track.scrollWidth - window.innerWidth); }
    var tween = gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: pan,
        start: "top top",
        end: function () { return "+=" + distance(); },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
    track.querySelectorAll(".pan__media img").forEach(function (img) {
      gsap.fromTo(img, { xPercent: -6, scale: 1.12 }, {
        xPercent: 6, ease: "none",
        scrollTrigger: { trigger: img.closest(".pan__item"), containerAnimation: tween, start: "left right", end: "right left", scrub: true }
      });
    });
  });

  /* ---------- Services index: hover / focus swaps the preview ---------- */
  var rows = document.querySelectorAll(".svc-row");
  var previews = document.querySelectorAll(".svc-preview img");
  rows.forEach(function (row, i) {
    function activate() {
      rows.forEach(function (r) { r.classList.remove("is-active"); });
      row.classList.add("is-active");
      previews.forEach(function (p, j) { p.classList.toggle("is-active", j === i); });
    }
    row.addEventListener("mouseenter", activate);
    row.addEventListener("focus", activate);
  });

  /* ---------- 4. Process line ---------- */
  if (!reduce) {
    var line = document.querySelector(".steps__line i");
    if (line) {
      gsap.to(line, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 65%", end: "bottom 65%", scrub: true } });
    }
    document.querySelectorAll(".step").forEach(function (step) {
      ScrollTrigger.create({ trigger: step, start: "top 65%", onEnter: function () { step.classList.add("is-on"); }, onLeaveBack: function () { step.classList.remove("is-on"); } });
    });

    var founderImg = document.querySelector(".founder__media img");
    if (founderImg) {
      gsap.fromTo(founderImg, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".founder", start: "top bottom", end: "bottom top", scrub: true } });
    }
  } else {
    document.querySelectorAll(".step").forEach(function (s) { s.classList.add("is-on"); });
    var l = document.querySelector(".steps__line i"); if (l) l.style.transform = "scaleY(1)";
  }
})();

/* RVS Constructions: services tab bar follows the section in view. */
(function () {
  "use strict";
  if (typeof ScrollTrigger === "undefined") return;
  var tabs = document.querySelectorAll(".svc-tabs a");
  function setActive(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("href") === "#" + id;
      t.classList.toggle("is-active", on);
      if (on) { t.setAttribute("aria-current", "true"); if (t.scrollIntoView && window.innerWidth < 860) t.parentNode.scrollTo({ left: t.offsetLeft - 16, behavior: "smooth" }); }
      else t.removeAttribute("aria-current");
    });
  }
  document.querySelectorAll(".svc-block").forEach(function (block) {
    ScrollTrigger.create({
      trigger: block, start: "top 45%", end: "bottom 45%",
      onToggle: function (self) { if (self.isActive) setActive(block.id); }
    });
  });
})();

/* Reading-time tracking for blog articles.
   Counts only the time the tab is actually visible, then reports once on exit. */
(function () {
  "use strict";

  var article = document.querySelector(".article[data-post-id]");
  if (!article) return;

  var postId = Number(article.getAttribute("data-post-id"));
  if (!postId) return;

  var visibleMs = 0;
  var lastTick = document.visibilityState === "visible" ? Date.now() : null;
  var maxScroll = 0;
  var sent = false;

  function accumulate() {
    if (lastTick !== null) {
      visibleMs += Date.now() - lastTick;
      lastTick = null;
    }
  }

  function trackScroll() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = Math.round((window.scrollY / scrollable) * 100);
    if (pct > maxScroll) maxScroll = Math.min(100, pct);
  }

  function report() {
    if (sent) return;
    accumulate();
    var seconds = Math.round(visibleMs / 1000);
    // ignore bounces and tabs left open overnight
    if (seconds < 3 || seconds > 7200) return;
    sent = true;

    var payload = JSON.stringify({ postId: postId, seconds: seconds, scrolled: maxScroll });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/read", new Blob([payload], { type: "application/json" }));
    } else {
      // keepalive so the request survives the page unloading
      fetch("/api/track/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(function () {});
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      lastTick = Date.now();
    } else {
      report();
    }
  });

  window.addEventListener("pagehide", report);
  window.addEventListener("beforeunload", report);
  window.addEventListener("scroll", trackScroll, { passive: true });
  trackScroll();
})();

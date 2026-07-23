/* Hawcus CRM - marketing site interactions (vanilla JS, no dependencies) */
(function () {
  "use strict";

  /* ---- Meta Pixel helper ----
     Wraps fbq so a blocked or unloaded pixel can never break the page.
     The base pixel code lives inline in each page's <head>. */
  function fbTrack(event, params) {
    if (typeof window.fbq === "function") window.fbq("track", event, params);
  }

  /* ---- Meta Pixel: CTA click tracking ----
     One delegated listener so each physical click fires exactly one event,
     no matter how many CTAs a page has or where they were added later
     (e.g. the nurture popup). Sign-in links are deliberately not tracked. */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var isDemo = href.indexOf("book-a-demo") !== -1;
    var isContact = /#contact$/.test(href);
    if (!isDemo && !isContact) return;
    // only real CTA buttons, not incidental text links
    if (!a.classList.contains("btn") && !a.classList.contains("popup__cta")) return;
    var label = (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
    fbTrack("Lead", {
      content_name: label || (isDemo ? "Book a Demo" : "Contact Sales"),
      content_category: "cta_click",
    });
  });

  /* ---- Mobile nav toggle ---- */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav__toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });
    // Close menu when a link is tapped
    nav.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Nav dropdown (Features mega menu) ---- */
  var menuItems = document.querySelectorAll(".nav__item--has-menu");
  menuItems.forEach(function (item) {
    var btn = item.querySelector(".nav__link");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !item.classList.contains("nav__item--open");
      // Close any other open menus
      menuItems.forEach(function (other) {
        if (other !== item) {
          other.classList.remove("nav__item--open");
          var b = other.querySelector(".nav__link");
          if (b) b.setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("nav__item--open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
    });
  });
  // Close on outside click
  document.addEventListener("click", function (e) {
    menuItems.forEach(function (item) {
      if (!item.contains(e.target)) {
        item.classList.remove("nav__item--open");
        var b = item.querySelector(".nav__link");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });
  });
  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      menuItems.forEach(function (item) {
        item.classList.remove("nav__item--open");
        var b = item.querySelector(".nav__link");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }
  });

  /* ---- FAQ accordion ---- */
  document.querySelectorAll(".faq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      var panel = btn.nextElementSibling;
      btn.setAttribute("aria-expanded", String(!expanded));
      if (panel) {
        panel.style.maxHeight = expanded ? null : panel.scrollHeight + "px";
      }
    });
  });

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    /* threshold 0 on purpose: a percentage threshold can never be met by a block
       taller than the viewport, which leaves tall sections stuck at opacity 0. */
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
    /* Failsafe: anything already on screen is shown outright, so a misfiring
       observer can never leave the visible part of a page blank. */
    var showVisible = function () {
      revealEls.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
      });
    };
    window.addEventListener("load", showVisible);
    window.setTimeout(showVisible, 1200);
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* ---- Contact form (front-end demo handler) ---- */
  var form = document.getElementById("demo-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var success = form.querySelector(".form__success");
      var fields = form.querySelector(".form__fields");
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Sending...";
      }

      try {
        var res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "contact",
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            company: form.elements.company.value.trim(),
            team_size: form.elements.team.value,
            message: form.elements.message.value.trim(),
            website: form.elements.website ? form.elements.website.value : "",
          }),
        });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");

        if (success) {
          success.classList.add("show");
          success.setAttribute("role", "status");
        }
        if (fields) fields.style.display = "none";
        form.reset();

        // fires once: the fields are hidden after success, so the form
        // cannot be submitted a second time
        fbTrack("Lead", { content_name: "contact_form", content_category: "form_submit" });
      } catch (ex) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = label;
        }
        window.alert(ex.message);
      }
    });
  }

  /* ---- Dynamic year in footer ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Header: shadow + auto-hide on scroll down, show on scroll up ---- */
  var header = document.querySelector(".site-header");
  if (header) {
    var lastY = window.scrollY;
    var nav = header.querySelector(".nav");
    var onScroll = function () {
      var y = window.scrollY;
      header.style.boxShadow = y > 8 ? "0 4px 20px rgba(17,19,24,0.06)" : "none";

      // Never hide while the mobile menu is open
      var menuOpen = nav && nav.getAttribute("data-open") === "true";
      var delta = y - lastY;

      if (menuOpen || y < 120) {
        header.classList.remove("site-header--hidden");
      } else if (delta > 4) {
        // scrolling down
        header.classList.add("site-header--hidden");
      } else if (delta < -4) {
        // scrolling up
        header.classList.remove("site-header--hidden");
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- Article FAQ accordion ---- */
  document.querySelectorAll(".afaq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      var panel = btn.nextElementSibling;
      btn.setAttribute("aria-expanded", String(!expanded));
      if (panel) {
        panel.style.maxHeight = expanded ? null : panel.scrollHeight + "px";
      }
    });
  });

  /* ---- Article TOC scrollspy ---- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".atoc__list a"));
  if (tocLinks.length) {
    var sections = tocLinks
      .map(function (a) {
        var id = a.getAttribute("href").slice(1);
        var el = document.getElementById(id);
        return el ? { link: a, el: el } : null;
      })
      .filter(Boolean);

    var setActive = function (link) {
      tocLinks.forEach(function (a) {
        a.classList.toggle("is-active", a === link);
      });
      // keep the highlighted item in view inside the scrolling TOC
      var box = document.querySelector(".atoc__inner");
      if (box && link && box.scrollHeight > box.clientHeight) {
        var top = link.offsetTop - box.clientHeight / 2;
        box.scrollTo({ top: top, behavior: "smooth" });
      }
    };

    var onSpy = function () {
      var y = window.scrollY + 140;
      var current = sections[0];
      sections.forEach(function (s) {
        if (s.el.offsetTop <= y) current = s;
      });
      if (current) setActive(current.link);
    };

    window.addEventListener("scroll", onSpy, { passive: true });
    onSpy();
  }

  /* ---- Blog index: category filter + search ---- */
  var blogGrid = document.getElementById("blog-grid");
  if (blogGrid) {
    var cards = Array.prototype.slice.call(blogGrid.querySelectorAll(".bcard"));
    var pills = Array.prototype.slice.call(document.querySelectorAll(".bpill"));
    var searchInput = document.getElementById("blog-search");
    var emptyMsg = document.getElementById("blog-empty");
    var activeCat = "all";

    var applyFilters = function () {
      var q = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var shown = 0;
      cards.forEach(function (card) {
        var catOk = activeCat === "all" || card.getAttribute("data-cat") === activeCat;
        var textOk = !q || (card.getAttribute("data-title") || "").indexOf(q) !== -1;
        var show = catOk && textOk;
        card.hidden = !show;
        if (show) shown++;
      });
      if (emptyMsg) emptyMsg.hidden = shown !== 0;
    };

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        activeCat = pill.getAttribute("data-filter");
        pills.forEach(function (p) {
          var on = p === pill;
          p.classList.toggle("is-on", on);
          p.setAttribute("aria-pressed", String(on));
        });
        applyFilters();
      });
    });

    if (searchInput) searchInput.addEventListener("input", applyFilters);
  }

  /* ---- Count-up for the "by the numbers" section ---- */
  var numlist = document.querySelector(".numlist");
  if (numlist) {
    var counted = false;
    var runCount = function () {
      if (counted) return;
      counted = true;
      numlist.querySelectorAll("[data-count]").forEach(function (el) {
        var target = parseInt(el.getAttribute("data-count"), 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1100;
        var start = null;
        var step = function (ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          // ease-out so it settles rather than stopping dead
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };

    if ("IntersectionObserver" in window) {
      var numIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              runCount();
              numIo.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      numIo.observe(numlist);
    } else {
      runCount();
    }
  }

  /* ---- Lead-nurturing popup (fires 7s after every page load) ----
     Skipped where the visitor is already looking at a booking form. Asking
     someone to book a demo while they are filling in the demo form is noise,
     and it covers the fields they are typing into. */
  var popup = document.getElementById("demo-booking") ? null : document.getElementById("nurture-popup");
  if (popup) {
    var lastFocus = null;

    var closePopup = function () {
      popup.classList.remove("is-open");
      popup.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        popup.hidden = true;
      }, 320);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    var openPopup = function () {
      lastFocus = document.activeElement;
      popup.hidden = false;
      popup.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      // Next frame so the transition runs
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          popup.classList.add("is-open");
        });
      });
      var cta = popup.querySelector(".popup__cta");
      if (cta) cta.focus();
    };

    popup.querySelectorAll("[data-popup-close]").forEach(function (el) {
      el.addEventListener("click", closePopup);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && popup.classList.contains("is-open")) closePopup();
    });

    window.setTimeout(openPopup, 7000);
  }
})();

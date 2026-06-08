(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  window.Theme = {
    get: function () { return root.getAttribute("data-theme") || "light"; },
    set: function (v) {
      root.setAttribute("data-theme", v);
      try { localStorage.setItem("lo-theme", v); } catch (e) {}
    },
    toggle: function () { this.set(this.get() === "dark" ? "light" : "dark"); }
  };
  (function () {
    var saved;
    try { saved = localStorage.getItem("lo-theme"); } catch (e) {}
    if (saved) root.setAttribute("data-theme", saved);
  })();

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var nav = document.getElementById("nav");

    /* ---------- Theme toggle ---------- */
    var tt = document.getElementById("themeToggle");
    if (tt) tt.addEventListener("click", function () { window.Theme.toggle(); });

    /* ---------- Nav scrolled border ---------- */
    function onScroll() {
      if (window.scrollY > 8) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    var menuBtn = document.getElementById("menuBtn");
    var mobileMenu = document.getElementById("mobileMenu");
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener("click", function () { mobileMenu.classList.toggle("open"); });
      mobileMenu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { mobileMenu.classList.remove("open"); });
      });
    }

    /* ---------- Scrollspy ---------- */
    var linkMap = {};
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      linkMap[id] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          Object.keys(linkMap).forEach(function (k) { linkMap[k].classList.remove("active"); });
          if (linkMap[en.target.id]) linkMap[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    ["about","skills","experience","projects","research","github","contact"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });

    /* ---------- Reveal on scroll ---------- */
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
          el.style.transitionDelay = Math.min(sibs, 4) * 60 + "ms";
          el.classList.add("in");
          obs.unobserve(el);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    document.querySelectorAll(".reveal").forEach(function (el) { ro.observe(el); });

    /* ---------- Stat count-up ---------- */
    var counted = false;
    var statWrap = document.querySelector(".stats");
    if (statWrap) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !counted) {
            counted = true;
            document.querySelectorAll(".num[data-count]").forEach(function (el) {
              var target = parseInt(el.getAttribute("data-count"), 10);
              var suffix = el.getAttribute("data-suffix") || "";
              var dur = 900, start = performance.now();
              function tick(now) {
                var p = Math.min((now - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(eased * target) + suffix;
                if (p < 1) requestAnimationFrame(tick);
              }
              requestAnimationFrame(tick);
            });
          }
        });
      }, { threshold: 0.4 }).observe(statWrap);
    }

    /* ---------- DNA strip ---------- */
    var strip = document.getElementById("dnaStrip");
    if (strip) {
      var seq = "ATGCGATCAGTCATGCTAGCATCGTACGATCGTAGCTAGCATCGTA";
      var html = "";
      for (var rep = 0; rep < 2; rep++) {
        for (var i = 0; i < seq.length; i++) {
          html += '<span class="base" data-b="' + seq[i] + '">' + seq[i] + "</span>";
        }
      }
      strip.innerHTML = html;
    }

    /* ---------- Project pointer glow ---------- */
    document.querySelectorAll(".proj").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });

    /* ---------- Contact form — Formspree ---------- */
    var form = document.getElementById("contactForm");
    if (form) {
      var fields = {
        name:    form.querySelector('[data-field="name"]'),
        email:   form.querySelector('[data-field="email"]'),
        message: form.querySelector('[data-field="message"]')
      };

      function validateField(key) {
        var wrap = fields[key];
        var input = wrap.querySelector("input, textarea");
        var val = input.value.trim();
        var ok = key === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) : val.length > 0;
        wrap.classList.toggle("err", !ok);
        return ok;
      }

      Object.keys(fields).forEach(function (key) {
        var input = fields[key].querySelector("input, textarea");
        input.addEventListener("input", function () {
          if (fields[key].classList.contains("err")) validateField(key);
        });
      });

      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var allOk = Object.keys(fields).map(validateField).every(Boolean);
        if (!allOk) return;

        var btn = form.querySelector("button[type=submit]");
        var orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'Sending… <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg>';

        try {
          var res = await fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" }
          });
          if (res.ok) {
            document.getElementById("formFields").style.display = "none";
            document.getElementById("formOk").classList.add("show");
          } else {
            btn.disabled = false;
            btn.innerHTML = orig;
            alert("Something went wrong — please email lestherouma@gmail.com directly.");
          }
        } catch (_) {
          btn.disabled = false;
          btn.innerHTML = orig;
          alert("Something went wrong — please email lestherouma@gmail.com directly.");
        }
      });
    }
  });
})();

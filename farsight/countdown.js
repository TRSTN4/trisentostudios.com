(() => {
  const REVEAL_EPOCH_SECONDS = 1770757200;

  const targetMs = REVEAL_EPOCH_SECONDS * 1000;

  const elDays = document.getElementById("cdDays");
  const elHours = document.getElementById("cdHours");
  const elMins = document.getElementById("cdMins");
  const elSecs = document.getElementById("cdSecs");
  const text = document.getElementById("countdownText");

  const card = document.getElementById("revealCard");
  const title = document.querySelector(".reveal-title");

  function pad2(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function setDigit(el, valueStr) {
    if (!el) return;
    el.textContent = valueStr;
    el.setAttribute("data-shadow", valueStr);
  }

  function setAll(d, h, m, s) {
    setDigit(elDays, pad2(d));
    setDigit(elHours, pad2(h));
    setDigit(elMins, pad2(m));
    setDigit(elSecs, pad2(s));
  }

  function tick() {
    const now = Date.now();
    let diff = Math.floor((targetMs - now) / 1000);

    if (diff <= 0) {
      setAll(0, 0, 0, 0);
      if (text) text.textContent = "Being revealed any moment…";
      return;
    }

    const days = Math.floor(diff / 86400);
    diff -= days * 86400;
    const hours = Math.floor(diff / 3600);
    diff -= hours * 3600;
    const mins = Math.floor(diff / 60);
    diff -= mins * 60;
    const secs = diff;

    setAll(days, hours, mins, secs);

    if (text) text.textContent = `In ${days}d ${hours}h ${mins}m ${secs}s`;
  }

  const GLITCH_CHARS = "0123456789";

  function scrambleOnce(el) {
    if (!el) return;
    const real = el.textContent || "00";
    const a = GLITCH_CHARS[(Math.random() * 10) | 0];
    const b = GLITCH_CHARS[(Math.random() * 10) | 0];
    setDigit(el, `${a}${b}`);
    setTimeout(() => setDigit(el, real), 90 + ((Math.random() * 120) | 0));
  }

  function pulseDigit(el) {
    if (!el) return;
    el.classList.add("glitching");
    scrambleOnce(el);
    setTimeout(() => el.classList.remove("glitching"), 220 + ((Math.random() * 220) | 0));
  }

  function pulseCard() {
    if (!card) return;
    card.classList.add("jitter");
    setTimeout(() => card.classList.remove("jitter"), 200);
  }

  function pulseTitle() {
    if (!title) return;
    title.classList.add("glitching");
    setTimeout(() => title.classList.remove("glitching"), 420 + Math.random() * 420);
  }

  window.addEventListener("DOMContentLoaded", () => {
    try {
      console.log("[FARSIGHT] Reveal target:", new Date(targetMs).toString(), "epoch:", REVEAL_EPOCH_SECONDS);
    } catch { }

    tick();
    setInterval(tick, 250);

    setInterval(() => {
      if (Math.random() < 0.14) pulseTitle();
      if (Math.random() < 0.12) pulseCard();

      const all = [elDays, elHours, elMins, elSecs].filter(Boolean);
      if (!all.length) return;

      if (Math.random() < 0.22) pulseDigit(all[(Math.random() * all.length) | 0]);
      if (Math.random() < 0.10) pulseDigit(all[(Math.random() * all.length) | 0]);
    }, 520);
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector(".countdown-bar");
  if (!bar) return;

  const title = bar.querySelector(".reveal-title-mini");
  const digits = bar.querySelectorAll(".cd-num");

  function pulseGlitch() {
    if (title) title.classList.add("glitching");
    digits.forEach(d => d.classList.add("glitching"));

    setTimeout(() => {
      if (title) title.classList.remove("glitching");
      digits.forEach(d => d.classList.remove("glitching"));
    }, 350);
  }

  pulseGlitch();

  setInterval(() => {
    if (Math.random() < 0.45) pulseGlitch();
  }, 2000);

});

window.addEventListener("DOMContentLoaded", () => {
  if (typeof gtag === "function") {
    gtag("event", "countdown_page_view", {
      send_to: "G-NSSGTGY1LD",
      page_path: location.pathname
    });
  }

  document.querySelectorAll('a[href*="farsight"]').forEach(a => {
    a.addEventListener("click", () => {
      if (typeof gtag === "function") {
        gtag("event", "enter_farsight_click", {
          send_to: "G-NSSGTGY1LD",
          link_url: a.href,
          page_path: location.pathname
        });
      }
    });
  });
});
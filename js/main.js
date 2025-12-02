"use strict";

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const nav = document.getElementById("nav");
const onScroll = () => {
  if (window.scrollY > 10) nav?.classList.add("scrolled");
  else nav?.classList.remove("scrolled");
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = document.getElementById("menuToggle");
const links = document.getElementById("links");
if (toggle && links) {
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("show");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function smoothScrollTo(targetId) {
  const el = document.querySelector(targetId);
  if (!el) return;
  const navHeight = nav?.offsetHeight || 70;
  const y = el.getBoundingClientRect().top + window.pageYOffset - (navHeight + 10);
  window.scrollTo({ top: y, behavior: "smooth" });
}
document.querySelectorAll('a.scroll[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    const href = a.getAttribute("href") || "#";
    smoothScrollTo(href);
    if (links?.classList.contains("show")) links.classList.remove("show");
  });
});

const video = document.getElementById("bgVideo");
if (video && typeof video.play === "function") {
  const p = video.play();
  if (p && typeof p.then === "function") p.catch(() => { });
}

(function initGalleries() {
  const galleries = Array.from(document.querySelectorAll(".gallery"));
  galleries.forEach(setupGallery);

  function setupGallery(root) {
    const viewport = root.querySelector(".gal-viewport");
    const track = root.querySelector(".gal-track");
    const slides = Array.from(root.querySelectorAll(".gal-slide"));
    const prev = root.querySelector(".gal-prev");
    const next = root.querySelector(".gal-next");
    if (!viewport || !track || slides.length === 0) return;

    const SINGLE = slides.length === 1;
    if (SINGLE) root.classList.add("is-single");

    let progress, bar;
    if (!SINGLE) {
      progress = document.createElement("div");
      progress.className = "gal-progress";
      bar = document.createElement("div");
      bar.className = "gal-progress-bar";
      progress.appendChild(bar);
      root.appendChild(progress);
    }

    let i = 0;
    let w = 0;
    let autoTimer = null;
    let rafId = null;
    const DURATION = 5000;
    let startedAt = 0;

    function measure() { w = viewport.clientWidth; }

    function clearTimers() {
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function resetAuto() {
      if (SINGLE) return;
      clearTimers();
      startedAt = performance.now();
      if (bar) bar.style.width = "0%";
      rafId = requestAnimationFrame(drawProgress);
      autoTimer = setTimeout(() => { go(i + 1); }, DURATION);
    }

    function drawProgress() {
      const t = performance.now() - startedAt;
      const p = Math.min(1, t / DURATION);
      if (bar) bar.style.width = (p * 100) + "%";
      if (p < 1) rafId = requestAnimationFrame(drawProgress);
    }

    function go(n, opts = {}) {
      const newIndex = (n + slides.length) % slides.length;
      const changed = newIndex !== i;
      i = newIndex;
      track.style.transition = opts.noAnim ? "none" : "";
      track.style.transform = `translateX(${-i * 100}%)`;
      if (opts.noAnim) requestAnimationFrame(() => track.style.transition = "");
      if (!SINGLE && changed) resetAuto();
    }

    prev?.addEventListener("click", e => { e.stopPropagation(); go(i - 1); });
    next?.addEventListener("click", e => { e.stopPropagation(); go(i + 1); });

    let startX = 0, deltaX = 0, dragging = false;
    viewport.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      deltaX = 0;
      viewport.setPointerCapture(e.pointerId);
      track.style.transition = "none";
    });
    viewport.addEventListener("pointermove", e => {
      if (!dragging) return;
      deltaX = e.clientX - startX;
      track.style.transform = `translateX(calc(${-i * 100}% + ${deltaX}px))`;
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.style.transition = "";
      const threshold = Math.max(60, w * 0.12);
      if (Math.abs(deltaX) > threshold) go(i + (deltaX < 0 ? 1 : -1));
      else track.style.transform = `translateX(${-i * 100}%)`;
      deltaX = 0;
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    const ro = new ResizeObserver(() => { measure(); go(i, { noAnim: true }); });
    ro.observe(viewport);
    measure();
    go(0, { noAnim: true });
    if (!SINGLE) resetAuto();
  }
})();

(function () {
  const lists = Array.from(document.querySelectorAll(".patchlist ul"));
  lists.forEach(ul => {
    const items = Array.from(ul.children).filter(li => li.nodeType === 1);
    const max = parseInt(ul.getAttribute("data-initial-visible") || "1", 10);
    if (items.length <= max) return;

    items.forEach((li, idx) => { if (idx >= max) li.classList.add("patch-hidden"); });

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "patch-toggle";
    btn.textContent = `Show all ${items.length} patch notes`;

    btn.addEventListener("click", () => {
      const hidden = ul.querySelector(".patch-hidden");
      if (hidden) {
        items.forEach(li => li.classList.remove("patch-hidden"));
        btn.textContent = "Hide extra patch notes";
      } else {
        items.forEach((li, idx) => { if (idx >= max) li.classList.add("patch-hidden"); });
        btn.textContent = `Show all ${items.length} patch notes`;
        ul.parentElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    ul.after(btn);
  });
})();

(function fitTimeline() {
  const tl = document.querySelector(".timeline-alt");
  if (!tl) return;

  function measure() {
    const rail = tl.querySelector(".tl-rail");
    const nodes = Array.from(tl.querySelectorAll(".tl-node"));
    if (!rail || nodes.length === 0) return;

    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    const tlRect = tl.getBoundingClientRect();

    const firstDot = nodes[0].querySelector(".tl-dot")?.getBoundingClientRect();
    const firstBadge = tl.querySelector(".tl-year-badge")?.getBoundingClientRect();
    let start = firstDot ? ((firstDot.top + firstDot.bottom) / 2 - tlRect.top) - 8 : 24;
    if (firstBadge) start = (firstBadge.bottom - tlRect.top) + (isMobile ? 12 : 6);

    let endY;
    if (isMobile) {
      const lastNode = nodes[nodes.length - 1];
      const lastDotRect = lastNode.querySelector(".tl-dot")?.getBoundingClientRect();
      const lastCenter = lastDotRect ? ((lastDotRect.top + lastDotRect.bottom) / 2) - tlRect.top : 0;
      endY = Math.max(0, lastCenter - 6);

      nodes.forEach(node => {
        const dot = node.querySelector(".tl-dot")?.getBoundingClientRect();
        const card = node.querySelector(".tl-card")?.getBoundingClientRect();
        if (!dot || !card) return;
        const dotCenter = dot.top + dot.height / 2;
        const h = Math.max(8, Math.round(card.top - dotCenter));
        node.style.setProperty("--connector-h", h + "px");
      });
    } else {
      const lastDot = nodes[nodes.length - 1].querySelector(".tl-dot")?.getBoundingClientRect();
      const lastCenter = lastDot ? (lastDot.top + lastDot.bottom) / 2 - tlRect.top : 0;
      endY = lastCenter - 8;
    }

    const height = Math.max(0, endY - start);
    rail.style.setProperty("--rail-top", start + "px");
    rail.style.setProperty("--rail-height", height + "px");
  }

  const onResize = () => requestAnimationFrame(measure);
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  window.addEventListener("load", measure);
  measure();
})();

(function () {
  const modal = document.getElementById("note-modal");
  const bodyEl = document.getElementById("note-modal-body");
  if (!modal || !bodyEl) return;

  let savedScrollY = 0;

  function openModal() {
    modal.classList.add("show");
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    document.body.style.top = `-${savedScrollY}px`;
  }

  function closeModal() {
    modal.classList.remove("show");
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    document.body.style.top = "";
    window.scrollTo(0, savedScrollY);
  }

  document.addEventListener("click", async (e) => {
    const a = e.target.closest('a[href*="patchnotes/index.html?id="]');
    if (!a) return;

    e.preventDefault();

    const url = new URL(a.href, location.origin);
    const id = url.searchParams.get("id");
    if (!id) return;

    bodyEl.innerHTML = '<p class="muted">Loading…</p>';
    openModal();

    try {
      const tryTxt = await fetch(`patchnotes/notes/${id}.txt`, { cache: "no-store" });
      if (tryTxt.ok) {
        const txt = await tryTxt.text();
        bodyEl.innerHTML = renderPatchText(txt);
        history.pushState({ modal: true }, "", `#note-${id}`);
        return;
      }
      const tryHtml = await fetch(`patchnotes/notes/${id}.html`, { cache: "no-store" });
      if (tryHtml.ok) {
        const html = await tryHtml.text();
        bodyEl.innerHTML = html;
        history.pushState({ modal: true }, "", `#note-${id}`);
        return;
      }
      throw new Error("not found");
    } catch {
      bodyEl.innerHTML = "<p>Couldn’t load patch note.</p>";
    }
  });

  function isModalCloseTarget(el) {
    return el?.id === "note-close" || el?.classList?.contains("modal-close");
  }

  document.addEventListener("click", (e) => {
    if (isModalCloseTarget(e.target)) closeModal();
  });

  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  window.addEventListener("popstate", () => closeModal());

  function escapeHTML(s) {
    return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function formatInline(s) {
    let out = escapeHTML(s);
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    out = out.replace(/(?<!href=")(https?:\/\/[^\s)]+)(?![^<]*>)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return out;
  }
  function toTimeTag(dateRaw) {
    const d = new Date(dateRaw);
    const iso = isNaN(d) ? "" : d.toISOString().slice(0, 10);
    const label = isNaN(d) ? dateRaw : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    return iso ? `<time datetime="${iso}">${label}</time>` : escapeHTML(label);
  }
  function renderPatchText(txt) {
    const lines = txt.replace(/\r\n?/g, "\n").split("\n");
    let i = 0, title = "", dateRaw = "";
    if (lines[i] && /^#\s+/.test(lines[i])) { title = lines[i].replace(/^#\s+/, "").trim(); i++; }
    if (lines[i] && /^@date:/i.test(lines[i])) { dateRaw = lines[i].replace(/^@date:\s*/i, "").trim(); i++; }
    while (i < lines.length && !lines[i].trim()) i++;

    const sections = [];
    let cur = null;
    const push = () => { if (cur) sections.push(cur); cur = null; };

    for (; i < lines.length; i++) {
      const line = lines[i];
      const h = line.match(/^##\s+(.+)/);
      if (h) { push(); cur = { heading: h[1].trim(), items: [], para: [] }; continue; }
      const b = line.match(/^\s*[-*]\s+(.+)/);
      if (b) { if (!cur) cur = { heading: "", items: [], para: [] }; cur.items.push(b[1]); continue; }
      if (!line.trim()) { if (cur && cur.para.length && cur.para.at(-1) !== "") cur.para.push(""); continue; }
      if (!cur) cur = { heading: "", items: [], para: [] };
      cur.para.push(line.trim());
    }
    push();

    const headHTML = `
      <div class="note-head">
        <h1 class="note-title">${escapeHTML(title || "Patch Notes")}</h1>
        ${dateRaw ? `<div class="note-meta">${toTimeTag(dateRaw)}</div>` : ""}
      </div>`;

    const bodyParts = sections.map(s => {
      const h = s.heading ? `<h4>${escapeHTML(s.heading)}</h4>` : "";
      const paras = (s.para.join("\n").split(/\n{2,}/).filter(Boolean)
        .map(p => `<p>${formatInline(p)}</p>`).join("")) || "";
      const bullets = s.items.length ? `<ul>${s.items.map(x => `<li>${formatInline(x)}</li>`).join("")}</ul>` : "";
      return `${h}${paras}${bullets}`;
    }).join("");

    return `<article class="note-card">${headHTML}<div class="note-body">${bodyParts}</div></article>`;
  }
})();

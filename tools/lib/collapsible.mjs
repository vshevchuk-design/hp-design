// Collapsible — one region a trigger shows or hides. Shared CSS + markup +
// behaviour for docs/collapsible.html and the prototypes (Scheduling's session
// lists). Self-resolving: the trigger is Button ghost sm from button.tokens.json,
// the rest from collapsible.tokens.json. The consumer also needs Button's own
// .btn / .btn--ghost / .btn--sm CSS (every page that has buttons already does).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const dim = load("tokens/primitives/dimension.tokens.json").dim;
const col = load("tokens/components/collapsible.tokens.json").component.collapsible;
const ghostSm = load("tokens/components/button.tokens.json").component.button.ghost.size.sm;
const D = (node) => { const k = node.$value.replace(/[{}]/g, "").split(".")[1]; const v = dim[k].$value; return `${v.value}${v.unit}`; };

export const COLLAPSIBLE_CSS = `
.collapsible { display: flex; flex-direction: column; align-items: stretch; gap: ${D(col.gap)}; }
/* Button ghost sm, pulled left by its own padding so the label lines up with the content */
.collapsible__trigger { align-self: flex-start; margin-inline-start: -${D(ghostSm.paddingX)}; }
.collapsible__chevron { width: ${D(col.chevronSize)}; height: ${D(col.chevronSize)}; flex-shrink: 0; transition: transform 0.12s ease; }
.collapsible__trigger[aria-expanded="true"] .collapsible__chevron { transform: rotate(180deg); }
.collapsible__trigger[hidden] { display: none; }
/* Read more: clamp the text until it is opened */
.collapsible--clamp > .collapsible__content { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${col.clampLines.$value}; overflow: hidden; }
.collapsible--clamp.is-open > .collapsible__content { display: block; -webkit-line-clamp: none; overflow: visible; }`;

const chevron = () => fs.readFileSync(path.join(root, "assets/icons/material-filled/expand_more.svg"), "utf8").replace("<svg ", '<svg class="collapsible__chevron btn__icon" aria-hidden="true" ');

/** The trigger on its own — for a consumer that renders the hidden part itself (Scheduling). */
export function collapsibleTrigger({ id = "", controls = "", more, less, extraClass = "", hidden = false }) {
  return `<button class="btn btn--ghost btn--sm collapsible__trigger${extraClass ? ` ${extraClass}` : ""}"${id ? ` id="${id}"` : ""} type="button" aria-expanded="false"${controls ? ` aria-controls="${controls}"` : ""} data-more="${more}" data-less="${less}"${hidden ? " hidden" : ""}><span class="collapsible__label">${more}</span>${chevron()}</button>`;
}

/** A whole Collapsible: `visible` always shows, `hidden` opens under it; `clamp` = Read more on one block of text. */
export function collapsibleHtml({ id, visible = "", hidden = "", more, less, clamp = false, contentTag = "div" }) {
  const cid = `${id}-content`;
  const content = clamp
    ? `<${contentTag} class="collapsible__content" id="${cid}">${hidden}</${contentTag}>`
    : `<${contentTag} class="collapsible__content" id="${cid}" hidden="until-found">${hidden}</${contentTag}>`;
  return `<div class="collapsible${clamp ? " collapsible--clamp" : ""}" id="${id}" data-collapsible>${visible}${content}${collapsibleTrigger({ controls: cid, more, less, hidden: clamp })}</div>`;
}

// Mounts every [data-collapsible] once. Clamp: the trigger shows only when the
// text overflows (re-checked on resize). Find-in-page opens a hidden region.
export const COLLAPSIBLE_JS = `(function () {
  function label(btn, open) { btn.setAttribute("aria-expanded", open ? "true" : "false"); btn.querySelector(".collapsible__label").textContent = open ? btn.dataset.less : btn.dataset.more; }
  window.hpCollapsibleLabel = label;
  document.querySelectorAll("[data-collapsible]").forEach(function (el) {
    if (el._hpcol) return; el._hpcol = true;
    var btn = el.querySelector(":scope > .collapsible__trigger"), content = el.querySelector(":scope > .collapsible__content");
    var clamp = el.classList.contains("collapsible--clamp");
    function set(open) {
      el.classList.toggle("is-open", open);
      if (!clamp) { if (open) content.removeAttribute("hidden"); else content.setAttribute("hidden", "until-found"); }
      label(btn, open);
    }
    btn.addEventListener("click", function () { set(!el.classList.contains("is-open")); });
    content.addEventListener("beforematch", function () { set(true); });
    if (clamp) {
      var fit = function () { if (!el.classList.contains("is-open")) btn.hidden = content.scrollHeight <= content.clientHeight + 1; };
      window.addEventListener("resize", fit); if (document.fonts) document.fonts.ready.then(fit); fit();
    }
  });
})();`;

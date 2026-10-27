// MultiSelectBadges — a summary of what's been chosen somewhere else (filters in
// a SlideOverPanel, rows ticked in a table): a title with the count, one Chip
// removable per choice, "Clear all". Past two rows of chips it shows
// "Show all N". One definition for the docs page and prototypes.
//
// Consumer: MSB_COLOR_PATHS into :root, MSB_CSS into its sheet, MSB_JS after
// the markup. The block fires bubbling events — `badgeremove` (detail.value)
// and `badgesclear` — so the picker can untick; to show a new set, call
// el._msb.set([{ value, label }]).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssVarName } from "./css-vars.mjs";

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const typo = load("tokens/primitives/typography.tokens.json");
const registry = {
  color: load("tokens/primitives/color.tokens.json").color,
  dim: load("tokens/primitives/dimension.tokens.json").dim,
  radius: load("tokens/primitives/radius.tokens.json").radius,
  family: typo.family,
  weight: typo.weight,
  size: typo.size,
  leading: typo.leading,
  tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};
const m = load("tokens/components/multi-select-badges.tokens.json").component.multiSelectBadges;
// the chips are Chip removable base, resolved from chip.tokens.json
const chip = load("tokens/components/chip.tokens.json").component.chip;

function get(ref) {
  const parts = ref.replace(/[{}]/g, "").split(".");
  let node = registry;
  for (const p of parts) node = node[p];
  if (node === undefined) throw new Error(`multi-select-badges: unresolved token ${ref}`);
  return node;
}
function resolveValue(v) {
  if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v));
  return v;
}
function resolveToken(node) {
  const v = node.$value;
  if (v && typeof v === "object" && !("value" in v)) {
    const out = {};
    for (const [k, sub] of Object.entries(v)) out[k] = resolveValue(sub);
    return out;
  }
  if (v && typeof v === "object" && "value" in v) return v;
  return resolveValue(v);
}
const px = (d) => `${d.value}${d.unit}`;
const D = (node) => px(resolveToken(node));
const refPath = (node) => node.$value.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node))})`;
const T = (node) => { const t = resolveToken(node); return `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`; };
const icon = (name) =>
  fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg aria-hidden="true" `);

const z = chip.size.base, rm = chip.removable;
const colorNodes = [m.titleColor, m.countColor, m.actionColor, rm.default.bg, rm.default.border, rm.default.text, rm.hover.border, rm.remove.icon, rm.remove.hoverBg, rm.remove.activeBg, chip.focus.ringColor];
export const MSB_COLOR_PATHS = [...new Set(colorNodes.map(refPath))];
const deco = resolveToken(m.action)["textDecoration"] || (get("text-style.link-sm").$extensions?.["hp.design/text"]?.textDecoration ?? "");
const ring = `${D(chip.focus.ringWidth)} solid ${R(chip.focus.ringColor)}`;

export const MSB_CSS = `
.msb { display: flex; flex-direction: column; gap: ${D(m.titleGap)}; min-width: 0; font-family: var(${cssVarName("family.sans")}); }
.msb[hidden] { display: none; }
/* .msb .msb__title: beats a page's own h3 rule (a heading inside a card) */
.msb .msb__title { margin: 0; font-family: inherit; letter-spacing: normal; color: ${R(m.titleColor)}; ${T(m.title)} }
.msb__count { color: ${R(m.countColor)}; font-weight: inherit; font-variant-numeric: tabular-nums; }
.msb__list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: ${D(m.chipGap)}; }
.msb__list > li[hidden] { display: none; }
/* Chip removable base */
.msb__chip { box-sizing: border-box; display: inline-flex; align-items: center; gap: ${D(z.gap)}; height: ${D(z.height)}; max-width: 100%; padding: 0 ${D(z.gap)} 0 ${D(z.paddingX)}; border-radius: ${D(chip.radius)}; background: ${R(rm.default.bg)}; border: 1px solid ${R(rm.default.border)}; color: ${R(rm.default.text)}; ${T(z.label)} }
.msb__chip:hover { border-color: ${R(rm.hover.border)}; }
.msb__label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msb__remove { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: ${D(z.iconSize)}; height: ${D(z.iconSize)}; padding: 0; border: none; border-radius: ${px(resolveToken(get("radius.default")))}; background: transparent; color: ${R(rm.remove.icon)}; cursor: pointer; }
.msb__remove svg { width: calc(${D(z.iconSize)} * 0.75); height: calc(${D(z.iconSize)} * 0.75); }
.msb__remove:hover { background: ${R(rm.remove.hoverBg)}; }
.msb__remove:active { background: ${R(rm.remove.activeBg)}; }
.msb__remove:focus-visible { outline: ${ring}; outline-offset: ${D(chip.focus.ringOffset)}; }
/* the actions sit on the chips' last row */
.msb__actions { display: inline-flex; align-items: center; gap: ${D(m.chipGap)}; height: ${D(z.height)}; padding: 0 ${D(z.gap)}; }
.msb__action { border: none; background: none; padding: 0; cursor: pointer; color: ${R(m.actionColor)}; font-family: inherit; ${T(m.action)}${deco ? ` text-decoration: ${deco};` : ""} white-space: nowrap; }
.msb__action[hidden] { display: none; }
.msb__action:focus-visible { outline: ${ring}; outline-offset: ${D(chip.focus.ringOffset)}; border-radius: 2px; }`;

const chipHtml = (o) => `<li class="msb__chip" data-value="${o.value ?? o.label}"><span class="msb__label">${o.label}</span><button type="button" class="msb__remove" aria-label="Remove ${o.label}">${icon("close")}</button></li>`;

/** A MultiSelectBadges. title: what was chosen ("Selected departments"); items: [{ value, label }]. */
export function msbHtml({ id, title, items = [] }) {
  return `<section class="msb" id="${id}" data-msb aria-labelledby="${id}-title"${items.length ? "" : " hidden"}>
  <h3 class="msb__title" id="${id}-title">${title} <span class="msb__count">· ${items.length}</span></h3>
  <ul class="msb__list">${items.map(chipHtml).join("")}<li class="msb__actions"><button type="button" class="msb__action msb__more" aria-expanded="false" hidden>Show all ${items.length}</button><button type="button" class="msb__action msb__clear">Clear all</button></li></ul>
</section>`;
}

// Past maxRows rows of chips, the rest hide and "Show all N" appears on the
// last shown row (it toggles to "Show less"); re-measured on resize. × takes
// a chip out (focus to the next ×, else the previous, else Clear all) and
// fires `badgeremove`; Clear all empties it and fires `badgesclear`. An empty
// block hides — the picker that filled it is where focus belongs next.
export const MSB_JS = `(function () {
  var MAX = ${m.maxRows.$value}, XICON = ${JSON.stringify(icon("close"))};
  document.querySelectorAll("[data-msb]").forEach(function (el) {
    if (el._msb) return;
    var list = el.querySelector(".msb__list"), acts = el.querySelector(".msb__actions"), more = el.querySelector(".msb__more"), count = el.querySelector(".msb__count"), open = false;
    function chips() { return Array.prototype.filter.call(list.children, function (c) { return c !== acts; }); }
    function fit() {
      var cs = chips(); cs.forEach(function (c) { c.hidden = false; }); more.hidden = true;
      more.textContent = open ? "Show less" : "Show all " + cs.length; more.setAttribute("aria-expanded", String(open));
      if (!cs.length) return;
      var top = cs[0].offsetTop, rowH = cs[0].offsetHeight, gap = parseFloat(getComputedStyle(list).rowGap) || 0, limit = top + (MAX - 1) * (rowH + gap);
      var over = cs.some(function (c) { return c.offsetTop > limit; }) || acts.offsetTop > limit;
      if (!over) return;
      more.hidden = false;
      if (open) return;
      // hide from the end until the actions fit on the last allowed row
      for (var i = cs.length - 1; i > 0 && (acts.offsetTop > limit); i--) cs[i].hidden = true;
      // hiding a single chip saves nothing — "Show all" would take its place; show them all instead
      if (cs.filter(function (c) { return c.hidden; }).length < 2) { cs.forEach(function (c) { c.hidden = false; }); more.hidden = true; }
    }
    function sync() {
      var cs = chips(); count.textContent = "· " + cs.length; el.hidden = cs.length === 0;
      if (cs.length < 2) open = false;
      fit();
    }
    function chip(o) {
      var li = document.createElement("li"), l = document.createElement("span"), x = document.createElement("button");
      li.className = "msb__chip"; li.dataset.value = o.value != null ? o.value : o.label; l.className = "msb__label"; l.textContent = o.label;
      x.type = "button"; x.className = "msb__remove"; x.setAttribute("aria-label", "Remove " + o.label); x.innerHTML = XICON;
      li.appendChild(l); li.appendChild(x); return li;
    }
    list.addEventListener("click", function (e) {
      var x = e.target.closest(".msb__remove");
      if (x) {
        var li = x.closest(".msb__chip"), cs = chips(), i = cs.indexOf(li), v = li.dataset.value;
        li.remove(); sync();
        var rest = chips().filter(function (c) { return !c.hidden; }), nx = rest[i] || rest[i - 1];
        if (nx) nx.querySelector(".msb__remove").focus(); else if (!el.hidden) el.querySelector(".msb__clear").focus();
        el.dispatchEvent(new CustomEvent("badgeremove", { bubbles: true, detail: { value: v } }));
        return;
      }
      if (e.target.closest(".msb__clear")) { chips().forEach(function (c) { c.remove(); }); sync(); el.dispatchEvent(new CustomEvent("badgesclear", { bubbles: true })); return; }
      if (e.target.closest(".msb__more")) { open = !open; fit(); more.focus(); }
    });
    el._msb = { set: function (items) { chips().forEach(function (c) { c.remove(); }); items.forEach(function (o) { list.insertBefore(chip(o), acts); }); sync(); } };
    var w = 0; // re-fit when the width changes (not on the height changes fit itself makes)
    if (window.ResizeObserver) new ResizeObserver(function () { if (!el.hidden && el.offsetWidth !== w) { w = el.offsetWidth; fit(); } }).observe(el);
    sync();
  });
})();`;

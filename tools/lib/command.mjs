// Command — a search over actions (inline panel) and the command palette
// (Command dialog, Ctrl/⌘+K). One shared definition: CSS, markup, behaviour.
// Self-resolving: its own command.tokens.json, plus Search's value type for
// the field and Modal's shell for the dialog — resolved from their token files.
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
  shadow: load("tokens/primitives/shadow.tokens.json").shadow,
  family: typo.family, weight: typo.weight, size: typo.size, leading: typo.leading, tracking: typo.tracking,
  "text-style": load("tokens/primitives/text-styles.tokens.json")["text-style"],
  ...load("tokens/semantic/color.tokens.json"),
};
const cmd = load("tokens/components/command.tokens.json").component.command;
const search = load("tokens/components/search.tokens.json").component.search;
const modal = load("tokens/components/modal.tokens.json").component.modal;

function get(ref) { const parts = ref.replace(/[{}]/g, "").split("."); let n = registry; for (const p of parts) n = n[p]; if (n === undefined) throw new Error(`command: unresolved ${ref}`); return n; }
function resolveValue(v) { if (typeof v === "string" && v.startsWith("{")) return resolveToken(get(v)); return v; }
function resolveToken(node) { const v = node.$value; if (v && typeof v === "object" && !("value" in v)) { const o = {}; for (const [k, s] of Object.entries(v)) o[k] = resolveValue(s); return o; } if (v && typeof v === "object" && "value" in v) return v; return resolveValue(v); }
const px = (d) => `${d.value}${d.unit}`;
const D = (node) => px(resolveToken(node));
const refPath = (ref) => ref.replace(/[{}]/g, "");
const R = (node) => `var(${cssVarName(refPath(node.$value))})`;
const typoCss = (t) => `font-weight: ${t.fontWeight}; font-size: ${px(t.fontSize)}; line-height: ${t.lineHeight};`;
const T = (node) => typoCss(resolveToken(node));
const icon = (name, cls) => fs.readFileSync(path.join(root, `assets/icons/material-filled/${name}.svg`), "utf8").replace("<svg ", `<svg class="${cls}" aria-hidden="true" `);

const { panel, input, group, item, empty } = cmd;
const colorNodes = [panel.bg, panel.border, input.icon, input.divider, group.headingColor, group.divider, item.icon, item.labelColor, item.activeBg, item.shortcutColor, item.disabledColor, empty.color, modal.bg, modal.overlay];
export const COMMAND_COLOR_PATHS = [...new Set([...colorNodes.map((n) => refPath(n.$value)), "text.muted"])];
const sh = resolveToken(modal.shadow);
const shadowCss = `${px(sh.offsetX)} ${px(sh.offsetY)} ${px(sh.blur)} ${px(sh.spread)} ${sh.color}`;

export const COMMAND_CSS = `
.command { display: flex; flex-direction: column; overflow: hidden; background: ${R(panel.bg)}; border: 1px solid ${R(panel.border)}; border-radius: ${D(panel.radius)}; font-family: var(${cssVarName("family.sans")}); }
.command__input-row { box-sizing: border-box; flex-shrink: 0; display: flex; align-items: center; gap: ${D(input.gap)}; height: ${D(input.height)}; padding: 0 ${D(input.paddingX)}; border-bottom: 1px solid ${R(input.divider)}; }
.command__search-icon { width: ${D(input.iconSize)}; height: ${D(input.iconSize)}; flex-shrink: 0; color: ${R(input.icon)}; }
/* Search's value type — 16px so iOS doesn't zoom on focus */
.command__input { flex: 1; min-width: 0; margin: 0; padding: 0; border: none; outline: none; background: none; color: ${R(item.labelColor)}; font-family: inherit; ${T(search.value)} }
.command__input::placeholder { color: var(${cssVarName("text.muted")}); }
.command__list { max-height: ${D(panel.listMaxHeight)}; overflow-y: auto; padding: ${D(panel.listPadding)}; }
.command__group[hidden], .command__item[hidden], .command__empty[hidden] { display: none; }
.command__group + .command__group:not([hidden]) { border-top: 1px solid ${R(group.divider)}; margin-top: ${D(panel.listPadding)}; padding-top: ${D(panel.listPadding)}; }
.command__heading { box-sizing: border-box; display: flex; align-items: center; height: ${D(group.headingHeight)}; padding: 0 ${D(item.paddingX)}; color: ${R(group.headingColor)}; ${T(group.heading)} }
.command__item { box-sizing: border-box; display: flex; align-items: center; gap: ${D(item.gap)}; height: ${D(item.height)}; padding: 0 ${D(item.paddingX)}; border-radius: ${D(item.radius)}; cursor: pointer; color: ${R(item.labelColor)}; ${T(item.label)} user-select: none; }
.command__item.is-active { background: ${R(item.activeBg)}; }
.command__item[aria-disabled="true"] { color: ${R(item.disabledColor)}; cursor: default; }
.command__icon { width: ${D(item.iconSize)}; height: ${D(item.iconSize)}; flex-shrink: 0; color: ${R(item.icon)}; }
.command__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.command__shortcut { flex-shrink: 0; color: ${R(item.shortcutColor)}; ${T(item.shortcut)} font-family: inherit; font-variant-numeric: tabular-nums; letter-spacing: 0.04em; }
.command__empty { padding: ${D(empty.paddingY)} 0; text-align: center; color: ${R(empty.color)}; ${T(empty.label)} }
/* the palette: Modal's shell, wider */
dialog.command-dialog { margin: 15vh auto auto; padding: 0; border: none; width: ${D(panel.dialogWidth)}; max-width: calc(100vw - 32px); background: transparent; }
dialog.command-dialog::backdrop { background: ${R(modal.overlay)}; }
dialog.command-dialog > .command { border: none; border-radius: ${D(modal.radius)}; box-shadow: ${shadowCss}; }`;

/** groups: [{ heading, items: [{ label, icon, shortcut, keywords, disabled }] }] */
export function commandHtml({ id, groups, placeholder = "Type a command or search…", label = "Commands", empty: emptyText = "No results found." }) {
  let n = 0;
  const gs = groups.map((g, gi) => `<div class="command__group" role="group" aria-labelledby="${id}-g${gi}"><div class="command__heading" id="${id}-g${gi}">${g.heading}</div>${g.items.map((it) => `<div class="command__item" role="option" id="${id}-o${n++}" aria-selected="false" data-value="${it.label}"${it.keywords ? ` data-keywords="${it.keywords}"` : ""}${it.disabled ? ' aria-disabled="true"' : ""}>${it.icon ? icon(it.icon, "command__icon") : ""}<span class="command__label">${it.label}</span>${it.shortcut ? `<kbd class="command__shortcut">${it.shortcut}</kbd>` : ""}</div>`).join("")}</div>`).join("");
  return `<div class="command" id="${id}" data-command>
  <div class="command__input-row">${icon("search", "command__search-icon")}<input class="command__input" type="text" placeholder="${placeholder}" role="combobox" aria-expanded="true" aria-controls="${id}-list" aria-autocomplete="list" aria-label="${label}" autocomplete="off" spellcheck="false"></div>
  <div class="command__list" id="${id}-list" role="listbox" aria-label="${label}">${gs}<div class="command__empty" hidden>${emptyText}</div></div>
</div>`;
}

/** The palette: a Command in a modal dialog; `hotkey` opens / closes it with Ctrl/⌘+K. */
export function commandDialogHtml({ id, hotkey = true, ...rest }) {
  return `<dialog class="command-dialog" id="${id}" aria-label="Command menu"${hotkey ? " data-hotkey" : ""}>${commandHtml({ id: `${id}-cmd`, ...rest })}</dialog>`;
}

// Mounts every [data-command] once. Typing filters (label + data-keywords),
// empty groups hide, ↑↓ move, Enter runs, a click runs. Running fires a
// bubbling "commandselect" event (detail.value) and closes a palette.
export const COMMAND_JS = `(function () {
  function mount(el) {
    if (el._hpcmd) return; el._hpcmd = true;
    var inp = el.querySelector(".command__input"), items = [].slice.call(el.querySelectorAll(".command__item"));
    var groups = [].slice.call(el.querySelectorAll(".command__group")), emptyEl = el.querySelector(".command__empty");
    var active = null;
    function visible() { return items.filter(function (i) { return !i.hidden && i.getAttribute("aria-disabled") !== "true"; }); }
    function setActive(i, scroll) {
      if (active) { active.classList.remove("is-active"); active.setAttribute("aria-selected", "false"); }
      active = i || null;
      if (active) { active.classList.add("is-active"); active.setAttribute("aria-selected", "true"); inp.setAttribute("aria-activedescendant", active.id); if (scroll) active.scrollIntoView({ block: "nearest" }); }
      else inp.removeAttribute("aria-activedescendant");
    }
    function filter() {
      var q = inp.value.trim().toLowerCase();
      items.forEach(function (i) { var t = (i.dataset.value + " " + (i.dataset.keywords || "")).toLowerCase(); i.hidden = q !== "" && t.indexOf(q) === -1; });
      groups.forEach(function (g) { g.hidden = !g.querySelector(".command__item:not([hidden])"); });
      emptyEl.hidden = items.some(function (i) { return !i.hidden; });
      setActive(visible()[0]);
    }
    function run(i) {
      if (!i || i.getAttribute("aria-disabled") === "true") return;
      el.dispatchEvent(new CustomEvent("commandselect", { bubbles: true, detail: { value: i.dataset.value } }));
      var dlg = el.closest("dialog"); if (dlg && dlg.open) dlg.close();
    }
    inp.addEventListener("input", filter);
    inp.addEventListener("keydown", function (e) {
      var v = visible(), k = v.indexOf(active);
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(v[(k + 1) % v.length], true); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(v[(k - 1 + v.length) % v.length], true); }
      else if (e.key === "Home") { e.preventDefault(); setActive(v[0], true); }
      else if (e.key === "End") { e.preventDefault(); setActive(v[v.length - 1], true); }
      else if (e.key === "Enter") { e.preventDefault(); run(active); }
    });
    items.forEach(function (i) {
      i.addEventListener("mousemove", function () { if (active !== i && i.getAttribute("aria-disabled") !== "true") setActive(i); });
      i.addEventListener("click", function () { run(i); });
    });
    el.hpReset = function () { inp.value = ""; filter(); };
    filter();
  }
  document.querySelectorAll("[data-command]").forEach(mount);
  document.querySelectorAll("dialog.command-dialog").forEach(function (dlg) {
    if (dlg._hpcmdd) return; dlg._hpcmdd = true;
    var cmd = dlg.querySelector("[data-command]");
    dlg.hpOpen = function () { cmd.hpReset(); dlg.showModal(); cmd.querySelector(".command__input").focus(); };
    // a click on the backdrop (the dialog box itself, outside the panel) closes it
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  });
  if (!window._hpcmdKey) {
    window._hpcmdKey = true;
    document.addEventListener("keydown", function (e) {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      var dlg = document.querySelector("dialog.command-dialog[data-hotkey]"); if (!dlg) return;
      e.preventDefault();
      if (dlg.open) dlg.close(); else dlg.hpOpen();
    });
  }
})();`;

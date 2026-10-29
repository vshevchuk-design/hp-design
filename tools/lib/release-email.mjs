// The release-notes email — one template, rendered from a release object
// (tools/lib/release-email-data.mjs). Used for every product's "News: …
// posted" mail to clients; tools/build-design-release-emails.mjs writes the
// sendable files and their viewer pages.
//
// EMAIL IS A DIFFERENT MEDIUM, so two repo rules bend here, on purpose:
// - Colours are resolved hex INLINED on each element, not --tok-* vars. Gmail
//   and Outlook drop custom properties and most of <style>; inline is the only
//   thing every client reads. They still come out of the token files through
//   C()/T() below — no literal hex is typed anywhere in this file.
// - Layout is tables + explicit px line-heights (Outlook ignores unitless).
//   Each text style's line-height is size × the token's leading, snapped to the
//   4px grid: 12→16, 14→20, 16→24, 18→24, 24→28.
// Sora loads from Google Fonts where the client allows it (Apple Mail, iOS,
// Outlook for Mac); everywhere else the email-safe fallback stack takes over.
// Images: the logo is a PNG (assets/email/highpoint-logo@2x.png) — no client
// that strips SVG (Gmail, Outlook) shows the wordmark otherwise. It carries a
// 2px white halo (rendered in, hence 126×28): Gmail/Outlook dark mode invert
// the background but not images, and the dark wordmark would vanish. Its alt
// text is styled so it still reads as a wordmark with images off.
//
// Components, each from its own token file: Card (the white body), Badge
// (product, version, section tags), Button primary/secondary (bulletproof
// table buttons, base 40px), Alert info/warning (no icon — Gmail drops SVG and
// the tint + lead carry the role), Separator (hairlines between sections).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const card = load("tokens/components/card.tokens.json").component.card;
const badge = load("tokens/components/badge.tokens.json").component.badge;
const button = load("tokens/components/button.tokens.json").component.button;
const alert = load("tokens/components/alert.tokens.json").component.alert;

function get(ref) {
  let node = registry;
  for (const p of ref.replace(/[{}]/g, "").split(".")) node = node[p];
  if (!node) throw new Error(`release-email: unknown token ${ref}`);
  return node;
}
function resolveValue(v) {
  return typeof v === "string" && v.startsWith("{") ? resolveToken(get(v)) : v;
}
function resolveToken(node) {
  const v = node.$value;
  if (v && typeof v === "object" && !("value" in v)) {
    const out = {};
    for (const [k, sub] of Object.entries(v)) out[k] = resolveValue(sub);
    return out;
  }
  return resolveValue(v);
}
const R = (ref) => resolveToken(get(ref));
const px = (d) => `${d.value}${d.unit}`;
// A component token node ({ $value: "{…}" }) → its resolved value.
const V = (node) => resolveToken(node);
const C = (ref) => R(ref); // colour by dotted path, e.g. C("text.default")
const D = (ref) => px(R(ref)); // dimension by dotted path, e.g. D("dim.4")
const dimPx = (ref) => R(ref).value;

const FONT = `'${R("family.sans")}', 'Segoe UI', Helvetica, Arial, sans-serif`;
// Text style → inline font declarations (grid-snapped px line-height, see top).
function T(styleOrRef) {
  const s = typeof styleOrRef === "string" ? R(styleOrRef) : styleOrRef;
  const size = s.fontSize.value;
  const lh = Math.max(4, Math.round((size * s.lineHeight) / 4) * 4);
  const ls = s.letterSpacing && s.letterSpacing.value ? ` letter-spacing: ${s.letterSpacing.value}${s.letterSpacing.unit};` : "";
  return `font-family: ${FONT}; font-size: ${size}px; line-height: ${lh}px; font-weight: ${s.fontWeight};${ls}`;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- resolved recipes ----
const cardR = {
  bg: V(card.bg),
  border: V(card.border),
  radius: px(V(card.radius)),
};
const badgeBase = badge.size.base;
const badgeR = {
  height: V(badgeBase.height).value,
  padX: px(V(badgeBase.paddingX)),
  radius: px(V(badge.radius)),
  label: V(badgeBase.label),
  regularWeight: V(badge.regular.fontWeight),
  outlineBorder: V(badge.outline.border),
  outlineText: V(badge.outline.text),
};
// lg (48px), not base: a tap target in a phone mail client should be ≥44px.
// Primary rests on its HOVER fill (blue.600): white on fill.primary (blue.500)
// is 4.0:1, under AA for a 16px label — the open system-wide finding in
// status.md ("Brand ramp"). An email has no hover/pressed, so the darker step
// costs nothing here; revisit if the system moves primary to 600.
const btnSize = button.primary.size.lg;
const btnR = {
  height: V(btnSize.height).value,
  padX: px(V(btnSize.paddingX)),
  radius: px(V(button.primary.radius)),
  label: V(btnSize.label),
  primary: { fill: V(button.primary.state.hover.fill), label: V(button.primary.state.default.label) },
  secondary: { fill: V(button.secondary.state.default.fill), label: V(button.secondary.state.default.label) },
};
const alertR = {
  radius: px(V(alert.radius)),
  padX: px(V(alert.paddingX)),
  padY: px(V(alert.paddingY)),
  title: V(alert.title),
  body: V(alert.body),
  titleColor: V(alert.titleColor),
  bodyColor: V(alert.bodyColor),
  role: Object.fromEntries(Object.entries(alert.role).filter(([k]) => !k.startsWith("$")).map(([k, r]) => [k, { bg: V(r.bg), border: V(r.border) }])),
};

// ---- atoms ----
function badgeHtml(label, { bg, text, border, weight } = {}) {
  const lab = badgeR.label;
  // Line box = the declared height minus the outline's 2px, so outline and
  // tint badges stand the same 20px tall.
  const lh = border ? badgeR.height - 2 : badgeR.height;
  const bd = border ? `border: 1px solid ${border}; ` : "";
  return `<span style="display: inline-block; ${bd}background-color: ${bg || "transparent"}; color: ${text}; border-radius: ${badgeR.radius}; padding: 0 ${badgeR.padX}; font-family: ${FONT}; font-size: ${lab.fontSize.value}px; line-height: ${lh}px; font-weight: ${weight || lab.fontWeight}; white-space: nowrap; vertical-align: middle;">${esc(label)}</span>`;
}
const tagBadge = (label, hue) => badgeHtml(label, { bg: C(`tag.${hue}.tint.bg`), text: C(`tag.${hue}.tint.text`) });

function buttonHtml({ label, href, primary }) {
  const v = primary ? btnR.primary : btnR.secondary;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: separate;"><tr>
              <td align="center" height="${btnR.height}" bgcolor="${v.fill}" style="height: ${btnR.height}px; padding: 0 ${btnR.padX}; background-color: ${v.fill}; border-radius: ${btnR.radius};">
                <a href="${esc(href)}" style="display: block; ${T(btnR.label)} line-height: ${btnR.height}px; color: ${v.label}; text-decoration: none; white-space: nowrap;">${esc(label)}</a>
              </td>
            </tr></table>`;
}

// **bold** and `code` inside body strings.
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight: ${R("weight.semibold")}; color: ${C("text.default")};">$1</strong>`)
    .replace(
      /`(.+?)`/g,
      `<code style="font-family: ${FONT}; font-size: ${R("size.sm").value}px; font-weight: ${R("weight.semibold")}; color: ${C("text.default")}; background-color: ${C("surface.dim")}; border: 1px solid ${C("border.default")}; border-radius: ${D("radius.xs")}; padding: 0 ${D("dim.1")}; white-space: nowrap;">$1</code>`
    );
}

function alertHtml({ role, lead, body, href, linkLabel }) {
  const r = alertR.role[role];
  const link = href
    ? ` <a href="${esc(href)}" style="color: ${C("text.primary")}; font-weight: ${R("weight.semibold")}; text-decoration: underline;">${esc(linkLabel || "Details")}</a>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: separate;"><tr>
              <td bgcolor="${r.bg}" style="background-color: ${r.bg}; border: 1px solid ${r.border}; border-radius: ${alertR.radius}; padding: ${alertR.padY} ${alertR.padX}; ${T(alertR.body)} color: ${alertR.bodyColor};">
                <strong style="${T(alertR.title)} color: ${alertR.titleColor};">${esc(lead)}</strong> ${inline(body)}${link}
              </td>
            </tr></table>`;
}

const spacer = (h) => `<tr><td height="${h}" style="height: ${h}px; font-size: 0; line-height: 0;">&nbsp;</td></tr>`;
const hairline = `<tr><td class="hp-px" style="padding: 0 ${D("dim.8")};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" style="height: 1px; font-size: 0; line-height: 0; background-color: ${C("border.default")};">&nbsp;</td></tr></table></td></tr>`;

// ---- blocks ----
function heroBlock(rel, assetBase) {
  const links = rel.links.length
    ? `${spacer(dimPx("dim.6"))}
          <tr><td><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            ${rel.links.map((l, i) => `<td class="hp-btn" style="padding: 0 ${i < rel.links.length - 1 ? D("dim.2") : "0"} 0 0;">${buttonHtml(l)}</td>`).join("\n            ")}
          </tr></table></td></tr>`
    : "";
  const notices = rel.notices.map((n) => `${spacer(dimPx("dim.4"))}\n          <tr><td>${alertHtml(n)}</td></tr>`).join("\n          ");
  return `<tr><td class="hp-px" style="padding: ${D("dim.8")} ${D("dim.8")} ${D("dim.8")};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td>${badgeHtml(rel.product, { bg: C("bg.primary"), text: C("text.primary") })}&nbsp;${badgeHtml(`v${rel.version}`, { border: badgeR.outlineBorder, text: badgeR.outlineText, weight: badgeR.regularWeight })}</td></tr>
          ${spacer(dimPx("dim.4"))}
          <tr><td><h1 class="hp-h1" style="margin: 0; ${T("text-style.title-2xl")} color: ${C("text.default")};">${esc(rel.headline)}</h1></td></tr>
          ${spacer(dimPx("dim.2"))}
          <tr><td style="${T("text-style.body-sm")} color: ${C("text.secondary")};">Released ${esc(rel.posted)} · ${esc(rel.author)}, HighPoint Support</td></tr>
          ${spacer(dimPx("dim.5"))}
          <tr><td style="${T("text-style.body-md")} color: ${C("text.secondaryStrong")};">${inline(rel.overview)}</td></tr>
          ${links}
          ${notices}
        </table>
      </td></tr>`;
}

const countItems = (s) => s.groups.reduce((n, g) => n + g.items.length, 0);

function tocBlock(rel) {
  const rows = rel.sections
    .map((s, i) => {
      const n = countItems(s);
      const top = i ? `border-top: 1px solid ${C("border.default")}; ` : "";
      return `<tr>
              <td width="128" class="hp-toc-tag" style="${top}padding: ${D("dim.3")} 0; vertical-align: middle;">${tagBadge(s.title, s.tag)}</td>
              <td class="hp-toc-blurb" style="${top}padding: ${D("dim.3")} ${D("dim.3")}; vertical-align: middle; ${T("text-style.body-base")} color: ${C("text.secondaryStrong")};"><a href="#${s.id}" style="color: ${C("text.secondaryStrong")}; text-decoration: none;">${esc(s.blurb)}</a></td>
              <td align="right" style="${top}padding: ${D("dim.3")} 0; vertical-align: middle; ${T("text-style.body-sm")} color: ${C("text.secondary")}; white-space: nowrap;">${n} ${n === 1 ? "change" : "changes"}</td>
            </tr>`;
    })
    .join("\n            ");
  return `<tr><td class="hp-px" style="padding: ${D("dim.6")} ${D("dim.8")} ${D("dim.5")};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td colspan="3" style="${T("text-style.label-sm")} text-transform: uppercase; color: ${C("text.secondary")}; padding-bottom: ${D("dim.1")};">In this release</td></tr>
            ${rows}
        </table>
      </td></tr>`;
}

function itemHtml(item, ticketUrl, first) {
  const tickets = item.tickets
    .map((t) => `<a href="${esc(ticketUrl(t))}" style="color: ${C("text.primary")}; text-decoration: none;">#${esc(t)}</a>`)
    .join(`<span style="color: ${C("text.muted")};">, </span>`);
  const meta = [item.area ? esc(item.area) : null, tickets].filter(Boolean).join(`<span style="color: ${C("text.muted")};"> · </span>`);
  const body = item.body
    .map((p, i) => `<tr><td style="padding-top: ${i ? D("dim.2") : D("dim.2")}; ${T("text-style.body-base")} color: ${C("text.secondaryStrong")};">${inline(p)}</td></tr>`)
    .join("\n              ");
  return `${first ? "" : spacer(dimPx("dim.6"))}
          <tr><td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td><h3 style="margin: 0; ${T("text-style.heading-md")} color: ${C("text.default")};">${esc(item.title)}</h3></td></tr>
              <tr><td style="padding-top: ${D("dim.1")}; ${T("text-style.body-sm")} color: ${C("text.secondary")};">${meta}</td></tr>
              ${body}
            </table>
          </td></tr>`;
}

function sectionBlock(s, ticketUrl) {
  const n = countItems(s);
  const intro = s.intro ? `${spacer(dimPx("dim.2"))}\n          <tr><td style="${T("text-style.body-base")} color: ${C("text.secondary")};">${inline(s.intro)}</td></tr>` : "";
  const notice = s.notice ? `${spacer(dimPx("dim.4"))}\n          <tr><td>${alertHtml(s.notice)}</td></tr>` : "";
  const groups = s.groups
    .map((g, gi) => {
      const head = g.title
        ? `${spacer(dimPx("dim.8"))}
          <tr><td style="${T("text-style.label-sm")} text-transform: uppercase; color: ${C("text.secondary")}; padding-bottom: ${D("dim.3")}; border-bottom: 1px solid ${C("border.default")};">${esc(g.title)}</td></tr>
          ${spacer(dimPx("dim.4"))}`
        : spacer(dimPx(gi ? "dim.8" : "dim.6"));
      return `${head}
          ${g.items.map((it, i) => itemHtml(it, ticketUrl, i === 0)).join("\n          ")}`;
    })
    .join("\n          ");
  // The section's tag hue as a 4px bar beside the heading — ties the section
  // back to its Badge in "In this release" without a second badge.
  return `<tr><td class="hp-px" id="${esc(s.id)}" style="padding: ${D("dim.8")} ${D("dim.8")};">
        <a name="${esc(s.id)}"></a>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td width="4" bgcolor="${C(`tag.${s.tag}.solid.bg`)}" style="width: 4px; background-color: ${C(`tag.${s.tag}.solid.bg`)}; border-radius: ${D("radius.xxs")}; font-size: 0; line-height: 0;">&nbsp;</td>
              <td style="padding-left: ${D("dim.3")};"><h2 style="margin: 0; ${T("text-style.heading-lg")} color: ${C("text.default")};">${esc(s.title)}</h2></td>
              <td align="right" style="${T("text-style.body-sm")} color: ${C("text.secondary")}; white-space: nowrap;">${n} ${n === 1 ? "change" : "changes"}</td>
            </tr></table>
          </td></tr>
          ${intro}
          ${notice}
          ${groups}
        </table>
      </td></tr>`;
}

function footerBlock(rel) {
  const link = (label, href) => `<a href="${esc(href)}" style="color: ${C("text.secondary")}; text-decoration: underline;">${esc(label)}</a>`;
  return `<tr><td class="hp-px" style="padding: ${D("dim.6")} ${D("dim.8")} ${D("dim.10")}; ${T("text-style.body-sm")} color: ${C("text.secondary")};">
        You're receiving this because you subscribed to ${esc(rel.product)} release notes, or you're involved in them.<br />
        ${link("Notification preferences", "https://support.highpoint.io")} &nbsp;·&nbsp; ${link("Support portal", "https://support.highpoint.io")}
      </td></tr>`;
}

// assetBase: where assets/ lives relative to the rendered file (docs preview)
// or an absolute https URL (the copy that actually gets sent).
export function renderReleaseEmail(rel, { assetBase = "../../assets", ticketUrl = (t) => `#${t}` } = {}) {
  const pageBg = C("surface.page");
  const sections = rel.sections.map((s) => `${hairline}\n      ${sectionBlock(s, ticketUrl)}`).join("\n      ");
  const toc = rel.sections.length > 1 ? `${hairline}\n      ${tocBlock(rel)}` : "";
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(rel.product)} ${esc(rel.version)} release notes</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&amp;display=swap" rel="stylesheet" />
<style>
  body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; }
  table { border-collapse: collapse; }
  img { border: 0; display: block; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  @media (max-width: 599px) {
    .hp-px { padding-left: ${D("dim.5")} !important; padding-right: ${D("dim.5")} !important; }
    .hp-h1 { font-size: ${R("size.xl").value}px !important; line-height: 24px !important; }
    .hp-toc-blurb { display: none !important; }
    .hp-card { border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
  }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: ${pageBg};">
  <div role="article" aria-roledescription="email" aria-label="${esc(rel.product)} ${esc(rel.version)} release notes" lang="en">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${esc(rel.preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${pageBg}" style="background-color: ${pageBg};">
    <tr><td align="center" style="padding: ${D("dim.8")} 0 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
        <tr><td class="hp-px" style="padding: 0 ${D("dim.8")} ${D("dim.5")};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td><img src="${esc(assetBase)}/email/highpoint-logo@2x.png" width="126" height="28" alt="HighPoint" style="${T("text-style.heading-lg")} color: ${C("text.default")};" /></td>
            <td align="right" style="${T("text-style.label-sm")} text-transform: uppercase; color: ${C("text.secondary")};">Release notes</td>
          </tr></table>
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="hp-card" bgcolor="${cardR.bg}" style="background-color: ${cardR.bg}; border: 1px solid ${cardR.border}; border-radius: ${cardR.radius}; border-collapse: separate;">
      ${heroBlock(rel)}
      ${toc}
      ${sections}
          </table>
        </td></tr>
        ${footerBlock(rel)}
      </table>
    </td></tr>
  </table>
  </div>
</body>
</html>
`;
}

// The text/plain part of the same message. Send both (multipart/alternative):
// some clients and most spam filters read this one, and a screen reader in a
// text-only client gets a real document instead of a stripped table.
export function renderReleaseEmailText(rel, { ticketUrl = (t) => `#${t}` } = {}) {
  const plain = (s) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1");
  const rule = (ch, s) => ch.repeat(Math.min(s.length, 60));
  const out = [];
  out.push(`HIGHPOINT RELEASE NOTES`, ``, rel.headline, rule("=", rel.headline), `Released ${rel.posted} · ${rel.author}, HighPoint Support`, ``, plain(rel.overview), ``);
  for (const l of rel.links) out.push(`${l.label}: ${l.href}`);
  for (const n of rel.notices) out.push(``, `! ${n.lead} ${plain(n.body)}`);
  if (rel.sections.length > 1) {
    out.push(``, `IN THIS RELEASE`);
    for (const s of rel.sections) out.push(`- ${s.title}: ${s.blurb} (${countItems(s)})`);
  }
  for (const s of rel.sections) {
    out.push(``, ``, s.title.toUpperCase(), rule("-", s.title));
    if (s.intro) out.push(plain(s.intro));
    if (s.notice) out.push(``, `! ${s.notice.lead} ${plain(s.notice.body)}`);
    for (const g of s.groups) {
      if (g.title) out.push(``, `${g.title}:`);
      for (const it of g.items) {
        out.push(``, `* ${it.title}`, `  ${[it.area, ...it.tickets.map((t) => `#${t}`)].filter(Boolean).join(" · ")}`);
        for (const p of it.body) out.push(`  ${plain(p)}`);
      }
    }
  }
  out.push(``, `--`, `You're receiving this because you subscribed to ${rel.product} release notes, or you're involved in them.`, `Notification preferences: https://support.highpoint.io`);
  return out.join("\n") + "\n";
}

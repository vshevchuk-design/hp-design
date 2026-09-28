// Export tokens/ → Figma Variables + Text/Effect Styles.
//
// Emits self-contained Plugin API scripts (figma-export/*.js) meant to run in
// order through the Figma MCP `use_figma` tool (or pasted into a dev plugin).
// Every script is idempotent: variables/styles are matched by name and updated
// in place, so re-running after a token edit never duplicates anything.
//
// Collections: Primitives (the palette things are built from) → Semantic (what
// a value means). Aliases stay aliases (createVariableAlias), never flattened.
// Component tokens become variables ONLY when they carry their own value —
// one that isn't just a pointer at a semantic/primitive token. Today none do,
// so there is no Components collection: Figma components bind straight to the
// semantic/primitive variable their component token resolves to (a 900-var
// mirror of pure aliases only cluttered every picker — decided 2026-09-28).
//
// Not variables (Figma has no composite variable type):
//   typography composites → Text Styles (only text-style.* in primitives;
//     component typography tokens just alias those styles and are skipped)
//   shadow → Effect Styles (same: component shadow tokens are skipped)
//   durations, % sizes, strings like `object-fit` → skipped (no design use)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'figma-export');
const CHUNK_BYTES = 40_000;

const LAYERS = [
  ['primitives', 'Primitives'],
  ['semantic', 'Semantic'],
  ['components', 'Components'],
];

// ---- load + flatten -------------------------------------------------------

const tokens = new Map(); // dotted path → { type, value, desc, ext, layer, file }
for (const [dir, layer] of LAYERS) {
  for (const file of fs.readdirSync(path.join(ROOT, 'tokens', dir)).sort()) {
    const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens', dir, file), 'utf8'));
    (function walk(node, p, inheritedType) {
      const type = node.$type ?? inheritedType;
      if ('$value' in node) {
        tokens.set(p.join('.'), { type, value: node.$value, desc: node.$description, ext: node.$extensions, layer, file });
        return;
      }
      for (const [k, v] of Object.entries(node)) if (!k.startsWith('$') && v && typeof v === 'object') walk(v, [...p, k], type);
    })(json, [], undefined);
  }
}

const isAlias = v => typeof v === 'string' && /^\{[^}]+\}$/.test(v);
const aliasPath = v => v.slice(1, -1);

function resolve(p, seen = new Set()) {
  if (seen.has(p)) throw new Error(`alias cycle at ${p}`);
  seen.add(p);
  const t = tokens.get(p);
  if (!t) throw new Error(`unresolved alias {${p}}`);
  return isAlias(t.value) ? resolve(aliasPath(t.value), seen) : t;
}

// ---- token → Figma variable ----------------------------------------------

// Figma variable names can't contain "."; groups are "/".
// Component tokens drop the redundant leading "component".
function varName(p, layer) {
  let segs = p.split('.');
  if (layer === 'Components' && segs[0] === 'component') segs = segs.slice(1);
  return segs.map(s => s.replace(/\./g, '_')).join('/');
}

function parseColor(v) {
  let m = /^#([0-9a-f]{3,8})$/i.exec(v);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map(c => c + c).join('');
    const n = i => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
  }
  m = /^rgba?\(([^)]+)\)$/.exec(v);
  if (m) {
    const [r, g, b, a = 1] = m[1].split(',').map(s => parseFloat(s));
    return { r: +(r / 255).toFixed(4), g: +(g / 255).toFixed(4), b: +(b / 255).toFixed(4), a };
  }
  throw new Error(`unsupported color ${v}`);
}

// Figma resolvedType for a token, or null if it doesn't become a variable.
function figmaType(t) {
  switch (t.type) {
    case 'color': return 'COLOR';
    case 'number': case 'fontWeight': return 'FLOAT';
    case 'fontFamily': return 'STRING';
    case 'dimension': {
      const lit = isAlias(t.value) ? resolve(aliasPath(t.value)).value : t.value;
      // px → FLOAT px. em (tracking) → FLOAT em, kept but unscoped: Figma
      // would read a bound letter-spacing variable as px.
      return lit && (lit.unit === 'px' || lit.unit === 'em') ? 'FLOAT' : null;
    }
    default: return null; // typography, shadow, duration, string
  }
}

function literal(t) {
  switch (t.type) {
    case 'color': return parseColor(t.value);
    case 'dimension': return t.value.value;
    case 'fontFamily': return Array.isArray(t.value) ? t.value[0] : t.value;
    default: return t.value;
  }
}

// Scopes decide which Figma pickers show a variable. Primitive colors are
// hidden (still aliasable) so designers pick semantic roles, as in code.
// Semantic/component scopes are inferred from the token's name.
const FILLS = ['FRAME_FILL', 'SHAPE_FILL'];
function scopes(p, t, layer) {
  const segs = p.split('.');
  const head = segs[0];
  if (layer !== 'Primitives') {
    const leaf = segs[segs.length - 1];
    const has = re => segs.some(s => re.test(s));
    if (t.type === 'color') {
      if (head === 'text') return ['TEXT_FILL'];
      if (head === 'border') return ['STROKE_COLOR'];
      if (head === 'icon') return ['SHAPE_FILL', 'STROKE_COLOR'];
      if (head === 'surface' || head === 'bg' || head === 'fill') return FILLS;
      // Leaf name wins over its group: iconButton/hoverBg is a fill, not an icon.
      const group = re => segs.slice(0, -1).some(s => re.test(s));
      if (/border|divider|ring/i.test(leaf)) return ['STROKE_COLOR'];
      if (/bg|fill|surface|track|thumb|highlight|overlay|indicator|dot/i.test(leaf)) return FILLS;
      if (/icon|chevron|checkmark|arrow/i.test(leaf)) return ['SHAPE_FILL', 'STROKE_COLOR'];
      // For an ambiguous "…Color" leaf, the semantic role it aliases decides.
      const role = isAlias(t.value) ? aliasPath(t.value).split('.')[0] : null;
      if (/color$/i.test(leaf) && role === 'icon') return ['SHAPE_FILL', 'STROKE_COLOR'];
      if (/color$/i.test(leaf) && role === 'border' && !group(/ring|border|divider/i)) return ['ALL_FILLS', 'STROKE_COLOR'];
      if (leaf === 'color') { // a bare "color" means whatever its group draws
        if (group(/ring|border|divider/i)) return ['STROKE_COLOR'];
        if (group(/icon|chevron|checkmark|arrow|close|clear/i)) return ['SHAPE_FILL', 'STROKE_COLOR'];
        if (/separator|connector/i.test(segs[segs.length - 2])) return ['ALL_FILLS', 'STROKE_COLOR'];
        return ['TEXT_FILL'];
      }
      if (group(/connector/i)) return ['ALL_FILLS', 'STROKE_COLOR']; // a drawn line, not text
      if (/text|label|title|color|description|placeholder|link|value|name|meta|time|subject|paragraph|body|detail|helper|preview/i.test(leaf)) return ['TEXT_FILL'];
      if (group(/icon|chevron|checkmark|arrow|close|clear/i)) return ['SHAPE_FILL', 'STROKE_COLOR'];
      if (group(/border|divider|ring|focus/i)) return ['STROKE_COLOR'];
      if (group(/surface|bg|fill/i)) return FILLS;
      return ['ALL_FILLS', 'STROKE_COLOR'];
    }
    if (t.type === 'number') return [];
    if (t.type === 'fontWeight') return ['FONT_WEIGHT'];
    if (/radius/i.test(leaf)) return ['CORNER_RADIUS'];
    if (/^(borderWidth|ringWidth|thickness)$/.test(leaf) || (leaf === 'width' && has(/^(ring|border)$/))) return ['STROKE_FLOAT'];
    if (has(/gap|padding|margin|indent|offset|inset|overlap/i)) return ['GAP'];
    return ['WIDTH_HEIGHT'];
  }
  if (head === 'color') return [];
  if (head === 'radius') return ['CORNER_RADIUS'];
  if (head === 'dim') return ['GAP', 'WIDTH_HEIGHT', 'CORNER_RADIUS', 'STROKE_FLOAT'];
  if (head === 'z') return [];
  if (head === 'family') return ['FONT_FAMILY'];
  if (head === 'weight') return ['FONT_WEIGHT'];
  if (head === 'size') return ['FONT_SIZE'];
  if (head === 'leading' || head === 'tracking') return []; // multiplier / em, not px
  return undefined;
}

const vars = { Primitives: [], Semantic: [], Components: [] };
const skipped = {};
const varByPath = new Map();

for (const [p, t] of tokens) {
  const ft = figmaType(t);
  if (!ft) { skipped[t.type] = (skipped[t.type] || 0) + 1; continue; }
  if (t.layer === 'Components' && isAlias(t.value)) { skipped['component alias'] = (skipped['component alias'] || 0) + 1; continue; }
  varByPath.set(p, { layer: t.layer, name: varName(p, t.layer), type: ft });
}

for (const [p, t] of tokens) {
  const v = varByPath.get(p);
  if (!v) continue;
  let value;
  if (isAlias(t.value)) {
    const target = varByPath.get(aliasPath(t.value));
    if (!target) throw new Error(`${p} aliases {${aliasPath(t.value)}}, which is not a variable`);
    if (target.type !== v.type) throw new Error(`${p}: type ${v.type} aliases ${target.type}`);
    value = { alias: `${target.layer}|${target.name}` };
  } else {
    value = literal(t);
  }
  const entry = [v.name, v.type[0], value]; // C / F / S
  const desc = t.desc || (t.type === 'dimension' && t.value?.unit === 'em' ? 'em (multiply by font size)' : '');
  const sc = scopes(p, t, t.layer);
  if (desc || sc) entry.push(desc || '');
  if (sc) entry.push(sc);
  vars[t.layer].push({ entry, file: t.file, deps: isAlias(t.value) ? [aliasPath(t.value)] : [] });
}

// ---- chunking -------------------------------------------------------------

// Component files alias each other (Tabs → Counter …), so order files so a
// chunk only aliases variables already created by an earlier chunk.
function orderFiles(items) {
  const byFile = new Map();
  for (const it of items) (byFile.get(it.file) ?? byFile.set(it.file, []).get(it.file)).push(it);
  const deps = new Map([...byFile].map(([f, its]) => [f, new Set(
    its.flatMap(i => i.deps).map(d => tokens.get(d)).filter(d => d && d.layer === 'Components' && d.file !== f).map(d => d.file),
  )]));
  const done = new Set(); const out = [];
  const visit = (f, stack = new Set()) => {
    if (done.has(f)) return;
    if (stack.has(f)) throw new Error(`component token files alias in a cycle: ${[...stack, f].join(' → ')}`);
    stack.add(f);
    for (const d of deps.get(f)) visit(d, stack);
    done.add(f); out.push(f);
  };
  for (const f of byFile.keys()) visit(f);
  return out.map(f => byFile.get(f));
}

function chunks(items, ordered) {
  const groups = ordered ? orderFiles(items) : [items];
  const out = []; let cur = []; let size = 0;
  for (const g of groups) {
    const s = JSON.stringify(g.map(i => i.entry)).length;
    if (cur.length && size + s > CHUNK_BYTES) { out.push(cur); cur = []; size = 0; }
    cur.push(...g.map(i => i.entry)); size += s;
  }
  if (cur.length) out.push(cur);
  return out;
}

// ---- script templates -----------------------------------------------------

const VAR_RUNTIME = `
const TYPES = { C: 'COLOR', F: 'FLOAT', S: 'STRING' };
const collections = await figma.variables.getLocalVariableCollectionsAsync();
let coll = collections.find(c => c.name === COLLECTION);
if (!coll) { coll = figma.variables.createVariableCollection(COLLECTION); collections.push(coll); }
if (coll.modes[0].name !== 'Light') coll.renameMode(coll.modes[0].modeId, 'Light');
const modeId = coll.modes[0].modeId;
const collName = new Map(collections.map(c => [c.id, c.name]));
const byKey = new Map();
for (const v of await figma.variables.getLocalVariablesAsync()) byKey.set(collName.get(v.variableCollectionId) + '|' + v.name, v);
let created = 0, updated = 0;
for (const [name, t] of VARS.map(e => [e[0], TYPES[e[1]]])) {
  const key = COLLECTION + '|' + name;
  let v = byKey.get(key);
  if (v && v.resolvedType !== t) { v.remove(); v = null; }
  if (!v) { v = figma.variables.createVariable(name, coll, t); byKey.set(key, v); created++; } else updated++;
}
const missing = [];
for (const [name, , value, desc, scopes] of VARS) {
  const v = byKey.get(COLLECTION + '|' + name);
  if (value && typeof value === 'object' && 'alias' in value) {
    const target = byKey.get(value.alias);
    if (!target) { missing.push(name + ' → ' + value.alias); continue; }
    v.setValueForMode(modeId, figma.variables.createVariableAlias(target));
  } else v.setValueForMode(modeId, value);
  v.description = desc || '';
  if (scopes) v.scopes = scopes;
}
return { collection: COLLECTION, created, updated, total: VARS.length, missing };
`;

function varScript(collection, entries, label) {
  return `// ${label} — generated by tools/export-figma.mjs, do not edit\n` +
    `const COLLECTION = ${JSON.stringify(collection)};\n` +
    `const VARS = ${JSON.stringify(entries)};\n` + VAR_RUNTIME.trimStart();
}

// Text styles: name "body-xs" → "body/xs" so Figma groups them. Component
// tokens that spell out their own typography (Counter's bold digits, Badge's
// label…) instead of aliasing a text-style also become styles, under their
// variable-style path ("counter/size/sm/label") so they sit apart from the
// shared ramp.
const WEIGHT_STYLE = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };
const textStyles = [];
const effectStyles = [];
for (const [p, t] of tokens) {
  const inlineType = t.layer === 'Components' && t.type === 'typography' && !isAlias(t.value);
  if (t.layer !== 'Primitives' && !inlineType) continue;
  if (t.type === 'typography') {
    const v = t.value; const ref = k => (isAlias(v[k]) ? aliasPath(v[k]) : null);
    const lit = k => (isAlias(v[k]) ? resolve(aliasPath(v[k])).value : v[k]);
    const bind = k => (ref(k) && varByPath.get(ref(k)) ? varByPath.get(ref(k)).name : null);
    const family = lit('fontFamily'); const weight = lit('fontWeight');
    textStyles.push({
      name: inlineType ? varName(p, t.layer) : p.split('.').pop().replace('-', '/'),
      desc: t.desc || '',
      family: Array.isArray(family) ? family[0] : family,
      style: WEIGHT_STYLE[weight] ?? (() => { throw new Error(`no font style for weight ${weight}`); })(),
      size: lit('fontSize').value,
      lineHeight: +(lit('lineHeight') * 100).toFixed(2),
      letterSpacing: +((lit('letterSpacing')?.value ?? 0) * 100).toFixed(2),
      decoration: t.ext?.['hp.design/text']?.textDecoration === 'underline' ? 'UNDERLINE' : 'NONE',
      bind: { fontFamily: bind('fontFamily'), fontWeight: bind('fontWeight'), fontSize: bind('fontSize') },
    });
  }
  if (t.type === 'shadow') {
    const layers = (Array.isArray(t.value) ? t.value : [t.value]).map(s => ({
      color: parseColor(s.color), x: s.offsetX.value, y: s.offsetY.value, blur: s.blur.value, spread: s.spread.value,
    }));
    effectStyles.push({ name: p.replace(/\./g, '/'), desc: t.desc || '', layers });
  }
}

function stylesScript() {
  return `// Text + Effect Styles — generated by tools/export-figma.mjs, do not edit
// Run after the Primitives variables script: text styles bind to them.
const TEXT = ${JSON.stringify(textStyles)};
const EFFECT = ${JSON.stringify(effectStyles)};
const colls = await figma.variables.getLocalVariableCollectionsAsync();
const prim = colls.find(c => c.name === 'Primitives');
const pv = new Map();
for (const v of await figma.variables.getLocalVariablesAsync()) if (prim && v.variableCollectionId === prim.id) pv.set(v.name, v);
const texts = await figma.getLocalTextStylesAsync();
const effects = await figma.getLocalEffectStylesAsync();
// Style names vary per family ("SemiBold" vs "Semi Bold") — match loosely
// against what Figma actually has instead of trusting the weight map.
const available = await figma.listAvailableFontsAsync();
const norm = s => s.replace(/\\s+/g, '').toLowerCase();
for (const t of TEXT) {
  const hit = available.find(f => f.fontName.family === t.family && norm(f.fontName.style) === norm(t.style));
  if (!hit) throw new Error('Font not available in Figma: ' + t.family + ' ' + t.style);
  t.style = hit.fontName.style;
}
const fonts = [...new Set(TEXT.map(t => t.family + '|' + t.style))];
await Promise.all(fonts.map(f => { const [family, style] = f.split('|'); return figma.loadFontAsync({ family, style }); }));
const unbound = [];
for (const t of TEXT) {
  const s = texts.find(x => x.name === t.name) ?? figma.createTextStyle();
  s.name = t.name;
  s.description = t.desc;
  s.fontName = { family: t.family, style: t.style };
  s.fontSize = t.size;
  s.lineHeight = { unit: 'PERCENT', value: t.lineHeight };
  s.letterSpacing = { unit: 'PERCENT', value: t.letterSpacing };
  s.textDecoration = t.decoration;
  for (const [field, name] of Object.entries(t.bind)) {
    const v = name && pv.get(name);
    if (v) s.setBoundVariable(field, v); else unbound.push(t.name + '.' + field);
  }
}
for (const e of EFFECT) {
  const s = effects.find(x => x.name === e.name) ?? figma.createEffectStyle();
  s.name = e.name;
  s.description = e.desc;
  s.effects = e.layers.map(l => ({
    type: 'DROP_SHADOW', color: l.color, offset: { x: l.x, y: l.y }, radius: l.blur, spread: l.spread,
    visible: true, blendMode: 'NORMAL', showShadowBehindNode: false,
  }));
}
return { textStyles: TEXT.length, effectStyles: EFFECT.length, unbound };
`;
}

// ---- write ----------------------------------------------------------------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
const files = [];
let n = 1;
const emit = (slug, body) => {
  const f = `${String(n++).padStart(2, '0')}-${slug}.js`;
  fs.writeFileSync(path.join(OUT, f), body);
  files.push([f, body.length]);
};
for (const [, layer] of LAYERS) {
  const cs = vars[layer].length ? chunks(vars[layer], layer === 'Components') : [];
  cs.forEach((c, i) => emit(
    cs.length > 1 ? `${layer.toLowerCase()}-${i + 1}` : layer.toLowerCase(),
    varScript(layer, c, `${layer} variables${cs.length > 1 ? ` (part ${i + 1}/${cs.length})` : ''}`),
  ));
  if (layer === 'Primitives') emit('styles', stylesScript());
}

// Where a Figma component should bind each of its tokens: component token path
// (variable-style name) → "Collection|variable" it finally resolves to. Component
// build scripts read this instead of creating component-level variables.
const bindings = {};
for (const [p, t] of tokens) {
  if (t.layer !== 'Components' || !isAlias(t.value)) continue;
  let q = aliasPath(t.value);
  while (tokens.get(q)?.layer === 'Components' && isAlias(tokens.get(q).value)) q = aliasPath(tokens.get(q).value);
  const target = varByPath.get(q);
  if (target) bindings[varName(p, 'Components')] = `${target.layer}|${target.name}`;
}
fs.writeFileSync(path.join(OUT, 'component-bindings.json'), JSON.stringify(bindings, null, 1));
files.push(['component-bindings.json', JSON.stringify(bindings).length]);

for (const [f, len] of files) console.log(`${f.padEnd(28)} ${(len / 1024).toFixed(1)} KB`);
console.log('variables:', Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, v.length])),
  '| text styles:', textStyles.length, '| effect styles:', effectStyles.length);
console.log('skipped (not variable types):', skipped);

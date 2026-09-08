// Client-side behaviour for the Explore Degrees prototype: one state object and
// the renderers that read it. Every branch the reference demonstrates is real
// here — focus areas only for majors that have them, Yes/No, N previous
// schools, the transcript scan's error AND success, both endings, and the
// Degree Planner switch.
//
// Single-IIFE like the Message Center prototypes, so every top-level name is
// prefixed `ed`/`S` — there are no module boundaries in the built page and a
// duplicate function name would hoist-clobber silently (that bug shipped once
// in the staff MC; grep before adding one).
import {
  PROGRAMS, PREV_SCHOOLS, CATALOG, SCANNED_CLASSES, TERM_OPTIONS, GRADE_OPTIONS,
  SCAN_ERROR, TRANSFER_RESULTS, STATUS_COPY, REQUIREMENT_GROUPS, NEXT_INTAKE,
  kindOf, coveredOf,
} from "./ed-data.mjs";

/** @param h { icon } — icons are inlined SVG strings, so they cross into JS as data */
export function edAppJs(h) {
  const { icon } = h;
  const groups = REQUIREMENT_GROUPS.map((g) => ({ ...g, count: coveredOf(g) }));
  const programs = PROGRAMS.map((p) => ({ ...p, kind: kindOf(p.name) }));

  const DATA = JSON.stringify({
    programs,
    schools: PREV_SCHOOLS,
    catalog: CATALOG,
    scanned: SCANNED_CLASSES,
    terms: TERM_OPTIONS,
    grades: GRADE_OPTIONS,
    scanError: SCAN_ERROR,
    transfer: TRANSFER_RESULTS,
    statusCopy: STATUS_COPY,
    groups,
    nextIntake: NEXT_INTAKE,
  });

  const ICONS = JSON.stringify({
    check: icon("check", "accordion__status accordion__status--done"),
    circle: icon("radio_button_unchecked", "accordion__status accordion__status--todo"),
    chevron: icon("expand_more", "accordion__chevron"),
    close: icon("close", ""),
    print: icon("print", "btn__icon"),
    launch: icon("launch", "btn__icon"),
    tick: icon("check", "listbox__checkmark"),
    info: icon("info", "alert__icon"),
    ok: icon("check_circle", "alert__icon"),
    warn: icon("warning", "alert__icon"),
    err: icon("error", "alert__icon"),
  });

  return `(function () {
  var D = ${DATA};
  var I = ${ICONS};
  var S = { step: 1, program: null, focus: null, combo: [], term: null, credits: null,
            schools: [], sid: 0, captcha: false, planner: true, tab: "credits", online: true };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var show = function (el, on) { if (el) el.classList.toggle("is-hidden", !on); };
  var programOf = function (name) { for (var i = 0; i < D.programs.length; i++) if (D.programs[i].name === name) return D.programs[i]; return null; };

  // Avatar's own hash — the same 8 hues, the same modulo, so a program's mark
  // is the identical colour wherever it appears in the flow.
  var HUES = ["blue", "green", "magenta", "amber", "teal", "orange", "violet", "red"];
  function edHue(name) { var s = 0; for (var i = 0; i < name.length; i++) s += name.charCodeAt(i); return HUES[s % HUES.length]; }
  // Only words that START with a letter — "Art (BFA)" must not become "A(".
  function edInitials(name) {
    var words = name.trim().split(/\\s+/).filter(function (w) { return /^[a-z]/i.test(w); });
    var p = words.length ? words : [name.trim()];
    return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)).toUpperCase();
  }

  /* ---------- popover anchoring (the native API gives the top layer, not a
     position) — same toggle-listener recipe the MC prototypes use ---------- */
  function edAnchor(panel, trigger) {
    panel.addEventListener("toggle", function (e) {
      if (e.newState !== "open") return;
      var r = trigger.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.margin = "0";
      var top = r.bottom + 4;
      if (top + panel.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - panel.offsetHeight - 4);
      panel.style.top = top + "px";
      panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8)) + "px";
      panel.style.width = Math.max(r.width, 280) + "px";
    });
  }

  /* ---------- step navigation ---------- */
  function edGoto(step) {
    S.step = step;
    $$(".ed__step").forEach(function (el) { el.classList.toggle("is-active", +el.dataset.panel === step); });
    edStepper();
    window.scrollTo(0, 0);
  }
  function edStepper() {
    $$("#ed-stepper .stepper__step").forEach(function (el) {
      var n = +el.dataset.step;
      el.classList.toggle("is-active", n === S.step);
      el.classList.toggle("is-complete", n < S.step);
    });
    $$("#ed-stepper .stepper__connector").forEach(function (el) {
      el.classList.toggle("is-complete", +el.dataset.after < S.step);
    });
  }

  /* ---------- step 1 · programs ---------- */
  function edPickProgram(name) {
    S.program = name;
    S.focus = null;
    S.combo = [{ name: name, kind: programOf(name).kind, primary: true }];
    var p = programOf(name);
    show($("#ed-pick-section"), true);
    $("#ed-pick-tile").innerHTML =
      '<span class="choice-tile__box" style="border-color: var(--tok-fill-primary); background: var(--tok-bg-primary)">' +
        '<span class="choice-tile__marker ed-hue--' + edHue(name) + '">' + edInitials(name) + "</span>" +
        '<span class="choice-tile__text"><span class="choice-tile__label">' + esc(name) + "</span>" +
        '<span class="choice-tile__description">Your primary pick</span></span></span>';
    show($("#ed-focus-block"), !!p.focus);
    if (p.focus) {
      $("#ed-focus-grid").innerHTML = p.focus.map(function (f) {
        return '<label class="choice-tile"><input class="choice-tile__input" type="radio" name="ed-focus" value="' + esc(f) + '" />' +
          '<span class="choice-tile__box"><span class="choice-tile__marker ed-hue--' + edHue(f) + '">' + edInitials(f) + "</span>" +
          '<span class="choice-tile__text"><span class="choice-tile__label">' + esc(f) + "</span></span></span></label>";
      }).join("") +
        '<label class="choice-tile"><input class="choice-tile__input" type="radio" name="ed-focus" value="__skip__" />' +
        '<span class="choice-tile__box"><span class="choice-tile__text"><span class="choice-tile__label">Not sure yet — skip focus areas</span></span></span></label>';
      $$('#ed-focus-grid input').forEach(function (r) {
        r.addEventListener("change", function () { S.focus = r.value === "__skip__" ? null : r.value; });
      });
    }
    edCombo();
    edComboList();
    edValidate();
  }

  function edCombo() {
    $("#ed-combo-chips").innerHTML = S.combo.map(function (c, i) {
      var badge = '<span class="badge badge--neutral">' + (c.primary ? "Primary · " : "") + c.kind + "</span>";
      var action = c.primary
        ? '<button class="chip__meta-action" type="button" data-change-primary="1">Change</button>'
        : '<button class="chip__remove" type="button" data-drop="' + i + '" aria-label="Remove ' + esc(c.name) + '">' + I.close + "</button>";
      return '<span class="chip">' + esc(c.name) + badge + action + "</span>";
    }).join("");
    $$("#ed-combo-chips [data-drop]").forEach(function (b) {
      b.addEventListener("click", function () { S.combo.splice(+b.dataset.drop, 1); edCombo(); edComboList(); });
    });
    var change = $("#ed-combo-chips [data-change-primary]");
    if (change) change.addEventListener("click", function () { edGoto(1); $("#ed-program-search").focus(); });
  }

  function edComboList() {
    var q = ($("#ed-combo-search").value || "").toLowerCase();
    var taken = S.combo.map(function (c) { return c.name; });
    $("#ed-combo-list").innerHTML = D.programs
      .filter(function (p) { return p.name.toLowerCase().indexOf(q) > -1; })
      .map(function (p) {
        var on = taken.indexOf(p.name) > -1;
        return '<li><button class="listbox__option" type="button" role="option" aria-selected="' + on + '" data-add="' + esc(p.name) + '"' + (on ? " disabled" : "") + ">" +
          '<span class="listbox__stack"><span>' + esc(p.name) + "</span>" +
          '<span class="listbox__desc">' + esc(p.degree) + "</span></span>" +
          '<span class="listbox__trailing badge badge--neutral">' + p.kind + "</span></button></li>";
      }).join("");
    $$("#ed-combo-list [data-add]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = programOf(b.dataset.add);
        S.combo.push({ name: p.name, kind: p.kind });
        edCombo(); edComboList();
      });
    });
  }

  /* ---------- step 3 · schools ---------- */
  function edAddSchool() {
    var id = ++S.sid;
    S.schools.push({ id: id, name: null, scan: "idle", file: null, captcha: false, attempts: 0, classes: [] });
    var opts = D.schools.map(function (n) {
      return '<li><button class="listbox__option" type="button" data-pick-school="' + esc(n) + '">' + esc(n) + "</button></li>";
    }).join("");
    var html = ${JSON.stringify("__TEMPLATE__")}.replace(/__ID__/g, id).replace("__SCHOOL_OPTIONS__", opts);
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    var block = wrap.firstElementChild;
    $("#ed-schools").appendChild(block);
    edWireSchool(id, block);
    edValidate();
  }

  function edSchool(id) { for (var i = 0; i < S.schools.length; i++) if (S.schools[i].id === id) return S.schools[i]; return null; }

  function edWireSchool(id, block) {
    var sc = edSchool(id);
    var trigger = $('[data-school-select="' + id + '"]', block);
    var panel = $("#ed-school-lb-" + id, block);
    edAnchor(panel, trigger);
    $$("[data-pick-school]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        sc.name = b.dataset.pickSchool;
        var v = $(".select__value", trigger);
        v.textContent = sc.name;
        v.classList.remove("is-placeholder");
        panel.hidePopover();
        show($('[data-school-body="' + id + '"]', block), true);
        edValidate();
      });
    });
    $('[data-remove-school="' + id + '"]', block).addEventListener("click", function () {
      S.schools = S.schools.filter(function (x) { return x.id !== id; });
      block.remove();
      if (!S.schools.length) edAddSchool();
      edValidate();
    });

    // --- transcript scan: idle → captcha → reading → error, then success ---
    var captcha = $('[data-scan-captcha="' + id + '"]', block);
    var go = $('[data-scan-go="' + id + '"]', block);
    $('[data-choose-file="' + id + '"]', block).addEventListener("click", function () {
      sc.file = sc.attempts === 0
        ? "793352309_28774422868808325_n.jpg"
        : "bainbridge-unofficial-transcript.pdf";
      $('[data-file-name="' + id + '"]', block).textContent = sc.file;
      go.disabled = !(sc.file && sc.captcha);
    });
    captcha.addEventListener("click", function (e) {
      e.preventDefault();
      sc.captcha = !sc.captcha;
      captcha.classList.toggle("is-checked", sc.captcha);
      go.disabled = !(sc.file && sc.captcha);
    });
    go.addEventListener("click", function () {
      show($('[data-scan-idle="' + id + '"]', block), false);
      show($('[data-scan-reading="' + id + '"]', block), true);
      setTimeout(function () {
        show($('[data-scan-reading="' + id + '"]', block), false);
        var out = $('[data-scan-result="' + id + '"]', block);
        show(out, true);
        sc.attempts++;
        if (sc.attempts === 1) {
          // The reference's own rejection: the reader says what the file WAS.
          out.innerHTML = '<div class="alert alert--danger">' + I.err +
            '<div class="alert__stack"><p class="alert__message">' + esc(D.scanError) + "</p>" +
            '<div class="alert__action"><button class="btn btn--ghost btn--sm" data-retry="' + id + '" type="button">Try another file</button></div></div></div>';
          $('[data-retry="' + id + '"]', out).addEventListener("click", function () {
            sc.file = null; sc.captcha = false;
            captcha.classList.remove("is-checked");
            $('[data-file-name="' + id + '"]', block).textContent = "PDF or image, up to 10 MB";
            go.disabled = true;
            show(out, false);
            show($('[data-scan-idle="' + id + '"]', block), true);
          });
        } else {
          D.scanned.forEach(function (c) { sc.classes.push(JSON.parse(JSON.stringify(c))); });
          out.innerHTML =
            '<div class="alert alert--info">' + I.info + '<div class="alert__stack"><p class="alert__message">Read as a transcript from <span class="alert__title">' + esc(sc.name) + "</span>.</p></div></div>" +
            '<div class="alert alert--success" style="margin-top:8px">' + I.ok +
            '<div class="alert__stack"><p class="alert__message"><span class="alert__title">We found ' + D.scanned.length + " classes we can import.</span> Review the grades and remove anything you don't want below.</p></div></div>";
          edClasses(id, block);
        }
        edValidate();
      }, 1100);
    });

    // --- manual class search ---
    var searchEl = $('[data-class-search="' + id + '"]', block);
    var results = $('[data-class-results="' + id + '"]', block);
    searchEl.addEventListener("input", function () {
      var q = searchEl.value.trim().toLowerCase();
      if (!q) { show(results, false); return; }
      var hits = D.catalog.filter(function (c) {
        return (c.code + " " + c.title).toLowerCase().indexOf(q) > -1;
      }).slice(0, 6);
      show(results, true);
      results.innerHTML = hits.length
        ? hits.map(function (c) {
            var added = sc.classes.some(function (x) { return x.code === c.code; });
            return '<li><button class="listbox__option" type="button" data-add-class="' + esc(c.code) + '"' + (added ? " disabled" : "") + ">" +
              '<span class="listbox__stack"><span>' + esc(c.code) + " · " + esc(c.title) + "</span>" +
              '<span class="listbox__desc">' + c.units + " units</span></span>" +
              (added ? '<span class="listbox__trailing badge badge--success">Added</span>' : '<span class="listbox__trailing badge badge--neutral">Add</span>') +
              "</button></li>";
          }).join("")
        : '<li><span class="listbox__option" style="cursor:default">No classes match that search</span></li>';
      $$("[data-add-class]", results).forEach(function (b) {
        b.addEventListener("click", function () {
          var c = D.catalog.filter(function (x) { return x.code === b.dataset.addClass; })[0];
          sc.classes.push({ code: c.code, term: "Fall", year: 2025, units: c.units, grade: "" });
          edClasses(id, block);
          searchEl.dispatchEvent(new Event("input"));
          edValidate();
        });
      });
    });
  }

  /* ---------- the classes table ---------- */
  function edClasses(id, block) {
    var sc = edSchool(id);
    var host = $('[data-classes="' + id + '"]', block || document);
    if (!sc.classes.length) { host.innerHTML = '<p class="ed-note">Nothing added yet. Search a class above to get started.</p>'; return; }
    var opt = function (list, val) {
      return list.map(function (o) { return '<option value="' + o + '"' + (o === val ? " selected" : "") + ">" + o + "</option>"; }).join("");
    };
    host.innerHTML =
      '<div class="ed-section__title">Classes you\\'re bringing</div>' +
      '<p class="ed-section__hint">Tell us when you took each one and the grade you earned. The year matters, because schools limit how old a class can be and still transfer.</p>' +
      '<div class="table"><div class="table__head"><span>Class</span><span>Term</span><span>Year <span class="table__req">*</span></span><span>Units</span><span>Grade <span class="table__req">*</span></span><span></span></div>' +
      sc.classes.map(function (c, i) {
        return '<div class="table__row">' +
          '<span class="table__code">' + esc(c.code) + "</span>" +
          '<span class="select select--sm"><select class="field__control" data-cls="' + i + '" data-field="term">' + opt(D.terms, c.term) + "</select></span>" +
          '<span class="field field--sm"><input class="field__control" data-cls="' + i + '" data-field="year" value="' + esc(c.year) + '" inputmode="numeric" aria-label="Year" /></span>' +
          '<span class="field field--sm"><input class="field__control" data-cls="' + i + '" data-field="units" value="' + esc(c.units) + '" inputmode="decimal" aria-label="Units" /></span>' +
          '<span class="select select--sm"><select class="field__control" data-cls="' + i + '" data-field="grade"><option value=""></option>' + opt(D.grades, c.grade) + "</select></span>" +
          '<button class="btn btn--ghost btn--sm btn--icon-only" data-del="' + i + '" type="button" aria-label="Remove ' + esc(c.code) + '">' + I.close + "</button>" +
          "</div>";
      }).join("") + "</div>";
    $$("[data-field]", host).forEach(function (el) {
      el.addEventListener("change", function () {
        sc.classes[+el.dataset.cls][el.dataset.field] = el.value;
        edValidate();
      });
    });
    $$("[data-del]", host).forEach(function (b) {
      b.addEventListener("click", function () { sc.classes.splice(+b.dataset.del, 1); edClasses(id, block); edValidate(); });
    });
  }

  /* ---------- validation per step ---------- */
  function edClassesReady() {
    return S.schools.length > 0 && S.schools.every(function (s) {
      return s.name && s.classes.length > 0 && s.classes.every(function (c) { return c.year && c.grade; });
    });
  }
  function edValidate() {
    $("#ed-next-1").disabled = !S.program;
    $("#ed-next-2").disabled = !S.term;
    $("#ed-next-3").disabled = !(S.credits === "no" || (S.credits === "yes" && edClassesReady()));
    $("#ed-build").disabled = !S.captcha;
  }

  /* ---------- step 4 · review (labels adapt to the data) ---------- */
  function edReview() {
    var rows = [];
    // No School row: there is only ever one, and the user's call is that the
    // school picker exists in their demo and never will in the product.
    rows.push(["Academic level", "Undergraduate"]);
    var extras = S.combo.filter(function (c) { return !c.primary; });
    rows.push([extras.length ? "Majors &amp; minors" : "Major",
      S.combo.map(function (c) {
        return esc(c.name) + ' <span class="badge badge--neutral">' + (c.primary && extras.length ? "Primary · " : "") + c.kind + "</span>";
      }).join("<br />")]);
    if (S.focus) rows.push(["Focus area", esc(S.focus)]);
    rows.push(["Starting term", esc(S.term)]);
    if (S.credits === "no") {
      rows.push(["Transfer credits", "None added"]);
    } else {
      var total = S.schools.reduce(function (n, s) { return n + s.classes.length; }, 0);
      var detail = S.schools.map(function (s) {
        return '<span class="alert__title">' + esc(s.name) + " (" + s.classes.length + " classes)</span><br />" +
          s.classes.map(function (c) {
            return '<span class="ed-tcredit__meta">' + esc(c.code) + " · " + esc(c.term) + " " + esc(c.year) + " · " + esc(c.units) + " units · grade " + esc(c.grade) + "</span>";
          }).join("<br />");
      }).join("<br /><br />");
      rows.push(["Transfer credits", total + " classes from " + S.schools.length + (S.schools.length === 1 ? " school" : " schools") + "<br /><br />" + detail]);
    }
    $("#ed-review").innerHTML = rows.map(function (r) {
      return '<div class="ed-summary"><span class="ed-summary__key">' + r[0] + '</span><span class="ed-summary__val">' + r[1] + "</span></div>";
    }).join("");
  }

  /* ---------- step 5 · results ---------- */
  function edBuild() {
    // Riverside is the school with no online rules — that's how the
    // "couldn't check your credits" ending gets demonstrated.
    S.online = !S.schools.some(function (s) { return /Riverside/.test(s.name || ""); });
    var veil = $("#ed-veil");
    veil.classList.add("is-active");
    setTimeout(function () {
      veil.classList.remove("is-active");
      edResults();
      edGoto(5);
    }, 1800);
  }

  function edResults() {
    var hasCredits = S.credits === "yes";
    var applied = D.transfer.filter(function (t) { return t.status === "accepted"; }).length;
    var total = D.transfer.length;
    var cov = D.groups.reduce(function (a, g) { return a + g.count.covered; }, 0);
    var reqTotal = D.groups.reduce(function (a, g) { return a + g.count.total; }, 0);

    $("#ed-res-headline").textContent = hasCredits
      ? "Your credits already cover " + cov + " of " + reqTotal + " requirement areas"
      : "What it takes to finish " + S.program;
    $("#ed-res-subline").textContent = hasCredits
      ? "What it takes to finish " + S.program + ", and where you already stand."
      : "You're starting fresh, so everything below is still ahead of you.";

    var pills = [["Start " + S.term, "primary"], [reqTotal + " requirement areas", "primary"]];
    if (hasCredits) pills.push([cov + " already covered", "primary"], [applied + " classes applied", "primary"]);
    $("#ed-res-pills").innerHTML = pills.map(function (p) { return '<span class="badge badge--' + p[1] + '">' + esc(p[0]) + "</span>"; }).join("");

    var pct = hasCredits ? Math.round((cov / reqTotal) * 100) : 0;
    var bar = $("#ed-res-progress");
    bar.setAttribute("aria-valuenow", pct);
    $(".progress__bar", bar).style.width = pct + "%";

    // Always the results page; the planner is a BUTTON, never a redirect —
    // a hard redirect would discard both the estimate and the print path.
    var actions = [];
    if (S.planner) actions.push('<button class="btn btn--primary btn--base" type="button">' + I.launch + "Open in Degree Planner</button>");
    actions.push('<button class="btn btn--secondary btn--base" type="button">' + I.print + "Print or save as PDF</button>");
    $("#ed-res-actions").innerHTML = actions.join("");


    // With no credits there is nothing to say in the transfer tab, so it
    // doesn't exist and requirements becomes the only view.
    show($("#ed-res-tabs"), hasCredits);
    if (!hasCredits) { S.tab = "reqs"; }
    edTab(S.tab);
    edCreditsPanel(hasCredits);
    edReqsPanel();
  }

  function edTab(name) {
    S.tab = name;
    $$(".ed-tab").forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".ed-tabpanel").forEach(function (p) { p.classList.toggle("is-active", p.dataset.tabpanel === name); });
  }

  function edCreditsPanel(on) {
    var host = $("#ed-panel-credits");
    if (!on) { host.innerHTML = ""; return; }
    if (!S.online) {
      // This tab IS the thing we couldn't compute, so the explanation lives
      // here rather than above the tabs — an empty panel under a label that
      // promises content reads as a bug.
      host.innerHTML = '<div class="card"><div class="card__body">' +
        '<span class="card__title">Your transfer credit</span>' +
        '<div class="alert alert--warning">' + I.warn + '<div class="alert__stack"><p class="alert__message">' +
        '<span class="alert__title">We couldn\\'t check your credits from ' + esc(S.schools[0].name) + ' online.</span> ' +
        'The rest of your roadmap is unaffected, and an advisor can evaluate those classes with you.</p></div></div>' +
        '<p class="ed-note">This is an estimate to help you plan, not an official award of transfer credit.</p>' +
        "</div></div>";
      return;
    }
    var order = ["accepted", "review", "evaluate"];
    var applied = D.transfer.filter(function (t) { return t.status === "accepted"; });
    var head = '<div class="alert alert--success">' + I.ok +
      '<div class="alert__stack"><p class="alert__message"><span class="alert__title">' + applied.length +
      " classes applied to your plan.</span> The rest need a quick advisor review — they're checked off in your degree requirements.</p>" +
      '<p class="alert__detail">Applied to: ' + applied.map(function (t) { return esc(t.equates.code); }).join(", ") + "</p></div></div>";

    host.innerHTML = head + order.map(function (st) {
      var rows = D.transfer.filter(function (t) { return t.status === st; });
      if (!rows.length) return "";
      var copy = D.statusCopy[st];
      return '<div class="card"><div class="card__head"><span class="card__title">' + esc(copy.label) +
        '</span><span class="badge badge--' + copy.role + '">' + rows.length + "</span></div>" +
        '<div class="card__body" style="padding:0;gap:0">' +
        rows.map(function (t) {
          return '<div class="ed-tcredit"><div class="ed-tcredit__col"><span class="ed-eyebrow">You took</span>' +
            t.took.map(function (k) {
              return '<span class="ed-tcredit__code">' + esc(k.code) + '</span><span class="ed-tcredit__meta">' + k.units + " units · grade " + esc(k.grade) + "</span>";
            }).join("") + "</div>" +
            '<div class="ed-tcredit__col"><span class="ed-eyebrow">Equates to</span>' +
            (t.equates
              ? '<span class="ed-tcredit__code">' + esc(t.equates.code) + " — " + esc(t.equates.title) + '</span><span class="ed-tcredit__meta">' + t.equates.units + " units</span>"
              : '<span class="ed-tcredit__meta">No matching class yet.</span>') + "</div>" +
            '<span class="ed-tcredit__note">' + esc(copy.note) + "</span></div>";
        }).join("") + "</div></div>";
    }).join("");
  }

  function edReqsPanel() {
    $("#ed-panel-reqs").innerHTML = D.groups.map(function (g) {
      var count = g.count.total ? '<span class="badge badge--neutral">' + g.count.covered + " of " + g.count.total + " covered</span>" : "";
      var rows = g.rows.map(function (r) {
        var stateful = typeof r.covered === "boolean";
        var status = stateful ? (r.covered ? I.check : I.circle) : "";
        var meta = stateful ? '<span class="accordion__meta">' + (r.covered ? "Covered" : "Still to do") + "</span>" : "";
        var body = (r.classes || []).length
          ? '<span class="ed-eyebrow">Classes that count toward this</span>' +
            r.classes.map(function (c) {
              return '<span class="ed-course"><b>' + esc(c.code) + "</b> " + esc(c.title) + " · " + c.units +
                ' units <span class="badge badge--success">Covered by your credit from ' + esc(c.from) + "</span></span>";
            }).join("")
          : '<span class="ed-section__hint">' + (stateful && r.covered ? "Satisfied by your transferred credit." : "No class applied to this yet.") + "</span>";
        return '<details class="accordion__item"><summary class="accordion__summary">' + status +
          '<span class="accordion__title">' + esc(r.title) + "</span>" + meta + I.chevron +
          '</summary><div class="accordion__body">' + body + "</div></details>";
      }).join("");
      return '<div class="card"><div class="card__head"><span class="card__title">' + esc(g.title) +
        (g.code ? ' <span class="ed-tcredit__meta">' + esc(g.code) + "</span>" : "") + "</span>" + count + "</div>" +
        (rows ? '<div class="card__body" style="padding:0;gap:0">' + rows + "</div>" : "") + "</div>";
    }).join("");
  }

  /* ---------- wiring ---------- */
  $$('#ed-program-grid input').forEach(function (r) {
    r.addEventListener("change", function () { edPickProgram(r.value); });
  });
  $("#ed-program-search").addEventListener("input", function () {
    var q = this.value.trim().toLowerCase();
    var any = false;
    $$("#ed-program-grid .choice-tile").forEach(function (t) {
      var hit = t.dataset.program.toLowerCase().indexOf(q) > -1;
      t.classList.toggle("is-hidden", !hit);
      if (hit) any = true;
    });
    show($("#ed-program-empty"), !any);
  });
  $("#ed-combo-search").addEventListener("input", edComboList);
  edAnchor($("#ed-combo-lb"), $("#ed-combo-trigger"));

  $$('input[name="ed-term"]').forEach(function (r) {
    r.addEventListener("change", function () { S.term = r.value; edValidate(); });
  });
  $("#ed-term-unsure").addEventListener("click", function () {
    var el = document.querySelector('input[name="ed-term"][value="' + D.nextIntake + '"]');
    el.checked = true; S.term = D.nextIntake; edValidate();
    el.closest(".choice-tile").scrollIntoView({ block: "center" });
  });

  $$('input[name="ed-credits"]').forEach(function (r) {
    r.addEventListener("change", function () {
      S.credits = r.value;
      show($("#ed-schools-block"), r.value === "yes");
      if (r.value === "yes" && !S.schools.length) edAddSchool();
      if (r.value === "no") { S.schools = []; $("#ed-schools").innerHTML = ""; }
      edValidate();
    });
  });
  $("#ed-add-school").addEventListener("click", edAddSchool);

  var cap = $("#ed-captcha-review");
  cap.addEventListener("click", function (e) {
    e.preventDefault();
    S.captcha = !S.captcha;
    cap.classList.toggle("is-checked", S.captcha);
    edValidate();
  });

  $("#ed-next-1").addEventListener("click", function () { edGoto(2); });
  $("#ed-next-2").addEventListener("click", function () { edGoto(3); });
  $("#ed-next-3").addEventListener("click", function () { edReview(); edGoto(4); });
  $("#ed-build").addEventListener("click", edBuild);
  $$("[data-back]").forEach(function (b) {
    b.addEventListener("click", function () { edGoto(+b.dataset.back); });
  });
  $$(".ed-tab").forEach(function (t) { t.addEventListener("click", function () { edTab(t.dataset.tab); }); });
  $("#ed-planner-toggle").addEventListener("change", function () { S.planner = this.checked; edResults(); });
  $("#ed-try-another").addEventListener("click", function () {
    S.program = null; S.focus = null; S.combo = [];
    $$('#ed-program-grid input').forEach(function (r) { r.checked = false; });
    show($("#ed-pick-section"), false);
    edValidate();
    edGoto(1);
  });

  edStepper();
  edValidate();
})();`;
}

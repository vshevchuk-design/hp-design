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
    add: icon("add", ""),
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
  var S = { step: 1, program: null, focus: null, combo: [], pickerMode: "primary", fKind: "", fLevel: "", focusSkipped: false, term: null, credits: null,
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
  /* ---------- step 1: the answer sheet, and a dialog to fill it ----------
     The step always shows what you have chosen — an empty slot shaped like a
     chosen row when that is nothing yet. The 29 programmes live in a modal
     dialog the slot opens. mode is "primary" when the pick replaces the
     primary programme and "add" when it appends one. */
  function edOpenPicker(mode) {
    S.pickerMode = mode;
    var adding = mode === "add";
    /* Not "major": the primary pick can be a minor, and the reference lets it be
       — the chosen row has always called it your primary pick. */
    $("#ed-picker-title").textContent = adding ? "Add a major or minor" : S.program ? "Change your primary pick" : "Choose your primary pick";
    /* Already-chosen programmes stay visible but are not pickable again. */
    var taken = S.combo.map(function (c) { return c.name; });
    $$("#ed-program-grid .choice-tile").forEach(function (t) {
      var input = t.querySelector(".choice-tile__input");
      input.disabled = taken.indexOf(t.dataset.program) > -1;
      input.checked = false;
    });
    $("#ed-program-search").value = "";
    S.fKind = ""; S.fLevel = "";
    ["kind", "level"].forEach(function (f) { edSetFacet(f, "", $('#ed-lb-' + f + " [data-value='']").textContent); });
    edFilterPrograms();
    $("#ed-picker").showModal();
    $(".ed-picker__body").scrollTop = 0;
    $("#ed-program-search").focus();
  }

  function edClosePicker() { $("#ed-picker").close(); }

  /* What you have chosen. The primary sits under its own heading and carries
     its focus areas inside its own card; the extras live in the combo section
     below. Both are the same .ed-pick card — the primary just has more in it. */
  function edMeta(c) { var p = programOf(c.name); return c.kind + " · " + p.degree; }

  function edPickCard(c, i) {
    var p = programOf(c.name);
    var actions = c.primary
      ? '<button class="btn btn--ghost btn--sm" type="button" data-change-primary="1">Change</button>' +
        '<button class="btn btn--ghost btn--sm btn--icon-only" type="button" data-drop="' + i +
        '" aria-label="Remove ' + esc(c.name) + '">' + I.close + "</button>"
      : '<button class="btn btn--ghost btn--sm btn--icon-only" type="button" data-drop="' + i +
        '" aria-label="Remove ' + esc(c.name) + '">' + I.close + "</button>";
    return '<div class="ed-pick"><div class="ed-pick__row">' +
      '<span class="choice-tile__marker ed-hue--' + edHue(c.name) + '">' + edInitials(c.name) + "</span>" +
      '<span class="choice-tile__text"><span class="choice-tile__label">' + esc(c.name) + "</span>" +
      '<span class="choice-tile__description">' + esc(edMeta(c)) + "</span></span>" +
      '<span class="ed-pick__actions">' + actions + "</span></div>" +
      (c.primary && p.focus ? edFocusMarkup(p) : "") + "</div>";
  }

  function edRenderChosen() {
    var primary = null, extras = [];
    S.combo.forEach(function (c, i) { if (c.primary) primary = { c: c, i: i }; else extras.push({ c: c, i: i }); });

    if (!primary) {
      $("#ed-primary").innerHTML =
        '<button class="ed-choose" id="ed-choose-program" type="button">' +
          '<span class="ed-choose__marker">' + I.add + "</span>" +
          '<span class="ed-choose__text"><span class="ed-choose__label">Choose a major or minor</span>' +
          '<span class="ed-choose__hint">Search ' + D.programs.length + ' majors and minors</span></span></button>';
      $("#ed-choose-program").addEventListener("click", function () { edOpenPicker("primary"); });
    } else {
      $("#ed-primary").innerHTML = edPickCard(primary.c, primary.i);
      $("#ed-primary [data-change-primary]").addEventListener("click", function () { edOpenPicker("primary"); });
      edWireFocus();
    }

    $("#ed-extras-list").innerHTML = extras.map(function (e) { return edPickCard(e.c, e.i); }).join("");
    show($("#ed-extras-list"), !!extras.length);
    /* Adding a second programme only makes sense once there is a first. */
    show($("#ed-add-block"), !!primary);

    $$("#ed-primary [data-drop], #ed-extras-list [data-drop]").forEach(function (b) {
      b.addEventListener("click", function () { edDrop(+b.dataset.drop); });
    });
    edValidate();
  }

  /* Dropping the primary promotes the next programme rather than throwing the
     whole combo away; with nothing left it goes back to the empty slot. Focus
     belongs to the programme, so it clears with it. */
  function edDrop(i) {
    var wasPrimary = S.combo[i].primary;
    S.combo.splice(i, 1);
    if (wasPrimary) {
      S.focus = null;
      S.focusSkipped = false;
      if (S.combo.length) { S.combo[0].primary = true; S.program = S.combo[0].name; }
      else S.program = null;
    }
    edRenderChosen();
  }
  function edSetFacet(facet, value, label) {
    S[facet === "kind" ? "fKind" : "fLevel"] = value;
    $("#ed-filter-" + facet + " .select__value").textContent = label;
    $$("#ed-lb-" + facet + " [data-value]").forEach(function (o) {
      o.setAttribute("aria-selected", String(o.dataset.value === value));
    });
  }

  function edFilterPrograms() {
    var q = ($("#ed-program-search").value || "").trim().toLowerCase();
    var any = false;
    $$("#ed-program-grid .choice-tile").forEach(function (t) {
      var hit = t.dataset.program.toLowerCase().indexOf(q) > -1 &&
        (!S.fKind || t.dataset.kind === S.fKind) &&
        (!S.fLevel || t.dataset.level === S.fLevel);
      t.classList.toggle("is-hidden", !hit);
      if (hit) any = true;
    });
    show($("#ed-program-empty"), !any);
  }

  function edPickProgram(name) {
    var p = programOf(name);
    if (S.pickerMode === "add") {
      S.combo.push({ name: p.name, kind: p.kind });
    } else {
      /* Changing the primary keeps whatever else was stacked; if the new
         primary was one of those extras, it moves up rather than doubling. */
      var extras = S.combo.filter(function (c) { return !c.primary && c.name !== p.name; });
      S.program = p.name;
      S.focus = null;
      S.focusSkipped = false;
      S.combo = [{ name: p.name, kind: p.kind, primary: true }].concat(extras);
    }
    edClosePicker();
    edRenderChosen();
  }
  /* Rendered into the primary's own card. Split from the wiring because the
     card is rebuilt whenever the combo changes, and S.focus has to survive it. */
  function edFocusMarkup(p) {
    var tile = function (value, label) {
      var mark = value === "__skip__" ? "" :
        '<span class="choice-tile__marker ed-hue--' + edHue(value) + '">' + edInitials(value) + "</span>";
      return '<label class="choice-tile"><input class="choice-tile__input" type="radio" name="ed-focus" value="' + esc(value) + '"' +
        ((value === "__skip__" ? S.focusSkipped : S.focus === value) ? " checked" : "") + " />" +
        '<span class="choice-tile__box">' + mark +
        '<span class="choice-tile__text"><span class="choice-tile__label">' + esc(label) + "</span></span></span></label>";
    };
    return '<div class="ed-pick__focus">' +
      '<div class="ed-section__head"><div class="ed-section__title">Want to focus it? (optional)</div>' +
      '<p class="ed-section__hint">This major or minor offers focus areas. Pick one if you already know, or skip and decide later.</p></div>' +
      '<div class="ed-grid" id="ed-focus-grid">' +
      p.focus.map(function (f) { return tile(f, f); }).join("") +
      tile("__skip__", "Not sure yet — skip focus areas") +
      "</div></div>";
  }
  function edWireFocus() {
    $$("#ed-focus-grid input").forEach(function (r) {
      r.addEventListener("change", function () {
        S.focusSkipped = r.value === "__skip__";
        S.focus = S.focusSkipped ? null : r.value;
      });
    });
  }
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
    /* The key can't say "Major" alone: the primary pick may be a minor, and
       that produced "Major — Classics Minor · Minor". PeopleSoft would call
       these plans, but this screen speaks to prospective students and every
       other control on it says major/minor — so the key does too. */
    rows.push([S.combo.length > 1 ? "Majors &amp; minors" : "Major or minor",
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
  $("#ed-program-search").addEventListener("input", edFilterPrograms);
  $("#ed-add-program").addEventListener("click", function () { edOpenPicker("add"); });
  $("#ed-picker-close").addEventListener("click", edClosePicker);
  ["kind", "level"].forEach(function (facet) {
    var panel = $("#ed-lb-" + facet), trigger = $("#ed-filter-" + facet);
    edAnchor(panel, trigger);
    $$("[data-value]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        edSetFacet(facet, b.dataset.value, b.textContent);
        panel.hidePopover();
        edFilterPrograms();
      });
    });
  });
  /* Click the backdrop to dismiss — <dialog> gives Escape for free but not
     this, and the backdrop is part of the dialog element's own box. */
  $("#ed-picker").addEventListener("click", function (e) { if (e.target === this) edClosePicker(); });

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
    S.program = null; S.focus = null; S.focusSkipped = false; S.combo = [];
    $$('#ed-program-grid input').forEach(function (r) { r.checked = false; r.disabled = false; });
    $("#ed-program-search").value = "";
    edGoto(1);
    edRenderChosen();
    edValidate();
  });

  edStepper();
  edRenderChosen();
  edValidate();
})();`;
}

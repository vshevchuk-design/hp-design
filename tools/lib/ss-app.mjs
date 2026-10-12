// The Student Scheduling prototype's client script: browse (search, the
// department dropdown chip, the drop-in toggle chip, sort, pagination, per-row
// department) and pick-a-time (week, time of day, day, slot, advisor,
// confirm). Plain ES5-ish so it runs as-is from a static file.
//
// One Listbox popover element serves every dropdown on the page — the
// department chip, sort, and each row's department Select. Native `popover`
// gives top-layer, Escape and outside-click for free; the script only fills
// the options and anchors the panel under whichever trigger opened it.

/** @param d  { SERVICES, ADVISORS, LOCATIONS, DEPARTMENTS, TODAY, WEEKS_AHEAD, TIME_ZONE, SECTIONS, ICONS } */
export function ssAppJs(d) {
  return `(function () {
  var SERVICES = ${JSON.stringify(d.SERVICES)};
  var ADVISORS = ${JSON.stringify(d.ADVISORS)};
  var LOCATIONS = ${JSON.stringify(d.LOCATIONS)};
  var DEPARTMENTS = ${JSON.stringify(d.DEPARTMENTS)};
  var TODAY = ${JSON.stringify(d.TODAY)};
  var WEEKS_AHEAD = ${d.WEEKS_AHEAD};
  var ICONS = ${JSON.stringify(d.ICONS)};
  var APPTS = ${JSON.stringify(d.APPOINTMENTS)};
  var ABOUT = ${JSON.stringify(d.ABOUT)};
  var NOW_MIN = ${d.NOW_MINUTES}, CHECKIN_BEFORE = ${d.CHECKIN_MINUTES_BEFORE};
  var STUDENT_PHONE = ${JSON.stringify(d.STUDENT_PHONE)};
  // v6: Book is one catalogue — appointments, drop-in desks, workshops.
  var V6 = ${!!d.V6};
  var WORKSHOPS = ${JSON.stringify(d.WORKSHOPS || [])};
  var DROPIN_HOURS = ${JSON.stringify(d.DROPIN_HOURS || {})};
  var PER_STUDENT = ${d.DROPIN_MINUTES_PER_STUDENT || 8};
  // "list" (v1: rows in one Card).
  var LAYOUT = ${JSON.stringify(d.LAYOUT || "list")};
  // "text" (v5): a flush divided list on a phone, list rows in a Card from
  // 768. Lists every department on the item; one is chosen on pick-a-time.
  var PAGE_SIZE = 10;
  var DEPT_ON_PICK = LAYOUT === "text";
  var FORMATS = [
    { key: "inPerson", label: "In person", icon: ICONS.group },
    { key: "phone", label: "Phone", icon: ICONS.call },
    { key: "video", label: "Video", icon: ICONS.videocam }
  ];
  // v5: base badges, regular weight; By appointment in the violet tag hue.
  var DROP_BADGE_V5 = {
    none: '<span class="badge badge--base badge--regular badge--violet">By appointment</span>',
    open: '<span class="badge badge--base badge--regular badge--success">Drop-in until 10:00 PM</span>',
    available: '<span class="badge badge--base badge--regular badge--primary">Drop-in available</span>'
  };

  function $(id) { return document.getElementById(id); }
  // listen only if the element exists — v6's views aren't in v5/v1's markup
  function on(id, type, fn) { var el = $(id); if (el) el.addEventListener(type, fn); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------------- shared Listbox popover ----------------
  var lb = $("ss-lb");
  var lbList = lb.querySelector(".listbox__list");
  var lbTrigger = null, lbOnPick = null, lbSuppress = null;
  lb.addEventListener("toggle", function (e) {
    if (e.newState === "closed" && lbTrigger) lbTrigger.setAttribute("aria-expanded", "false");
  });
  // Tapping the trigger of an open listbox should close it, not reopen it.
  // Light-dismiss closes the panel on pointerdown, and its toggle event is
  // queued — so by the click, nothing synchronous says "it was just open".
  // Record it here, in the capture phase, while it still is.
  document.addEventListener("pointerdown", function (e) {
    lbSuppress = lb.matches(":popover-open") && lbTrigger && lbTrigger.contains(e.target) ? lbTrigger : null;
  }, true);
  function openListbox(trigger, options, selected, onPick) {
    if (lbSuppress === trigger) { lbSuppress = null; return; }
    lbSuppress = null;
    lbTrigger = trigger; lbOnPick = onPick;
    lbList.innerHTML = options.map(function (o) {
      var sel = o.value === selected;
      return '<button type="button" class="listbox__option" role="option" aria-selected="' + sel + '" data-value="' + esc(o.value) + '"><span>' + esc(o.label) + "</span>" + ICONS.check + "</button>";
    }).join("");
    lb.showPopover();
    trigger.setAttribute("aria-expanded", "true");
    var r = trigger.getBoundingClientRect();
    lb.style.position = "fixed";
    lb.style.minWidth = Math.max(220, r.width) + "px";
    var top = r.bottom + 4;
    if (top + lb.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - 4 - lb.offsetHeight);
    lb.style.top = top + "px";
    lb.style.left = Math.max(8, Math.min(r.left, window.innerWidth - lb.offsetWidth - 8)) + "px";
    var cur = lbList.querySelector('[aria-selected="true"]') || lbList.firstChild;
    if (cur) cur.focus();
  }
  lbList.addEventListener("click", function (e) {
    var opt = e.target.closest(".listbox__option");
    if (!opt) return;
    var fn = lbOnPick, t = lbTrigger;
    lb.hidePopover();
    if (t) t.focus();
    if (fn) fn(opt.dataset.value);
  });

  // ---------------- toast ----------------
  function showToast(text) {
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("popover", "manual");
    t.setAttribute("role", "status");
    t.innerHTML = ICONS.checkCircle + '<span class="toast__label"></span>';
    t.querySelector(".toast__label").textContent = text;
    document.body.appendChild(t);
    t.showPopover();
    setTimeout(function () { t.hidePopover(); t.remove(); }, 3600);
  }

  // ---------------- sections + views ----------------
  var views = document.querySelectorAll(".ss-view");
  function showView(name) {
    views.forEach(function (v) { v.classList.toggle("is-active", v.dataset.view === name); });
    window.scrollTo(0, 0);
  }
  var sectionTabs = document.querySelectorAll(".ss-sections .tab");
  function goSection(i) {
    sectionTabs.forEach(function (t, j) {
      t.classList.toggle("tab--active", i === j);
      t.setAttribute("aria-selected", i === j ? "true" : "false");
    });
    if (i === 0) { renderBrowse(); showView("browse"); return; }
    if (i === 1) { renderAppts(); showView("appointments"); return; }
    $("ss-placeholder-text").textContent = sectionTabs[i].textContent + " — not designed yet";
    showView("placeholder");
  }
  sectionTabs.forEach(function (t, i) { t.addEventListener("click", function () { goSection(i); }); });

  // v5: the segmented section bar tucks away while scrolling down and returns
  // on any scroll up (a few px of slack so a jittery finger doesn't flicker it).
  var band = document.querySelector(".ss-sections--seg");
  if (band) {
    var row = band.querySelector(".tabs--segmented");
    var fades = function () {
      var max = row.scrollWidth - row.clientWidth;
      band.classList.toggle("has-more-start", row.scrollLeft > 1);
      band.classList.toggle("has-more-end", row.scrollLeft < max - 1);
    };
    row.addEventListener("scroll", fades, { passive: true });
    window.addEventListener("resize", fades);
    if (document.fonts) document.fonts.ready.then(fades);
    fades();
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (Math.abs(y - lastY) < 4) return;
      band.classList.toggle("is-tucked", y > lastY && y > band.offsetHeight);
      lastY = y;
    }, { passive: true });
  }

  // ---------------- browse ----------------
  var st = { q: "", dept: "", dropOnly: false, sort: "name", page: 0, rowDept: {} };
  var searchBox = $("ss-search"), searchInput = $("ss-search-input");
  searchInput.addEventListener("input", function () {
    st.q = searchInput.value.trim().toLowerCase();
    searchBox.classList.toggle("is-populated", !!searchInput.value);
    st.page = 0; renderBrowse();
  });
  function clearSearch() {
    searchInput.value = ""; st.q = ""; searchBox.classList.remove("is-populated");
    st.page = 0; renderBrowse();
  }
  // v5 phone: search lives behind a button in the title row and expands over
  // the title — the Message Center's pattern. × clears, then closes; Escape
  // clears and closes. From 768 the field goes back to the filter row.
  var head = $("ss-browse-head"), headRow = $("ss-head-row"), openBtn = $("ss-search-open");
  var tools = document.querySelector(".ss-tools");
  // Focus goes back to the search button only for a keyboard close (Escape).
  // After a tap on ×, moving focus programmatically from the text field (which
  // always matches :focus-visible) carries the ring onto the button — so a
  // pointer close just lets focus go.
  function closeSearch(fromKeyboard) {
    clearSearch();
    head.classList.remove("is-search-open");
    openBtn.setAttribute("aria-expanded", "false");
    if (fromKeyboard) openBtn.focus();
    else if (document.activeElement) document.activeElement.blur();
  }
  if (head) {
    var phone = window.matchMedia("(max-width: 767px)");
    var placeSearch = function () {
      if (phone.matches) headRow.appendChild(searchBox);
      else { tools.insertBefore(searchBox, tools.firstChild); head.classList.remove("is-search-open"); }
    };
    phone.addEventListener("change", placeSearch);
    placeSearch();
    openBtn.addEventListener("click", function () {
      head.classList.add("is-search-open");
      openBtn.setAttribute("aria-expanded", "true");
      searchInput.focus();
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && head.classList.contains("is-search-open")) closeSearch(true);
    });
    // Leaving an EMPTY open search (tapping a filter, sort, the list…) folds it
    // back into the button. With text in it, it stays open — it is an active
    // filter and has to stay visible, same as the always-open field on desktop.
    searchBox.addEventListener("focusout", function (e) {
      if (!head.classList.contains("is-search-open") || searchInput.value) return;
      if (e.relatedTarget && searchBox.contains(e.relatedTarget)) return;
      head.classList.remove("is-search-open");
      openBtn.setAttribute("aria-expanded", "false");
    });
  }
  $("ss-search-clear").addEventListener("click", function (e) {
    if (!searchInput.value && head && head.classList.contains("is-search-open")) { closeSearch(e.detail === 0); return; }
    clearSearch(); searchInput.focus();
  });

  var deptChip = $("ss-dept-chip");
  deptChip.addEventListener("click", function () {
    var opts = [{ value: "", label: "All departments" }].concat(DEPARTMENTS.map(function (x) { return { value: x, label: x }; }));
    openListbox(deptChip, opts, st.dept, function (v) {
      st.dept = v; st.page = 0;
      $("ss-dept-label").textContent = v || "Department";
      deptChip.classList.toggle("chip--checked-outline", !!v);
      renderBrowse();
    });
  });
  // v6 has no drop-in toggle — the Type chip covers it.
  var dropChip = $("ss-drop-chip") || document.createElement("button");
  dropChip.addEventListener("click", function () {
    st.dropOnly = !st.dropOnly;
    dropChip.setAttribute("aria-pressed", st.dropOnly ? "true" : "false");
    st.page = 0; renderBrowse();
  });

  // v6 — Type: All / Appointments / Drop-ins / Workshops (dropdown chip).
  var TYPES = [{ value: "", label: "All types" }, { value: "appointment", label: "Appointments" }, { value: "dropin", label: "Drop-ins" }, { value: "workshop", label: "Workshops" }];
  var typeChip = $("ss-type-chip");
  function setType(v) {
    st.type = v; st.page = 0;
    $("ss-type-label").textContent = v ? TYPES.filter(function (x) { return x.value === v; })[0].label : "Type";
    typeChip.classList.toggle("chip--checked-outline", !!v);
  }
  if (typeChip) typeChip.addEventListener("click", function () {
    openListbox(typeChip, TYPES, st.type, function (v) { setType(v); renderBrowse(); });
  });

  var SORTS = V6
    ? [{ value: "name", label: "Name (A–Z)" }, { value: "kind", label: "Type" }]
    : [{ value: "name", label: "Name (A–Z)" }, { value: "duration", label: "Duration (shortest first)" }];
  var sortBtn = $("ss-sort");
  sortBtn.addEventListener("click", function () {
    openListbox(sortBtn, SORTS, st.sort, function (v) {
      st.sort = v;
      $("ss-sort-label").textContent = v === "name" ? "Name (A–Z)" : v === "kind" ? "Type" : "Duration";
      renderBrowse();
    });
  });

  $("ss-clear-filters").addEventListener("click", function () {
    st.q = ""; st.dept = ""; st.dropOnly = false; st.page = 0;
    searchInput.value = ""; searchBox.classList.remove("is-populated");
    $("ss-dept-label").textContent = "Department";
    deptChip.classList.remove("chip--checked-outline");
    dropChip.setAttribute("aria-pressed", "false");
    if (typeChip) setType("");
    renderBrowse();
  });

  function filtered() {
    if (V6) return filteredV6();
    var list = SERVICES.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) {
      if (st.q && x.s.name.toLowerCase().indexOf(st.q) === -1) return false;
      if (st.dept && x.s.depts.indexOf(st.dept) === -1) return false;
      if (st.dropOnly && x.s.drop === "none") return false;
      return true;
    });
    list.sort(function (a, b) {
      if (st.sort === "duration" && a.s.minutes !== b.s.minutes) return a.s.minutes - b.s.minutes;
      return a.s.name.localeCompare(b.s.name);
    });
    return list;
  }
  function deptOf(i) {
    var s = SERVICES[i];
    if (st.rowDept[i]) return st.rowDept[i];
    if (st.dept && s.depts.indexOf(st.dept) !== -1) return st.dept;
    return s.depts[0];
  }

  // v1 item — v5's shell and type, but the department is picked HERE: a base
  // Select (floating "Department" label) when several departments offer the
  // service, an outline Badge after the booking mode when only one does.
  // Pick a time is Button secondary.
  function rowHtml(x) {
    var s = x.s, multi = s.depts.length > 1;
    var select = multi
      ? '<button type="button" class="select" data-row-dept="' + x.i + '" aria-haspopup="listbox" aria-expanded="false" aria-label="Department for ' + esc(s.name) + '"><span class="select__stack"><span class="select__label">Department</span><span class="select__value" data-dept-value>' + esc(deptOf(x.i)) + "</span></span>" + ICONS.chevron + "</button>"
      : "";
    return '<article class="ss-item ss-item--pick">' +
      '<div class="ss-item__main"><h3 class="ss-item__name">' + esc(s.name) + "</h3>" +
      '<div class="ss-item__line"><span class="ss-fact">' + ICONS.schedule + '<span class="ss-fact__text">' + s.minutes + " min</span></span>" + DROP_BADGE_V5[s.drop] +
      (multi ? "" : '<span class="badge badge--base badge--outline badge--regular">' + esc(s.depts[0]) + "</span>") +
      "</div></div>" +
      '<div class="ss-item__aside">' + select + '<button type="button" class="btn btn--secondary btn--base ss-item__cta" data-pick="' + x.i + '">Pick a time</button></div>' +
      "</article>";
  }
  // v5 item — the departments as plain comma-separated text right under the
  // name; duration + booking mode on the line below.
  function textItemHtml(x) {
    var s = x.s, depts = s.depts.slice(), at = st.dept ? depts.indexOf(st.dept) : -1;
    if (at > 0) { depts.splice(at, 1); depts.unshift(st.dept); }
    return '<article class="ss-item ss-item--text">' +
      '<div class="ss-item__main"><h3 class="ss-item__name">' + esc(s.name) + "</h3>" +
      '<p class="ss-item__depts">' + esc(depts.join(", ")) + "</p>" +
      '<div class="ss-item__line"><span class="ss-fact">' + ICONS.schedule + '<span class="ss-fact__text">' + s.minutes + " min</span></span>" + DROP_BADGE_V5[s.drop] + "</div></div>" +
      '<button type="button" class="btn btn--tint btn--base ss-item__cta" data-pick="' + x.i + '">Pick a time</button>' +
      "</article>";
  }

  // ---------------- v6 catalogue ----------------
  // One entry per thing you can book: every service by appointment; a drop-in
  // desk for each service that runs one (at its first department); every
  // workshop. Same name sorts appointment → drop-in → workshop.
  var KIND_ORDER = { appointment: 0, dropin: 1, workshop: 2 };
  var CATALOG = [];
  if (V6) {
    SERVICES.forEach(function (s, i) {
      CATALOG.push({ kind: "appointment", si: i, name: s.name, depts: s.depts });
      if (DROPIN_HOURS[s.name]) CATALOG.push({ kind: "dropin", si: i, key: "d" + i, name: s.name, depts: [s.depts[0]], hours: DROPIN_HOURS[s.name] });
    });
    WORKSHOPS.forEach(function (w, wi) { CATALOG.push({ kind: "workshop", wi: wi, name: w.name, depts: [w.dept] }); });
  }
  var QUEUE = {}, RESERVED = {}, WS_REG = {};
  function filteredV6() {
    var list = CATALOG.map(function (c, i) { return { c: c, i: i }; }).filter(function (x) {
      if (st.q && x.c.name.toLowerCase().indexOf(st.q) === -1) return false;
      if (st.dept && x.c.depts.indexOf(st.dept) === -1) return false;
      if (st.type && x.c.kind !== st.type) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (st.sort === "kind" && a.c.kind !== b.c.kind) return KIND_ORDER[a.c.kind] - KIND_ORDER[b.c.kind];
      return a.c.name.localeCompare(b.c.name) || KIND_ORDER[a.c.kind] - KIND_ORDER[b.c.kind];
    });
    return list;
  }
  function fact(icon, text) { return '<span class="ss-fact">' + icon + '<span class="ss-fact__text">' + esc(text) + "</span></span>"; }
  function vbadge(role, text) { return '<span class="badge badge--base badge--regular badge--' + role + '">' + esc(text) + "</span>"; }
  function dropinOpen(h) { return !h.opens || NOW_MIN >= h.opens; }
  function catalogItemHtml(x) {
    var c = x.c, depts = c.depts.slice(), at = st.dept ? depts.indexOf(st.dept) : -1;
    if (at > 0) { depts.splice(at, 1); depts.unshift(st.dept); }
    var line = "", cta = "";
    if (c.kind === "appointment") {
      line = fact(ICONS.schedule, SERVICES[c.si].minutes + " min") + vbadge("violet", "By appointment");
      cta = '<button type="button" class="btn btn--tint btn--base ss-item__cta" data-pick="' + c.si + '">Pick a time</button>';
    } else if (c.kind === "dropin") {
      var h = c.hours;
      if (dropinOpen(h)) {
        var n = h.waiting;
        line = fact(ICONS.people, n ? n + " waiting · about " + n * PER_STUDENT + " min" : "No wait right now") + vbadge("success", "Drop-in · open until " + fmtTime(h.until));
        cta = QUEUE[c.key]
          ? '<button type="button" class="btn btn--secondary btn--base ss-item__cta" disabled>You\u2019re in line</button>'
          : '<button type="button" class="btn btn--tint btn--base ss-item__cta" data-queue="' + x.i + '">Join queue</button>';
      } else {
        line = fact(ICONS.schedule, "Today " + fmtTime(h.opens) + " – " + fmtTime(h.until)) + vbadge("primary", "Drop-in · opens " + fmtTime(h.opens));
        cta = RESERVED[c.key]
          ? '<button type="button" class="btn btn--secondary btn--base ss-item__cta" disabled>Seat reserved</button>'
          : '<button type="button" class="btn btn--tint btn--base ss-item__cta" data-reserve="' + x.i + '">Reserve a seat</button>';
      }
    } else {
      var w = WORKSHOPS[c.wi], reg = WS_REG[w.id], full = wsFull(w);
      line = fact(ICONS.dateRange, wsPatternLabel(w)) + vbadge("teal", "Workshop") +
        (w.course ? '<span class="badge badge--base badge--outline badge--regular">' + esc(w.course) + "</span>" : "") +
        (reg ? vbadge("success", "Registered") : full ? vbadge("neutral", "Full") : "");
      cta = '<button type="button" class="btn ' + (reg || full ? "btn--secondary" : "btn--tint") + ' btn--base ss-item__cta" data-ws="' + c.wi + '">' + (reg || full ? "View" : "Register") + "</button>";
    }
    return '<article class="ss-item ss-item--text">' +
      '<div class="ss-item__main"><h3 class="ss-item__name">' + esc(c.name) + "</h3>" +
      '<p class="ss-item__depts">' + esc(depts.join(", ")) + "</p>" +
      '<div class="ss-item__line">' + line + "</div></div>" + cta + "</article>";
  }

  function renderBrowse() {
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (st.page >= pages) st.page = pages - 1;
    var from = st.page * PAGE_SIZE, slice = list.slice(from, from + PAGE_SIZE);
    var any = list.length > 0;
    $("ss-results").classList.toggle("is-hidden", !any);
    $("ss-empty").classList.toggle("is-hidden", any);
    $("ss-list").innerHTML = slice.map(V6 ? catalogItemHtml : LAYOUT === "text" ? textItemHtml : rowHtml).join("");
    $("ss-range").textContent = any ? "Showing " + (from + 1) + "–" + (from + slice.length) + " of " + list.length : "";
    renderPager(pages);
  }
  $("ss-list").addEventListener("click", function (e) {
    var sel = e.target.closest("[data-row-dept]");
    if (sel) {
      var i = +sel.dataset.rowDept;
      openListbox(sel, SERVICES[i].depts.map(function (x) { return { value: x, label: x }; }), deptOf(i), function (v) {
        st.rowDept[i] = v;
        sel.querySelector("[data-dept-value]").textContent = v;
      });
      return;
    }
    var pick = e.target.closest("[data-pick]");
    if (pick) { openPick(+pick.dataset.pick); return; }
    var q = e.target.closest("[data-queue]");
    if (q) { joinQueue(CATALOG[+q.dataset.queue]); return; }
    var r = e.target.closest("[data-reserve]");
    if (r) { reserveSeat(CATALOG[+r.dataset.reserve]); return; }
    var w = e.target.closest("[data-ws]");
    if (w) openWorkshop(+w.dataset.ws);
  });

  function renderPager(pages) {
    var pager = $("ss-pages");
    $("ss-pager").classList.toggle("is-hidden", pages < 2);
    var h = '<button type="button" class="page-item" data-page="prev" aria-label="Previous page"' + (st.page === 0 ? " disabled" : "") + ">" + ICONS.chevronLeft + "</button>";
    for (var p = 0; p < pages; p++) {
      h += '<button type="button" class="page-item" data-page="' + p + '"' + (p === st.page ? ' aria-current="page"' : "") + ">" + (p + 1) + "</button>";
    }
    h += '<button type="button" class="page-item" data-page="next" aria-label="Next page"' + (st.page === pages - 1 ? " disabled" : "") + ">" + ICONS.chevronRight + "</button>";
    pager.innerHTML = h;
  }
  $("ss-pages").addEventListener("click", function (e) {
    var b = e.target.closest("[data-page]");
    if (!b || b.disabled) return;
    var v = b.dataset.page;
    st.page = v === "prev" ? st.page - 1 : v === "next" ? st.page + 1 : +v;
    renderBrowse();
    $("ss-results").scrollIntoView({ block: "start" });
  });

  // ---------------- availability (generated) ----------------
  var today = new Date(TODAY + "T00:00:00");
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MON_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function addDays(dt, n) { var x = new Date(dt); x.setDate(x.getDate() + n); return x; }
  function key(dt) { return dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate(); }
  function fmtTime(min) { var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? "PM" : "AM", hh = h % 12 || 12; return hh + ":" + (m < 10 ? "0" : "") + m + " " + ap; }
  // A week is the next seven days from its start, Sundays closed.
  function weekDays(w) {
    var out = [];
    for (var i = 0; i < 7; i++) { var dt = addDays(today, w * 7 + i); if (dt.getDay() !== 0) out.push(dt); }
    return out;
  }
  var booked = {};
  var slotCache = {};
  function slotsFor(si, dt) {
    var k = si + "|" + pk.dept + "|" + key(dt);
    if (!slotCache[k]) {
      var s = SERVICES[si], out = [];
      if (!s.noSlots) {
        var density = 12 + hash(k) % 40; // percent of half-hours open that day
        if (dt.getDay() === 6) density = Math.floor(density / 3);
        for (var m = 8 * 60; m <= 19 * 60 + 30; m += 30) {
          // today's slots that have already started aren't on offer
          if (key(dt) === key(today) && m <= NOW_MIN) continue;
          var hk = k + "|" + m;
          if (hash(hk) % 100 >= density) continue;
          var pool = ADVISORS.slice().sort(function (a, b) { return hash(hk + a) - hash(hk + b); });
          var n = 1 + hash(hk + "n") % 6;
          var fm = FORMATS.filter(function (f, fi) { return fi === 0 || hash(hk + f.key) % 2; });
          out.push({ id: hk, min: m, advisors: pool.slice(0, n), formats: fm.map(function (f) { return f.key; }) });
        }
      }
      slotCache[k] = out;
    }
    return slotCache[k].filter(function (x) { return !booked[x.id]; });
  }
  var TODS = { any: [0, 1440], morning: [0, 720], afternoon: [720, 1020], evening: [1020, 1440] };
  function inTod(slot, tod) { var r = TODS[tod]; return slot.min >= r[0] && slot.min < r[1]; }

  // ---------------- pick a time ----------------
  var pk = { si: 0, dept: null, week: 0, tod: "any", day: null, slot: null, advisor: null, notified: {} };
  // opts.dept: arrive with this department (Book again / Reschedule).
  // opts.reschedule: the appointment id being moved — Confirm then moves it.
  function openPick(si, opts) {
    opts = opts || {};
    pk.si = si; pk.week = 0; pk.tod = "any"; pk.day = null; pk.slot = null; pk.advisor = null;
    pk.reschedule = opts.reschedule || null;
    var s = SERVICES[si];
    // v3 chooses the department here. It arrives pre-set when the browse
    // filter already named one this service has (or when there is only one);
    // otherwise the student picks it before any times show.
    var choose = DEPT_ON_PICK && s.depts.length > 1;
    if (opts.dept) pk.dept = opts.dept;
    else if (DEPT_ON_PICK) pk.dept = s.depts.length === 1 ? s.depts[0] : s.depts.indexOf(st.dept) !== -1 ? st.dept : null;
    else pk.dept = deptOf(si);
    $("ss-pick-title").textContent = s.name;
    $("ss-pick-meta").textContent = s.minutes + " minutes" + (DEPT_ON_PICK ? "" : " · " + pk.dept);
    $("ss-dept-step").classList.toggle("is-hidden", !DEPT_ON_PICK);
    $("ss-pick-dept").classList.toggle("is-hidden", !choose);
    $("ss-pick-dept-text").classList.toggle("is-hidden", choose);
    $("ss-pick-dept-text").textContent = choose ? "" : pk.dept;
    var moving = pk.reschedule ? apptById(pk.reschedule) : null;
    $("ss-resched-note").classList.toggle("is-hidden", !moving);
    if (moving) $("ss-resched-text").textContent = moving.service + " is booked for " + whenShort(moving) + ". That time stays yours until you confirm a new one.";
    $("ss-back").querySelector("span").textContent = moving ? "Back to appointment" : "All services";
    $("ss-confirm").textContent = moving ? "Confirm new time" : "Confirm appointment";
    showView("pick");
    renderPick();
  }
  $("ss-back").addEventListener("click", function () {
    if (pk.reschedule) { var id = pk.reschedule; pk.reschedule = null; openAppt(id); return; }
    showView("browse");
  });
  $("ss-prev-week").addEventListener("click", function () { pk.week--; pk.day = null; pk.slot = null; renderPick(); });
  $("ss-next-week").addEventListener("click", function () { pk.week++; pk.day = null; pk.slot = null; renderPick(); });
  document.querySelectorAll("#ss-tod .tab").forEach(function (t) {
    t.addEventListener("click", function () { pk.tod = t.dataset.tod; pk.slot = null; renderPick(); });
  });

  var pickDept = $("ss-pick-dept");
  pickDept.addEventListener("click", function () {
    openListbox(pickDept, SERVICES[pk.si].depts.map(function (x) { return { value: x, label: x }; }), pk.dept, function (v) {
      pk.dept = v; pk.week = 0; pk.day = null; pk.slot = null; pk.advisor = null;
      renderPick();
    });
  });

  function renderPick() {
    // Department picker state (v3): Select's resting placeholder until chosen,
    // then the populated shape with its floating "Department" label.
    pickDept.classList.toggle("is-placeholder", !pk.dept);
    $("ss-pick-dept-value").textContent = pk.dept || "Choose a department";
    var needDept = !pk.dept;
    $("ss-need-dept").classList.toggle("is-hidden", !needDept);
    $("ss-week").classList.toggle("is-hidden", needDept);
    if (needDept) {
      $("ss-choose-body").classList.add("is-hidden");
      $("ss-noslots").classList.add("is-hidden");
      renderSummary(true);
      return;
    }
    var days = weekDays(pk.week);
    var first = days[0], last = days[days.length - 1];
    $("ss-week-label").textContent = MON[first.getMonth()] + " " + first.getDate() + " – " + (first.getMonth() === last.getMonth() ? "" : MON[last.getMonth()] + " ") + last.getDate();
    $("ss-prev-week").disabled = pk.week === 0;
    $("ss-next-week").disabled = pk.week >= WEEKS_AHEAD - 1;

    var perDay = days.map(function (dt) { return slotsFor(pk.si, dt); });
    var weekTotal = perDay.reduce(function (a, l) { return a + l.length; }, 0);
    var empty = weekTotal === 0;
    $("ss-choose-body").classList.toggle("is-hidden", empty);
    $("ss-noslots").classList.toggle("is-hidden", !empty);
    if (empty) {
      var s = SERVICES[pk.si];
      $("ss-dropins").classList.toggle("is-hidden", s.drop === "none");
      var nb = $("ss-notify"), done = !!pk.notified[pk.si];
      nb.disabled = done;
      nb.querySelector("span").textContent = done ? "We'll let you know" : "Notify me when a spot opens";
      // Nothing to book this week: the summary stays (so the page keeps its
      // shape) but in its minimal form — no When, no advisors, no Confirm.
      renderSummary(true);
      return;
    }

    // time-of-day tabs: a range with nothing in it this week is disabled
    document.querySelectorAll("#ss-tod .tab").forEach(function (t) {
      var n = perDay.reduce(function (a, l) { return a + l.filter(function (x) { return inTod(x, t.dataset.tod); }).length; }, 0);
      t.disabled = n === 0;
      t.classList.toggle("tab--active", t.dataset.tod === pk.tod);
      t.setAttribute("aria-selected", t.dataset.tod === pk.tod ? "true" : "false");
    });

    var counts = perDay.map(function (l) { return l.filter(function (x) { return inTod(x, pk.tod); }).length; });
    if (pk.day === null || !counts[pk.day]) {
      pk.day = null;
      for (var i = 0; i < counts.length; i++) if (counts[i]) { pk.day = i; break; }
    }
    $("ss-days").innerHTML = days.map(function (dt, i) {
      var n = counts[i];
      return '<label class="choice-tile ss-day"><input class="choice-tile__input" type="radio" name="ss-day" value="' + i + '"' + (i === pk.day ? " checked" : "") + (n ? "" : " disabled") + ' aria-label="' + DOW_LONG[dt.getDay()] + ", " + MON_LONG[dt.getMonth()] + " " + dt.getDate() + ", " + n + ' open times">' +
        '<span class="choice-tile__box"><span class="ss-day__dow">' + DOW[dt.getDay()] + '</span><span class="ss-day__num">' + dt.getDate() + '</span><span class="choice-tile__description">' + (n ? n + (n === 1 ? " time" : " times") : "Full") + "</span></span></label>";
    }).join("");

    var dayDate = pk.day === null ? null : days[pk.day];
    var slots = pk.day === null ? [] : perDay[pk.day].filter(function (x) { return inTod(x, pk.tod); });
    $("ss-day-title").textContent = dayDate ? DOW_LONG[dayDate.getDay()] + ", " + MON_LONG[dayDate.getMonth()] + " " + dayDate.getDate() : "";
    $("ss-day-count").textContent = slots.length + (slots.length === 1 ? " open time" : " open times");
    $("ss-slots").innerHTML = slots.map(function (x) {
      var who = x.advisors[0] + (x.advisors.length > 1 ? " +" + (x.advisors.length - 1) + " more" : "");
      var fm = x.formats.map(function (k) {
        var f = FORMATS.filter(function (y) { return y.key === k; })[0];
        return '<span class="tooltip-wrapper" aria-label="' + f.label + '">' + f.icon + '<span class="tooltip" role="tooltip">' + f.label + "</span></span>";
      }).join("");
      return '<label class="choice-tile ss-slot"><input class="choice-tile__input" type="radio" name="ss-slot" value="' + esc(x.id) + '"' + (pk.slot && pk.slot.id === x.id ? " checked" : "") + ">" +
        '<span class="choice-tile__box"><span class="choice-tile__text"><span class="choice-tile__label">' + fmtTime(x.min) + '</span><span class="choice-tile__description">' + esc(who) + '</span></span><span class="ss-slot__formats">' + fm + "</span></span></label>";
    }).join("");
    pk.daySlots = slots;
    renderSummary();
  }
  $("ss-days").addEventListener("change", function (e) { pk.day = +e.target.value; pk.slot = null; renderPick(); });
  $("ss-slots").addEventListener("change", function (e) {
    pk.slot = pk.daySlots.filter(function (x) { return x.id === e.target.value; })[0];
    pk.advisor = pk.slot.advisors[0];
    renderSummary();
    // Below 1024 the summary sits under the times — bring it into view.
    if (window.innerWidth < 1024) $("ss-summary").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // minimal: nothing bookable yet (no open times, or no department chosen) —
  // the card keeps what's known (service, department, duration, location)
  // and drops the booking half: When, the advisor block and Confirm.
  function renderSummary(minimal) {
    document.querySelectorAll("#ss-summary .ss-sum-when-row, #ss-summary .ss-sum-booking").forEach(function (el) { el.classList.toggle("is-hidden", !!minimal); });
    var s = SERVICES[pk.si], days = weekDays(pk.week), dt = pk.day === null ? null : days[pk.day];
    $("ss-sum-service").textContent = s.name;
    $("ss-sum-duration").textContent = s.minutes + " minutes";
    var when = $("ss-sum-when");
    if (pk.slot && dt) {
      when.textContent = DOW[dt.getDay()] + ", " + MON[dt.getMonth()] + " " + dt.getDate() + " · " + fmtTime(pk.slot.min);
      when.classList.remove("is-empty");
    } else {
      when.textContent = "Pick a time";
      when.classList.add("is-empty");
    }
    var adv = $("ss-advisors");
    if (!minimal) {
      $("ss-advisor-group").classList.toggle("is-hidden", !pk.slot);
      $("ss-advisor-hint").classList.toggle("is-hidden", !!pk.slot);
    }
    if (pk.slot) {
      adv.innerHTML = pk.slot.advisors.map(function (a, i) {
        return '<label class="radio"><input class="radio__input" type="radio" name="ss-advisor" value="' + esc(a) + '"' + (a === pk.advisor ? " checked" : "") + '><span class="radio__circle"></span><span class="radio__text">' + esc(a) + (i === 0 ? ' <span class="badge badge--primary">Recommended</span>' : "") + "</span></label>";
      }).join("");
    }
    var dept = pk.dept;
    $("ss-sum-dept").textContent = dept || "Choose a department";
    $("ss-sum-dept").classList.toggle("is-empty", !dept);
    document.querySelectorAll("#ss-summary .ss-sum-loc").forEach(function (el) { el.classList.toggle("is-hidden", !dept); });
    $("ss-sum-location").textContent = dept ? LOCATIONS[dept] : "";
    $("ss-sum-formats").textContent = pk.slot
      ? pk.slot.formats.map(function (k) { return FORMATS.filter(function (y) { return y.key === k; })[0].label; }).join(" · ")
      : minimal ? "In person, phone or video" : "In person, phone or video — depends on the time";
    $("ss-confirm").disabled = !pk.slot;
  }
  $("ss-advisors").addEventListener("change", function (e) { pk.advisor = e.target.value; });
  $("ss-confirm").addEventListener("click", function () {
    if (!pk.slot) return;
    var dt = weekDays(pk.week)[pk.day];
    booked[pk.slot.id] = true;
    var when = DOW[dt.getDay()] + ", " + MON[dt.getMonth()] + " " + dt.getDate() + " at " + fmtTime(pk.slot.min);
    if (pk.reschedule) {
      // Reschedule moves the existing appointment — same reference, new slot.
      var a = apptById(pk.reschedule);
      a.date = iso(dt); a.min = pk.slot.min; a.advisor = pk.advisor; a.format = pk.slot.formats[0]; a.dept = pk.dept;
      a.checkedIn = false;
      pk.reschedule = null; pk.slot = null; pk.advisor = null;
      showToast("Rescheduled to " + when);
      openAppt(a.id);
      return;
    }
    APPTS.push({ id: "n" + Date.now(), ref: String(5200 + APPTS.length), service: SERVICES[pk.si].name, dept: pk.dept, date: iso(dt), min: pk.slot.min, advisor: pk.advisor, format: pk.slot.formats[0], status: "upcoming" });
    updateUpcomingCount();
    if (V6) {
      var na = APPTS[APPTS.length - 1];
      pk.slot = null; pk.advisor = null;
      showDone({
        title: "You\u2019re booked",
        text: na.service + " with " + na.advisor + ", " + whenShort(na) + ". Check-in opens " + CHECKIN_BEFORE + " minutes before.",
        facts: [["When", esc(whenLong(na))], ["Advisor", esc(na.advisor)], ["Department", esc(na.dept)], ["Meeting", esc(where(na))], ["Reference", "#" + esc(na.ref)]],
        actions: [
          { label: "Go to My schedule", primary: true, fn: function () { goSection(1); } },
          { label: "Book something else", fn: function () { goSection(0); } }
        ]
      });
      return;
    }
    showToast("Booked: " + SERVICES[pk.si].name + ", " + when + " — it's in My appointments");
    pk.slot = null; pk.advisor = null;
    renderPick();
  });
  $("ss-notify").addEventListener("click", function () {
    pk.notified[pk.si] = true;
    showToast("We'll email you when a time opens for " + SERVICES[pk.si].name);
    renderPick();
  });
  $("ss-dropins").addEventListener("click", function () {
    if (!V6) { goSection(2); return; }
    // v6: no Drop-Ins tab — Book, narrowed to this service's drop-in desk.
    var name = SERVICES[pk.si].name;
    setType("dropin");
    searchInput.value = name; st.q = name.toLowerCase(); searchBox.classList.add("is-populated");
    if (head && window.matchMedia("(max-width: 767px)").matches) { head.classList.add("is-search-open"); openBtn.setAttribute("aria-expanded", "true"); }
    goSection(0);
  });

  // ---------------- my appointments ----------------
  var apptTab = "upcoming";
  function apptById(id) { return APPTS.filter(function (a) { return a.id === id; })[0]; }
  function svcIndex(name) { for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].name === name) return i; return -1; }
  function iso(dt) { return dt.getFullYear() + "-" + (dt.getMonth() < 9 ? "0" : "") + (dt.getMonth() + 1) + "-" + (dt.getDate() < 10 ? "0" : "") + dt.getDate(); }
  function apptDate(a) { return new Date(a.date + "T00:00:00"); }
  function minutesOf(a) { var i = svcIndex(a.service); return i === -1 ? 30 : SERVICES[i].minutes; }
  function isToday(a) { return a.date === TODAY; }
  // Check-in opens CHECKIN_BEFORE minutes ahead and stays open through the slot.
  function checkinOpen(a) { return a.status === "upcoming" && !a.checkedIn && isToday(a) && NOW_MIN >= a.min - CHECKIN_BEFORE && NOW_MIN < a.min + minutesOf(a); }
  function whenShort(a) { var d = apptDate(a); return DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate() + " at " + fmtTime(a.min); }
  function whenLong(a) { var d = apptDate(a); return DOW_LONG[d.getDay()] + ", " + MON_LONG[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " at " + fmtTime(a.min) + " (" + ${JSON.stringify(d.TIME_ZONE)} + ")"; }
  function groupLabel(a) { var d = apptDate(a); return (isToday(a) ? "Today · " : "") + DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate() + (d.getFullYear() !== today.getFullYear() ? ", " + d.getFullYear() : ""); }
  var FORMAT_ICON = { inPerson: ICONS.group, phone: ICONS.call, video: ICONS.videocam };
  function where(a) {
    if (a.format === "phone") return "Phone — your advisor calls you at " + STUDENT_PHONE;
    if (a.format === "video") return "Video — the link is in your email";
    return "In person — " + LOCATIONS[a.dept];
  }
  function badge(role, text) { return '<span class="badge badge--base badge--regular badge--' + role + '">' + esc(text) + "</span>"; }
  function statusBadges(a) {
    var out = [];
    if (a.status === "completed") out.push(badge("success", "Completed"));
    else if (a.status === "noshow") out.push(badge("danger", "No-show"));
    else if (a.status === "cancelled") out.push(badge("neutral", "Cancelled"));
    else {
      if (a.checkedIn) out.push(badge("success", "Checked in"));
      else if (checkinOpen(a)) out.push(badge("success", "Check-in open"));
      if (a.questions && !a.answered) out.push(badge("warning", a.questions.length + " questions to answer"));
    }
    return out.join("");
  }
  function checkinNote(a) {
    return '<span class="ss-note ss-note--icon">' + ICONS.noteClock + "Check-in opens at " + fmtTime(a.min - CHECKIN_BEFORE) + "</span>";
  }
  function updateUpcomingCount() {
    $("ss-upcoming-count").textContent = APPTS.filter(function (a) { return a.status === "upcoming"; }).length;
  }
  function apptRow(a) {
    var actions = "";
    if (a.status === "upcoming") {
      var btns = (checkinOpen(a) ? '<button type="button" class="btn btn--primary btn--sm" data-checkin="' + a.id + '">Check in</button>' : "") +
        '<button type="button" class="btn btn--secondary btn--sm" data-appt="' + a.id + '">Details</button>';
      actions = '<div class="ss-appt__btns">' + btns + "</div>" + (!a.checkedIn && !checkinOpen(a) ? checkinNote(a) : "");
    } else {
      actions = '<div class="ss-appt__btns"><button type="button" class="btn btn--secondary btn--sm" data-appt="' + a.id + '">Details</button></div>';
    }
    return '<article class="ss-appt">' +
      '<div class="ss-appt__time"><span class="ss-appt__clock">' + fmtTime(a.min) + '</span><span class="ss-appt__dur">' + minutesOf(a) + " min</span></div>" +
      '<div class="ss-appt__main"><div class="ss-appt__title"><h3 class="ss-appt__name">' + esc(a.service) + "</h3>" + statusBadges(a) + "</div>" +
      '<div class="ss-appt__meta">' +
      '<span class="ss-fact">' + ICONS.person + '<span class="ss-fact__text">' + esc(a.advisor) + " · " + esc(a.dept) + "</span></span>" +
      '<span class="ss-fact">' + FORMAT_ICON[a.format] + '<span class="ss-fact__text">' + esc(where(a)) + "</span></span>" +
      "</div></div>" +
      '<div class="ss-appt__actions">' + actions + "</div>" +
      "</article>";
  }
  function renderAppts() {
    updateUpcomingCount();
    document.querySelectorAll("#ss-appt-tabs .tab").forEach(function (t) {
      var on = t.dataset.apptTab === apptTab;
      t.classList.toggle("tab--active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    var list = APPTS.filter(function (a) {
      if (apptTab === "upcoming") return a.status === "upcoming";
      if (apptTab === "past") return a.status === "completed" || a.status === "noshow";
      return a.status === "cancelled";
    }).sort(function (x, y) {
      var k = (x.date + x.min).localeCompare(y.date + y.min);
      return apptTab === "upcoming" ? k : -k;
    });
    var groups = [], byKey = {};
    list.forEach(function (a) {
      if (!byKey[a.date]) { byKey[a.date] = { label: groupLabel(a), items: [] }; groups.push(byKey[a.date]); }
      byKey[a.date].items.push(a);
    });
    $("ss-appts").innerHTML = groups.map(function (g) {
      return '<section class="ss-appt-group"><h3 class="ss-eyebrow">' + esc(g.label) + '</h3><div class="ss-hybrid ss-hybrid--flush">' + g.items.map(apptRow).join("") + "</div></section>";
    }).join("");
    var empty = !list.length;
    $("ss-appts").classList.toggle("is-hidden", empty);
    $("ss-appts-empty").classList.toggle("is-hidden", !empty);
    $("ss-appts-empty-text").textContent = { upcoming: "No upcoming appointments", past: "No past appointments yet", cancelled: "Nothing cancelled" }[apptTab];
    $("ss-appts-browse").classList.toggle("is-hidden", apptTab !== "upcoming");
  }
  document.querySelectorAll("#ss-appt-tabs .tab").forEach(function (t) {
    t.addEventListener("click", function () { apptTab = t.dataset.apptTab; renderAppts(); });
  });
  $("ss-appts-browse").addEventListener("click", function () { goSection(0); });
  $("ss-appts").addEventListener("click", function (e) {
    var c = e.target.closest("[data-checkin]");
    if (c) { checkIn(apptById(c.dataset.checkin)); renderAppts(); return; }
    var d = e.target.closest("[data-appt]");
    if (d) openAppt(d.dataset.appt);
  });
  function checkIn(a) {
    a.checkedIn = true;
    var first = a.advisor.split(" ")[0];
    showToast(a.format === "phone" ? "Checked in — " + first + " will call you at " + STUDENT_PHONE
      : a.format === "video" ? "Checked in — join with the link in your email"
      : "Checked in — " + first + " will come and get you");
  }

  // ---- details ----
  var openId = null;
  function openAppt(id) { openId = id; renderAppt(); showView("appt"); }
  function renderAppt() {
    var a = apptById(openId), up = a.status === "upcoming";
    $("ss-d-name").textContent = a.service;
    $("ss-d-status").innerHTML = statusBadges(a);
    $("ss-d-dept").textContent = a.dept;
    var askQ = up && a.questions && !a.answered;
    $("ss-d-questions").classList.toggle("is-hidden", !askQ);
    if (askQ) {
      $("ss-d-q-title").textContent = a.advisor + " asked " + a.questions.length + " questions.";
      $("ss-d-q-text").textContent = "Answer them before the meeting so you can spend the time on what matters.";
    }
    var rows = [
      ["When", esc(whenLong(a))],
      ["Duration", minutesOf(a) + " minutes"],
      ["Advisor", esc(a.advisor)],
      ["Meeting", '<span class="ss-fact">' + FORMAT_ICON[a.format] + "<span>" + esc(where(a)) + "</span></span>"],
      ["Reference", '<span class="ss-ref">#' + esc(a.ref) + ' <button type="button" class="btn btn--ghost btn--sm btn--icon-only" id="ss-d-copy" aria-label="Copy reference number">' + ICONS.copy + "</button></span>"]
    ];
    if (a.questions && a.answered) rows.push(["Questions", "Answered — " + esc(a.advisor.split(" ")[0]) + " has them"]);
    $("ss-d-facts").innerHTML = rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    var act = "";
    if (up) {
      if (checkinOpen(a)) act += '<button type="button" class="btn btn--primary btn--base" id="ss-d-checkin">Check in</button>';
      else if (!a.checkedIn) act += checkinNote(a);
      act += '<button type="button" class="btn btn--secondary btn--base ss-push" id="ss-d-resched">Reschedule</button>' +
        '<button type="button" class="btn btn--secondary btn--base" id="ss-d-cancel">Cancel appointment</button>';
    } else {
      act += '<button type="button" class="btn btn--secondary btn--base" id="ss-d-again">Book again</button>';
    }
    $("ss-d-actions").innerHTML = act;
    $("ss-d-about").classList.toggle("is-hidden", !ABOUT[a.service]);
    $("ss-d-about-text").textContent = ABOUT[a.service] || "";
  }
  $("ss-appt-back").addEventListener("click", function () { renderAppts(); showView("appointments"); });
  $("ss-d-facts").addEventListener("click", function (e) {
    if (!e.target.closest("#ss-d-copy")) return;
    var ref = "#" + apptById(openId).ref;
    if (navigator.clipboard) navigator.clipboard.writeText(ref).catch(function () {});
    showToast("Reference " + ref + " copied");
  });
  $("ss-d-actions").addEventListener("click", function (e) {
    var a = apptById(openId);
    if (e.target.closest("#ss-d-checkin")) { checkIn(a); renderAppt(); }
    else if (e.target.closest("#ss-d-resched")) openPick(svcIndex(a.service), { dept: a.dept, reschedule: a.id });
    else if (e.target.closest("#ss-d-again")) openPick(svcIndex(a.service), { dept: a.dept });
    else if (e.target.closest("#ss-d-cancel")) {
      $("ss-cancel-text").textContent = a.service + " with " + a.advisor + ", " + whenShort(a) + ". The time goes back to other students.";
      $("ss-cancel-modal").showModal();
    }
  });

  // ---- cancel: AlertDialog — no backdrop dismiss, Escape blocked ----
  var cancelDlg = $("ss-cancel-modal");
  cancelDlg.addEventListener("cancel", function (e) { e.preventDefault(); });
  $("ss-cancel-keep").addEventListener("click", function () { cancelDlg.close(); });
  $("ss-cancel-confirm").addEventListener("click", function () {
    var a = apptById(openId);
    a.status = "cancelled";
    cancelDlg.close();
    showToast(a.service + " on " + whenShort(a) + " cancelled");
    apptTab = "upcoming";
    renderAppts();
    showView("appointments");
  });

  // ---- questions: Modal ----
  var qDlg = $("ss-q-modal");
  qDlg.addEventListener("click", function (e) { if (e.target === qDlg) qDlg.close(); });
  $("ss-d-q-open").addEventListener("click", function () {
    var a = apptById(openId);
    $("ss-q-intro").textContent = a.advisor + " asked these before your " + a.service + " appointment on " + whenShort(a) + ".";
    $("ss-q-fields").innerHTML = a.questions.map(function (q, i) {
      return '<label class="ss-q"><span class="ss-q__label">' + esc(q) + '</span><textarea class="ss-q__field" rows="3" placeholder="Your answer" data-q="' + i + '"></textarea></label>';
    }).join("");
    qDlg.showModal();
  });
  $("ss-q-cancel").addEventListener("click", function () { qDlg.close(); });
  $("ss-q-form").addEventListener("submit", function () {
    var a = apptById(openId);
    a.answered = true;
    showToast("Answers sent to " + a.advisor);
    renderAppt();
  });

  // ---------------- v6: drop-in queue / reserve (the queue page is next) ----------------
  function joinQueue(c) {
    var h = c.hours, pos = h.waiting + 1, dept = c.depts[0];
    QUEUE[c.key] = pos;
    showDone({
      title: "You\u2019re in line",
      text: "You\u2019re number " + pos + " for " + c.name + (h.waiting ? " — about " + h.waiting * PER_STUDENT + " minutes. " : " — you\u2019re next. ") + "Stay nearby: we\u2019ll let you know when an advisor is ready for you.",
      facts: [["Drop-in", esc(c.name)], ["Department", esc(dept)], ["Where", esc(LOCATIONS[dept])], ["Open until", fmtTime(h.until)]],
      actions: [{ label: "Done", primary: true, fn: function () { goSection(0); } }]
    });
  }
  function reserveSeat(c) {
    var h = c.hours, dept = c.depts[0];
    RESERVED[c.key] = true;
    showDone({
      title: "Seat reserved",
      text: "Your place for " + c.name + " is held for when drop-in opens at " + fmtTime(h.opens) + ". Check in at the desk by " + fmtTime(h.opens + 15) + " to keep it.",
      facts: [["Drop-in", esc(c.name)], ["Department", esc(dept)], ["Where", esc(LOCATIONS[dept])], ["Hours", "Today " + fmtTime(h.opens) + " – " + fmtTime(h.until)]],
      actions: [{ label: "Done", primary: true, fn: function () { goSection(0); } }]
    });
  }

  // ---------------- v6: workshops ----------------
  var DOW_PLURAL = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  var WS_FORMAT = { inPerson: { label: "In person", icon: ICONS.group }, video: { label: "Online", icon: ICONS.videocam } };
  function fmtDate(dt) { return DOW[dt.getDay()] + ", " + MON[dt.getMonth()] + " " + dt.getDate(); }
  function fmtRange(min, minutes) {
    var a = fmtTime(min), b = fmtTime(min + minutes);
    // "10:00 – 11:30 AM" when both ends share AM/PM
    return a.slice(-2) === b.slice(-2) ? a.slice(0, -3) + " – " + b : a + " – " + b;
  }
  var sessCache = {};
  function sessionsOf(sc) {
    if (sessCache[sc.id]) return sessCache[sc.id];
    var out = [], dt = new Date(sc.start + "T00:00:00");
    for (var guard = 0; out.length < sc.count && guard < 400; guard++) {
      for (var j = 0; j < sc.days.length; j++) if (sc.days[j][0] === dt.getDay()) out.push({ date: new Date(dt), min: sc.days[j][1] });
      dt = addDays(dt, 1);
    }
    return (sessCache[sc.id] = out);
  }
  // "Mon & Wed · 10:00 AM" when every day starts at the same time, else each
  // day with its own: "Tue 10:00 AM · Thu 2:00 PM · Sat 10:00 AM".
  function daysLabel(sc) {
    var same = sc.days.every(function (x) { return x[1] === sc.days[0][1]; });
    if (!same) return sc.days.map(function (x) { return DOW[x[0]] + " " + fmtTime(x[1]); }).join(" · ");
    var names = sc.days.map(function (x) { return DOW[x[0]]; });
    var joined = names.length === 1 ? DOW_PLURAL[sc.days[0][0]] : names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
    return joined + " · " + fmtTime(sc.days[0][1]);
  }
  function seatsLeftSchedule(sc) { return sc.seats - sc.taken; }
  function seatsLeftSession(sc, k) { return sc.seats - sc.takenBy[k]; }
  function wsFull(w) {
    if (w.mode === "single") { var sc = w.schedules[0]; return sc.takenBy.every(function (t) { return t >= sc.seats; }); }
    return w.schedules.every(function (sc) { return seatsLeftSchedule(sc) <= 0; });
  }
  function seatsText(n) { return n <= 0 ? "Full" : n + (n === 1 ? " seat left" : " seats left"); }
  // The catalogue line: the pattern, and when it starts.
  function wsPatternLabel(w) {
    var sc = w.schedules[0], first = sessionsOf(sc)[0];
    if (w.mode === "single") {
      if (sc.count === 1) return fmtDate(first.date) + " · " + fmtTime(first.min);
      return daysLabel(sc) + " · " + sc.count + " dates from " + MON[first.date.getMonth()] + " " + first.date.getDate();
    }
    if (w.schedules.length > 1) {
      var starts = w.schedules.map(function (x) { return sessionsOf(x)[0].date; }).sort(function (a, b) { return a - b; });
      return w.schedules.length + " schedules · from " + MON[starts[0].getMonth()] + " " + starts[0].getDate();
    }
    return daysLabel(sc) + " · " + sc.count + " sessions from " + MON[first.date.getMonth()] + " " + first.date.getDate();
  }
  function scheduleLocation(sc) { return sc.format === "video" ? "Online — the link arrives by email once you\u2019re registered" : sc.room; }

  var ws = { wi: 0, sched: null, sess: null, showAll: false };
  function openWorkshop(wi) {
    var w = WORKSHOPS[wi];
    ws.wi = wi; ws.showAll = false; ws.sess = null;
    // one schedule: nothing to choose; several: the student picks one
    ws.sched = w.mode === "single" || (w.schedules.length === 1 && seatsLeftSchedule(w.schedules[0]) > 0) ? 0 : null;
    if (w.mode === "single" && w.schedules[0].count === 1 && seatsLeftSession(w.schedules[0], 0) > 0) ws.sess = 0;
    renderWorkshop();
    showView("workshop");
  }
  on("ss-ws-back", "click", function () { goSection(0); });

  function wsOptionTile(name, value, checked, label, desc, left) {
    var full = left <= 0;
    return '<label class="choice-tile ss-ws-option"><input class="choice-tile__input" type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + (full ? " disabled" : "") + ">" +
      '<span class="choice-tile__box"><span class="choice-tile__text"><span class="choice-tile__label">' + esc(label) + '</span><span class="choice-tile__description">' + desc + "</span></span>" +
      '<span class="ss-ws-option__seats">' + (full ? vbadge("neutral", "Full") : esc(seatsText(left))) + "</span></span></label>";
  }
  function scheduleDesc(w, sc) {
    var first = sessionsOf(sc)[0];
    return esc(WS_FORMAT[sc.format].label + " · " + sc.organizer + " · " + sc.count + " sessions from " + fmtDate(first.date));
  }

  function renderWorkshop() {
    var w = WORKSHOPS[ws.wi], reg = WS_REG[w.id], full = wsFull(w), single = w.mode === "single";
    var sc = ws.sched === null ? null : w.schedules[ws.sched];
    $("ss-ws-name").textContent = w.name;
    $("ss-ws-badges").innerHTML = vbadge("teal", "Workshop") + (w.course ? '<span class="badge badge--base badge--outline badge--regular">' + esc(w.course) + "</span>" : "") + (reg ? vbadge("success", "Registered") : full ? vbadge("neutral", "Full") : "");
    $("ss-ws-meta").textContent = w.dept + " · " + w.minutes + "-minute sessions";
    $("ss-ws-about").textContent = w.about;

    // the note above the page: registered, or full
    var note = $("ss-ws-note");
    note.classList.toggle("is-hidden", !reg && !full);
    $("ss-ws-note-actions").innerHTML = "";
    if (reg) {
      var rsc = w.schedules[reg.sched];
      $("ss-ws-note-title").textContent = "You\u2019re registered.";
      $("ss-ws-note-text").textContent = single
        ? fmtDate(sessionsOf(rsc)[reg.sess].date) + " at " + fmtTime(sessionsOf(rsc)[reg.sess].min) + "."
        : daysLabel(rsc) + ", " + rsc.count + " sessions starting " + fmtDate(sessionsOf(rsc)[0].date) + ".";
    } else if (full) {
      $("ss-ws-note-title").textContent = "This workshop is full.";
      $("ss-ws-note-text").textContent = "Every seat is taken. We can email you if one opens up.";
      var done = !!wsNotified[w.id];
      $("ss-ws-note-actions").innerHTML = '<button class="btn btn--secondary btn--sm" type="button" id="ss-ws-notify"' + (done ? " disabled" : "") + ">" + (done ? "We\u2019ll let you know" : "Notify me when a seat opens") + "</button>";
    }

    // the choice
    var opts = $("ss-ws-options"), fixed = $("ss-ws-fixed"), hint = $("ss-ws-choose-hint"), title = $("ss-ws-choose-title");
    var sessions0 = sessionsOf(w.schedules[0]);
    var fixedOnly = reg || (single ? w.schedules[0].count === 1 : w.schedules.length === 1);
    opts.classList.toggle("is-hidden", fixedOnly);
    fixed.classList.toggle("is-hidden", !fixedOnly);
    hint.textContent = "";
    if (single) {
      title.textContent = fixedOnly ? "Date" : "Choose a date";
      if (!fixedOnly) {
        hint.textContent = "Every date is the same session";
        opts.innerHTML = sessions0.map(function (x, k) {
          return wsOptionTile("ss-ws-sess", k, ws.sess === k, fmtDate(x.date), esc(fmtRange(x.min, w.minutes)), seatsLeftSession(w.schedules[0], k));
        }).join("");
      } else {
        var k0 = reg ? reg.sess : 0, x0 = sessions0[k0];
        fixed.innerHTML = '<p class="ss-ws-fixed__label">' + esc(fmtDate(x0.date)) + '</p><p class="ss-ws-fixed__desc">' + esc(fmtRange(x0.min, w.minutes) + " · " + WS_FORMAT[w.schedules[0].format].label + " · " + w.schedules[0].organizer) + "</p>" +
          (reg ? "" : '<p class="ss-ws-fixed__desc">' + esc(seatsText(seatsLeftSession(w.schedules[0], k0))) + "</p>");
      }
    } else {
      title.textContent = fixedOnly ? "Schedule" : "Choose a schedule";
      if (!fixedOnly) {
        hint.textContent = "Same workshop on different days";
        opts.innerHTML = w.schedules.map(function (x, k) {
          return wsOptionTile("ss-ws-sched", k, ws.sched === k, daysLabel(x), scheduleDesc(w, x), seatsLeftSchedule(x));
        }).join("");
      } else {
        var fsc = w.schedules[reg ? reg.sched : 0];
        fixed.innerHTML = '<p class="ss-ws-fixed__label">' + esc(daysLabel(fsc)) + '</p><p class="ss-ws-fixed__desc">' + scheduleDesc(w, fsc) + "</p>" +
          (reg ? "" : '<p class="ss-ws-fixed__desc">' + esc(seatsText(seatsLeftSchedule(fsc))) + "</p>");
      }
    }

    // sessions of the chosen (or registered) schedule — series only
    var listSc = reg ? w.schedules[reg.sched] : sc;
    var showSessions = !single && !!listSc;
    $("ss-ws-sessions-step").classList.toggle("is-hidden", !showSessions);
    if (showSessions) {
      var all = sessionsOf(listSc), SHOW = 4;
      var shown = ws.showAll ? all : all.slice(0, SHOW);
      $("ss-ws-sessions-count").textContent = all.length + " sessions";
      $("ss-ws-sessions").innerHTML = shown.map(function (x, k) {
        return '<li class="ss-session"><span class="ss-session__num">' + (k + 1) + '</span><span class="ss-session__date">' + esc(fmtDate(x.date)) + '</span><span class="ss-session__time">' + esc(fmtRange(x.min, w.minutes)) + "</span></li>";
      }).join("");
      var more = $("ss-ws-more");
      more.classList.toggle("is-hidden", all.length <= SHOW);
      more.textContent = ws.showAll ? "Show fewer" : "Show all " + all.length + " sessions";
    }

    // summary card
    var useSc = listSc || (single ? w.schedules[0] : null);
    var facts = [];
    if (single) {
      var k = reg ? reg.sess : ws.sess;
      facts.push(["Date", k === null ? null : fmtDate(sessions0[k].date)]);
      facts.push(["Time", k === null ? null : fmtRange(sessions0[k].min, w.minutes)]);
    } else {
      facts.push(["Schedule", useSc ? daysLabel(useSc) : null]);
      facts.push(["Sessions", useSc ? String(useSc.count) : null]);
      facts.push(["Starts", useSc ? fmtDate(sessionsOf(useSc)[0].date) : null]);
    }
    facts.push(["Format", useSc ? WS_FORMAT[useSc.format].label : null]);
    facts.push(["Organizer", useSc ? useSc.organizer : null]);
    $("ss-ws-facts").innerHTML = facts.map(function (f) {
      return "<dt>" + f[0] + "</dt><dd" + (f[1] === null ? ' class="is-empty">' + (single ? "Choose a date" : "Choose a schedule") : ">" + esc(f[1])) + "</dd>";
    }).join("");
    $("ss-ws-location").textContent = useSc ? scheduleLocation(useSc) : w.schedules.some(function (x) { return x.format === "video"; }) && w.schedules.some(function (x) { return x.format === "inPerson"; }) ? "In person or online — depends on the schedule" : scheduleLocation(w.schedules[0]);

    var canRegister = !reg && !full && (single ? ws.sess !== null : !!sc);
    var label = single ? "Register" : sc ? "Register for all " + sc.count + " sessions" : "Register";
    ["ss-ws-register", "ss-ws-register-bar"].forEach(function (id) { $(id).disabled = !canRegister; $(id).textContent = label; });
    document.querySelector(".ss-ws-foot").classList.toggle("is-hidden", !!reg || full);
    $("ss-ws-bar").classList.toggle("is-hidden", !!reg || full);
  }
  var wsNotified = {};
  on("ss-ws-options", "change", function (e) {
    if (e.target.name === "ss-ws-sched") { ws.sched = +e.target.value; ws.showAll = false; }
    else ws.sess = +e.target.value;
    renderWorkshop();
  });
  on("ss-ws-more", "click", function () { ws.showAll = !ws.showAll; renderWorkshop(); });
  on("ss-ws-note-actions", "click", function (e) {
    if (!e.target.closest("#ss-ws-notify")) return;
    var w = WORKSHOPS[ws.wi];
    wsNotified[w.id] = true;
    showToast("We\u2019ll email you if a seat opens in " + w.name);
    renderWorkshop();
  });
  function registerWorkshop() {
    var w = WORKSHOPS[ws.wi], single = w.mode === "single", sc = w.schedules[single ? 0 : ws.sched];
    if (single) sc.takenBy[ws.sess]++; else sc.taken++;
    WS_REG[w.id] = { sched: single ? 0 : ws.sched, sess: single ? ws.sess : null };
    var first = single ? sessionsOf(sc)[ws.sess] : sessionsOf(sc)[0];
    var facts = single
      ? [["Date", esc(fmtDate(first.date))], ["Time", esc(fmtRange(first.min, w.minutes))]]
      : [["Schedule", esc(daysLabel(sc))], ["Sessions", sc.count + ", starting " + esc(fmtDate(first.date))]];
    facts.push(["Organizer", esc(sc.organizer)], ["Location", esc(scheduleLocation(sc))]);
    showDone({
      title: "You\u2019re registered",
      text: single
        ? w.name + " on " + fmtDate(first.date) + " at " + fmtTime(first.min) + ". We\u2019ll remind you the day before."
        : w.name + " — all " + sc.count + " sessions. The first is " + fmtDate(first.date) + " at " + fmtTime(first.min) + "; we\u2019ll remind you the day before each one.",
      facts: facts,
      actions: [
        { label: "Done", primary: true, fn: function () { goSection(0); } },
        { label: "View workshop", fn: function () { openWorkshop(ws.wi); } }
      ]
    });
  }
  on("ss-ws-register", "click", registerWorkshop);
  on("ss-ws-register-bar", "click", registerWorkshop);

  // ---------------- v6: done — the one screen every booking ends on ----------------
  var doneActions = [];
  function showDone(o) {
    $("ss-done-title").textContent = o.title;
    $("ss-done-text").textContent = o.text;
    $("ss-done-facts").innerHTML = o.facts.map(function (f) { return "<dt>" + f[0] + "</dt><dd>" + f[1] + "</dd>"; }).join("");
    doneActions = o.actions;
    $("ss-done-actions").innerHTML = o.actions.map(function (a, i) {
      return '<button type="button" class="btn ' + (a.primary ? "btn--primary" : "btn--secondary") + ' btn--base" data-done="' + i + '">' + esc(a.label) + "</button>";
    }).join("");
    showView("done");
  }
  if (V6) $("ss-done-actions").addEventListener("click", function (e) {
    var b = e.target.closest("[data-done]");
    if (b) doneActions[+b.dataset.done].fn();
  });

  updateUpcomingCount();
  renderBrowse();
})();`;
}

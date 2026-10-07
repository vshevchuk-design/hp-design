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
  // "list" (v1: rows in one Card).
  var LAYOUT = ${JSON.stringify(d.LAYOUT || "list")};
  // "hybrid" (v4) and "text" (v5): cards on a phone, list rows from 768 —
  // one markup, CSS switches the shape. Both list every department on the
  // item and choose one on the pick-a-time page.
  var PAGE_SIZE = 10;
  var DEPT_ON_PICK = LAYOUT === "hybrid" || LAYOUT === "text";
  var FORMATS = [
    { key: "inPerson", label: "In person", icon: ICONS.group },
    { key: "phone", label: "Phone", icon: ICONS.call },
    { key: "video", label: "Video", icon: ICONS.videocam }
  ];
  var DROP_BADGE = {
    none: '<span class="badge badge--neutral">By appointment</span>',
    open: '<span class="badge badge--success">Drop-in open until 10:00 PM</span>',
    available: '<span class="badge badge--primary">Drop-in available</span>'
  };

  // v4: base badges, regular weight; By appointment in the violet tag hue.
  var DROP_BADGE_V4 = {
    none: '<span class="badge badge--base badge--regular badge--violet">By appointment</span>',
    open: '<span class="badge badge--base badge--regular badge--success">Drop-in until 10:00 PM</span>',
    available: '<span class="badge badge--base badge--regular badge--primary">Drop-in available</span>'
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------------- shared Listbox popover ----------------
  var lb = $("ss-lb");
  var lbList = lb.querySelector(".listbox__list");
  var lbTrigger = null, lbOnPick = null, lbClosedAt = 0, lbClosedBy = null;
  lb.addEventListener("toggle", function (e) {
    if (e.newState === "closed") {
      if (lbTrigger) lbTrigger.setAttribute("aria-expanded", "false");
      lbClosedAt = Date.now(); lbClosedBy = lbTrigger;
    }
  });
  function openListbox(trigger, options, selected, onPick) {
    // A click on the same trigger that just light-dismissed the panel is a close.
    if (lbClosedBy === trigger && Date.now() - lbClosedAt < 250) return;
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
    if (i === 0) { showView("browse"); return; }
    $("ss-placeholder-text").textContent = sectionTabs[i].textContent + " — not designed yet";
    showView("placeholder");
  }
  sectionTabs.forEach(function (t, i) { t.addEventListener("click", function () { goSection(i); }); });

  // ---------------- browse ----------------
  var st = { q: "", dept: "", dropOnly: false, sort: "name", page: 0, rowDept: {} };
  var searchBox = $("ss-search"), searchInput = $("ss-search-input");
  searchInput.addEventListener("input", function () {
    st.q = searchInput.value.trim().toLowerCase();
    searchBox.classList.toggle("is-populated", !!searchInput.value);
    st.page = 0; renderBrowse();
  });
  $("ss-search-clear").addEventListener("click", function () {
    searchInput.value = ""; st.q = ""; searchBox.classList.remove("is-populated");
    st.page = 0; renderBrowse(); searchInput.focus();
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
  var dropChip = $("ss-drop-chip");
  dropChip.addEventListener("click", function () {
    st.dropOnly = !st.dropOnly;
    dropChip.setAttribute("aria-pressed", st.dropOnly ? "true" : "false");
    st.page = 0; renderBrowse();
  });

  var SORTS = [{ value: "name", label: "Name (A–Z)" }, { value: "duration", label: "Duration (shortest first)" }];
  var sortBtn = $("ss-sort");
  sortBtn.addEventListener("click", function () {
    openListbox(sortBtn, SORTS, st.sort, function (v) {
      st.sort = v;
      $("ss-sort-label").textContent = v === "name" ? "Name (A–Z)" : "Duration";
      renderBrowse();
    });
  });

  $("ss-clear-filters").addEventListener("click", function () {
    st.q = ""; st.dept = ""; st.dropOnly = false; st.page = 0;
    searchInput.value = ""; searchBox.classList.remove("is-populated");
    $("ss-dept-label").textContent = "Department";
    deptChip.classList.remove("chip--checked-outline");
    dropChip.setAttribute("aria-pressed", "false");
    renderBrowse();
  });

  function filtered() {
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

  function rowHtml(x) {
    var s = x.s, multi = s.depts.length > 1;
    var dept = multi
      ? '<button type="button" class="select" data-row-dept="' + x.i + '" aria-haspopup="listbox" aria-expanded="false" aria-label="Department for ' + esc(s.name) + '"><span class="select__stack"><span class="select__label">Department</span><span class="select__value" data-dept-value>' + esc(deptOf(x.i)) + "</span></span>" + ICONS.chevron + "</button>"
      : "";
    return '<div class="ss-svc">' +
      '<div class="ss-svc__main"><h3 class="ss-svc__name">' + esc(s.name) + "</h3>" +
      '<div class="ss-svc__meta"><span>' + s.minutes + " min</span>" + (multi ? "" : "<span>·</span><span>" + esc(s.depts[0]) + "</span>") + DROP_BADGE[s.drop] + "</div></div>" +
      '<div class="ss-svc__aside">' + dept + '<button type="button" class="btn btn--secondary btn--base" data-pick="' + x.i + '">Pick a time</button></div>' +
      "</div>";
  }
  // v4 item — a card on a phone, a list row from 768 (CSS decides). Duration,
  // booking mode and every department share one wrapping line: they fill the
  // line while they fit and carry on to the next, all of them shown.
  function itemHtml(x) {
    var s = x.s, depts = s.depts.slice(), at = st.dept ? depts.indexOf(st.dept) : -1;
    if (at > 0) { depts.splice(at, 1); depts.unshift(st.dept); }
    return '<article class="ss-item">' +
      '<div class="ss-item__main"><h3 class="ss-item__name">' + esc(s.name) + "</h3>" +
      '<div class="ss-item__line"><span class="ss-fact">' + ICONS.schedule + '<span class="ss-fact__text">' + s.minutes + " min</span></span>" + DROP_BADGE_V4[s.drop] +
      depts.map(function (d) { return '<span class="badge badge--base badge--outline badge--regular">' + esc(d) + "</span>"; }).join("") +
      "</div></div>" +
      '<button type="button" class="btn btn--tint btn--base ss-item__cta" data-pick="' + x.i + '">Pick a time</button>' +
      "</article>";
  }
  // v5 item — same shell as v4, but the departments are plain text, comma-
  // separated, right under the name; duration + booking mode on the line below.
  function textItemHtml(x) {
    var s = x.s, depts = s.depts.slice(), at = st.dept ? depts.indexOf(st.dept) : -1;
    if (at > 0) { depts.splice(at, 1); depts.unshift(st.dept); }
    return '<article class="ss-item ss-item--text">' +
      '<div class="ss-item__main"><h3 class="ss-item__name">' + esc(s.name) + "</h3>" +
      '<p class="ss-item__depts">' + esc(depts.join(", ")) + "</p>" +
      '<div class="ss-item__line"><span class="ss-fact">' + ICONS.schedule + '<span class="ss-fact__text">' + s.minutes + " min</span></span>" + DROP_BADGE_V4[s.drop] + "</div></div>" +
      '<button type="button" class="btn btn--tint btn--base ss-item__cta" data-pick="' + x.i + '">Pick a time</button>' +
      "</article>";
  }

  function renderBrowse() {
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (st.page >= pages) st.page = pages - 1;
    var from = st.page * PAGE_SIZE, slice = list.slice(from, from + PAGE_SIZE);
    var any = list.length > 0;
    $("ss-results").classList.toggle("is-hidden", !any);
    $("ss-empty").classList.toggle("is-hidden", any);
    $("ss-list").innerHTML = slice.map(LAYOUT === "hybrid" ? itemHtml : LAYOUT === "text" ? textItemHtml : rowHtml).join("");
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
    if (pick) openPick(+pick.dataset.pick);
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
  function openPick(si) {
    pk.si = si; pk.week = 0; pk.tod = "any"; pk.day = null; pk.slot = null; pk.advisor = null;
    var s = SERVICES[si];
    // v3 chooses the department here. It arrives pre-set when the browse
    // filter already named one this service has (or when there is only one);
    // otherwise the student picks it before any times show.
    var choose = DEPT_ON_PICK && s.depts.length > 1;
    if (DEPT_ON_PICK) pk.dept = s.depts.length === 1 ? s.depts[0] : s.depts.indexOf(st.dept) !== -1 ? st.dept : null;
    else pk.dept = deptOf(si);
    $("ss-pick-title").textContent = s.name;
    $("ss-pick-meta").textContent = s.minutes + " minutes" + (choose ? "" : " · " + pk.dept);
    $("ss-pick-dept").classList.toggle("is-hidden", !choose);
    showView("pick");
    renderPick();
  }
  $("ss-back").addEventListener("click", function () { showView("browse"); });
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
      $("ss-summary").classList.add("is-hidden");
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
    // Nothing to book this week, so nothing to summarise.
    $("ss-summary").classList.toggle("is-hidden", empty);
    if (empty) {
      var s = SERVICES[pk.si];
      $("ss-dropins").classList.toggle("is-hidden", s.drop === "none");
      var nb = $("ss-notify"), done = !!pk.notified[pk.si];
      nb.disabled = done;
      nb.querySelector("span").textContent = done ? "We'll let you know" : "Notify me when a spot opens";
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

  function renderSummary() {
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
    $("ss-advisor-group").classList.toggle("is-hidden", !pk.slot);
    $("ss-advisor-hint").classList.toggle("is-hidden", !!pk.slot);
    if (pk.slot) {
      adv.innerHTML = pk.slot.advisors.map(function (a, i) {
        return '<label class="radio"><input class="radio__input" type="radio" name="ss-advisor" value="' + esc(a) + '"' + (a === pk.advisor ? " checked" : "") + '><span class="radio__circle"></span><span class="radio__text">' + esc(a) + (i === 0 ? ' <span class="badge badge--primary">Recommended</span>' : "") + "</span></label>";
      }).join("");
    }
    var dept = pk.dept;
    $("ss-sum-dept").textContent = dept;
    $("ss-sum-location").textContent = LOCATIONS[dept];
    $("ss-sum-formats").textContent = pk.slot
      ? pk.slot.formats.map(function (k) { return FORMATS.filter(function (y) { return y.key === k; })[0].label; }).join(" · ")
      : "In person, phone or video — depends on the time";
    $("ss-confirm").disabled = !pk.slot;
  }
  $("ss-advisors").addEventListener("change", function (e) { pk.advisor = e.target.value; });
  $("ss-confirm").addEventListener("click", function () {
    if (!pk.slot) return;
    var dt = weekDays(pk.week)[pk.day];
    booked[pk.slot.id] = true;
    showToast("Booked: " + SERVICES[pk.si].name + ", " + DOW[dt.getDay()] + " " + MON[dt.getMonth()] + " " + dt.getDate() + " at " + fmtTime(pk.slot.min) + " with " + pk.advisor);
    pk.slot = null; pk.advisor = null;
    renderPick();
  });
  $("ss-notify").addEventListener("click", function () {
    pk.notified[pk.si] = true;
    showToast("We'll email you when a time opens for " + SERVICES[pk.si].name);
    renderPick();
  });
  $("ss-dropins").addEventListener("click", function () { goSection(2); });

  renderBrowse();
})();`;
}

// Markup for the Explore Degrees prototype — the static skeleton of all five
// screens. Anything that depends on what the user picked (combo chips, school
// blocks, the class table, both result tabs) is rendered by ed-app.mjs into the
// containers this file lays out.
import { PROGRAMS, TERM_YEARS, NEXT_INTAKE, SCHOOL, kindOf } from "./ed-data.mjs";

const STEPS = [
  { n: 1, label: "Study" },
  { n: 2, label: "Start" },
  { n: 3, label: "Credits" },
  { n: 4, label: "Review" },
];

/** @param h { esc, icon, initialsOf, hueOf } */
export function edMarkup(h) {
  const { esc, icon, initialsOf, hueOf } = h;

  const stepper = `<div class="stepper" id="ed-stepper" role="list" aria-label="Progress">
${STEPS.map(
  (s, i) => `      <div class="stepper__step" role="listitem" data-step="${s.n}">
        <span class="stepper__circle"><span>${s.n}</span>${icon("check", "")}</span>
        <span class="stepper__label">${s.label}</span>
      </div>${i < STEPS.length - 1 ? `\n      <span class="stepper__connector" data-after="${s.n}"></span>` : ""}`
).join("\n")}
    </div>`;

  const programTile = (p) => `<label class="choice-tile" data-program="${esc(p.name)}">
        <input class="choice-tile__input" type="radio" name="ed-program" value="${esc(p.name)}" />
        <span class="choice-tile__box">
          <span class="choice-tile__marker ed-hue--${hueOf(p.name)}">${initialsOf(p.name)}</span>
          <span class="choice-tile__text"><span class="choice-tile__label">${esc(p.name)}</span></span>
        </span>
      </label>`;

  const termTile = (year, hue, term) => {
    const label = `${year} ${term}`;
    return `<label class="choice-tile">
        <input class="choice-tile__input" type="radio" name="ed-term" value="${esc(label)}" />
        <span class="choice-tile__box">
          <span class="choice-tile__marker ed-hue--${hue}">${String(year).slice(2)}</span>
          <span class="choice-tile__text"><span class="choice-tile__label">${esc(label)}</span>${label === NEXT_INTAKE ? `<span class="choice-tile__description">Next intake</span>` : ""}</span>
        </span>
      </label>`;
  };

  const credit = (value, label, desc, mark, hueClass) => `<label class="choice-tile">
        <input class="choice-tile__input" type="radio" name="ed-credits" value="${value}" />
        <span class="choice-tile__box">
          <span class="choice-tile__marker ${hueClass}">${mark}</span>
          <span class="choice-tile__text"><span class="choice-tile__label">${esc(label)}</span><span class="choice-tile__description">${esc(desc)}</span></span>
        </span>
      </label>`;

  return `<div class="ed">
  <header class="ed__topbar">
    <span class="ed__brand"><span class="ed__brand-name">Explore Your Degree</span><span class="ed__brand-school">· ${esc(SCHOOL)}</span></span>
    <span class="ed__noaccount">No account needed</span>
  </header>
  <main class="ed__main">
    ${stepper}

    <!-- ============ step 1 · what do you want to study ============ -->
    <section class="ed__step is-active" data-panel="1">
      <div class="ed__head">
        <h1 class="ed__title">What do you want to study?</h1>
        <p class="ed__sub">Pick anything — you can change it later. Not sure? Browse by what sounds interesting.</p>
      </div>
      <div class="card"><div class="card__body">
        <div class="ed-section">
          <div class="ed-row">
            <span class="badge badge--neutral">School: ${esc(SCHOOL)}</span>
            <button class="ed-link" type="button">Change</button>
          </div>
          <div class="search">${icon("search", "search__icon")}<input class="search__input" id="ed-program-search" type="search" placeholder="Search majors: try &ldquo;computer&rdquo; or &ldquo;bio&rdquo;" aria-label="Search majors" /></div>
          <div class="ed-scroll">
            <div class="ed-grid" id="ed-program-grid">
      ${PROGRAMS.map(programTile).join("\n      ")}
            </div>
            <div class="empty-state is-hidden" id="ed-program-empty"><span class="empty-state__text">No majors match that search</span></div>
          </div>
        </div>

        <!-- revealed once a program is picked -->
        <div class="ed-section is-hidden" id="ed-pick-section">
          <div id="ed-pick-tile"></div>
          <div class="is-hidden" id="ed-focus-block">
            <div class="ed-section__title">Want to focus it? (optional)</div>
            <p class="ed-section__hint">This major offers focus areas. Pick one if you already know, or skip and decide later.</p>
            <div class="ed-grid" id="ed-focus-grid"></div>
          </div>
          <div class="ed-section__title">Build your program combo (optional)</div>
          <p class="ed-section__hint">Stack more majors or minors and we'll check them all in one go.</p>
          <div class="ed-row" id="ed-combo-chips"></div>
          <button class="select select--base select--block" id="ed-combo-trigger" type="button" popovertarget="ed-combo-lb" aria-haspopup="listbox">
            <span class="select__value is-placeholder">Add a major or minor</span>
            ${icon("expand_more", "select__chevron")}
          </button>
          <div class="listbox" id="ed-combo-lb" popover>
            <div class="listbox__search-wrap">
              <div class="search">${icon("search", "search__icon")}<input class="search__input" id="ed-combo-search" type="search" placeholder="Search majors and minors…" aria-label="Search majors and minors" /></div>
            </div>
            <ul class="listbox__list" id="ed-combo-list" role="listbox" aria-label="Add a major or minor"></ul>
          </div>
        </div>
      </div></div>
      <div class="ed__footer ed__footer--end">
        <button class="btn btn--primary btn--base" id="ed-next-1" type="button" disabled>Continue</button>
      </div>
    </section>

    <!-- ============ step 2 · when would you like to start ============ -->
    <section class="ed__step" data-panel="2">
      <div class="ed__head">
        <h1 class="ed__title">When would you like to start?</h1>
        <p class="ed__sub">Most new students start with the next available term. A guess is fine.</p>
      </div>
      <div class="card"><div class="card__body">
${TERM_YEARS.map(
  (y) => `        <div class="ed-section">
          <div class="ed-eyebrow">${y.year}</div>
          <div class="ed-grid">
      ${y.terms.map((t) => termTile(y.year, y.hue, t)).join("\n      ")}
          </div>
        </div>`
).join("\n")}
        <div class="ed-section">
          <button class="btn btn--secondary btn--base btn--block" id="ed-term-unsure" type="button">I'm not sure yet, use ${esc(NEXT_INTAKE)}</button>
        </div>
      </div></div>
      <div class="ed__footer">
        <button class="btn btn--secondary btn--base" data-back="1" type="button">Back</button>
        <button class="btn btn--primary btn--base" id="ed-next-2" type="button" disabled>Continue</button>
      </div>
    </section>

    <!-- ============ step 3 · have you taken any college classes ============ -->
    <section class="ed__step" data-panel="3">
      <div class="ed__head">
        <h1 class="ed__title">Have you taken any college classes before?</h1>
        <p class="ed__sub">AP tests, dual-enrollment and community-college classes all count toward your degree.</p>
      </div>
      <div class="card"><div class="card__body">
        <div class="ed-section">
          <div class="ed-grid">
      ${credit("yes", "Yes, I have credits", "We'll match them to requirements", icon("check", ""), "ed-mark--yes")}
      ${credit("no", "No, starting fresh", "Straight to your results", icon("remove", ""), "ed-mark--no")}
          </div>
        </div>
        <div class="is-hidden" id="ed-schools-block">
          <div id="ed-schools"></div>
          <div class="ed-section">
            <button class="btn btn--secondary btn--base" id="ed-add-school" type="button">${icon("add", "btn__icon")}Add another school</button>
            <p class="ed-note">We'll check these against each school's transfer rules when you run your results. This is an estimate to help you plan, not an official award of transfer credit.</p>
          </div>
        </div>
      </div></div>
      <div class="ed__footer">
        <button class="btn btn--secondary btn--base" data-back="2" type="button">Back</button>
        <button class="btn btn--primary btn--base" id="ed-next-3" type="button" disabled>Continue</button>
      </div>
    </section>

    <!-- ============ step 4 · review ============ -->
    <section class="ed__step" data-panel="4">
      <div class="ed__head">
        <h1 class="ed__title">Review your choices</h1>
        <p class="ed__sub">Make sure everything looks right, then we'll build your personalized results.</p>
      </div>
      <div class="card"><div class="card__body">
        <div id="ed-review"></div>
        <div class="ed-section">
          <div class="ed-section__title">One quick check to make sure you're human</div>
          <label class="ed-captcha" id="ed-captcha-review">
            <span class="ed-captcha__box">${icon("check", "")}</span>
            <span>I'm not a robot</span>
            <span class="ed-captcha__brand">reCAPTCHA</span>
          </label>
        </div>
      </div></div>
      <div class="ed__footer">
        <button class="btn btn--secondary btn--base" data-back="3" type="button">Back</button>
        <button class="btn btn--primary btn--base" id="ed-build" type="button" disabled>Build my roadmap</button>
      </div>
    </section>

    <!-- ============ step 5 · results ============ -->
    <section class="ed__step" data-panel="5">
      <label class="ed-scaffold">
        <input type="checkbox" id="ed-planner-toggle" checked />
        <span>Prototype switch: this school has a Degree Planner product</span>
      </label>
      <div class="ed__head">
        <h1 class="ed__title">Your results</h1>
      </div>
      <div class="card"><div class="card__body">
        <div class="ed-row" style="justify-content: space-between; align-items: flex-start">
          <div class="ed-tcredit__col">
            <span class="card__title" id="ed-res-headline">Your results</span>
            <span class="ed-tcredit__meta" id="ed-res-subline"></span>
          </div>
          <div class="ed-res__actions" id="ed-res-actions"></div>
        </div>
        <div class="ed-res__pills" id="ed-res-pills"></div>
        <span class="progress progress--base" role="progressbar" id="ed-res-progress" aria-valuemin="0" aria-valuemax="100"><span class="progress__bar" style="width:0%"></span></span>
      </div></div>
      <div id="ed-res-fallback"></div>
      <div class="ed-tabs" id="ed-res-tabs" role="tablist">
        <button class="ed-tab is-active" data-tab="credits" role="tab" aria-selected="true" type="button">Your transfer credits</button>
        <button class="ed-tab" data-tab="reqs" role="tab" aria-selected="false" type="button">Degree requirements</button>
      </div>
      <div class="ed-tabpanel is-active" data-tabpanel="credits" id="ed-panel-credits"></div>
      <div class="ed-tabpanel" data-tabpanel="reqs" id="ed-panel-reqs"></div>
      <div class="card"><div class="card__body">
        <div class="ed-section__title">Ready for the next step?</div>
        <p class="ed-section__hint">Talk it through with the school's admissions team when you're ready to apply, or explore another area of study to compare first.</p>
        <div class="ed-res__actions"><button class="btn btn--secondary btn--base" id="ed-try-another" type="button">Try another major</button></div>
      </div></div>
      <div class="ed__footer">
        <button class="btn btn--secondary btn--base" data-back="4" type="button">Back</button>
      </div>
    </section>
  </main>

  <div class="ed-veil" id="ed-veil" role="status" aria-live="polite">
    <span class="spinner spinner--lg"></span>
    <span class="ed-veil__title">Checking your classes…</span>
    <span class="ed-veil__hint">This usually takes a minute or two. Please keep this page open.</span>
    <span class="progress progress--sm progress--indeterminate ed-veil__bar" role="progressbar" aria-label="Working"><span class="progress__bar"></span></span>
  </div>
</div>`;
}

/** Per-school block — rendered by the app, kept here so all markup lives together. */
export function edSchoolBlockTemplate(h) {
  const { icon } = h;
  return `<div class="ed-section" data-school-block="__ID__">
  <div class="ed-row" style="justify-content: space-between">
    <span class="ed-section__title">Previous school</span>
    <button class="btn btn--ghost btn--sm btn--icon-only" data-remove-school="__ID__" type="button" aria-label="Remove this school">${icon("delete", "btn__icon")}</button>
  </div>
  <button class="select select--base select--block" data-school-select="__ID__" type="button" popovertarget="ed-school-lb-__ID__" aria-haspopup="listbox">
    <span class="select__value is-placeholder">Select the school you attended</span>
    ${icon("expand_more", "select__chevron")}
  </button>
  <div class="listbox" id="ed-school-lb-__ID__" popover>
    <ul class="listbox__list" role="listbox" aria-label="School you attended">__SCHOOL_OPTIONS__</ul>
  </div>
  <p class="ed-note">Don't see your school? We don't have automatic transfer rules for it yet, but an advisor will evaluate those credits with you personally.</p>

  <div class="is-hidden" data-school-body="__ID__">
    <div class="ed-section">
      <div class="ed-section__title">${icon("auto_awesome", "btn__icon")} Scan your transcript</div>
      <p class="ed-section__hint">Upload a PDF or photo of your transcript and we'll fill in your classes for you. You can edit or remove anything afterward. This is optional.</p>
      <div data-scan-idle="__ID__">
        <div class="ed-row">
          <button class="btn btn--secondary btn--base" data-choose-file="__ID__" type="button">${icon("cloud_upload", "btn__icon")}Choose file</button>
          <span class="ed-note" data-file-name="__ID__">PDF or image, up to 10 MB</span>
        </div>
        <div class="ed-row" style="margin-top: 12px">
          <label class="ed-captcha" data-scan-captcha="__ID__">
            <span class="ed-captcha__box">${icon("check", "")}</span>
            <span>I'm not a robot</span>
            <span class="ed-captcha__brand">reCAPTCHA</span>
          </label>
        </div>
        <div class="ed-row" style="margin-top: 12px">
          <button class="btn btn--primary btn--base" data-scan-go="__ID__" type="button" disabled>Scan transcript</button>
        </div>
      </div>
      <div class="is-hidden" data-scan-reading="__ID__">
        <span class="ed-course"><span class="spinner spinner--sm"></span> Reading your transcript…</span>
      </div>
      <div class="is-hidden" data-scan-result="__ID__"></div>
    </div>

    <div class="ed-section">
      <div class="ed-section__title">Add the classes you took</div>
      <p class="ed-section__hint">Search this school's classes and tap each one you took — we fill in the rest.</p>
      <div class="search">${icon("search", "search__icon")}<input class="search__input" data-class-search="__ID__" type="search" placeholder="Search your classes: try &ldquo;bio&rdquo; or a course number" aria-label="Search classes" /></div>
      <ul class="listbox__list is-hidden" data-class-results="__ID__" style="max-height: 220px"></ul>
      <div data-classes="__ID__"></div>
    </div>
  </div>
</div>`;
}

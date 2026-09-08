// Data for the Explore Degrees prototype (docs/designs/explore-degrees-app.html).
// Pure content — no tokens, no DOM. Split out of the builder because the wizard
// carries five screens' worth of fixtures and mixing them into the CSS/markup
// file made both unreadable.
//
// Content is taken from the reference screens (the live app for steps 1–3, demo
// video frames for the results). Two deliberate departures, both because the
// reference's own data is internally inconsistent and our version shouldn't
// look broken:
//   · the reference lists a "3031 Spring" term — clearly a typo for 2031, and
//     replicating a typo isn't replicating UX;
//   · its requirement groups say "2 of 6 covered" above eight rows. Here the
//     counts are COMPUTED from the rows (see coveredOf), so a group can never
//     contradict itself.

/** A program's kind is derivable from its name — no need to store it twice. */
export const kindOf = (name) => (/minor/i.test(name) ? "Minor" : "Major");

// Step 1. ~27 programs, the reference's own list. `focus` exists on exactly one
// (Psychology) because that's the branch the video demonstrates: focus areas
// appear only for majors that have them.
export const PROGRAMS = [
  { name: "A B C", degree: "Liberal Arts Undergraduate" },
  { name: "Accounting", degree: "Liberal Arts Undergraduate" },
  { name: "Accounting AA", degree: "Associate of Arts" },
  { name: "Accounting AB", degree: "Liberal Arts Undergraduate" },
  { name: "Art (BFA)", degree: "Fine Arts Undergraduate" },
  { name: "Art History (BFA)", degree: "Fine Arts Undergraduate" },
  { name: "Art History Minor", degree: "Liberal Arts Undergraduate" },
  { name: "Auto Technology", degree: "Associate of Science" },
  { name: "Baking and Pastry Arts", degree: "Associate of Arts" },
  { name: "Biology (BS)", degree: "Liberal Arts Undergraduate" },
  { name: "Business Administration", degree: "Associate of Arts" },
  { name: "Business Management", degree: "Liberal Arts Undergraduate" },
  { name: "Chemical Engineering (BE)", degree: "Engineering Undergraduate" },
  { name: "Chemistry (BS)", degree: "Liberal Arts Undergraduate" },
  { name: "Classics Minor", degree: "Liberal Arts Undergraduate" },
  { name: "Communication Technology", degree: "Associate of Science" },
  { name: "Computer Science", degree: "Liberal Arts Undergraduate" },
  { name: "Computer Science Minor", degree: "Liberal Arts Undergraduate" },
  { name: "Economics", degree: "Liberal Arts Undergraduate" },
  { name: "English (BA)", degree: "Liberal Arts Undergraduate" },
  { name: "English Minor", degree: "Liberal Arts Undergraduate" },
  { name: "Journalism BA", degree: "Liberal Arts Undergraduate" },
  { name: "Mathematics (BA)", degree: "Liberal Arts Undergraduate" },
  { name: "Physics", degree: "Liberal Arts Undergraduate" },
  { name: "Political Science", degree: "Liberal Arts Undergraduate" },
  {
    name: "Psychology",
    degree: "Liberal Arts Undergraduate",
    focus: ["Bio-Psychology", "Developmental Psychology"],
  },
  { name: "Sociology", degree: "Liberal Arts Undergraduate" },
  { name: "Statistics", degree: "Liberal Arts Undergraduate" },
  { name: "Undeclared Undergraduate", degree: "Liberal Arts Undergraduate" },
];

// Step 2. Years carry their own hue so thirteen tiles don't read as thirteen
// identical blue blocks — the user's one complaint about this step, fixed
// without changing its UX. The first term is the next intake.
export const TERM_YEARS = [
  { year: 2027, hue: "blue", terms: ["Spring", "Summer", "Fall"] },
  { year: 2028, hue: "teal", terms: ["Spring", "Summer", "Fall"] },
  { year: 2029, hue: "violet", terms: ["Spring", "Summer", "Fall"] },
  { year: 2030, hue: "amber", terms: ["Spring", "Summer", "Fall"] },
  { year: 2031, hue: "green", terms: ["Spring"] },
];
export const NEXT_INTAKE = "2027 Spring";

// Step 3.
export const PREV_SCHOOLS = [
  "Bainbridge Junior College",
  "Long Beach City College",
  "Riverside Community College",
];

/** The searchable class catalogue for a previous school. */
export const CATALOG = [
  { code: "ENGL 1101", title: "English Composition I", units: 3 },
  { code: "ENGL 1102", title: "English Composition II", units: 3 },
  { code: "MATH 1111", title: "College Algebra", units: 3 },
  { code: "PSYC 1101", title: "Introduction to Psychology", units: 3 },
  { code: "PSYC 1500", title: "Theory of Personality", units: 3 },
  { code: "HIST 2111", title: "US History I", units: 3 },
  { code: "COMM 1100", title: "Human Communication", units: 3 },
  { code: "BIOL 1107", title: "Principles of Biology I", units: 3 },
  { code: "BIOL 1107L", title: "Biology Lab I", units: 1 },
  { code: "ECON 2105", title: "Macroeconomics", units: 3 },
  { code: "CSCI 1301", title: "Computer Science I", units: 4 },
  { code: "SOCI 1101", title: "Introduction to Sociology", units: 3 },
  { code: "PHED 1010", title: "Basketball", units: 1 },
];

/** What the AI transcript scan reports it found — the reference's own ten. */
export const SCANNED_CLASSES = [
  { code: "ENGL 1101", term: "Fall", year: 2025, units: 3, grade: "A" },
  { code: "MATH 1111", term: "Fall", year: 2025, units: 3, grade: "B" },
  { code: "PSYC 1101", term: "Fall", year: 2025, units: 3, grade: "A" },
  { code: "HIST 2111", term: "Fall", year: 2025, units: 3, grade: "B" },
  { code: "COMM 1100", term: "Fall", year: 2025, units: 3, grade: "A" },
  { code: "ENGL 1102", term: "Spring", year: 2026, units: 3, grade: "A" },
  { code: "BIOL 1107", term: "Spring", year: 2026, units: 3, grade: "B" },
  { code: "BIOL 1107L", term: "Spring", year: 2026, units: 1, grade: "A" },
  { code: "ECON 2105", term: "Spring", year: 2026, units: 3, grade: "B" },
  { code: "CSCI 1301", term: "Spring", year: 2026, units: 4, grade: "A" },
];

export const TERM_OPTIONS = ["Fall", "Spring", "Summer"];
export const GRADE_OPTIONS = ["A", "B", "C", "D", "P"];

/** The AI reader's rejection, quoted from the reference — it names what the
 *  file actually was, which is the whole reason that screen is worth having. */
export const SCAN_ERROR =
  "This is a photograph of a house and pool, not a transcript — it contains no coursework, grades, or academic information. Please upload an official or unofficial transcript from your student portal.";

// Step 5 (results). Three statuses, not two: the reference's "We'll Evaluate It"
// is a real third state for classes with no transfer rule yet. `took` is an
// array because the mapping can be many→one, and the equated units can differ
// from what was taken (BIOL 11: 4 units in, 3.5 out).
export const TRANSFER_RESULTS = [
  { status: "accepted", took: [{ code: "HIST 10", units: 3, grade: "B" }, { code: "HIST 11", units: 3, grade: "A" }], equates: { code: "HISTORY 120", title: "American History", units: 3 } },
  { status: "accepted", took: [{ code: "PSYC 15", units: 3, grade: "B" }], equates: { code: "PSYCH 120", title: "Psychopathology", units: 3 } },
  { status: "accepted", took: [{ code: "PSYC 11", units: 3, grade: "A" }], equates: { code: "PSYCH 210", title: "Theories of Personality", units: 3 } },
  { status: "accepted", took: [{ code: "MATH 15", units: 4, grade: "A" }], equates: { code: "MATH 111", title: "Calculus I for Engineers", units: 3 } },
  { status: "accepted", took: [{ code: "ENGL 14", units: 3, grade: "B" }], equates: { code: "ENGLCOMP 200", title: "English Composition II (C1)", units: 3 } },
  { status: "accepted", took: [{ code: "ENGL 12", units: 3, grade: "A" }], equates: { code: "ENGLCOMP 100", title: "English Composition I", units: 3 } },
  { status: "accepted", took: [{ code: "ECON 10", units: 3, grade: "B" }], equates: { code: "ECON 140", title: "Principles of Economics", units: 3 } },
  { status: "accepted", took: [{ code: "BIOL 11", units: 4, grade: "B" }], equates: { code: "BIOLOGY 100", title: "General Biology I", units: 3.5 } },
  { status: "accepted", took: [{ code: "PSYC 10", units: 3, grade: "A" }], equates: { code: "PSYCH 100", title: "Intro to Psychology", units: 3 } },
  { status: "review", took: [{ code: "SOC 10", units: 3, grade: "B" }], equates: { code: "SOC 100", title: "Introduction to Sociology", units: 3 } },
  { status: "review", took: [{ code: "PSYC 12", units: 3, grade: "B" }], equates: { code: "PSYCH 205", title: "Developmental Psychology", units: 3 } },
  { status: "review", took: [{ code: "MATH 11", units: 3, grade: "C" }], equates: { code: "MATH 105", title: "Quantitative Reasoning", units: 3 } },
  { status: "review", took: [{ code: "HIST 12", units: 3, grade: "B" }], equates: { code: "HISTORY 121", title: "American History II", units: 3 } },
  { status: "evaluate", took: [{ code: "COUNS 1", units: 1, grade: "A" }], equates: null },
  { status: "evaluate", took: [{ code: "ETHST 1", units: 3, grade: "A" }], equates: null },
  { status: "evaluate", took: [{ code: "PHIL 6", units: 3, grade: "A" }], equates: null },
  { status: "evaluate", took: [{ code: "STAT C1000", units: 4, grade: "A" }], equates: null },
  { status: "evaluate", took: [{ code: "PSYCH 11", units: 3, grade: "A" }], equates: null },
  { status: "evaluate", took: [{ code: "PHED 23", units: 4.5, grade: "B" }], equates: null },
];

/** Copy per status — the label, the tint role, and the sentence under a row. */
export const STATUS_COPY = {
  accepted: { label: "Accepted", role: "success", note: "These classes transfer." },
  review: {
    label: "Needs a quick review",
    role: "warning",
    note: "Good news: this class should transfer. It just needs a quick review by an advisor to confirm.",
  },
  evaluate: {
    label: "We'll evaluate it",
    role: "info",
    note: "We don't have an automatic rule for this class yet, so an advisor will evaluate it for you.",
  },
};

// Degree Requirements. `covered` drives both the row's own state and the
// group's count, so the two can't disagree. Rows without `covered` are
// sub-options inside a requirement — the reference has those, and they show
// neither a status icon nor a state label.
export const REQUIREMENT_GROUPS = [
  { title: "Limits (TXFRP and PE)", code: "1900 #149", rows: [] },
  {
    title: "LAU GE Distribution",
    code: "F25 000115",
    rows: [
      { title: "Social Science Courses", covered: true },
      { title: "Life Science", covered: true, classes: [{ code: "BIOLOGY 100", title: "General Biology I", units: 3.5, from: "Long Beach City College" }] },
      { title: "Physical Science", covered: false },
      { title: "Lab Requirements", covered: false },
      { title: "Lit and Arts", covered: false },
      { title: "Non-western Culture", covered: false },
      { title: "American Life", covered: false },
      { title: "LAU Math Requirement", covered: true, classes: [{ code: "MATH 111", title: "Calculus I for Engineers", units: 3, from: "Long Beach City College" }] },
    ],
  },
  {
    title: "Undergraduate Requirements",
    rows: [
      { title: "Minimum Credit Required for Graduation", covered: true },
      { title: "Minimum GPA of 2.00", covered: true },
      { title: "Diversity", covered: false },
      { title: "Expository Writing", covered: true, classes: [{ code: "ENGLCOMP 100", title: "English Composition I", units: 3, from: "Long Beach City College" }] },
      { title: "Verify Writing Portfolio", covered: false },
      { title: "First Year Experience", covered: false },
      { title: "US History — HISTORY 120", covered: true, classes: [{ code: "HISTORY 120", title: "American History", units: 3, from: "Long Beach City College" }] },
      { title: "US Constitution — POL SCI 1", covered: false },
      { title: "Second Language (2 proficiencies required)", covered: false },
    ],
  },
  {
    title: "Psychology Requirements",
    code: "2015 #116",
    rows: [
      { title: "Psych Stats", covered: false },
      { title: "PSYCH 101 Introduction to Psychology", covered: false },
      { title: "PSY 190 — Introduction to Research and Statistics in Psychology", covered: false },
      { title: "PSY 393 Introduction to Development Psychology", covered: false },
      { title: "PSY 390 Intermediate Research Methods and Biobehavioral Statistics" },
      { title: "Psych 100 Level Elective" },
      { title: "Psych electives", covered: false },
    ],
  },
  {
    title: "BS in Psychology — UMiami",
    code: "Fall 2024 – Summer 2025",
    rows: [
      { title: "Expository Writing", covered: true },
      { title: "PSYCH 101 Introduction to Psychology", covered: false },
    ],
  },
  { title: "Unused Courses", rows: [{ title: "Free Electives" }] },
];

/** Covered / total for a group, counting only rows that HAVE a state. */
export const coveredOf = (group) => {
  const stateful = group.rows.filter((r) => typeof r.covered === "boolean");
  return { covered: stateful.filter((r) => r.covered).length, total: stateful.length };
};

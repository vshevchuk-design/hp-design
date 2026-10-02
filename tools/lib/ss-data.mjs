// Content and fixtures for the Student Scheduling prototype.
//
// The service catalogue is the live app's (names, durations, drop-in status,
// the departments that offer each one), padded out to the 29 the reference's
// "Showing 1–10 of 29" reports. Availability is generated, not hand-listed:
// a deterministic hash of service × date, so every reload shows the same week
// and the client script can regenerate any week without shipping a table.

export const DEPARTMENTS = [
  "Academic Advising",
  "Admissions & Records",
  "Career and Talent Development",
  "Counseling",
  "English Dept",
  "Grad - Admissions",
  "Liberal Arts",
  "Office of the Registrar",
  "Student Mentoring",
  "Tutoring Center",
];

// Where an in-person meeting happens, per department — what the reference's
// confirm drawer reported as "Location".
export const LOCATIONS = {
  "Academic Advising": "Advising Center, Student Services Building",
  "Admissions & Records": "Admissions Office, Student Services Building",
  "Career and Talent Development": "Career Center, Library 2nd floor",
  Counseling: "Counseling Center, Student Services Building",
  "English Dept": "Humanities Hall, Room 214",
  "Grad - Admissions": "Graduate Office, Admin Building",
  "Liberal Arts": "Humanities Hall, Room 102",
  "Office of the Registrar": "Registrar, Admin Building",
  "Student Mentoring": "Student Union, Room 3",
  "Tutoring Center": "Learning Commons, Library 1st floor",
};

// drop: "none" = by appointment only · "open" = drop-in open right now ·
// "available" = offers drop-in, not open at the moment.
export const SERVICES = [
  { name: "Academic Difficulty", minutes: 45, drop: "none", depts: ["Counseling"], noSlots: true },
  { name: "Academic Probation", minutes: 30, drop: "open", depts: ["Counseling"] },
  { name: "Assessment / Placement", minutes: 30, drop: "open", depts: ["Admissions & Records"] },
  { name: "Career Counseling", minutes: 60, drop: "none", depts: ["Career and Talent Development", "Counseling"] },
  { name: "Change of Major", minutes: 60, drop: "none", depts: ["Academic Advising"] },
  { name: "Comprehensive Ed Plan", minutes: 60, drop: "open", depts: ["Counseling"] },
  { name: "Degree Planning", minutes: 30, drop: "available", depts: ["English Dept", "Liberal Arts", "Office of the Registrar"] },
  { name: "Ed Plan Review", minutes: 30, drop: "open", depts: ["Counseling"] },
  { name: "Education Plan", minutes: 30, drop: "none", depts: ["Academic Advising"] },
  { name: "EOPS Appointment", minutes: 45, drop: "open", depts: ["Counseling"] },
  { name: "Financial Aid Petition", minutes: 30, drop: "available", depts: ["Office of the Registrar"] },
  { name: "Graduation", minutes: 15, drop: "available", depts: ["Liberal Arts", "Office of the Registrar"] },
  { name: "Graduate Admissions Review", minutes: 45, drop: "none", depts: ["Grad - Admissions"] },
  { name: "Internship Planning", minutes: 30, drop: "none", depts: ["Career and Talent Development"] },
  { name: "Major Exploration", minutes: 45, drop: "none", depts: ["Academic Advising", "Liberal Arts"] },
  { name: "Math Tutoring", minutes: 30, drop: "open", depts: ["Tutoring Center"] },
  { name: "Mentor Check-In", minutes: 30, drop: "none", depts: ["Student Mentoring"] },
  { name: "New Student Orientation", minutes: 60, drop: "none", depts: ["Admissions & Records"] },
  { name: "Peer Mentoring", minutes: 30, drop: "available", depts: ["Student Mentoring"] },
  { name: "Personal Counseling", minutes: 45, drop: "none", depts: ["Counseling"] },
  { name: "Readmission", minutes: 30, drop: "none", depts: ["Admissions & Records"] },
  { name: "Records Request", minutes: 15, drop: "available", depts: ["Office of the Registrar"] },
  { name: "Resume Review", minutes: 30, drop: "open", depts: ["Career and Talent Development"] },
  { name: "Scholarship Advising", minutes: 30, drop: "none", depts: ["Academic Advising"] },
  { name: "Study Skills", minutes: 45, drop: "none", depts: ["Tutoring Center"] },
  { name: "Transcript Evaluation", minutes: 30, drop: "none", depts: ["Office of the Registrar", "Admissions & Records"] },
  { name: "Transfer Planning", minutes: 60, drop: "none", depts: ["Academic Advising", "Counseling"] },
  { name: "Veterans Services", minutes: 45, drop: "none", depts: ["Counseling"] },
  { name: "Writing Center", minutes: 30, drop: "open", depts: ["Tutoring Center", "English Dept"] },
];

export const ADVISORS = [
  "Alexander Robinson",
  "Andy Hernandez",
  "Ava Robinson",
  "Caitlin Moore",
  "Craig Millett",
  "Denny Petersen",
  "Eric Lynch",
  "George Amalor",
  "Jonathan Rehm",
  "Priya Natarajan",
];

// The prototype's "today" — the reference screens were taken on Friday,
// October 2, and the week strip starts there.
export const TODAY = "2026-10-02";
export const WEEKS_AHEAD = 3;
export const TIME_ZONE = "EEST";

export const SECTIONS = ["Browse", "Appointments", "Drop-Ins", "Workshops", "Reserve a Seat", "Calendar"];

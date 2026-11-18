**Mockup updated: Post-session Survey (student)**

The updated HTML mockup is attached: `advising-post-session-survey.html`. It is also online, with a Download button: https://hp-design-brown.vercel.app/docs/designs/advising-post-session-survey.html

**What changed after the triage**
- **Another account** now covers every registration the student can't access, whether it's someone else's or doesn't exist. The text no longer claims it's another account: "This survey isn't available to you." + "Check that you're signed in with the account the email was sent to."
- **No-show** text assumes the student missed the appointment. If `ORGANIZER_NO_SHOW` means the advisor missed it, that case needs its own text (OPEN QUESTIONS 1).
- **Draft autosave timing**:
  - a choice saves as soon as it's picked;
  - text saves 1 second after typing stops, and when leaving the field;
  - Submit waits for a running save;
  - leaving the page lets the save finish, with no warning.
- **ITEMS** in the PAGE note list each question kind with its component and its error text, so any survey can be built, not just the sample one.
- **Phone notes** on every part that changes below 768px.

**Open questions**
1. Does no-show mean the student or the advisor missed the appointment?
2. The URL is whatever the survey email links to; it isn't designed here.
3. CheckboxGroup has no required mark. How should a required multiple-choice question be marked?
4. Parked: the design system has a Form component; ui-next uses a standard `<form>`.

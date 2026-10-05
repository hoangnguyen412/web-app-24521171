# PROJECT RULES — HW3 Resilient Landing Page (Tech Talk 2026)

## 1. Architecture & Tech Stack
- Use **Vanilla HTML5**, modern CSS3, and **ES6+ JavaScript** exclusively.
- **BANNED**: jQuery, Bootstrap, Tailwind, date libraries (moment, dayjs), external script CDNs.
- **Contract-First Architecture**: Config (event deadline, state labels) lives in HTML attributes or named constants, not scattered magic values in logic.
- Separate files: `index.html`, `styles.css`, `countdown.js`, `form.js`.

## 2. HTML & CSS Standard
- Semantic HTML only. BANNED: unnecessary `<div>` wrappers.
- Exactly ONE `<h1>`; no heading level skipping.
- Every form control has a visible `<label for="id">`. Placeholders are never a substitute for labels.
- Status messages use `<p aria-live="polite">`.
- Design tokens in `:root`; automated dark mode via `prefers-color-scheme`.
- Layout must be responsive (375px baseline, no horizontal scroll) using Flexbox or CSS Grid.

## 3. JavaScript Standard
- `const` by default, `let` only if reassigned. BANNED: `var`.
- **Countdown**: Deadline stored as a UTC ISO 8601 string. Each tick recomputes `deadline - Date.now()`. NEVER decrement a counter (drift-free).
- **Form**: Explicit state machine `idle -> submitting -> success | error`. Submit is blocked unless state is `idle` (double-submit prevention).
- Clear all timers/listeners that are no longer needed (no memory leaks).

## 4. Security
- **Zero XSS**: BANNED `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` for any user-provided data. Use `textContent` only.
- Sanitize and trim all input before use; treat Special Requests as hostile.
- **Zero inline event handlers** (`onclick`, `onsubmit`, ...).
- Strict CSP via `<meta http-equiv="Content-Security-Policy">`.

## 5. Accessibility
- Fully operable with Tab and Enter only; visible `:focus-visible` styles.
- Skip link to main content.

## 6. Engineering Workflow
- **No one-shot prompting**: one isolated slice per prompt.
- One atomic commit per task, following the required commit sequence.
- Generate with AI. Verify with engineering.
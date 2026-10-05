# TASK DECOMPOSITION — HW3: Resilient Landing Page (Tech Talk 2026)

## T-01 — Semantic DOM & Form Contract
- **Objective**: Establish the static structure before any CSS/JS.
- **Tasks**: Build landmarks (`header`, `main`, `footer`), one `<h1>`, countdown container, and the registration form: Full Name (text, required, minlength=3), Email (email, required), Organization (text, optional), Ticket Type (select: Student, Professional), Special Requests (textarea, optional), Submit button, and `<p aria-live="polite">` status.
- **Contract**: Zero logic in HTML. Zero `<div>` soup. Every control has a visible `<label>`.
- **Verification**: Inspect DOM and heading outline; Tab through all controls with keyboard.
- **Atomic Commit**: `feat(html): build semantic landmark tree`

## T-02 — Design Tokens, Reset & Layout
- **Objective**: Style the page without touching HTML structure or JS.
- **Tasks**: Box-sizing reset, `:root` design tokens, dark mode via `prefers-color-scheme`, Grid/Flexbox layout, `:focus-visible` states.
- **Contract**: Responsive at 375px with no horizontal scroll.
- **Verification**: DevTools device mode at 375px; toggle OS dark mode.
- **Atomic Commit**: `feat(css): implement design tokens & box-sizing reset`

## T-03 — Drift-Free UTC Countdown Engine
- **Objective**: Build a standalone countdown for 7 days from page load.
- **Tasks**: Compute deadline once as UTC ISO 8601 string; each tick recompute `deadline - Date.now()`; render days/hours/minutes/seconds via `textContent`.
- **Contract**: No decrementing counter. No timezone-dependent parsing.
- **Verification**: Throttle/background the tab, return, and confirm the displayed time is still correct.
- **Atomic Commit**: `feat(js): implement UTC-based countdown engine`

## T-04 — Form State Machine & Sanitization
- **Objective**: Make the form resilient.
- **Tasks**: State machine `idle -> submitting -> success | error`; block submit when not `idle`; disable button while submitting; trim and sanitize input; report status in the `aria-live` paragraph via `textContent`.
- **Contract**: BANNED `innerHTML` for user data. Zero inline handlers.
- **Verification**: Double-click Submit rapidly (one submission only); paste `<script>` / `<img onerror>` payloads into Special Requests (rendered as plain text, never executed).
- **Atomic Commit**: `feat(js): implement form state machine & sanitization`

## T-05 — AI Failure Mode Audit
- **Objective**: Document 3 AI-induced defects caught during review.
- **Tasks**: Write `AI_FAILURE_AUDIT.md` with, per defect: description, diagnostic method, refactored solution.
- **Atomic Commit**: `docs(audit): compile AI failure mode report`

---

## Required Commit Sequence
1. `docs(spec): define component contracts & WBS table` *(this file)*
2. `feat(html): build semantic landmark tree`
3. `feat(css): implement design tokens & box-sizing reset`
4. `feat(js): implement UTC-based countdown engine`
5. `feat(js): implement form state machine & sanitization`
6. `docs(audit): compile AI failure mode report`

*Live Defense Prep: Be ready to explain any line of the Git history and modify one contract constraint in under 3 minutes.*
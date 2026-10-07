# AI FAILURE AUDIT — HW3: Resilient Landing Page (Tech Talk 2026)

Eight AI-induced defects/risks found while reviewing Tasks 3-4 and the follow-up fixes. Defects 1-6 are real defects in AI-generated code that changed observable behavior. Defects 7-8 are latent risks (not reachable with the current HTML/output path) hardened as defense in depth. Each entry gives the defect, how it was diagnosed, and the verified fix.

---

## Defect 1 — Countdown resets on every reload (Task 3) — spec ambiguity

**Defect Description**
The generated countdown computed its deadline from the current page load:

```javascript
const deadlineISO = new Date(Date.now() + 7 * MS_PER_DAY).toISOString();
```

This matches the literal spec ("7 days from page load"), but every F5 restarted a full 7 days, so the clock could never reach zero. The AI did not flag the ambiguity: "from page load" and "registration closes in 7 days" conflict across reloads.

**Diagnostic Method**
- Reload the page: the display jumps back to 07 00 00 00.
- DevTools > Application > Local Storage: no persisted deadline key.

**Refactored Solution**
Persist a UTC ISO 8601 deadline in `localStorage` (`techtalk2026:deadline`). `loadDeadline()` accepts a stored value only if it round-trips through `toISOString()` and is no further away than the configured duration; otherwise `createDeadline()` creates a new one and `saveDeadline()` stores it. Every tick still recomputes `deadlineMs - Date.now()` (never decrements) and re-aligns with `setTimeout(render, 1000 - (Date.now() % 1000))`. Storage access is wrapped in try/catch so blocked storage falls back to a per-load deadline.

---

## Defect 2 — `disabled` submit button drops keyboard focus (Task 4)

**Defect Description**
The generated handler set `submitBtn.disabled = true` while submitting. A disabled button is not focusable and ignores keyboard events, so a keyboard user who pressed Enter on Submit lost their place during submission, breaking the Tab & Enter contract.

**Diagnostic Method**
- Tab to Submit, press Enter, then inspect focus: the focus ring disappears and the button no longer receives key events (browser-dependent: `document.activeElement` may become `<body>`).
- DevTools > Accessibility pane on the button: not focusable while submitting.

**Refactored Solution**
Use `aria-disabled="true"` (synced by `syncSubmitButton()`) plus `aria-busy` on the form instead of `disabled`. Double-submit prevention is enforced in logic (`if (state === STATES.SUBMITTING) return;`), not by the native attribute, so the button stays focusable throughout.

---

## Defect 3 — Timer reaches zero but UI keeps showing 00 00 00 00 (Task 3)

**Defect Description**
When `remainingMs <= 0`, the generated code cleared the timer and returned, leaving the zeros and the heading "Registration closes in" on screen. Users could not tell registration had closed, and the form stayed usable.

**Diagnostic Method**
- Set the deadline a few seconds ahead from the console, reload, and wait:
  `localStorage.setItem('techtalk2026:deadline', new Date(Date.now() + 5000).toISOString())`
- Note: `data-duration-days="0"` does NOT work for this test, because the code falls back to 7 days for values that are not `> 0`. Use `"0.0001"` (about 9 seconds) with the storage key cleared.

**Refactored Solution**
`closeRegistration(container)` sets `data-registration="closed"`, hides the countdown, rewrites the heading to "Registration closed", and inserts a `<p role="status">` using `textContent`. It dispatches a `registration:closed` event so `form.js` blocks late submissions and updates the status paragraph. The closed state also survives reloads because the deadline is persisted (Defect 1).

---

## Defect 4 — Submit button not visibly greyed while submitting (Task 4)

**Defect Description**
The original CSS only had `button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; }`. That dims the accent color but never turns the button grey, so the "busy" state was weak. Moving to `aria-disabled` (Defect 2) would have made even that rule dead, because `:disabled` does not match `aria-disabled="true"`.

**Diagnostic Method**
- Click Submit and compare the button against its idle state: still the accent hue.
- DevTools > Elements: `[aria-disabled="true"]` present, but no matching rule in the Styles pane.

**Refactored Solution**
Add `button[type="submit"][aria-disabled="true"]` using new `--disabled-bg / --disabled-text / --disabled-border` tokens (with a dark-mode override), and gate the hover style with `:hover:not([aria-disabled="true"])`. Commit order matters for the defense: the CSS commit adding the `aria-disabled` rule landed before the JS commit that switched to `aria-disabled`.

---

## Defect 5 — Duplicate top-level `const` crashes `form.js`; wrong root cause (HTTP 405)

**Defect Description**
`countdown.js` and `form.js` both declared `const CLOSED_MESSAGE` at top level. Classic scripts share one global lexical scope, so `form.js` threw `SyntaxError: Identifier 'CLOSED_MESSAGE' has already been declared` and never executed. With no submit handler attached, the browser submitted the form natively as `POST /`, which the static dev server rejected with **HTTP 405**.

The first AI "fix" changed the form to `method="dialog"`, which only masked the symptom (the form stopped navigating but still did nothing). The AI diagnosed the server response instead of reading the Console.

**Diagnostic Method**
- DevTools > Console: red SyntaxError on `form.js` at load.
- DevTools > Network: `POST /` returning 405 on submit.
- Sources panel: `form.js` is not listed as parsed; no event listener on `#register-form`.

**Refactored Solution**
Wrap `form.js` in an IIFE so its constants are local, and rename the constant to `FORM_CLOSED_MESSAGE`. `method="dialog"` and `form-action 'none'` in the CSP stay as defense in depth, since a native submit can never leave the page, but they are not the fix.

---

## Defect 6 — State machine collapses; `finally` overwrites SUCCESS/ERROR (Task 4)

**Defect Description**
The generated handler ended with:

```javascript
try {
  await submitRegistration(payload);
  setState(STATES.SUCCESS, '...');
} catch (error) {
  setState(STATES.ERROR, '...');
} finally {
  setState(STATES.IDLE); // runs in the same tick
}
```

`SUCCESS` and `ERROR` were left in the same tick they were entered, so the declared `idle -> submitting -> success | error` machine behaved as `idle -> submitting -> idle`. The same handler also logged the sanitized payload with `console.info`, leaking the email address to the console. Also found in the same review: validation ran before sanitization, so `"  a"` passed native `minlength="3"` (raw length 3) but became `"a"` after cleaning.

**Diagnostic Method**
- Elements panel: watch `data-state` on `<form>` during a submit; `success` / `error` never appear.
- Breakpoint in `setState`: `SUCCESS -> IDLE` fires back-to-back with no await in between.
- Submit `"  a"` as Full Name and observe it pass native validation.

**Refactored Solution**
Remove `finally` and the `console.info`. `SUCCESS` / `ERROR` stay visible until the next `input` event (or the next submit) returns the machine to `IDLE`. Clean the input first, write cleaned values back into the fields, then run `checkValidity()` on the cleaned values.

---

## Defect 7 — `String(null)` produces the literal `"null"` (Task 4) — latent

**Defect Description**
The generated sanitizers began with `String(value)`. `FormData.get()` returns `null` for a missing field, and `String(null)` is `"null"`, which would be sent as if the user had typed it. With the current HTML this is not reachable (an empty Organization yields `""`, not `null`), and the submit is simulated, but any removed, renamed or disabled field would trigger it.

**Diagnostic Method**
- Console: `String(null)` returns `"null"`.
- DevTools: delete the Organization input from the DOM and submit, or rename its `name`; `FormData.get('organization')` returns `null`.

**Refactored Solution**
`toText(value) { return typeof value === 'string' ? value : ''; }` is the first step of `cleanLine()` and `cleanMultiline()`. Missing fields and `File` entries collapse to `''`.

---

## Defect 8 — Sanitizer leaves HTML-significant characters unescaped (Task 4) — latent

**Defect Description**
The generated sanitizer stripped control characters and trimmed whitespace but left `<`, `>`, `&`, `"`, `'` untouched. The UI is safe today because all output uses `textContent`, but the value would be live XSS if a future code path used `innerHTML`, `insertAdjacentHTML` or `document.write`.

**Diagnostic Method**
- Static review: sanitizer output for `<img src=x onerror=alert(1)>` still contains raw `<` and `>`.
- `grep -rn "innerHTML\|outerHTML\|insertAdjacentHTML\|document.write" .` currently returns zero matches (defense in depth only).

**Refactored Solution**
`escapeHtml()` with a `HTML_ESCAPES` map is applied in `toSafePayload()`, so the object leaving the form is escaped while the unescaped cleaned values are used only for validation and `textContent` display. This is a second layer, not a replacement for the `textContent` rule.

**Known residual (not yet fixed):** `submitRegistration()` checks `fullName.length` on the escaped payload, and escaping inflates length (`<<` becomes `&lt;&lt;`). Native `minlength` on the cleaned value blocks this today, but the backend-side length check should run on cleaned values, or on the original input, before escaping.

---

## Commit Sequence

1. `docs(spec): define component contracts & WBS table`
2. `feat(html): build semantic landmark tree`
3. `feat(css): implement design tokens & box-sizing reset`
4. `feat(js): implement UTC-based countdown engine`
5. `feat(js): implement form state machine & sanitization`
6. `docs(audit): compile AI failure mode report`
7. `fix(js): keep success/error states observable & validate after sanitizing`
8. `fix(js): persist UTC deadline across reloads & show closed state`
9. `fix(css): add gray aria-disabled submit state`
10. `fix(js): keep submit focus, escape output & block closed registration`
11. `fix(html): use method=dialog to prevent native POST (HTTP 405)`
12. `fix(js): isolate form.js scope to fix duplicate const SyntaxError`
13. `docs(audit): rewrite AI failure mode report with verified diagnostics`
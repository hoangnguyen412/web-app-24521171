# HW1 — Project Rules

These rules define the scope, keyboard, audio, accessibility and quality contracts for the Production Studio Drum Kit.

When an implementation shortcut conflicts with the assignment requirements, follow the assignment requirements.

## 1. Scope and Source of Truth

- The assignment slides (HW 1 and the AI Failure Mode Audit) are the source of truth.
- Build only what HW 1 asks for: the seven-pad Drum Kit, the keyboard hook, the Visual Hit Log, the decibel meter, accessibility and the AI audit.
- Do not add recording, sequencing, saving, login, backend calls or third-party libraries.
- Anything the assignment does not specify (pad names, sounds, layout, colors) is an implementation decision and must stay simple.

## 2. Keyboard Rules

The hook follows the assignment code contract:

```js
useDrumKeyboard(padMap, onTriggerPad, isEnabled = true)
```

Required behavior:

1. Listen on `window` for `keydown`.
2. Map pads with `padMap.get(e.code)`.
3. Use `e.code`; never use `keyCode` and never use `key`.
4. Return immediately when `e.repeat` is `true`.
5. Return immediately when `e.target.tagName` is `INPUT`, `TEXTAREA` or `SELECT`.
6. Call `e.preventDefault()` only when the key belongs to a pad.
7. When `isEnabled` is `false`, attach no listener.
8. Remove the listener in the effect cleanup; the dependency array is `[padMap, onTriggerPad, isEnabled]`.

Allowed addition: `keyup` handling through an optional fourth parameter (for example `onReleasePad`) that clears the active state. The first three parameters must keep the contract signature.

Supported key codes:

```text
KeyW  KeyA  KeyS  KeyD  KeyJ  KeyK  KeyL
```

`padMap` is a `Map` from key code to `{ id, label }` and is created once (module level or `useMemo`) so its reference stays stable.

## 3. React State Rules

- Keep state minimal: the set of active pad ids and the hit log entries.
- Do not use `useEffect` to compute derived values.
- Do not store the same information in two state variables.
- Update state immutably (new `Set`, new array).
- `onTriggerPad` must be stable (`useCallback`) so the hook does not reattach the listener on every render.
- Hit log entries get a unique id from a counter, never from the array index.
- Cap the hit log (for example the latest 10 entries) so it cannot grow without limit.

## 4. Audio Rules

- Use the Web Audio API; no audio files and no audio libraries.
- Create the `AudioContext` lazily on the first user interaction and call `resume()` if it is suspended.
- Route all pad sounds through one `AnalyserNode` so the decibel meter can read the level.
- Each pad sound must stop by itself (short envelope) and its nodes must be disconnected afterwards.
- On unmount, stop the meter animation loop and close the `AudioContext`.

## 5. Decibel Meter Rules

- Compute the level from the `AnalyserNode` (RMS converted to dB) and clamp it to a fixed display range.
- Show a visual bar and a numeric dB value.
- Give the meter an accessible name (`aria-label`) and expose its value with `role="meter"` plus `aria-valuemin`, `aria-valuemax` and `aria-valuenow`, or use a native `<meter>`.
- Do not put `aria-live` on the meter; only the Hit Log announces.
- Any `requestAnimationFrame` loop must be cancelled in cleanup.

## 6. Accessibility Rules (WCAG 2.2 AA)

| Criterion | Rule for this app |
| --- | --- |
| 1.3.1 Info and Relationships | Use semantic elements (`main`, `h1`, `button`, `output`, `label`). |
| 1.4.1 Use of Color | Active pads differ by more than color (for example border or `aria-pressed`). |
| 1.4.3 Contrast (Minimum) | Text contrast at least 4.5:1. |
| 1.4.11 Non-text Contrast | Pad borders, focus ring and meter bar at least 3:1. |
| 2.1.1 Keyboard | Every function works without a mouse. |
| 2.1.2 No Keyboard Trap | Tab always moves focus onward. |
| 2.4.2 Page Titled | Meaningful `<title>`. |
| 2.4.7 Focus Visible | Clear focus indicator on every control. |
| 2.4.11 Focus Not Obscured (Minimum) | Focused control is never hidden behind other content. |
| 2.5.8 Target Size (Minimum) | Pads and controls at least 24 by 24 CSS pixels. |
| 3.1.1 Language of Page | `<html lang>` set. |
| 3.3.2 Labels or Instructions | The text input has a visible `<label htmlFor>`. |
| 4.1.3 Status Messages | Hits are announced through `<output aria-live="polite">`. |

Additional rules:

- Pads are `<button type="button">` with `aria-pressed={isActive}`.
- Mouse, touch, Enter and Space all trigger a pad through the same `triggerPad(id)` function.
- Information is never given by sound alone; every hit also appears in the Hit Log and on the meter.
- Respect `prefers-reduced-motion` for any animation.

## 7. Code Quality Rules

- One component per file; hooks in `src/hooks/`, audio in `src/audio/`.
- Use descriptive names and follow the project's formatting conventions.
- Keep the code simple enough to explain during a review.
- No dependencies beyond `react`, `react-dom` and build tooling.
- No leftover `console.log` or commented-out code.
- Do not suppress React or ESLint warnings to hide problems.

## 8. Verification Rules

Before completing the homework, verify:

- All seven key codes trigger the correct pad.
- `keyCode` is absent from the source (`grep`).
- Holding a key does not retrigger the pad.
- Typing in the text input triggers nothing.
- The listener is removed on unmount (Elements panel, Event Listeners, `window`).
- `aria-pressed` flips on press and release.
- The Hit Log announces each hit and does not grow without limit.
- The meter responds to hits and decays.
- The page works with keyboard only and with UniKey enabled.
- Lighthouse on the production build scores 100 in all four categories, or any shortfall is recorded with its cause.
- No console errors or React warnings remain.

## 9. AI Audit Rules

- `AI_AUDIT.md` documents at least 3 real AI-generated bugs, with proof and a manual fix (the audit is worth 15%).
- Do not invent bugs, evidence or commit hashes; only record what actually happened.

## 10. Completion Standard

The homework is ready for submission when all seven pads work through the specified contract, the Hit Log and decibel meter work, accessibility and Lighthouse targets are verified, and `AI_AUDIT.md` contains at least three real, proven and fixed bugs.

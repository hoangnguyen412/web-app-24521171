# HW1 — Task Decomposition

## 1. Goal

Refactor Legacy Slide 26 (Drum Kit with `w/a/s/d/j/k/l`) into a production studio Drum Kit that is keyboard-correct, accessible for deaf and hard-of-hearing users, and targets WCAG 2.2 AA and a Lighthouse score of 100.

The implementation must demonstrate `e.code` handling, the anti-repeat guard, input focus isolation, a correct listener lifecycle, and non-audio feedback.

## 2. Scope

### Required

1. Seven pads mapped to `KeyW KeyA KeyS KeyD KeyJ KeyK KeyL`.
2. `useDrumKeyboard(padMap, onTriggerPad, isEnabled = true)` following the assignment contract.
3. `e.code` instead of `keyCode`; `if (e.repeat) return`; input, textarea and select isolation.
4. Pads as `<button aria-pressed={isActive}>`.
5. Visual Hit Log as `<output aria-live="polite">`.
6. Visual decibel meter.
7. WCAG 2.2 AA accessibility and Lighthouse 100 target.
8. `AI_AUDIT.md` with at least 3 real bugs.

### Out of Scope

- Recording, looping or sequencing.
- Backend, database, authentication or persistence.
- Uploading or loading audio files.
- Third-party UI, audio or state libraries.
- Additional pads beyond the seven specified keys.

## 3. Data Contract

Pad map entry:

```js
{ id: 'kick', label: 'Kick' }   // key: 'KeyW'
```

| Item | Type | Rule |
| --- | --- | --- |
| `padMap` | `Map<string, { id, label }>` | Key is `e.code`; created once, stable reference |
| `activeIds` | `Set<string>` | Pad ids currently active; updated immutably |
| Hit log entry | `{ id, padId, label, time }` | `id` from a counter, newest first, capped |

## 4. Implementation Phases

### Phase A — Setup and Pad Map

Tasks:

- Create a Vite + React 19 project with JavaScript and plain CSS.
- Set `lang`, `<title>`, `meta description` and `meta viewport` in `index.html`.
- Define the seven-pad `padMap` and the pad list used for rendering.

Acceptance criteria:

- `npm run dev` runs with no console errors or warnings.
- Exactly seven pads are rendered, in a stable order.

### Phase B — Audio Engine

Tasks:

- Create `drumAudio.js` that lazily creates the `AudioContext`, resumes it on user interaction, and exposes `playPad(id)`.
- Synthesize seven distinct short sounds with oscillators and noise through Web Audio.
- Route all sounds through one `AnalyserNode` and expose it to the meter.
- Disconnect nodes when sounds end; close the context on unmount.

Acceptance criteria:

- Each pad plays a distinct sound.
- No audio plays before the first user interaction.
- No leftover nodes remain after sounds finish.

### Phase C — Keyboard Hook

Tasks:

- Implement `useDrumKeyboard` exactly as in the assignment contract, including `SELECT` in the ignored tags.
- Add optional `keyup` release handling for the active state.
- Make `onTriggerPad` stable with `useCallback`.

Acceptance criteria:

- Seven keys trigger the correct pads.
- Holding a key triggers once.
- Typing in the input triggers nothing and leaves default behavior intact.
- The listener is removed on unmount and when `isEnabled` is `false`.

### Phase D — Pad UI and Active State

Tasks:

- Build `DrumPad` as `<button type="button" aria-pressed={isActive}>` showing the pad label and its shortcut key.
- Make click, touch, Enter and Space call `triggerPad(id)`.
- Show the active state visually in a way that does not rely on color alone.

Acceptance criteria:

- `aria-pressed` flips on press and release.
- Keyboard-only users can reach and trigger every pad.

### Phase E — Visual Hit Log and Meter

Tasks:

- Build `HitLog` as `<output aria-live="polite">` listing the latest hits with pad label and time.
- Build `DecibelMeter` that reads the `AnalyserNode` in a `requestAnimationFrame` loop and shows a bar plus a dB value.
- Cancel the animation loop in cleanup.

Acceptance criteria:

- Every hit adds one log entry and the log is capped.
- The meter rises on a hit and decays when silent.
- Only the Hit Log is a live region.

### Phase F — Input Isolation Demo

Tasks:

- Add one labelled `<input>` (for example "Session name") so the isolation rule can be demonstrated.

Acceptance criteria:

- Typing `wasdjkl` in the input plays no sound and adds no log entries.

### Phase G — Accessibility and Lighthouse

Tasks:

- Check contrast (4.5:1 text, 3:1 non-text), focus visibility, target size (24 by 24 or larger) and heading structure.
- Check keyboard operation and the absence of keyboard traps.
- Build for production and run Lighthouse.

Acceptance criteria:

- The WCAG table in `PROJECT_RULES.md` is satisfied.
- Lighthouse results are recorded in `README.md`; the target is 100 in each category.

### Phase H — Verification and Audit

Perform these manual checks:

1. Start the app and check the console.
2. Press each of the seven keys and confirm the right pad and sound.
3. Hold a key for two seconds and confirm a single hit.
4. Type in the input field and confirm no pad triggers.
5. Enable UniKey and repeat steps 2 and 3.
6. Use only Tab, Enter and Space to trigger every pad.
7. Confirm `aria-pressed` toggles on press and release.
8. Confirm the Hit Log is announced by a screen reader.
9. Unmount the app (or hot reload) and confirm no duplicate listeners remain.
10. Run the `grep` checks from `README.md`.
11. Complete `AI_AUDIT.md` with at least three real bugs.

## 5. Definition of Done

The homework is complete when:

- Seven pads work through the specified hook contract.
- `e.code`, the repeat guard and input isolation are implemented and verified.
- The Hit Log and decibel meter provide non-audio feedback.
- Accessibility checks pass and Lighthouse results are recorded.
- The listener and audio lifecycle leave no leaks.
- `AI_AUDIT.md` contains at least three real, proven and fixed bugs.

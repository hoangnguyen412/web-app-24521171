# TASK DECOMPOSITION — HW2: Drum Kit Engine

## T-01 — Semantic DOM & Data-Sound Contract
- **Objective**: Establish the structural foundation and data contract before writing any JS logic.
- **Tasks**: Create the UI for the drum kit pads. Bind the appropriate audio file paths and trigger keys using `data-sound` and `data-key` attributes.
- **Contract**: Zero logic in HTML. Zero `<div>` soup.
- **Verification**: Inspect DOM to ensure `data-*` attributes are correctly populated and mapped to valid sound assets.
- **Atomic Commit**: `feat(html): define data-sound contract and drum pads`

## T-02 — Polyphonic Audio Engine
- **Objective**: Build a standalone audio playback engine.
- **Tasks**: Write a decoupled function that reads the `data-sound` attribute from a triggered DOM element and plays it. It must allow overlapping sounds (polyphony).
- **Contract**: No hardcoded 30-line `switch-case` in JS. Path must be injected from HTML.
- **Verification**: Manually call the function in DevTools console to ensure audio plays without interrupting currently playing sounds.
- **Atomic Commit**: `feat(js): implement decoupled polyphonic audio engine`

## T-03 — Keyboard Event Hub & Throttling
- **Objective**: Bind the UI and Audio engine to physical keyboard inputs.
- **Tasks**: Add a global `keydown` listener using `event.key`. Map the key to the DOM element. Add visual active states to the drum pads.
- **Contract**: Must check `e.repeat` to exit early if a key is held down.
- **Verification**: Hold down a key. The audio should play exactly once and not glitch/flood the browser.
- **Atomic Commit**: `feat(js): bind keydown events with repeat throttling`

## T-04 — FIFO Beat Recorder
- **Objective**: Track and store the user's play sequence.
- **Tasks**: Implement a First-In, First-Out (FIFO) queue array. On every valid keystroke, push an object containing the key and a timestamp (e.g., `Date.now()`).
- **Contract**: Event array must accurately reflect the chronological order and timing of strokes.
- **Verification**: Play a sequence, then log the recorder array in the console to verify timestamps and keys.
- **Atomic Commit**: `feat(js): implement FIFO beat recorder`

---

## Required Commit Sequence & Final Audit
Ensure your `git log` strictly reflects these isolated milestones to pass the architectural grading:

1. `docs(spec): define component contracts & WBS table` *(Done when creating this file)*
2. `feat(html): define data-sound contract and drum pads`
3. `feat(js): implement decoupled polyphonic audio engine`
4. `feat(js): bind keydown events with repeat throttling`
5. `feat(js): implement FIFO beat recorder`

*Oral Defense Prep: Be prepared to modify a `data-sound` attribute, change a key binding, or explain the `event.repeat` block live in under 3 minutes.*
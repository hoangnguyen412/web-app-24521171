# HW2 — Project Rules

These rules define the data, React, audio, concurrency and quality contracts for the 88-Key Polyphonic Piano & Concurrent FIFO Sequencer.

When an implementation shortcut conflicts with the assignment requirements, follow the assignment requirements.

## 1. Scope and Source of Truth

- The assignment slides (HW 2, HW 2 Engine and the AI Failure Mode Audit) are the source of truth.
- Build only what HW 2 asks for: the generated 88-key piano, `React.memo` isolation, `PolyphonicSynth`, FIFO recording, replay at three speeds, cancellation and the AI audit.
- Do not add computer-keyboard play, real MIDI input, saving recordings, multiple waveforms, effects, backend calls or third-party libraries.
- Anything the assignment does not specify (layout, colors, button placement) is an implementation decision and must stay simple.

## 2. Data Rules

Each generated key has:

| Field | Type | Rule |
| --- | --- | --- |
| `midi` | Number | Integer from 21 to 108 |
| `noteName` | String | Note letter plus octave, for example `A0`, `C#4`, `C8` |
| `isBlack` | Boolean | True for pitch classes 1, 3, 6, 8 and 10 |
| `freqHz` | Number | `440 * 2 ** ((midi - 69) / 12)` |

Rules:

- Generate the keys with a loop from MIDI 21 to 108; never write 88 elements by hand.
- Compute `noteName` from the MIDI number: `['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][midi % 12]` plus `Math.floor(midi / 12) - 1`.
- The result must be exactly 52 white and 36 black keys.
- Create the key list once at module level (or `useMemo`) so its reference is stable.
- Use `midi` as the React `key`.

## 3. React State and Render Isolation

- `PianoKey` follows the assignment contract and is wrapped in `memo`.
- Its props are exactly `midi`, `noteName`, `isBlack`, `isPressed`, `onNoteOn`, `onNoteOff`.
- `isPressed` is a boolean (`pressedMidis.has(midi)`), never the whole set.
- `onNoteOn` and `onNoteOff` are created with `useCallback` and never recreated per render.
- Do not create inline functions or objects as props of `PianoKey`.
- Keep pressed keys as a `Set` of MIDI numbers in state and update it immutably (`new Set(previous)`).
- The `PolyphonicSynth` instance lives in a `useRef`, not in state.
- Do not use `useEffect` to compute derived state.
- Allowed addition: `onPointerLeave` and `onPointerCancel` on the button to release a note when the pointer leaves, as long as `memo` still works.

## 4. Synth Rules (`PolyphonicSynth`)

Follow the assignment contract and complete it:

1. `constructor(maxVoices = 8)` with `this.ctx = null` and `this.voices = new Map()` (`midi -> { osc, gain }`).
2. `noteOn(midi, freqHz)` creates the `AudioContext` lazily and resumes it if suspended.
3. `noteOn` returns immediately when the midi is already in `voices`.
4. When `voices.size >= maxVoices`, release `this.voices.keys().next().value` through `noteOff`.
5. `noteOn` returns the stolen midi (or `null`) so the UI can clear its pressed state.
6. The initial gain is `0.2`, as in the contract.
7. `noteOff(midi)` does nothing when the midi is not in `voices`.
8. `noteOff` removes the voice from the `Map`, holds the current gain value, then calls `gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)`, then `osc.stop(ctx.currentTime + 0.04)`.
9. Disconnect `osc` and `gain` when the oscillator ends (`onended`).
10. `stopAll()` releases every voice.
11. `dispose()` calls `stopAll()`, closes the `AudioContext` and sets `ctx` back to `null` so a later `noteOn` recreates it.
12. If eight simultaneous voices cause audible clipping, add a single master `GainNode` instead of changing the contract.

## 5. Recording and Replay Rules

Recorded event:

```js
{ midi, freqHz, durationMs, deltaMs }
```

- `deltaMs` is the time since the previous recorded note start; for the first note it is the time since recording started.
- `durationMs` is the time between `noteOn` and `noteOff` for that note.
- Notes still held when recording stops get their duration finalized at that moment.
- Events are stored in a FIFO queue in the order the notes started.
- Replay reads a copy of the queue, so a recording can be played many times.
- Allowed speeds: `0.5`, `1.0` and `2.0`; waits and durations are divided by the speed.
- Recording and replay are mutually exclusive in the UI.
- Replayed notes use the same `onNoteOn` and `onNoteOff` handlers, so the keys light up.
- Replayed notes are never recorded.

## 6. Cancellation Rules

- Replay receives an `AbortSignal` created from an `AbortController`.
- Every wait (`setTimeout`) uses an abortable sleep that rejects or resolves early on `signal.abort`.
- Timers that release scheduled notes are tracked and cleared on abort.
- **Stop Sequence** and unmount both: call `abort()`, call `stopAll()`, clear the pressed state.
- After abort, no scheduled note may sound.
- Handle `AbortError` silently; it is not an application error.
- A new replay creates a new `AbortController`.

## 7. Performance and Memory Rules

- Pressing a single key must commit only that `PianoKey`.
- Voice tracking uses an ES6 `Map` (O(1) lookup and removal).
- No growing arrays except the recording, which is replaced when a new recording starts.
- No timers, listeners or oscillators survive unmount.

## 8. Accessibility Rules

- Keys are `<button type="button">` with `aria-pressed`.
- Each key shows its note name.
- Controls (Record, Play, speed, Stop Sequence) are labelled buttons or a labelled `<select>`.
- Text contrast is at least 4.5:1 and focus is clearly visible.
- Operating the piano from the computer keyboard is out of scope.

## 9. Code Quality Rules

- One component per file; audio code in `src/audio/`, key generation in `src/lib/`.
- Use descriptive names and follow the project's formatting conventions.
- Keep the code simple enough to explain during a review.
- No dependencies beyond `react`, `react-dom` and build tooling.
- No leftover `console.log` or commented-out code.
- Do not suppress React or ESLint warnings.

## 10. Verification Rules

Before completing the homework, verify:

- Exactly 88 keys exist: 52 white and 36 black, from A0 to C8.
- A4 (MIDI 69) is 440 Hz.
- No hardcoded 88 elements exist in the source.
- The Profiler shows only one `PianoKey` committed per press or release.
- Nine notes held together keep `voices.size` at 8 and release the oldest first.
- The stolen key's `aria-pressed` returns to `false`.
- No click or pop on release.
- Replay timing is correct at 0.5x, 1.0x and 2.0x.
- Stop Sequence and unmount leave `voices.size` at 0 and no pending timers.
- No console errors or React warnings remain.

## 11. AI Audit Rules

- `AI_AUDIT.md` documents at least 3 real AI-generated bugs, with DevTools proof and a manual fix (15% weight).
- Do not invent bugs, evidence or commit hashes.

## 12. Completion Standard

The homework is ready for submission when the generated piano, memo isolation, polyphonic engine, FIFO recording, replay speeds and cancellation are verified, and `AI_AUDIT.md` contains at least three real, proven and fixed bugs.

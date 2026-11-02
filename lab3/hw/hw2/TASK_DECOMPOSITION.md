# HW2 — Task Decomposition

## 1. Goal

Combine Legacy Slide 27 (88-key piano) with React `memo`, the Lab 2 shallow-equality/memoization ideas, and the FIFO `AudioTaskQueue` concept. Add the HW 2 engine: a polyphonic voice pool and asynchronous, abortable FIFO replay.

The implementation must demonstrate:

- Algorithmic generation of all 88 piano keys.
- Render isolation using `React.memo`, stable callbacks, and shallow prop comparison.
- Deterministic voice management with a maximum of 8 active voices and FIFO voice stealing.
- Click-free note release using a short gain ramp.
- FIFO recording and variable-speed replay, including overlapping notes.
- Cancellation and cleanup when **Stop Sequence** is pressed or the component unmounts.
- A manually verified `AI_FAILURE_AUDIT.md` containing at least 3 real bugs that were found and fixed.

## 2. Scope

### Required

1. Generate 88 keys from A0 to C8 (52 white, 36 black) algorithmically using the MIDI frequency formula.
2. Implement `PianoKey` with `React.memo`, following the six-prop assignment contract.
3. Verify render isolation using the React DevTools Profiler.
4. Implement `PolyphonicSynth` with an ES6 `Map`, a maximum of 8 active voices, and FIFO voice stealing.
5. Release notes with a 40 ms exponential gain ramp before stopping the oscillator.
6. Record note events as `{ midi, freqHz, durationMs, deltaMs }` in note-on order.
7. Replay asynchronously at `0.5x`, `1.0x`, and `2.0x`, including overlapping notes and chords.
8. Support cancellation using `AbortController` and tracked timer cleanup on **Stop Sequence** and unmount.
9. Implement a FIFO recording queue with `enqueue`, `dequeue`, `toArray`, `clear`, and `size`.
10. Submit `AI_FAILURE_AUDIT.md` with at least 3 real, proven, fixed bugs.

### Out of Scope

- Computer-keyboard note mapping or real MIDI input.
- Saving or exporting recordings.
- Multiple waveforms, effects, or a mixer.
- Backend, database, or authentication.
- Third-party audio, UI, or state libraries.

Normal keyboard accessibility for focused UI controls is still expected. “Computer-keyboard play” being out of scope means mapping keys such as A/S/D to piano notes, not removing standard browser accessibility from controls.

## 3. Data Contract

### Generated key

```js
{
  midi: 69,
  noteName: 'A4',
  isBlack: false,
  freqHz: 440
}
```

### Recorded event

```js
{
  midi: 69,
  freqHz: 440,
  durationMs: 320,
  deltaMs: 150
}
```

| Item | Type | Rule |
| --- | --- | --- |
| `PIANO_KEYS` | Array of 88 keys | Generated once at module load; stable reference |
| `pressed` | `Set<number>` | MIDI numbers currently shown as pressed; update immutably |
| `voices` | `Map<number, { osc, gain }>` | Insertion order represents FIFO order of active voices |
| Recording queue | FIFO queue of events | Replay reads a snapshot created with `toArray()` |
| Replay speed | `0.5`, `1`, or `2` | Divide both event delays and note durations by the selected speed |
| `deltaMs` | Number | Time from the previous note-on to this note-on; for the first event, time from recording start |
| `durationMs` | Number | Time from note-on to note-off; if recording stops while the note is held, use the stop-recording time |

### Shared timing and event rules

- Record events in **note-on order**, not in the order the user releases notes. A chord or overlapping notes must keep their original start order even when the notes are released in a different order.
- Track the start time, frequency, and note identity when recording note-on. Finalize the event when note-off occurs or when recording stops.
- When stopping a recording with notes still held, finalize their recorded durations at the stop-recording timestamp. Do not create a second event if those notes are physically released later.
- Replay uses a copy of the completed event array. Replaying must not mutate or consume the original recording.
- Replay-generated notes must not be added to a new recording.

## 4. Implementation Phases

### Phase A — Setup and Key Generation

**Tasks**

- Create a Vite + React 19 project using JavaScript and plain CSS.
- Implement `midiToFreq(midi)` using `440 * 2 ** ((midi - 69) / 12)`.
- Implement `generatePianoKeys()` by looping from MIDI 21 through MIDI 108 inclusive.
- Generate each key's `midi`, `noteName`, `isBlack`, and `freqHz`.
- Export one stable `PIANO_KEYS` array.

**Acceptance criteria**

- The array has exactly 88 entries: 52 white keys and 36 black keys.
- The first key is A0 with MIDI 21; A4 is MIDI 69 at 440 Hz; the last key is C8 with MIDI 108.
- Black-key detection is derived from pitch class, not individually hardcoded.
- No piano-key element is hardcoded in JSX.

### Phase B — Piano UI and `PianoKey`

**Tasks**

- Implement `PianoKey` as a `React.memo` component following the assignment contract:
  `midi`, `noteName`, `isBlack`, `isPressed`, `onNoteOn`, and `onNoteOff`.
- Use a native `<button type="button">` for each key and set `aria-pressed={isPressed}`.
- Use `onPointerDown` and `onPointerUp` to start and release notes.
- Handle `pointercancel` and pointer release outside the key so a note cannot remain stuck. Use pointer capture where appropriate, while preserving the six-prop component contract.
- Render all 88 keys in a horizontally scrollable keyboard. Use CSS positioning so black keys overlap the neighboring white keys correctly.
- Display each key's note name.
- Keep the six contract props stable and avoid creating new object/function props for each key on every render.

**Acceptance criteria**

- White and black keys are visually distinct and aligned like a piano.
- All 88 keys display their note names.
- Pressing and releasing a key updates its visual pressed state.
- Pointer cancellation or losing pointer interaction cannot leave a note stuck.
- UI controls can be focused and operated with standard keyboard accessibility. No A/S/D-style note mapping is required.

### Phase C — Pressed State, Stable Handlers, and Render Isolation

**Tasks**

- Keep `pressed` as a `Set` in React state and update it immutably. Never mutate the existing state `Set` directly.
- Implement `handleNoteOn` and `handleNoteOff` with `useCallback` and stable dependencies.
- Pass `isPressed={pressed.has(key.midi)}` to each `PianoKey`.
- Keep the `PIANO_KEYS` array and callback references stable.
- Use `React.memo` shallow prop comparison. React's default `memo` comparison is sufficient when the props remain stable. If the assignment rubric explicitly requires a named `shallowEqual` helper from Lab 2, reuse that helper or implement a local comparator and pass it as the second argument to `memo`; do not import `shallowEqual` as though it were a named React API.

**Acceptance criteria**

- An isolated press or release changes `isPressed` for only the relevant key, so only that `PianoKey` needs to re-render.
- When multiple keys change state (for example, pressing a ninth note steals the oldest voice), only the keys whose props actually changed may re-render.
- Verify an isolated key press and release with React DevTools Profiler. Do not claim that every interaction must always render exactly one key if more than one key's state changes.

### Phase D — `PolyphonicSynth`

**Tasks**

- Implement `src/audio/PolyphonicSynth.js`.
- Create the `AudioContext` lazily on the first user-triggered note so browsers that require a user gesture can start audio correctly.
- Store active voices in `Map<midi, { osc, gain }>`; the map's insertion order defines FIFO order.
- Implement `noteOn(midi, freqHz)`:
  - If the same MIDI note is already active, do not create a duplicate voice.
  - If fewer than 8 voices are active, create and start the oscillator.
  - If 8 voices are active, release the oldest voice first, then start the new note.
  - Return the stolen MIDI number when a voice was stolen, or `null` when no voice was stolen.
- Implement `noteOff(midi)` using the release envelope below. Remove the voice from the active-voice map immediately so it no longer counts toward the 8 active voices, but let the oscillator finish its short release tail before disconnecting it.
- Implement `stopAll()` to prevent further active notes and begin a short release for each active voice.
- Implement `dispose()` to stop/disconnect remaining audio nodes, clear the map, and close the `AudioContext` when appropriate.
- Disconnect oscillator and gain nodes after the oscillator ends. Do not leave completed nodes connected indefinitely.
- Keep the synth instance in a React `useRef`. If FIFO stealing returns a MIDI number, clear that key from the UI's `pressed` state and finalize any corresponding recorded note at the steal time if it is being recorded.

**Release envelope requirement**

Use an exponential ramp to `0.0001` over 40 ms and schedule the oscillator to stop at the **end** of the ramp. Calling `osc.stop()` immediately without a future stop time would cut off the ramp and defeat the fade-out.

```js
const now = this.ctx.currentTime;

gain.gain.cancelScheduledValues(now);
gain.gain.setValueAtTime(
  Math.max(gain.gain.value, 0.0001),
  now
);
gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
osc.stop(now + 0.04);
```

After the oscillator's `ended` event, disconnect the oscillator and gain nodes. Guard against duplicate release calls so the same voice is not stopped or disconnected repeatedly.

**Acceptance criteria**

- Up to 8 active notes can sound together.
- Starting a ninth distinct note releases the oldest active voice first.
- The active `voices` map never contains more than 8 voices.
- Playing the same MIDI number twice does not create a duplicate active voice.
- A normal note release fades over 40 ms instead of stopping abruptly.
- The stolen key's UI state is cleared, and recording does not leave a stolen note open indefinitely.
- `stopAll()` and `dispose()` leave no active map entries or permanently connected nodes.

### Phase E — FIFO Recording

**Tasks**

- Implement a small FIFO queue with `enqueue`, `dequeue`, `toArray`, `clear`, and `size`.
- Add **Record** and **Stop Recording** controls.
- On recording start, clear the previous queue and store the recording start timestamp.
- On note-on, record its MIDI number, frequency, and start timestamp in a separate structure for currently held recorded notes.
- On note-off, calculate `durationMs` and finalize that event.
- On Stop Recording, finalize every still-held recorded note using the stop timestamp. Avoid duplicate finalization when the physical note is released later.
- Preserve note-on ordering even when overlapping notes are released out of order. Calculate `deltaMs` from consecutive note-on timestamps after the events have been finalized and sorted into note-on order, with the first delta measured from the recording start.
- If voice stealing ends a recorded note, finalize that note at the steal timestamp.
- Exclude replay-generated events from recording.

**Acceptance criteria**

- Recorded events preserve the order in which notes began, including chords and overlapping notes.
- Every event contains `midi`, `freqHz`, `durationMs`, and `deltaMs`.
- Stopping a recording while notes are held finalizes their durations without creating duplicate events.
- The queue's `toArray()` returns a snapshot that can be replayed repeatedly without consuming or changing the stored recording.
- Recording and replay cannot run at the same time.

### Phase F — Asynchronous Replay

**Tasks**

- Implement `sleep(ms, signal)` as an abortable delay. It must check whether the signal is already aborted, clear its timeout when aborted, remove its abort listener on completion, and reject or otherwise terminate with a handled abort result.
- Implement `playSequence(events, speed, handlers, signal)` using a snapshot of the recorded events.
- For each event, wait `deltaMs / speed`, trigger note-on, and schedule note-off after `durationMs / speed` **without blocking the scheduling of later note-ons for the full duration**.
- Track all note-off timers created by replay so they can be canceled. Resolve replay cleanly after the note-on sequence and its remaining note releases finish, or terminate cleanly when aborted.
- Support a speed selector with `0.5x`, `1.0x`, and `2.0x`.
- Make Record and Play mutually exclusive. Prevent replay events from being captured by the recording logic.
- Avoid conflicting manual note events during replay; the handlers should ignore manual note input while replay is active, or otherwise explicitly prevent the same MIDI voice from being owned by both manual input and replay.
- Allow the same recording to be replayed more than once.

**Timing rule**

`deltaMs` is the delay between consecutive note-on events, not the delay between note releases. Each note's release timer runs independently, so later notes can begin while earlier notes are still sounding. At `1.0x`, timing uses the recorded values; at `0.5x`, both delays and durations are doubled; at `2.0x`, both are halved.

**Acceptance criteria**

- Replay timing matches the recording at `1.0x`, takes approximately twice as long at `0.5x`, and half as long at `2.0x`, subject to normal browser timer scheduling.
- Overlapping notes and chords remain overlapping during replay.
- Replayed notes light up their corresponding keys and are not recorded again.
- The same recording can be replayed repeatedly.
- Aborted or completed replay does not leave pending note-off timers behind.

### Phase G — Cancellation and Cleanup

**Tasks**

- Create one `AbortController` per replay and keep the current controller in a `useRef`.
- Add a **Stop Sequence** button.
- On Stop Sequence:
  1. Abort the current replay controller.
  2. Clear all tracked replay timers, including note-off timers.
  3. Prevent any new replay note from starting.
  4. Call `stopAll()` to begin releasing active voices.
  5. Clear the UI's pressed state.
  6. Reset replaying/loading state and handle abort rejection so it does not become an unhandled promise rejection.
- On unmount, run the same cancellation/cleanup process, clear pressed state as part of teardown, dispose the synth, and set `synthRef.current` to `null` so a later valid setup can create a fresh instance.
- Ensure React Strict Mode's development setup/cleanup cycle cannot leave the app holding a disposed synth instance. Create or recreate the synth lazily when needed rather than assuming a disposed `useRef` instance is still usable.
- Make cleanup idempotent so calling it more than once is safe.

**Cancellation behavior**

Stop Sequence must cancel pending work immediately: no new note may start after the stop action. Active notes begin their short 40 ms release immediately, and no sound or timer should remain after that release window. During unmount, disposal may stop and disconnect audio nodes directly because the component is being torn down.

**Acceptance criteria**

- Stop Sequence prevents all future scheduled notes from playing.
- Active notes are silenced through the release path, with no sound remaining after the short release window.
- All replay `sleep` and note-off timers are cleared on cancellation.
- After unmount, `voices.size` is `0`, no replay timers remain, and the audio resources are disposed.
- React Strict Mode does not cause subsequent user interactions to use a disposed synth.

### Phase H — Verification and Audit

Perform these manual checks:

1. Start the app and check the browser console for errors and unhandled promise rejections.
2. Confirm 88 keys total: 52 white and 36 black.
3. Confirm the first key is A0/MIDI 21 and the last is C8/MIDI 108.
4. Play A4 and verify its frequency is 440 Hz.
5. Use React DevTools Profiler to inspect an isolated key press and release. Confirm only the key whose props changed needs to re-render.
6. Hold nine distinct notes and confirm the oldest is released first and `voices.size` never exceeds 8.
7. Listen for audible clicks on normal note release.
8. Record a short sequence and replay it at `0.5x`, `1.0x`, and `2.0x`.
9. Record overlapping notes and a chord; confirm replay preserves note-on order and overlap.
10. Stop recording while one or more notes are held; confirm events are finalized once with the correct durations.
11. Press **Stop Sequence** while replay notes are sounding and while future notes are still scheduled.
12. Confirm no new notes play after Stop Sequence and no replay timers remain.
13. Navigate away or unmount during replay; confirm no sound or timer remains and the app can create a fresh synth after a valid remount.
14. Run the verification/`grep` checks documented in `README.md`.
15. Complete `AI_FAILURE_AUDIT.md` with at least three real bugs that were reproduced, proven, fixed, and retested. Include evidence such as DevTools observations, console/network output, or a clear before/after test when applicable.

## 5. Definition of Done

The homework is complete when:

- All 88 keys are generated algorithmically with the correct MIDI numbers, note names, colors, and frequencies.
- `PianoKey` follows the six-prop contract and uses `React.memo` with stable props.
- Render isolation has been verified in React DevTools Profiler.
- The synth enforces a maximum of 8 active voices and steals the oldest voice in FIFO order.
- Notes use a 40 ms exponential release ramp, with oscillators stopped after the ramp and nodes disconnected after ending.
- Recording preserves note-on order and stores correct `midi`, `freqHz`, `durationMs`, and `deltaMs` values.
- Replay works at `0.5x`, `1.0x`, and `2.0x`, including overlapping notes and chords.
- Stop Sequence and unmount cancel pending work and clean up timers and audio resources.
- React Strict Mode does not leave the application with a disposed synth instance.
- `README.md` documents how to run and verify the project, including its required checks.
- `AI_FAILURE_AUDIT.md` contains at least three real, proven, fixed bugs.

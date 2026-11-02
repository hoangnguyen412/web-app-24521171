# HW2 — 88-Key Polyphonic Piano & Concurrent FIFO Sequencer

An 88-key Web Audio piano with 8-voice polyphony, FIFO voice stealing, a recorded FIFO note queue and abortable asynchronous replay. It combines Legacy Slide 27 (88-key piano) with the Lab 2 `memo()` and `shallowEqual` techniques and the Lab 2 HW 2 FIFO `AudioTaskQueue`.

The homework focuses on algorithmic key generation, `React.memo` render isolation (only the pressed key re-renders), deterministic voice management with an ES6 `Map`, click-free envelopes, and cancellation with `AbortController`.

## Homework Scope

Build a piano from **A0 to C8** (MIDI 21 to 108) without hardcoding 88 elements:

| Item | Value |
| --- | --- |
| Total keys | 88 |
| White keys | 52 |
| Black keys | 36 |
| Lowest key | A0 (MIDI 21) |
| Highest key | C8 (MIDI 108) |
| Frequency | `f = 440 * 2 ** ((midi - 69) / 12)` |

## Required Behavior

- **Algorithmic generation:** all 88 keys are generated from MIDI numbers; hardcoding 88 tags is banned.
- **`PianoKey`:** `memo`-wrapped button following the assignment contract (`midi`, `noteName`, `isBlack`, `isPressed`, `onNoteOn`, `onNoteOff`, `aria-pressed`).
- **Render isolation:** pressing one key re-renders only that key, verified in the React DevTools Profiler.
- **8-voice polyphony:** up to 8 simultaneous Web Audio oscillators.
- **FIFO voice stealing:** the 9th concurrent note releases the oldest voice (`this.voices.keys().next().value`).
- **Click-free release:** `gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04)` before `osc.stop()`.
- **FIFO recording:** each note is recorded as `{ midi, freqHz, durationMs, deltaMs }` into a FIFO queue.
- **Replay:** asynchronous replay at `0.5x`, `1.0x` and `2.0x`.
- **Cancellation:** **Stop Sequence** and unmount abort pending playback and silence active oscillators (`AbortController`).

## Technology and Requirements

- React 19 function components and hooks.
- Vite, JavaScript, plain CSS.
- Web Audio API; no audio libraries and no extra dependencies.
- ES6 `Map` for active voices.
- `AbortController` for replay cancellation.

## Architecture Notes

- **Algorithmic data:** the key list is generated once and has a stable reference.
- **Stable props:** `onNoteOn` and `onNoteOff` are `useCallback` functions, and `isPressed` is a plain boolean, so `memo` can skip unchanged keys.
- **Single source of truth for sound:** a `PolyphonicSynth` instance (kept in a ref) owns the voices; React state only mirrors which keys are pressed.
- **Deterministic voices:** `Map` insertion order gives FIFO stealing in O(1).
- **Unidirectional replay:** recorded events go through the same note handlers as live playing, so the UI highlights replayed notes.

## Getting Started

```bash
npm install
npm run dev
```

Before submitting:

```bash
npm run lint
npm run build
```

## Project Structure

```text
src/
  audio/
    PolyphonicSynth.js    # voice pool, FIFO stealing, noteOff + ramp
    FifoQueue.js          # recorded note queue
    replay.js             # abortable replay
  components/
    PianoKey.jsx
    Piano.jsx             # generates and renders the keys
    Sequencer.jsx         # Record / Play / speed / Stop Sequence
  lib/
    pianoKeys.js          # key generation + midiToFreq
  App.jsx
  main.jsx
  index.css
```

## Verification Checklist

- [ ] Exactly 88 keys are generated: 52 white and 36 black.
- [ ] The first key is A0 (MIDI 21) and the last is C8 (MIDI 108).
- [ ] Frequencies come from `440 * 2 ** ((midi - 69) / 12)`; A4 equals 440 Hz.
- [ ] No hardcoded 88 key elements exist in the source.
- [ ] `PianoKey` is wrapped in `memo` and its props match the contract.
- [ ] React DevTools Profiler: pressing one key commits only that `PianoKey`.
- [ ] Nine simultaneous notes never exceed 8 voices; the oldest voice is released first.
- [ ] Releasing a note has no audible click or pop.
- [ ] A recorded sequence replays at 0.5x, 1.0x and 2.0x with correct timing.
- [ ] **Stop Sequence** stops scheduled and sounding notes immediately.
- [ ] Unmounting the page leaves no sound, timer or pending promise.
- [ ] No console errors or React warnings.

## Verification Audit

```bash
# Key generation uses the MIDI frequency formula (expected: at least 1 match)
grep -rn "440" src/lib/pianoKeys.js

# Voice stealing uses the Map's first key (expected: at least 1 match)
grep -n "keys().next().value" src/audio/PolyphonicSynth.js

# Envelope ramp is present (expected: at least 1 match)
grep -n "exponentialRampToValueAtTime" src/audio/PolyphonicSynth.js

# Cancellation is present (expected: at least 1 match)
grep -rn "AbortController" src/

# PianoKey is memoized (expected: at least 1 match)
grep -n "memo(" src/components/PianoKey.jsx
```

## Profiler Evidence

Record in React DevTools: Profiler, Record, press one key, Stop. Save the screenshot as `docs/profiler.png` and note the result:

| Action | Components committed |
| --- | --- |
| Press one key | `___` |
| Release one key | `___` |

## Related Documents

- `TASK_DECOMPOSITION.md`
- `PROJECT_RULES.md`
- `AI_AUDIT.md`

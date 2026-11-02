# AI Failure Mode Audit — React 19 HW2

## Project

88-Key Polyphonic Piano & Concurrent FIFO Sequencer

## Failure #01: Incorrect Black-Key Horizontal Alignment

### Requirement

Generate an 88-key piano with black keys overlapping the
correct boundaries between neighboring white keys.

### AI-Generated Code

```jsx
const positionStyle = isBlack
  ? {
      left: `${countWhiteKeysBefore(midi) * WHITE_KEY_WIDTH_PX}px`,
    }
  : undefined;
```

### Bug

The calculated position represents the boundary between two white keys.
However, the code places the left edge of the black key at that boundary.

With a black-key width of 27px, the key is shifted 13.5px to the right.

### DevTools Proof

1. Inspect A#0 (MIDI 22) in Chrome DevTools Elements.
2. Inspect its computed `left` and `width`.
3. Before the fix, the key uses `left: 42px` and `width: 27px`.
4. Its center is therefore 55.5px, although the expected boundary is 42px.
5. After the fix, inspect the computed transform.

**Evidence to capture:** Before/after screenshots from the Elements panel.

### Engineering Fix

Added:

```jsx
transform: "translateX(-50%)"
```

This centers each black key over its calculated white-key boundary.

### Verification

[ ] Before/after alignment checked in the browser.

---

## Failure #02: Manual Piano Interaction Interrupts Sequence Replay

### Requirement

Replay recorded notes asynchronously while preserving their
scheduled durations and preventing recording/playback conflicts.

### AI-Generated Code

```jsx
<PianoKey
  onNoteOn={handleNoteOn}
  onNoteOff={handleNoteOff}
/>
```

The same handlers were also passed to the sequence player:

```js
playSequence(events, speed, {
  noteOn: handleNoteOn,
  noteOff: handleNoteOff,
}, signal);
```

### Bug

The physical piano and sequence player share the same MIDI-based
note-off handler.

During replay, manually releasing a key with the same MIDI number
can stop the sequence's active voice prematurely.

### DevTools Proof

1. Record a long A4 note.
2. Start playback.
3. While A4 is playing, try interacting with A4 manually.
4. Before the fix, the pointer event can reach the piano button
   and call `handleNoteOff(69)`.
5. Inspect the event breakpoint and call stack in Chrome DevTools.

**Evidence to capture:** Before/after replay behavior and pointer-event
breakpoint screenshots.

### Engineering Fix

Added to the piano-track container:

```jsx
aria-disabled={isPlaying}
inert={isPlaying}
```

The piano is temporarily non-interactive during sequence playback.

### Verification

[ ] Manual interaction cannot interrupt replay.

---

## Failure #03: React State Update During Unmount Cleanup

### Requirement

Abort all scheduled playback operations and release audio resources
when the component unmounts.

### AI-Generated Code

The original cleanup called:

```js
controller?.abort();
```

The abort handler then called `handleNoteOff()`, which unconditionally
updated React state:

```js
setPressed((previous) => {
  const next = new Set(previous);
  next.delete(midi);
  return next;
});
```

### Bug

Aborting playback during unmount releases active notes through
the normal note-off handler.

That handler could call `setPressed()` while the component was
being unmounted.

### DevTools Proof

1. Start a sequence with a long-duration note.
2. Open Chrome DevTools Sources.
3. Set a breakpoint inside `handleNoteOff()`.
4. Navigate away while playback is active.
5. Inspect the call stack from effect cleanup through
   `controller.abort()` and the note-off handler.
6. Before the fix, execution reaches the React state update.
7. After the fix, `mountedRef.current` is false and the handler
   returns before updating state.

**Evidence to capture:** Breakpoint call-stack screenshots before/after
the mounted-state guard.

### Engineering Fix

Added a mounted-state ref:

```js
const mountedRef = useRef(false);
```

The lifecycle effect sets it to true during setup and false
before aborting playback during cleanup.

The note-off handler always releases the audio voice but skips
React state updates after unmount.

### Verification

[ ] Unmount during replay produces no post-unmount state update.
[ ] Audio resources are released.
[ ] Application can mount again and play normally.

---

## Final Audit Checklist

- [ ] Three real AI-generated bugs documented.
- [ ] Reproduction steps completed.
- [ ] DevTools evidence captured.
- [ ] Engineering fixes implemented.
- [ ] Fixes re-tested.
- [ ] Screenshots or evidence records retained for submission.
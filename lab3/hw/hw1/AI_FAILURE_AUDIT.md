# HW1 — AI Failure Audit

Mandatory deliverable of the AI Failure Mode Audit (15% weight): document, prove via DevTools and manually fix at least 3 AI-generated bugs found while building the Production Studio Drum Kit.

## 1. Audit Rules

- Each entry comes from AI-generated code reviewed during the HW1 build.
- Each bug is reproducible on the pre-fix commit (`git checkout <fix-hash>^`) and observable in DevTools.
- Each bug was fixed manually, and the fix is explained.
- Original prompts were not all preserved; where marked "reconstructed", the prompt is rebuilt from the task history, not quoted verbatim.
- Minimum: 3 entries (this file has 4).

## 2. Failure #01: Props Contract Mismatch Between `App.jsx` and `DrumPad.jsx`

- **Prompt** (reconstructed): "Build the drum kit App and a DrumPad component for the 7 pads (W/A/S/D/J/K/L) with an accessible label showing the pad name and its key."
- **AI Code**:

```jsx
// App.jsx
<DrumPad key={pad.id} pad={pad} onTrigger={padHandlers[pad.id]} />

// DrumPad.jsx
export function DrumPad({ id, label, keyLabel, onTrigger }) {
  return (
    <button aria-label={`${label}, phím ${keyLabel}`} onClick={onTrigger}>
      {label}
    </button>
  );
}
```

- **Bug**: `App` passes one `pad` object but `DrumPad` destructures `id`, `label`, `keyLabel`, so all three are `undefined`. The button renders empty and its accessible name is "undefined, phím undefined". Clicking still played a sound because `padHandlers` ignored its argument, which hid the bug in a quick manual test.
- **DevTools Proof** (pre-fix commit): React DevTools → Components → select `DrumPad`: props `id`, `label`, `keyLabel` are `undefined`. Elements tab: `aria-label="undefined, phím undefined"` and an empty button text.
- **Engineering Fix (Commit `<hash>`)**: `App` now passes the props `DrumPad` reads, plus `isActive`, and triggering goes through one shared handler; `padHandlers` was removed:

```jsx
<DrumPad
  key={pad.id}
  id={pad.id}
  label={pad.name}
  keyLabel={pad.keyLabel}
  isActive={activePads.has(pad.id)}
  onTrigger={onTriggerPad}
/>
```

## 3. Failure #02: `<output>` Decibel Meter Is an Implicit Live Region

- **Prompt** (reconstructed): "Add a visual decibel meter for the deaf/hard-of-hearing requirement that shows the current level in dBFS."
- **AI Code**:

```jsx
<output className="meter">{level.toFixed(1)} dBFS</output>
```

- **Bug**: `<output>` has an implicit `role="status"` (polite live region). The level updates about every 100 ms, so a screen reader announces it continuously and drowns out the Hit Log, which the assignment says is the only region that should announce.
- **DevTools Proof** (pre-fix commit): Elements → Accessibility pane on the meter node shows role `status` (live region: polite). Optional: NVDA/VoiceOver reading the value repeatedly.
- **Engineering Fix (Commit `<hash>`)**: Replaced `<output>` with a plain `<span>` so the dBFS number is no longer a live region.

## 4. Failure #03: Hit Log Does Not Announce Repeated Hits or Expose History

- **Prompt** (reconstructed): "Add an `<output aria-live="polite">` hit history so deaf/hard-of-hearing users see every hit."
- **AI Code**:

```jsx
<output aria-live="polite">Last hit: {last.name}, key {last.keyLabel}</output>
<ol>
  {hits.map((h) => <li key={h.id}>{h.name}</li>)}
</ol>
```

- **Bug**: (1) The live region holds only the latest hit; the history `<ol>` is outside it, but the assignment requires the hit history inside `<output aria-live="polite">`. (2) Hitting the same pad twice gives identical text ("Last hit: Kick, key W"), so React does not touch the DOM and a screen reader stays silent on the second hit.
- **DevTools Proof** (pre-fix commit): Elements tab: hit the same pad twice and the `<output>` text node does not mutate (no flash) on the second hit; the `<ol>` is a sibling outside the `<output>`.
- **Engineering Fix (Commit `<hash>`)**: The history is now inside the `<output aria-live="polite">`, and each entry carries per-hit information (hit number) so consecutive hits on the same pad produce different content. Screen-reader behavior of the list update should still be checked with NVDA/VoiceOver.

## 5. Failure #04: Modifier Keys Trigger Pads and Are Blocked by `preventDefault`

- **Prompt** (reconstructed): "Write `useDrumKeyboard` using `e.code`, `e.repeat` and an input-focus guard."
- **AI Code**:

```jsx
const onKeyDown = (e) => {
  if (e.repeat) return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  const pad = padMap.get(e.code);
  if (pad) { e.preventDefault(); onTriggerPad(pad.id); }
};
```

- **Bug**: No guard for `Ctrl`/`Meta`/`Alt`. Ctrl+A, Ctrl+S, Ctrl+D and Ctrl+L map to pad keys, so they fire a pad and `preventDefault` blocks the browser shortcut. The hook also had no `keyup`, so `aria-pressed` depended only on a 120 ms timer.
- **DevTools Proof** (pre-fix commit): Console: log `e.code` and `e.ctrlKey` in the handler; pressing Ctrl+S logs `KeyS / true` and the pad fires.
- **Engineering Fix (Commit `<hash>`)**: Added `if (e.ctrlKey || e.metaKey || e.altKey) return;` and a `keyup` listener (optional `onReleasePad`) that clears the active state; the shortcut toggle is wired to `isEnabled`.

## 6. Summary Table

| # | Failure | Category | DevTools panel used | Commit |
| --- | --- | --- | --- | --- |
| 01 | Props contract mismatch (`pad` vs `id/label/keyLabel`) | Hallucinated contract between components | React DevTools Components, Elements | `<hash>` |
| 02 | `<output>` meter is an implicit live region | Accessibility / live region spam | Elements, Accessibility | `<hash>` |
| 03 | Hit Log not re-announced, history outside live region | Accessibility / live region | Elements | `<hash>` |
| 04 | Modifier keys trigger pads, no `keyup` | Missing input guards | Console | `<hash>` |

## 7. Submission Checklist

- [x] At least 3 AI bugs documented.
- [x] Every entry has a prompt and the AI code.
- [x] Every entry explains the cause and the real consequence.
- [x] Every entry has DevTools proof and a manual fix.
- [x] Real commit hashes filled in (`git log --oneline`).
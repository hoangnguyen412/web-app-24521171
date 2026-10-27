# HW1 — AI Failure Audit

Mandatory deliverable of the AI Failure Mode Audit (15% weight): document, prove via DevTools and manually fix at least 3 AI-generated bugs found while building the Production Studio Drum Kit.

> Only record bugs the AI actually produced while you worked. Delete any entry that did not happen. Do not invent evidence or commit hashes. This file is a template; the proof and fix fields must come from your real work.

## 1. Audit Rules

- Each entry must come from a real AI prompt and real AI output.
- Each bug must be reproduced and proven with DevTools (Network, Console, Elements, React DevTools Profiler or Performance).
- Each bug must be fixed manually, and the fix must be explained.
- A bug that is only theoretical does not count.
- Minimum: 3 entries.

## 2. Entry Format

Every entry uses these seven fields:

1. Failure name
2. Prompt
3. AI Code
4. Bug
5. DevTools Proof
6. Engineering Fix
7. Commit (if you use Git)

## 3. Failure Modes to Look For in HW1

| AI failure mode | Where it can appear in HW1 | Useful DevTools evidence |
| --- | --- | --- |
| Stale closure in event or timer hooks | `keydown` handler registered with `[]` deps reading old state | Console log of stale values; Hit Log not updating correctly |
| Missing listener or audio cleanup | Listener never removed; `AudioContext` or oscillators never stopped | Elements, Event Listeners on `window` showing duplicates; Console showing `audioCtx.state` |
| `keyCode` or `key` instead of `e.code`; missing `e.repeat` or input guard | Hook written without the contract's guards | Console log of `e.keyCode` and `e.code` with UniKey on; Hit Log flooding while a key is held |
| Redundant `useEffect` for derived state | Extra state copying the hit log or active pads | React DevTools Profiler showing an extra render per hit |

## 4. Failure #01: Stale Closure in the Keydown Listener

- **Prompt**: `<the exact prompt you gave the AI>`
- **AI Code**:

```jsx
useEffect(() => {
  const onKeyDown = (e) => {
    setHits([...hits, e.code]);
  };
  window.addEventListener('keydown', onKeyDown);
}, []);
```

- **Bug**: `<explain what actually happened: the empty dependency array freezes the initial state snapshot, and the missing cleanup keeps old listeners alive>`
- **DevTools Proof**: `<what you observed: for example Console output of the stale array length, or duplicate keydown listeners under Elements, Event Listeners>`
- **Engineering Fix (Commit `<hash>`)**: `<functional state update or correct dependencies, plus a cleanup that calls removeEventListener>`

## 5. Failure #02: `keyCode` Usage or Missing Repeat and Input Guards

- **Prompt**: `<the exact prompt you gave the AI>`
- **AI Code**: `<paste the AI code that used keyCode or key, or lacked e.repeat or the INPUT check>`
- **Bug**: `<explain the real effect: IME (UniKey) breaking triggers, key-hold flooding, or pads firing while typing in the input>`
- **DevTools Proof**: `<Console output of e.key, e.keyCode and e.code with UniKey enabled, or the Hit Log flooding while a key is held>`
- **Engineering Fix (Commit `<hash>`)**: `<e.code mapping, e.repeat guard and tagName check as in the assignment contract>`

## 6. Failure #03: Missing Audio or Listener Cleanup on Unmount

- **Prompt**: `<the exact prompt you gave the AI>`
- **AI Code**: `<paste the AI code that created AudioContext or oscillators or listeners without cleanup>`
- **Bug**: `<explain the real effect: nodes or listeners still alive after the component is gone>`
- **DevTools Proof**: `<Console output of audioCtx.state after unmount, or Event Listeners panel after a hot reload>`
- **Engineering Fix (Commit `<hash>`)**: `<stop and disconnect nodes, close the context, remove listeners and cancel animation frames in cleanup>`

## 7. Optional Further Entries

Copy the entry format above for any additional real bug.

## 8. Summary Table

| # | Failure | Category | DevTools panel used | Commit |
| --- | --- | --- | --- | --- |
| 01 | | | | |
| 02 | | | | |
| 03 | | | | |

## 9. Submission Checklist

- [ ] At least 3 real AI bugs are documented.
- [ ] Every entry has a prompt and the AI code.
- [ ] Every entry explains the cause and the real consequence.
- [ ] Every entry has DevTools proof.
- [ ] Every entry has a manual fix with an explanation.
- [ ] No placeholder text (`<...>`) remains.

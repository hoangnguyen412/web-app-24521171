# HW3 — AI Failure Audit

Mandatory deliverable (`AI_FAILURE_AUDIT.md`, 15% weight): document, prove via DevTools and manually fix at least 3 AI-generated bugs caught while building the KRAFTON x PUBG VN Arena.

> Submit this file under the name `AI_FAILURE_AUDIT.md`. Only record bugs the AI actually produced while you worked. Delete any entry that did not happen. Do not invent evidence or commit hashes. This file is a template; the proof and fix fields must come from your real work.

## 1. Audit Rules

- Each entry must come from a real AI prompt and real AI output.
- Each bug must be reproduced and proven with DevTools (Network, Console, React DevTools Profiler, Performance or Elements).
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

## 3. Failure Modes to Look For in HW3

| AI failure mode | Where it can appear in HW3 | Useful DevTools evidence |
| --- | --- | --- |
| Naive `setInterval` countdown drift | Countdown written as `setSeconds(s => s - 1)` | Console comparison with `targetEpochMs - Date.now()` after a background tab |
| Stale closure in timer hooks | Interval with `[]` deps reading an old target or offset | Console log of stale values after the target changes |
| Duplicate claims or wrong rollback | Claim without an in-flight lock, or rollback using an old snapshot | Network or Console showing two requests; React DevTools showing wrong `remainingStock` |
| Redundant `useEffect` for derived state | Leaderboard copying filtered or sorted rows into state | React DevTools Profiler showing two commits per keystroke |
| Missing `AbortController` or cleanup | Mock request or listeners that outlive the component | Console warning or Network entry after unmount |

## 4. Failure #01: Per-Second Countdown Drifts in Background Tabs

- **Prompt**: `<the exact prompt you gave the AI>`
- **AI Code**:

```jsx
useEffect(() => {
  const id = setInterval(() => setSeconds((s) => s - 1), 1000);
  return () => clearInterval(id);
}, []);
```

- **Bug**: `<explain what actually happened: the browser throttles background timers, and a counter that decrements per callback lags real time>`
- **DevTools Proof**: `<what you measured: for example the displayed value versus targetEpochMs - Date.now() after the tab stayed in the background for a minute>`
- **Engineering Fix (Commit `<hash>`)**: `<compute remaining time from targetEpochMs, resync on visibilitychange, and clean up the interval and listener>`

## 5. Failure #02: Duplicate Claims or Wrong Rollback

- **Prompt**: `<the exact prompt you gave the AI>`
- **AI Code**: `<paste the AI claim code that had no in-flight lock, or restored stock from an old snapshot>`
- **Bug**: `<explain the real effect: a double-click sends two requests, stock is deducted twice, or a 409 restores the wrong value>`
- **DevTools Proof**: `<number of requests after one double-click, plus remainingStock before and after in React DevTools or the Console>`
- **Engineering Fix (Commit `<hash>`)**: `<claimId lock with a useRef set, exact-amount rollback, and the lock released in finally>`

## 6. Failure #03: Redundant `useEffect` for Derived Leaderboard State

- **Prompt**: `<the exact prompt you gave the AI>`
- **AI Code**:

```jsx
const [visible, setVisible] = useState(standings);

useEffect(() => {
  setVisible(
    standings
      .filter((s) => s.squadName.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b[sortKey] - a[sortKey]),
  );
}, [standings, query, sortKey]);
```

- **Bug**: `<explain the real effect: an extra render pass for every filter change, and the mutating sort>`
- **DevTools Proof**: `<React DevTools Profiler: number of commits per keystroke, before and after the fix>`
- **Engineering Fix (Commit `<hash>`)**: `<compute visible squads during render with filter and toSorted, with no extra state>`

## 7. Optional Failure #04: Missing `AbortController` or Cleanup

- **Prompt**: `<the exact prompt you gave the AI>`
- **AI Code**: `<paste the AI code that started the mock request without a signal or cleanup>`
- **Bug**: `<explain the real effect: a request that keeps running or updates state after unmount>`
- **DevTools Proof**: `<Network or Console evidence>`
- **Engineering Fix (Commit `<hash>`)**: `<AbortController, signal passed to the mock server, and no state update after abort>`

## 8. Summary Table

| # | Failure | Category | DevTools panel used | Commit |
| --- | --- | --- | --- | --- |
| 01 | | | | |
| 02 | | | | |
| 03 | | | | |

## 9. Submission Checklist

- [ ] The file is submitted as `AI_FAILURE_AUDIT.md`.
- [ ] At least 3 real AI bugs are documented.
- [ ] Every entry has a prompt and the AI code.
- [ ] Every entry explains the cause and the real consequence.
- [ ] Every entry has DevTools proof.
- [ ] Every entry has a manual fix with an explanation.
- [ ] No placeholder text (`<...>`) remains.

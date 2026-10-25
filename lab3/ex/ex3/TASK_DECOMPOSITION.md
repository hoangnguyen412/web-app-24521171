# Task Decomposition — Exercise 3

## Objective

Build `src/components/PubgMatchTelemetry.jsx`, a fault-tolerant KRAFTON PUBG Vietnam Series (PVS) telemetry interface for three Vietnamese pro squads. The deliverable demonstrates a four-state UI, asynchronous request cancellation, simulated packet loss, a loading skeleton, and accessible retry recovery.

## Scope and Constraints

- Target component: `src/components/PubgMatchTelemetry.jsx`.
- Use the three squad records in the supplied dataset.
- Use the exact states `IDLE`, `LOADING`, `SUCCESS`, and `ERROR`.
- Use `AbortController` to cancel stale requests when the squad or retry trigger changes.
- Simulate 35% satellite packet loss for Erangel/Miramar.
- Render a 220px pulsing Blue-Zone skeleton during loading.
- Render failures inside an accessible `<section role="alert">` with a retry button.
- Never use `window.alert()` for timeout or packet-loss errors.
- Preserve the required two-commit history.

## Required Squad Dataset

Represent the assignment's data without changing the supplied values:

```js
export const PUBG_VN_SQUADS = [
  {
    id: 'ces',
    name: 'Cerberus Esports',
    map: 'Erangel',
    phase: 'Phase 6',
    alive: 4,
    kills: 14,
    wwcdProb: '68%',
    status: 'In Safe Zone',
  },
  {
    id: 'te',
    name: 'The Expendables',
    map: 'Miramar',
    phase: 'Phase 7',
    alive: 4,
    kills: 18,
    wwcdProb: '82%',
    status: 'Holding High Ground',
  },
  {
    id: 'ge',
    name: 'Genius Esports',
    map: 'Taego',
    phase: 'Phase 5',
    alive: 3,
    kills: 9,
    wwcdProb: '41%',
    status: 'Rotating Blue Zone',
  },
];
```

## Task 1 — Four-State Telemetry and Request Cancellation

**Commit:** `feat(ex3): implement PUBG VN 4-state telemetry & AbortController`

### Implementation Steps

1. Create the `PubgMatchTelemetry.jsx` component and the required squad data.
2. Track the selected squad, the view model, and a retry trigger using React state where appropriate.
3. Model the view with `status`, `data`, and `error`, using only `IDLE`, `LOADING`, `SUCCESS`, and `ERROR` as status values.
4. Use an effect that runs when `squadId` or `retryTick` changes.
5. Create a new `AbortController` for each request and pass its `signal` to the telemetry request function.
6. Set the view to `LOADING` when a request begins.
7. On success, set `SUCCESS` with the returned telemetry.
8. On failure, ignore `AbortError`; represent other failures as `ERROR` with a useful message.
9. Abort the request in effect cleanup so rapid squad changes do not leave stale requests active.
10. Implement the assignment's 35% simulated packet-loss behavior for Erangel/Miramar.

### Acceptance Criteria

- Each squad selector choice initiates a request for that squad.
- The latest selected squad determines the visible result.
- A canceled request does not display a false error or overwrite newer data.
- The request state can transition to `ERROR` when a non-abort failure occurs.
- No `window.alert()` is used.

## Task 2 — Skeleton UI and Accessible Retry Recovery

**Commit:** `feat(ex3): add skeleton UI & retry alert`

### Implementation Steps

1. Render a loading skeleton when status is `LOADING`.
2. Keep the skeleton card at 220px and animate it with a pulsing Blue-Zone style.
3. Mark the loading section with `aria-busy="true"`.
4. Render successful telemetry in an `<article aria-live="polite">` or another suitable live region.
5. Render packet-timeout/connection failure in `<section role="alert">`.
6. Add a **Reconnect Satellite (Retry)** button in the error state.
7. Make retry increment `retryTick`, which reruns the effect and starts a fresh request.
8. Ensure the loading-to-result transition does not create a visible layout shift.

### Acceptance Criteria

- The skeleton is shown while telemetry is loading and has the required 220px height.
- The error is visible and announced accessibly.
- Clicking retry starts a new attempt without changing the selected squad.
- There are no calls to `window.alert()`.
- Success content is announced appropriately.

## Manual Verification Plan

1. Start the app and confirm all three squad options are visible.
2. Select CES, TE, and GE individually and verify each record's supplied fields.
3. Emulate **Slow 3G** in browser DevTools.
4. While loading, confirm the 220px skeleton appears and inspect layout shift; the exercise contract calls for **0.00 CLS** for the skeleton transition.
5. Rapidly select CES → TE → GE. In the Network panel, verify previous requests are canceled and the latest selection is the one reflected in the UI.
6. Trigger or wait for simulated packet loss on Erangel/Miramar and confirm the error appears inline under `role="alert"`.
7. Click **Reconnect Satellite (Retry)** and verify a new request begins.
8. Check that `AbortError` does not show the error alert.
9. Confirm the console contains no relevant errors and no `window.alert()` behavior exists.
10. Run `npm run build` if the project defines the script.

## Definition of Done

- Both tasks meet their acceptance criteria.
- The four-state machine, abort cleanup, simulated packet loss, skeleton, retry path, and accessibility requirements are implemented.
- Slow-network, rapid-switch, error, and retry behavior have been verified.
- Exactly the two required commits exist; no third documentation commit is created.

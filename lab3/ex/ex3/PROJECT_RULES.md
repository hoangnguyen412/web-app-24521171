# Project Rules — Exercise 3

These rules are the implementation contract for the KRAFTON PUBG Vietnam Series (PVS) Live Telemetry exercise. Follow the supplied exercise screenshots and code contract. Do not add unrelated features or replace the required behavior with a simpler approach.

## 1. Scope

- Implement the telemetry interface in `src/components/PubgMatchTelemetry.jsx`.
- Keep the interface focused on Cerberus Esports, The Expendables, and Genius Esports.
- Preserve the exact supplied sample values.
- Do not build a backend or claim that the mock is connected to official live PUBG data.
- Keep the required two atomic feature commits.

## 2. Squad Data Contract

Each squad record uses these fields:

| Field | Type | Required meaning |
| --- | --- | --- |
| `id` | String | Stable squad identifier: `ces`, `te`, or `ge` |
| `name` | String | Squad display name |
| `map` | String | Current map in the provided sample |
| `phase` | String | Current phase label |
| `alive` | Number | Number of squad members alive |
| `kills` | Number | Squad kill count |
| `wwcdProb` | String | Supplied win probability label, including `%` |
| `status` | String | Supplied location/rotation status |

Do not silently change the assignment's sample data:

- CES: Erangel, Phase 6, 4 alive, 14 kills, 68%, `In Safe Zone`.
- TE: Miramar, Phase 7, 4 alive, 18 kills, 82%, `Holding High Ground`.
- GE: Taego, Phase 5, 3 alive, 9 kills, 41%, `Rotating Blue Zone`.

## 3. State Machine Contract

The view model must support exactly these four status values:

- `IDLE`: initial/no active result state.
- `LOADING`: a telemetry request is running.
- `SUCCESS`: telemetry for the current selected squad has arrived.
- `ERROR`: a non-abort request failure occurred.

A view model shaped like `{ status, data, error }` follows the reference contract. Do not introduce conflicting loading/error booleans that can represent impossible combinations.

## 4. Request Lifecycle and AbortController

- Start a request when `squadId` changes or the retry trigger changes.
- Create a fresh `AbortController` inside the effect for each request.
- Pass `controller.signal` through to the request function.
- Return cleanup that calls `controller.abort()`.
- Clear stale `data` and `error` when beginning a new request, consistent with the reference state transition to `LOADING`.
- Check `err.name === 'AbortError'` and return without showing an error for intentional cancellation.
- Non-abort failures transition to `ERROR` and preserve an informative error message.
- Prevent obsolete requests from determining the latest selected squad's visible result.
- Do not disable cleanup or suppress real failures merely to avoid a race condition.

Rapid squad switching—CES → TE → GE—is an explicit verification case.

## 5. Simulated Packet Loss

The exercise requires simulated **35% packet loss for Erangel/Miramar satellite telemetry**. Keep this simulation in the mock/request layer rather than randomly changing the displayed squad data.

- Packet timeout or simulated transport failure must reject the request through the normal error path.
- Cancellation caused by `AbortController` must remain distinguishable from a simulated packet failure.
- Taego is part of the supplied squad data; the screenshot specifies the 35% packet-loss simulation for Erangel/Miramar.
- Do not claim the data is official or genuinely live.

## 6. Loading UI Contract

While status is `LOADING`:

- Render a Blue-Zone themed pulsing skeleton card.
- The required card height is **220px**.
- Mark the loading section with `aria-busy="true"`.
- Reserve the required layout space so the loading-to-result change does not visibly shift the page.
- Use DevTools to verify the exercise's **0.00 CLS** target during loading.

Do not replace the loading skeleton with only plain text or a spinner.

## 7. Error and Retry Accessibility

- Do not call `window.alert()`.
- Display packet-timeout and request errors inline inside `<section role="alert">`.
- Include the message `Blue-Zone Link Lost` or an equivalent clear connection-failure description consistent with the reference.
- Provide a button labeled **Reconnect Satellite (Retry)** (the reference snippet's shorter `Reconnect Satellite` label is acceptable only if the UI clearly communicates retry).
- Clicking the retry button must increment a React retry trigger such as `retryTick`.
- The changed retry trigger must rerun the request effect for the current squad.
- Errors must remain visible and announced until the next attempt changes the view state.

## 8. Success UI and Semantics

- Display telemetry for the currently selected squad only.
- Keep the successful result in an accessible live region, such as `<article aria-live="polite">`.
- Show useful supplied fields including the squad name, kills, map, phase, alive count, WWCD probability, and status where the layout allows.
- Keep text legible and controls keyboard-operable.
- Use stable squad IDs for selector values or keys.

## 9. React and Code Quality

- Use React hooks within the function component.
- Keep request lifecycle logic in `useEffect` with a complete dependency list, including `squadId` and `retryTick`.
- Do not omit the cleanup function.
- Avoid unrelated state synchronization effects.
- Keep the mock request deterministic enough to test, except for the explicitly required packet-loss simulation.
- Do not add packages unless the starter project genuinely requires them.
- Follow the existing project formatting and naming conventions.

## 10. Required Git History

Create exactly these two commits with the exact messages:

```text
feat(ex3): implement PUBG VN 4-state telemetry & AbortController
feat(ex3): add skeleton UI & retry alert
```

- Commit 1 covers the data/state machine, request lifecycle, abort cleanup, and simulated telemetry failure handling.
- Commit 2 covers the 220px skeleton UI, accessible error alert, retry control, and final UI verification.
- Do not create a third commit for documentation or cleanup.
- Do not stage unrelated exercise work, generated build output, or `node_modules`.

## 11. Final Acceptance Checklist

- [ ] Three required squads and sample values match the source contract.
- [ ] Four states are implemented.
- [ ] Request effect responds to squad selection and retry trigger.
- [ ] Every request has an `AbortController` and cleanup.
- [ ] `AbortError` is ignored; genuine failures show `ERROR`.
- [ ] Erangel/Miramar use the required 35% simulated packet-loss behavior.
- [ ] The loading skeleton is 220px tall, pulsing, and uses `aria-busy="true"`.
- [ ] Slow 3G loading has been checked for 0.00 CLS.
- [ ] Rapid CES → TE → GE switching cancels stale requests.
- [ ] Errors use `role="alert"` and an inline retry button.
- [ ] No `window.alert()` is used.
- [ ] Success is announced accessibly.
- [ ] Build and manual tests pass.
- [ ] Exactly two required commits exist.

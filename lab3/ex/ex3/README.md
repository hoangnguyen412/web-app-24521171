# Exercise 3 — KRAFTON PUBG Vietnam Series (PVS) Live Telemetry

A React live-match radar for Vietnamese PUBG esports squads. The exercise focuses on fault-tolerant asynchronous UI: a four-state view model, cancellation of stale requests with `AbortController`, a stable loading skeleton, and accessible retry handling.

## Exercise Scope

Build `src/components/PubgMatchTelemetry.jsx` to display telemetry for the three squads supplied in the assignment:

- **Cerberus Esports (CES):** Erangel, Phase 6, 4 alive, 14 kills, 68% WWCD probability, `In Safe Zone`.
- **The Expendables (TE):** Miramar, Phase 7, 4 alive, 18 kills, 82% WWCD probability, `Holding High Ground`.
- **Genius Esports (GE):** Taego, Phase 5, 3 alive, 9 kills, 41% WWCD probability, `Rotating Blue Zone`.

The interface simulates satellite telemetry and packet loss for the exercise; it is not a claim of a live connection to the official PUBG/KRAFTON service.

## Required Behavior

- Support the states `IDLE`, `LOADING`, `SUCCESS`, and `ERROR`.
- Start a request when the selected squad changes and when retry is requested.
- Use `AbortController` to cancel the previous request during cleanup. Rapid changes such as CES → TE → GE must not allow an obsolete request to overwrite the latest squad's result or show a false error after cancellation.
- Simulate **35% packet loss on Erangel and Miramar** as specified by the exercise.
- During `LOADING`, display a **220px pulsing Blue-Zone skeleton card** with `aria-busy="true"`.
- During `ERROR`, show the packet-timeout message inside `<section role="alert">` and provide a **Reconnect Satellite (Retry)** button. Do not use `window.alert()`.
- During `SUCCESS`, display the selected squad's telemetry in an accessible live region.
- Keep retry behavior in React state, for example with a `retryTick` counter.

## Technology and Requirements

- React function component and hooks.
- `useEffect` for request lifecycle and cleanup; `useState` for selected squad, view state, and retry trigger as needed.
- `AbortController` and `signal` propagation to the telemetry request function.
- Semantic HTML and accessible status/error announcements.
- No `window.alert()` for network or packet-loss errors.

## Getting Started

Run commands from the existing Vite/React project root:

```bash
npm install
npm run dev
```

Before committing, run the checks provided by the project, for example:

```bash
npm run build
```

## Verification Checklist

- [ ] The three required squads and their supplied telemetry fields are represented correctly.
- [ ] The view state is limited to `IDLE`, `LOADING`, `SUCCESS`, and `ERROR`.
- [ ] Selecting a squad triggers a telemetry request.
- [ ] A retry triggers a new request without requiring a squad change.
- [ ] Every effect cleanup aborts its request.
- [ ] An `AbortError` is ignored rather than displayed as a genuine packet failure.
- [ ] Switching CES → TE → GE rapidly leaves the final UI associated with GE and cancels stale requests.
- [ ] Loading renders the 220px pulsing skeleton with `aria-busy="true"`.
- [ ] The loading skeleton does not cause a visible layout jump; verify CLS using DevTools.
- [ ] Packet-loss/timeout errors are announced within `<section role="alert">`.
- [ ] The retry button is available in the error state and increments the retry trigger.
- [ ] No `window.alert()` is used.
- [ ] Success telemetry is announced using an appropriate live region.
- [ ] The browser console contains no relevant errors.
- [ ] Exactly the two required commits are present.

## Required Git History

Create these two commits using the exact messages specified by the assignment:

1. `feat(ex3): implement PUBG VN 4-state telemetry & AbortController`
2. `feat(ex3): add skeleton UI & retry alert`

Do not create an extra documentation-only commit. Include these documentation files in one of the two required commits, or leave them unstaged until they can be included without adding a third commit.

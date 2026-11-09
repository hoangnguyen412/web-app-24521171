# HW3 — Project Rules

These rules define the data, timer, concurrency, React and quality contracts for the KRAFTON x PUBG Vietnam Championship & Airdrop Arena.

When an implementation shortcut conflicts with the assignment requirements, follow the assignment requirements.

## 1. Scope and Source of Truth

- The assignment slides (HW 3, HW 3 Code Contract and the AI Failure Mode Audit) are the source of truth.
- Build only what HW 3 asks for: the airdrop countdown hook, the optimistic claim flow with 409 rollback, the leaderboard with filter and sort, and the AI audit.
- Do not add a real backend, login, payments, WebSockets, a virtual scroller (there are only four squads), a real-time kill feed, or third-party libraries.
- Sample values (drop titles, prices, stock, standings) are implementation decisions and must stay simple.

## 2. Data Rules

Domain types follow the assignment contract exactly:

- `DropPhase = 'WARMUP' | 'AIRDROP_LIVE' | 'LOOTED_OUT' | 'EXPIRED'`
- `PubgCrateDrop`: `id`, `title`, `priceVnd`, `remainingStock`, `dropEpochMs`
- `PubgVnSquadStanding`: `squadId`, `squadName`, `wwcdCount`, `placementPts`, `killPts`

Rules:

- Keep every `readonly` modifier and every field name.
- `squadId` uses the ids from the contract (`'te' | 'ces' | 'ge' | 'agg'`); `'ge'` is used for Roy Esports.
- IDs are assigned in the source data, never generated during rendering.
- Never use array indices as React keys; use `drop.id` and `squad.squadId`.
- Do not mutate data objects or arrays; replace them with new ones.
- Provide at least two drops: one PVS Grand Finals VIP Ticket and one G-Coin Crate.
- Prices are numbers in VND and are formatted only at display time.
- `EXPIRED` is part of the type; the assignment defines no condition for it, so producing it is not required.

## 3. Timer Rules

`usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0)` follows the assignment contract:

1. `calcRemaining = Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))`.
2. The initial state comes from `useState(calcRemaining)`.
3. The effect calls `syncClock()` immediately, then every 200 ms with `window.setInterval`.
4. A `visibilitychange` listener calls `syncClock()` when `document.visibilityState === 'visible'`.
5. Cleanup calls `window.clearInterval` and `document.removeEventListener`.
6. The dependency array is `[targetEpochMs, serverOffsetMs]`.
7. The hook returns `{ remainingMs, isLive: remainingMs === 0 }`.

Forbidden:

- Decrementing a counter per tick (`setSeconds(s => s - 1)` or similar).
- Storing the countdown as a count of ticks.
- Skipping cleanup.

Phase derivation (computed during render, never stored):

| Condition | Phase |
| --- | --- |
| `remainingMs > 0` | `WARMUP` |
| `remainingMs === 0` and `remainingStock > 0` | `AIRDROP_LIVE` |
| `remainingMs === 0` and `remainingStock <= 0` | `LOOTED_OUT` |

## 4. Claim Rules

Required order for one claim:

1. Ignore the click if the drop is already in flight (check a `useRef` set first).
2. Ignore the click unless the phase is `AIRDROP_LIVE`.
3. Create a `claimId` for this attempt (for example `crypto.randomUUID()`).
4. Add the drop to the in-flight ref and to the state that disables its button.
5. Deduct one unit of stock in the UI immediately.
6. Call the mock server with `dropId`, `claimId` and an `AbortSignal`.
7. On success keep the deducted stock.
8. On `409`, add back exactly the amount this claim deducted and show a "Looted Out" message.
9. On any other error, roll back the same way and show an error message.
10. In `finally`, remove the drop from the in-flight ref and from the disabling state.

Additional rules:

- The synchronous `useRef` guard is required because React state updates are not visible until the next render.
- Roll back by adding the deducted amount, not by overwriting stock with an old snapshot.
- Do not update state after unmount or after an abort.
- Each claim takes one unit.
- Idempotency: the mock server must treat a repeated `claimId` as the same claim and never charge it twice.

## 5. Mock Server Rules

- It lives in `src/api/mockServer.ts`; there is no real network call.
- It keeps its own stock, separate from the UI stock, and a map of processed `claimId` values.
- It waits a short delay (an abortable timeout) before answering.
- It throws an error with `status === 409` when its stock is `0`.
- At least one item must have a server stock lower than what the UI shows, so the 409 rollback can be demonstrated.

## 6. Leaderboard Rules

- State holds only `query` (raw text) and `sortKey` (`wwcdCount`, `placementPts` or `killPts`).
- Filtering and sorting are derived during render:

```ts
const normalizedQuery = query.trim().toLowerCase();

const visibleSquads = standings
  .filter((s) => s.squadName.toLowerCase().includes(normalizedQuery))
  .toSorted((a, b) => b[sortKey] - a[sortKey]);
```

- Do not store the visible list in state.
- Do not use `useEffect` to filter or sort.
- Do not use mutating `.sort()`.
- Sorting is descending; ties keep their original order.
- Each input has a visible `<label htmlFor>` linked with `useId()`.

## 7. Formatting Rules

- Format prices with `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- Create the formatter once at module level.
- Format the countdown as minutes and seconds from `remainingMs`, rounding up to whole seconds.

## 8. Code Quality Rules

- One component per file; hooks in `src/hooks/`, mock server in `src/api/`, data in `src/data/`.
- Use descriptive names and follow the project's formatting conventions.
- Keep the code simple enough to explain during a review.
- No dependencies beyond `react`, `react-dom` and build tooling.
- No leftover `console.log` or commented-out code.
- Do not suppress React or ESLint warnings.
- Ensure the browser supports ES2023 `toSorted()`.

## 9. Verification Rules

Before completing the homework, verify:

- The countdown is correct after a background tab returns.
- The countdown never goes below `0`.
- No interval or listener remains after unmount.
- The claim button is enabled only in `AIRDROP_LIVE`.
- A double-click produces one request.
- A `409` restores stock exactly and shows "Looted Out".
- The lock is released after both success and failure.
- Prices appear in VND format.
- The leaderboard filter and all three sort keys work.
- No `useEffect` is used for derived leaderboard data.
- No console errors or React warnings remain.

## 10. AI Audit Rules

- `AI_AUDIT.md` (submitted as `AI_FAILURE_AUDIT.md`) documents at least 3 real AI-generated bugs found while building this arena, with DevTools proof and a manual fix (15% weight).
- Do not invent bugs, evidence or commit hashes.

## 11. Completion Standard

The homework is ready for submission when the countdown hook, optimistic claim with rollback, VND pricing and leaderboard are verified, and the audit file contains at least three real, proven and fixed bugs.

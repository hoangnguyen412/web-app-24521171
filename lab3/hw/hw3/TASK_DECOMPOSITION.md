# HW3 — Task Decomposition

## 1. Goal

Evolve the Lab 2 HW 3 `createAntiDriftTimer` into a React 19 esports platform for the **PUBG Vietnam Series (PVS) Finals Ticket & G-Coin Contraband Crate Arena**.

The implementation must demonstrate a zero-drift countdown, idempotent optimistic inventory updates with 409 rollback, immutable domain types and a derived-state leaderboard.

## 2. Scope

### Required

1. Domain types from the assignment contract (`DropPhase`, `PubgCrateDrop`, `PubgVnSquadStanding`).
2. `usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0)` with `visibilitychange` resync.
3. Claiming PVS Grand Finals VIP Tickets and G-Coin Crates.
4. VND price formatting with `Intl.NumberFormat('vi-VN')`.
5. Optimistic stock deduction, duplicate-click lock with `claimId`, and rollback on HTTP 409.
6. PUBG VN leaderboard for The Expendables, Cerberus Esports, Roy Esports and AGG, filtered and sorted by WWCD, Placement Points and Kill Points.
7. `AI_AUDIT.md` (submitted as `AI_FAILURE_AUDIT.md`) with at least 3 real bugs.

### Out of Scope

- A real backend, database, login or payments.
- WebSockets or real-time kill feeds.
- A virtual scroller (only four squads).
- Third-party UI, state or data libraries.

## 3. Data Contract

Types follow the assignment exactly (see `README.md`).

Sample drops (implementation decision):

| `id` | `title` | `priceVnd` | UI `remainingStock` | `dropEpochMs` | Server stock |
| --- | --- | ---: | ---: | --- | ---: |
| `drop-vip-ticket` | PVS Grand Finals VIP Ticket | sample | 3 | now + 20 s | 3 |
| `drop-gcoin-crate` | G-Coin Contraband Crate | sample | 2 | now + 40 s | 0 |

The crate's server stock is `0` while the UI shows `2`, so claiming it demonstrates the 409 rollback.

Sample standings (implementation decision):

| `squadId` | `squadName` | `wwcdCount` | `placementPts` | `killPts` |
| --- | --- | ---: | ---: | ---: |
| `te` | The Expendables | sample | sample | sample |
| `ces` | Cerberus Esports | sample | sample | sample |
| `ge` | Roy Esports | sample | sample | sample |
| `agg` | AGG | sample | sample | sample |

Replace every `sample` with a number before running the app.

## 4. Implementation Phases

### Phase A — Setup and Domain Types

Tasks:

- Create a Vite + React 19 project using the TypeScript template with plain CSS.
- Create `src/types.ts` with the contract types, keeping `readonly`.
- Create sample data in `src/data/drops.ts` and `src/data/standings.ts`.

Acceptance criteria:

- Types match the assignment contract field for field.
- Data has unique, stable ids and numeric fields are numbers.
- `npm run dev` runs with no errors or warnings.

### Phase B — Formatting Helpers

Tasks:

- Create `formatVnd(amount)` using `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`, with the formatter created once.
- Create a helper that formats `remainingMs` as minutes and seconds.

Acceptance criteria:

- Prices render with Vietnamese grouping and the VND symbol.
- The countdown shows whole seconds and `00:00` at zero.

### Phase C — `usePubgAirdropTimer`

Tasks:

- Implement the hook exactly as the assignment contract: `calcRemaining`, `useState(calcRemaining)`, immediate `syncClock()`, a 200 ms interval, the `visibilitychange` wake handler and full cleanup.
- Use it once per drop card.

Acceptance criteria:

- The countdown reaches `0` and never goes negative.
- After the tab sits in the background for a minute, the value is correct the moment the tab becomes visible.
- No interval or listener survives unmount.

### Phase D — Mock Server

Tasks:

- Implement `claimCrate(dropId, claimId, signal)` with an abortable delay.
- Keep server stock and a map of processed `claimId` values.
- Throw an error with `status === 409` when the server stock is `0`.

Acceptance criteria:

- A successful claim lowers server stock by one.
- A repeated `claimId` returns the previous result without charging twice.
- The ticket succeeds and the crate returns 409.

### Phase E — Optimistic Claim Hook

Tasks:

- Implement `useOptimisticClaim` following the claim order in `PROJECT_RULES.md`.
- Keep an in-flight `useRef` set plus a state set so buttons render disabled.
- Keep a status message per claim result (success, Looted Out, other error).
- Abort the request and skip state updates on unmount.

Acceptance criteria:

- Stock drops immediately when Claim is pressed.
- A double-click sends exactly one request.
- On 409 the stock returns to its exact previous value and the message says "Looted Out".
- The lock is released after success and after failure.

### Phase F — Drop Cards

Tasks:

- Build `DropCard` showing the title, VND price, stock, countdown, derived phase and a Claim button.
- Derive the phase from `remainingMs` and `remainingStock` during render.
- Enable Claim only in `AIRDROP_LIVE` and when the drop is not in flight.

Acceptance criteria:

- Phases move from `WARMUP` to `AIRDROP_LIVE` when the countdown hits zero.
- Stock `0` shows `LOOTED_OUT`.
- The Claim button is disabled outside `AIRDROP_LIVE` and while a claim is in flight.

### Phase G — Leaderboard

Tasks:

- Build `Leaderboard` with a labelled text filter (by squad name) and a labelled sort selector (WWCD, Placement Points, Kill Points).
- Derive the visible list during render with `filter` and `toSorted()`.
- Render rows keyed by `squadId`.

Acceptance criteria:

- Filtering is case-insensitive and ignores surrounding spaces.
- Each sort key orders squads in descending order.
- The source standings are never mutated and no `useEffect` is used.

### Phase H — Verification and Audit

Perform these manual checks:

1. Start the app and check the console.
2. Confirm prices appear in VND format.
3. Watch a countdown reach zero and the phase change.
4. Switch to another tab for over a minute, return, and confirm the countdown is correct immediately.
5. Claim the ticket and confirm stock drops at once and stays dropped after success.
6. Double-click Claim and confirm a single request.
7. Claim the crate and confirm stock drops, then returns to its exact value with a Looted Out message.
8. Confirm the Claim button becomes usable again after success and after failure.
9. Filter the leaderboard and try all three sort keys.
10. Unmount or reload and confirm no timers or listeners remain.
11. Run the `grep` checks from `README.md`.
12. Complete `AI_AUDIT.md` with at least three real bugs.

## 5. Definition of Done

The homework is complete when:

- Domain types, sample data and VND formatting follow the contract.
- The countdown is zero-drift and resyncs on `visibilitychange`.
- Claims are optimistic, locked against duplicates and rolled back on 409.
- The leaderboard filters and sorts by all three criteria without effect-based state.
- Cleanup leaves no timers, listeners or pending requests.
- `AI_AUDIT.md` (submitted as `AI_FAILURE_AUDIT.md`) contains at least three real, proven and fixed bugs.

# TASK DECOMPOSITION — HW3: High-Concurrency Flash-Sale E-Commerce Engine

## T-01 — Specification & State Contract

- Objective: Freeze the contracts before implementation.
- Tasks:
  - Define the Vietnam Mega-Sale simulation scenario.
  - Document the anti-drift timer signature and behavior.
  - Define inventory quantities and reservation statuses separately.
  - Define stock invariants, state transitions, expiry rules, and checkout.
  - Define the optimistic-lock `version` contract.
  - Update `PROJECT_RULES.md`, `TASK_DECOMPOSITION.md`, and `README.md`.
- Contract: Documentation only; no business logic.
- Verification:
  - Every state and valid transition is defined.
  - Expiry returns reserved stock to available stock exactly once.
  - Stale versions are rejected without changing data.
- Atomic commit: `docs(spec): define flash-sale state model`

## T-02 — Flash-Sale View

- Objective: Build the page displaying the simulation.
- Tasks:
  - Display the product, countdown, and remaining stock.
  - Display reservation status and checkout result.
  - Render the UI from the authoritative inventory state.
- Contract: The UI must not maintain an independent, conflicting stock count.
- Verification: The displayed timer and inventory state reflect current data.
- Atomic commit: `feat(ui): add flash-sale simulation view`

## T-03 — Zero-Drift Timer

- Objective: Implement the countdown without accumulated timing drift.
- Tasks:
  - Implement `createAntiDriftTimer` in `anti-drift-timer.ts`.
  - Compute the target timestamp once using `Date.now()`.
  - Recalculate remaining time from the current timestamp on each frame.
  - Stop at zero and return a cleanup function.
- Contract: No `setInterval`; no decrementing counter.
- Verification:
  - Compare the displayed remaining time with the target-time delta.
  - Background the tab, return, and verify the remaining time recovers.
  - Verify the timer stops at zero and cancellation stops future ticks.
- Atomic commit: `feat(timer): implement zero-drift countdown`

## T-04 — Inventory State Machine

- Objective: Model reservation and stock transitions.
- Tasks:
  - Track `available`, `reserved`, and `sold` quantities.
  - Define valid reservation statuses and transitions.
  - Reject invalid transitions and insufficient-stock requests.
- Contract: Stock never becomes negative; invariants always hold.
- Verification: Test valid transitions, invalid transitions, and stock limits.
- Atomic commit: `feat(inventory): implement reservation state machine`

## T-05 — Optimistic Inventory Lock

- Objective: Reject conflicting updates based on stale inventory versions.
- Tasks:
  - Require `expectedVersion` for each inventory mutation.
  - Compare it with the current version before applying a change.
  - Increment `version` once after each successful mutation.
- Contract: A stale update never changes state or stock.
- Verification:
  - Let two buyers compete for the final unit using the same version.
  - Verify at most one reservation succeeds with that version.
- Atomic commit: `feat(lock): add optimistic inventory lock`

## T-06 — Lock Expiry & Checkout

- Objective: Release expired reservations and complete valid purchases.
- Tasks:
  - Expire a reservation when its expiry time has been reached.
  - Release its reserved stock exactly once.
  - Permit checkout only for a valid, unexpired reservation.
  - Handle checkout-versus-expiry races.
- Contract: An expired reservation cannot be checked out.
- Verification:
  - Checkout before expiry succeeds.
  - Checkout after expiry fails.
  - Expiry and checkout cannot both finalize one reservation.
- Atomic commit: `feat(checkout): handle lock expiry and checkout`

## T-07 — Concurrency Verification

- Objective: Verify that competing buyers cannot oversell stock.
- Tasks:
  - Simulate many buyers competing for limited stock.
  - Exercise reservation, expiry, and checkout under contention.
  - Assert stock invariants throughout the simulation.
- Contract:
  - `available + reserved + sold === initialStock`
  - Stock never becomes negative.
  - No reservation is finalized or released twice.
- Verification: Repeat the tests and confirm that all invariants hold.
- Atomic commit: `test(inventory): verify concurrent reservations`

## T-08 — AI Failure Mode Audit

- Objective: Document defects found in AI-generated code.
- Tasks:
  - Create `AI_FAILURE_AUDIT.md`.
  - Document at least three real, reproduced defects.
  - Include location, problem, reproduction evidence, and fix for each.
- Contract: Findings must be verified, not hypothetical.
- Verification: Confirm at least three supported findings are documented.
- Atomic commit: `docs(audit): add AI failure mode audit`

---

## Required Commit Sequence

1. `docs(spec): define flash-sale state model`
2. `feat(ui): add flash-sale simulation view`
3. `feat(timer): implement zero-drift countdown`
4. `feat(inventory): implement reservation state machine`
5. `feat(lock): add optimistic inventory lock`
6. `feat(checkout): handle lock expiry and checkout`
7. `test(inventory): verify concurrent reservations`
8. `docs(audit): add AI failure mode audit`
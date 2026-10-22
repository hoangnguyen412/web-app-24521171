# AI FAILURE AUDIT — HW3: High-Concurrency Flash-Sale E-Commerce Engine

This report lists defects found in AI-generated code during the project. Each finding was observed while running or reviewing the code and was fixed; none is hypothetical.

| # | Defect | Area |
|---|--------|------|
| 1 | Countdown reaches 0 but stock can still be held | Sale deadline / UI |
| 2 | Test summary reports `Tests passed: 13/12` | Test output |
| 3 | T-02 wrote inline JavaScript in HTML although the project requires TypeScript | Project rules |
| 4 | Image path and format inconsistent between PNG and SVG | HTML / assets |

---

## Finding 1 — Countdown reaches 0 but stock can still be held

- **Location**: `main.ts` — the sale-deadline handling, `refreshView()`, and the reserve button click handler.
- **Problem**: When the flash-sale countdown displayed `00:00.000`, the system still allowed a buyer to hold stock. The end of the sale was only shown by the timer; nothing enforced it when a reservation was requested. Two different time limits exist in the project and they were not distinguished: `saleDeadline` (when the flash sale ends) and `expiresAt` (when an individual reservation expires). Only `expiresAt` was enforced.
- **Impact**: A reservation could be created after the flash sale had ended, which breaks the sale rules and lets the displayed state (sale over) disagree with what the system accepts.
- **How it was found**: Manual run of the simulation: let the countdown reach `00:00.000`, then clicked the reserve button. The reservation was accepted instead of being rejected.
- **Fix**: Added a `saleDeadline` and `saleEnded` guard in `main.ts`. The countdown marks the sale as ended, `refreshView()` disables the reserve button, and the reserve click handler checks the deadline again before creating a reservation. Separately, `InventoryStateMachine` handles reservation expiry using `expiresAt`, rejects checkout of expired reservations, and releases reserved stock exactly once.
- **Evidence**: Figure 3 (reservation expired: payment blocked) and Figure 5 (sale ended: reserve disabled).

## Finding 2 — Test summary reports `Tests passed: 13/12`

- **Location**: `inventory.test.ts` — the test summary/footer after the inventory test count increased to 13.
- **Problem**: The output showed 13 passing tests but a total of 12. The printed total no longer matched the number of executed test cases after a test was added.
- **Impact**: The summary contradicts itself (passed cannot exceed total), so it cannot be trusted as evidence that the inventory behaviour was verified.
- **How it was found**: Reading the test output: `13/12` is impossible. The number of test cases in the file was compared with the printed total.
- **Fix**: Corrected the displayed test total from 12 to 13 so it matches the number of executed test cases.
- **Evidence**: Test output showing all tests passing with a consistent total.

## Finding 3 — Inline JavaScript in HTML although the project requires TypeScript

- **Location**: T-02 (flash-sale view) — the inline `<script>` block in `index.html`.
- **Problem**: The AI wrote the page logic as inline JavaScript inside the HTML. `PROJECT_RULES.md` requires TypeScript for the project.
- **Impact**: Breaks the project rules. The logic is untyped, is not checked by the TypeScript compiler, and cannot be tested together with the rest of the code.
- **How it was found**: Comparing the T-02 source against `PROJECT_RULES.md`.
- **Fix**: Moved the inline logic into `main.ts` and loaded it with an external module script. `index.html` now contains markup only.

## Finding 4 — Image path and format inconsistent between PNG and SVG

- **Location**: the image reference in `index.html` and the image asset file.
- **Problem**: The extension in the HTML was changed from PNG to SVG, but the file itself was still a PNG, because renaming an extension does not convert the format. The HTML and the file on disk disagreed.
- **Impact**: The image did not open on the page.
- **How it was found**: Opening the page in the browser: the product image failed to load.
- **Fix**: Synchronized the HTML reference and the asset file: one real file in one format, with the same path and extension in the markup.

---

## Summary

Four verified defects were found in AI-generated code: two behaviour/verification defects (1, 2) and two rule/consistency defects (3, 4). All were fixed, which meets the requirement of at least three verified AI flaws.

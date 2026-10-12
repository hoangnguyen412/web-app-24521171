# TASK DECOMPOSITION — HW1: Production Enterprise Data-Grid (WCAG 2.2 AA)

## T-01 — Component Contract & WBS
- **Objective**: Freeze the public API before any implementation.
- **Tasks**: Write `data-grid-contract.ts` with `ColumnDef<T>` (`header`, `accessorKey`, `sortable?`) and `DataGridProps<T>` (`data`, `columns`, `onRowSelect?`, `ariaLabel`), plus the invariant comment (full ARIA grid semantics: `role="grid"`, `role="row"`, `role="gridcell"`). Write `PROJECT_RULES.md`, `TASK_DECOMPOSITION.md`, `README.md`.
- **Contract**: Types only; zero logic.
- **Verification**: The contract compiles and matches the specification.
- **Atomic Commit**: `docs(spec): define component contracts & WBS table`

## T-02 — Native Table Structure & ARIA Grid Roles
- **Objective**: Build the grid with native elements only (zero div-soup).
- **Tasks**: `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<button>` (sortable headers, pagination); `role="grid"`, `role="row"`, `role="gridcell"`; `aria-label` from `ariaLabel`; filter input with a visible `<label>`.
- **Contract**: No `<div>` or `<span>` acting as a row or cell.
- **Verification**: Inspect the DOM and the accessibility tree.
- **Atomic Commit**: `feat(html): build semantic data-grid structure`

## T-03 — Accessible Styling (4.5:1 Contrast)
- **Objective**: Style the grid to meet WCAG 2.2 Level AA.
- **Tasks**: Text and control colors with at least 4.5:1 contrast; visible `:focus-visible` indicator.
- **Contract**: Every text/background pair is >= 4.5:1.
- **Verification**: Check every color pair with a contrast checker; tab through the grid and confirm focus is visible.
- **Atomic Commit**: `feat(css): style accessible data-grid`

## T-04 — Sorting
- **Objective**: Sort by columns marked `sortable`.
- **Tasks**: Toggle none -> ascending -> descending -> none; expose the state with `aria-sort`.
- **Contract**: `props.data` is not mutated.
- **Verification**: Sorting works on every sortable column (text and numbers).
- **Atomic Commit**: `feat(grid): implement column sorting`

## T-05 — Filtering
- **Objective**: Filter the grid rows.
- **Tasks**: Case-insensitive, trimmed text filter across the columns.
- **Contract**: Cell values and filter text are rendered as text only (no `innerHTML`).
- **Verification**: Matching, no-match, and cleared-filter cases work.
- **Atomic Commit**: `feat(grid): implement text filtering`

## T-06 — Pagination
- **Objective**: Paginate the filtered and sorted rows.
- **Tasks**: Previous / Next `<button>`s; current page indicator; page index clamped when results shrink.
- **Contract**: Pipeline order is filter -> sort -> paginate.
- **Verification**: Empty result, single page, and partial final page work.
- **Atomic Commit**: `feat(grid): implement pagination`

## T-07 — Keyboard Navigation
- **Objective**: Operate the grid with the keyboard.
- **Tasks**: Up/Down/Left/Right arrow keys navigate grid cells (roving `tabindex`); Enter selects the row (`onRowSelect`); Space toggles the selection.
- **Contract**: No keyboard trap; Tab and Shift+Tab can enter and leave the grid.
- **Verification**: Complete sort, filter, page, and select using the keyboard only.
- **Atomic Commit**: `feat(a11y): implement keyboard navigation and selection`

## T-08 — Screen Reader Support & Lighthouse Audit
- **Objective**: Prove full screen reader support and the 100/100 score.
- **Tasks**: `<p aria-live="polite">` announcements for sort, filter results, and page changes; screen reader test (NVDA or VoiceOver); run Lighthouse and fix all findings; save the reports in `docs/lighthouse/`.
- **Contract**: Lighthouse Accessibility = 100 and Best Practices = 100.
- **Verification**: Screen reader announces sort, result count, and page changes; Lighthouse reports show 100/100 for both categories.
- **Atomic Commit**: `test(a11y): verify lighthouse and screen-reader behaviour`

---

## Required Commit Sequence
1. `docs(spec): define component contracts & WBS table`
2. `feat(html): build semantic data-grid structure`
3. `feat(css): style accessible data-grid`
4. `feat(grid): implement column sorting`
5. `feat(grid): implement text filtering`
6. `feat(grid): implement pagination`
7. `feat(a11y): implement keyboard navigation and selection`
8. `test(a11y): verify lighthouse and screen-reader behaviour`
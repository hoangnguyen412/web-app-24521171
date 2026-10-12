# PROJECT RULES — HW1: Production Enterprise Data-Grid (WCAG 2.2 AA)

## 1. Architecture
- Use **TypeScript** and semantic HTML5; the contract is defined in `data-grid-contract.ts`.
- **Contract-First**: `ColumnDef<T>` and `DataGridProps<T>` are written before any implementation. A contract change must be reflected in `data-grid-contract.ts`, `README.md`, and `TASK_DECOMPOSITION.md`.
- Component scope: a full-featured accessible Data-Grid with **sorting, filtering, and pagination**.

## 2. HTML Standard (Zero Div-Soup)
- Must use native `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<button>`.
- BANNED: `<div>` or `<span>` acting as a row or cell.
- Full ARIA grid semantics: `role="grid"`, `role="row"`, `role="gridcell"`.
- The grid is named with `ariaLabel` (`aria-label`).
- Sortable headers contain a `<button>` and expose `aria-sort`.
- The filter input has a visible `<label for="id">`.

## 3. Accessibility Contract
- WCAG 2.2 Level AA compliance.
- **4.5:1 color contrast** for text and controls.
- **Full screen reader support**: sort, filter-result, and page changes are announced in a `<p aria-live="polite">`.
- Visible `:focus-visible` indicator.

## 4. Keyboard Navigation
- Up / Down / Left / Right arrow keys navigate grid cells (roving `tabindex`).
- **Enter** selects the row (`onRowSelect`).
- **Space** toggles the selection.
- No keyboard trap: Tab / Shift+Tab can enter and leave the grid.

## 5. Data Handling
- Sorting, filtering, and pagination do not mutate `props.data`.
- Pipeline order: filter -> sort -> paginate.
- Cell values and filter text are rendered as text only (no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`).

## 6. Lighthouse Audit
- Must achieve a **verified 100/100** score on **Accessibility** and **Best Practices**.
- Reports are saved in `docs/lighthouse/`; do not claim 100/100 without a saved report.
- No project-caused console errors.
# HW1: Production Enterprise Data-Grid (WCAG 2.2 AA)

Industrial-strength accessible component system with 100 Lighthouse score.

## Features
- Full-featured accessible Data-Grid with **sorting, filtering, and pagination**.
- **WCAG 2.2 Level AA** compliance, **4.5:1** color contrast, full screen reader support.
- **Keyboard navigation**: Up/Down/Left/Right arrow keys navigate grid cells; Enter selects, Space toggles.
- **Lighthouse Audit**: verified 100/100 score on Accessibility and Best Practices.
- **Zero div-soup**: native `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<button>`.

## Component Contract
```ts
// data-grid-contract.ts
export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  sortable?: boolean;
}

export interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowSelect?: (item: T) => void;
  ariaLabel: string;
}
// Invariant: Full ARIA grid semantics (role="grid",
// role="row", role="gridcell")
```

## Keyboard Reference
| Key | Action |
|-----|--------|
| `Arrow Up / Down / Left / Right` | Navigate grid cells |
| `Enter` | Select the row |
| `Space` | Toggle the selection |
| `Tab` / `Shift+Tab` | Enter / leave the grid |

## Project Structure
```
hw1-data-grid/
├── index.html
├── styles.css
├── data-grid-contract.ts
├── DataGrid.ts
├── docs/lighthouse/        # Lighthouse reports
├── PROJECT_RULES.md
├── TASK_DECOMPOSITION.md
└── README.md
```

## Verification Checklist
- [ ] Sorting works
- [ ] Filtering works
- [ ] Pagination works
- [ ] Only native `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<button>` (no div-soup)
- [ ] Full ARIA grid semantics (`role="grid"`, `role="row"`, `role="gridcell"`)
- [ ] Text and controls have at least 4.5:1 contrast
- [ ] Screen reader announces sort, filter results, and page changes
- [ ] Up/Down/Left/Right arrow keys navigate grid cells
- [ ] Enter selects; Space toggles
- [ ] Lighthouse Accessibility = 100 (report in `docs/lighthouse/`)
- [ ] Lighthouse Best Practices = 100 (report in `docs/lighthouse/`)
- [ ] No console errors

## Git History
One atomic commit per task — see `TASK_DECOMPOSITION.md` for the commit sequence.
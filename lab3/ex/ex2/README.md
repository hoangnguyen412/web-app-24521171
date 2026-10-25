# Exercise 2 — Interactive Scientist & Pioneer Directory

A reactive React data explorer for famous scientists and pioneers (Goethe, Einstein, da Vinci, Newton, Maxwell, Sidis). The exercise focuses on a single source of truth, derived state without `useEffect`, accessible form controls, ES2023 `.toSorted()`, and immutable updates.

It upgrades the legacy exercises Ex 0.4, 2.2, 3 and 4.3 (`smartPeople`) using the Lab 2 reconciliation and derived-state principles.

## Exercise Scope

Build `src/components/ScientistDirectory.jsx` to turn the static `smartPeople` array into an interactive directory. The data is normalized with stable IDs:

| ID | Name | Age | IQ |
| --- | --- | --- | --- |
| `sp-1` | Johann Goethe | 82 | 210 |
| `sp-2` | Albert Einstein | 76 | 205 |
| `sp-3` | Leonardo da Vinci | 67 | 180 |
| `sp-4` | Isaac Newton | 84 | 190 |
| `sp-5` | James Maxwell | 48 | 190 |
| `sp-6` | William Sidis | 46 | 200 |

The IQ values are the fictional exercise dataset (`SMART_PEOPLE`), not scientific claims.

## Required Behavior

- **Search:** case-insensitive name search; the query is trimmed before matching.
- **Min-IQ filter:** a numeric input read with `e.target.valueAsNumber`, falling back to `0` when the value is `NaN`, so the state stays a number and `>=` comparisons never silently break.
- **Sort:** by IQ (descending) or Age, using the non-mutating ES2023 `.toSorted()`.
- **Delete:** remove one person by `id` with `prev.filter((p) => p.id !== id)`.
- **Reset:** restore the original `SMART_PEOPLE` snapshot.
- **Live result count:** `<output role="status" aria-live="polite">` announces the number of visible pioneers.
- Use stable `key={person.id}` when rendering the list.

## Technology and Requirements

- React 19 function component and hooks.
- `useState` holds only the raw independent inputs: `people`, `query`, `minIq`, `sortBy`.
- `visiblePeople` is **derived on the fly** during render.
- **Zero `useEffect`** for filtering or sorting.
- Inputs are bound with `<label htmlFor>` plus `useId()`.
- Semantic HTML: `section`, `form role="search"`, `label`, `input`, `output`, `ul`, `li`.
- No extra dependencies.

## Architecture Notes

- **Single source of truth:** derived data is never copied into state, which avoids duplicated or out-of-sync state.
- **Unidirectional data flow:** input event → state update → re-render → derived list.
- **Immutable updates:** delete and reset create new arrays; `.toSorted()` never mutates `people`.
- **Reconciliation:** stable `id` keys let React preserve the remaining list items and focus when an item is deleted.

## Getting Started

Run commands from the existing Vite/React project root:

```bash
npm install
npm run dev
```

Before committing, run the project checks:

```bash
npm run lint
npm run build
```

## Verification Checklist

- [ ] The six required people are normalized with stable IDs `sp-1` to `sp-6`.
- [ ] Name search is case-insensitive and ignores surrounding whitespace.
- [ ] The Min-IQ filter uses `valueAsNumber` and the state stays a number.
- [ ] Sorting by IQ and by Age works through `.toSorted()` without mutating state.
- [ ] Delete removes exactly one person by `id`; Reset restores all six.
- [ ] No `useEffect` is used for filtering or sorting.
- [ ] Every input has a `<label htmlFor>` linked through `useId()`.
- [ ] The result count is in `<output role="status" aria-live="polite">` and updates correctly.
- [ ] React DevTools Profiler: typing one character in the search input causes exactly 1 render pass.
- [ ] Deleting "Johann Goethe" keeps focus and the keys of the remaining items.
- [ ] The browser console contains no relevant errors and `npm run build` succeeds.
- [ ] Exactly the three required commits are present.

## Verification Audit

```bash
# No useEffect for derived state (expected: 0 matches)
grep -n 'useEffect' src/components/ScientistDirectory.jsx

# Non-mutating sort is used (expected: at least 1 match)
grep -n 'toSorted' src/components/ScientistDirectory.jsx
```

## Required Git History

Create these three commits using the exact messages specified by the assignment:

1. `feat(ex2): normalize smartPeople schema with stable IDs`
2. `feat(ex2): add search, IQ filter & toSorted`
3. `feat(ex2): add delete/reset & live status`

Do not create an extra documentation-only commit. Include the documentation files in one of the three required commits, or leave them unstaged until they can be included without adding a fourth commit.
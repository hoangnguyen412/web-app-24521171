# Task Decomposition — Exercise 2

## 1. Goal

Transform the legacy static `smartPeople` array into an interactive Scientist & Pioneer Directory.

The implementation must demonstrate stable React identity, immutable array operations, derived state, accessible interactions, and a one-way data flow.

The final dataset must contain the six reference scientists and pioneers plus the student as the seventh entry.

## 2. Scope

### Required

1. Inspect the legacy data and current React application structure.
2. Normalize the data schema and assign stable, unique IDs.
3. Preserve the six reference entries and add the student's entry as `sp-7`.
4. Implement case-insensitive name search.
5. Implement a numeric minimum-IQ filter.
6. Implement IQ-descending and age-ascending sorting with `toSorted()`.
7. Implement delete and reset actions.
8. Display an accessible live result count.
9. Use `useId()` to associate controls with their labels.
10. Verify the data flow, accessibility, and rendering behavior.
11. Produce exactly three required atomic feature commits.

### Out of Scope

- Backend, database, authentication, or API integration.
- Unrelated features, animations, or third-party libraries.
- Refactoring unrelated legacy exercises.
- Adding a fourth commit for documentation or cleanup.

## 3. Data Contract

Each person must use this schema:

```js
{
  id: 'sp-1',
  name: 'Johann Goethe',
  age: 82,
  iq: 210,
}
```

Requirements:

- `id` must be a stable, unique string.
- `name` must be a non-empty string.
- `age` must be a number.
- `iq` must be a number.
- IDs must be assigned in the source dataset, not generated during rendering.
- The original `SMART_PEOPLE` array must remain the reset baseline.
- UI actions must not mutate the baseline dataset.

### Required Dataset

| ID | Name | Age | IQ |
| --- | --- | ---: | ---: |
| `sp-1` | Johann Goethe | 82 | 210 |
| `sp-2` | Albert Einstein | 76 | 205 |
| `sp-3` | Leonardo da Vinci | 67 | 180 |
| `sp-4` | Isaac Newton | 64 | 190 |
| `sp-5` | James Maxwell | 48 | 190 |
| `sp-6` | William Sidis | 46 | 200 |
| `sp-7` | Student entry | Student age | Student IQ |

Replace the final row's placeholders with the student's display name, age, and intended IQ value before completing the dataset.

Do not change the reference entries to make room for the seventh entry.

## 4. Implementation Phases

### Phase A — Inspect and Normalize Data

Tasks:

- Locate the existing `smartPeople` array and application entry point.
- Normalize every person to `id`, `name`, `age`, and `iq`.
- Preserve the six reference entries.
- Add the student's entry with ID `sp-7`.
- Make sure the seventh entry is part of `SMART_PEOPLE`.
- Ensure every ID is unique and deterministic.
- Keep numeric fields as numbers.
- Initialize editable state from a copy of the baseline dataset.

Example seventh entry template:

```js
{
  id: 'sp-7',
  name: 'YOUR_NAME',
  age: YOUR_AGE,
  iq: YOUR_IQ,
}
```

Replace the placeholders before running the application. Do not leave placeholder identifiers or non-numeric values in the final data.

Acceptance criteria:

- The baseline dataset contains seven people.
- All IDs are unique and stable.
- `age` and `iq` are numbers for every entry.
- Reset can restore all seven entries.
- No component action mutates `SMART_PEOPLE`.

### Phase B — Search, Filter, and Sorting

Tasks:

- Keep the independent state values limited to `people`, `query`, `minIq`, and `sortBy`.
- Generate control IDs using `useId()`.
- Connect each control to a visible label.
- Search names case-insensitively.
- Trim surrounding whitespace from the query during matching.
- Read the numeric input through `event.currentTarget.valueAsNumber`.
- Explicitly handle `NaN`.
- Filter by the inclusive comparison `person.iq >= minIq`.
- Use `toSorted()` to sort the filtered result.
- Calculate `visiblePeople` during rendering.

Suggested pipeline:

```js
const normalizedQuery = query.trim().toLowerCase();

const visiblePeople = people
  .filter(
    (person) =>
      person.name.toLowerCase().includes(normalizedQuery) &&
      person.iq >= minIq,
  )
  .toSorted((a, b) =>
    sortBy === 'iq-desc'
      ? b.iq - a.iq
      : a.age - b.age,
  );
```

When the numeric input is empty, set the minimum IQ to `0` so the filter remains numeric and behaves predictably.

Acceptance criteria:

- Search is case-insensitive.
- Leading and trailing query spaces do not affect matching.
- The IQ threshold is numeric and inclusive.
- IQ sorting is descending.
- Age sorting is ascending.
- Filtering and sorting do not mutate the source array.
- No effect-based state synchronization is introduced.

### Phase C — Delete, Reset, and Live Status

Tasks:

- Delete people by their stable ID.
- Use a functional state update.
- Reset the editable list from the original seven-entry dataset.
- Reset search, minimum IQ, and sorting to their default values.
- Render the result count through an accessible live status output.
- Use stable IDs as React list keys.
- Give delete controls descriptive accessible names.

Suggested deletion:

```js
setPeople((previous) =>
  previous.filter((person) => person.id !== id),
);
```

Suggested live status:

```jsx
<output role="status" aria-live="polite">
  Found {visiblePeople.length} pioneers
</output>
```

Acceptance criteria:

- Deleting a person removes only the selected ID.
- The original baseline remains unchanged.
- Reset restores all seven entries, including the student.
- Reset clears the search, restores minimum IQ to `0`, and selects the default sort mode.
- The live result count updates when the visible list changes.
- Remaining people preserve their identity through stable keys.

### Phase D — Verification

Perform these manual checks:

1. Start the app and check the browser console.
2. Confirm that seven entries appear initially.
3. Confirm the student's name appears in the directory.
4. Search for `ein`, `EIN`, and a name surrounded by spaces.
5. Set the minimum IQ to `200`; verify that only people with IQ values of at least `200` remain.
6. Clear the numeric field; verify that the minimum IQ returns to `0`.
7. Test both sorting modes.
8. Delete the student's entry and verify that only that entry disappears.
9. Reset the directory and verify that all seven entries return.
10. Confirm that the live count matches the displayed result list.
11. Navigate through all controls using the keyboard.
12. Verify visible labels, accessible delete names, and sensible focus behavior.
13. Use React DevTools Profiler while typing one character.
14. Confirm that no effect introduces an unnecessary second state update for filtering or sorting.
15. Confirm that no index-key or `toSorted()` runtime errors occur.

## 5. Required Git History

The assignment requires exactly these three commits, with the messages written exactly as shown.

### Commit 1 — Normalize Data

```text
feat(ex2): normalize smartPeople schema with stable IDs
```

Include:

- Data schema normalization.
- Stable IDs for all seven entries.
- The student's entry as `sp-7`.
- The original baseline dataset.
- Necessary foundational documentation, if appropriate.

### Commit 2 — Search, Filter, and Sort

```text
feat(ex2): add search, IQ filter & toSorted
```

Include:

- Search input and logic.
- Numeric minimum-IQ filter.
- Sorting controls and `toSorted()`.
- Associated labels and generated control IDs.

### Commit 3 — Delete, Reset, and Live Status

```text
feat(ex2): add delete/reset & live status
```

Include:

- Delete and reset actions.
- Accessible live result count.
- Final behavior and accessibility fixes.

Do not create a fourth commit for documentation, formatting, or cleanup. Avoid staging unrelated work from other exercises.

## 6. Definition of Done

The exercise is complete when:

- The dataset contains all six reference entries and the student's seventh entry.
- All fields follow the required schema and type contract.
- Search, filtering, sorting, delete, and reset work correctly.
- Derived data is computed during rendering without `useEffect`.
- All controls and result announcements satisfy the accessibility contract.
- Manual testing and the React DevTools Profiler check are complete.
- Exactly the three required commits exist.
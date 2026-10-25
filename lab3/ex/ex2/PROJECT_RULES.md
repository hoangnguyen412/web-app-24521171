# Project Rules — Exercise 2

These rules define the data, React, accessibility, testing, and Git contracts for the Scientist & Pioneer Directory.

When an implementation shortcut conflicts with the assignment requirements, follow the assignment requirements.

## 1. Scope and Source of Truth

- Modify only the files needed for Exercise 2.
- Preserve the existing starter structure where practical.
- Do not refactor unrelated legacy exercises.
- Keep `SMART_PEOPLE` as the original dataset and reset baseline.
- The final baseline must contain seven people: the six reference entries and the student.
- Treat the required three-commit Git history as part of the deliverable.

## 2. Data Rules

Every person must have the following fields:

| Field | Type | Rule |
| --- | --- | --- |
| `id` | String | Unique and stable |
| `name` | String | Non-empty |
| `age` | Number | Numeric value |
| `iq` | Number | Numeric value |

### Stable IDs

Use the IDs `sp-1` through `sp-6` for the six reference entries and `sp-7` for the student's entry, provided these IDs do not conflict with existing required data.

The seventh entry must include the student's chosen display name, age, and IQ value.

- Assign IDs in the source dataset.
- Never generate IDs during rendering.
- Never use array positions as person identities.
- Never use array indices as React list keys.
- Do not replace the seventh entry with a temporary item added only in component state.

### Immutability

- Do not mutate `SMART_PEOPLE`.
- Do not mutate person objects or arrays in place.
- Initialize editable state from a new array based on the baseline.
- Reset from the original baseline, not from the already-filtered or deleted list.

## 3. React State and Derived Data

Only these independent values should be held in `useState`:

- `people` — the current editable list.
- `query` — the user's raw search text.
- `minIq` — the numeric minimum-IQ threshold.
- `sortBy` — the selected sort mode.

`visiblePeople` is derived data. Calculate it during rendering by filtering and sorting the current list.

### Required Data Flow

1. Keep the raw query in state.
2. Trim and lowercase the query for matching.
3. Filter people by name and minimum IQ.
4. Call `toSorted()` on the filtered result.
5. Render the resulting list and its count in the same render pass.

Suggested implementation:

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

Do not:

- Store `visiblePeople` in state.
- Store a separately synchronized result count in state.
- Use `useEffect` to filter or sort the list.
- Use an effect to copy derived results into a second state variable.
- Mutate `people` or `SMART_PEOPLE` with `.sort()`.

The assignment explicitly requires zero `useEffect` usage for derived filtering and sorting.

## 4. Numeric Input Rules

The minimum-IQ control must be a numeric input.

Read its value with:

```js
event.currentTarget.valueAsNumber
```

Handle `NaN` explicitly:

```jsx
onChange={(event) => {
  const nextValue = event.currentTarget.valueAsNumber;

  setMinIq(Number.isNaN(nextValue) ? 0 : nextValue);
}}
```

Rules:

- Keep `minIq` numeric.
- An empty input must safely fall back to `0`.
- Use the inclusive comparison `person.iq >= minIq`.
- Do not compare IQ values against a string.
- Do not allow `NaN` to silently break the filter.

## 5. Search, Sorting, Delete, and Reset

### Search

- Search is case-insensitive.
- Trim surrounding whitespace before matching.
- Do not overwrite the raw query state with the normalized query.

### Sorting

The required sort modes are:

- `iq-desc`: IQ from highest to lowest.
- `age-asc`: Age from youngest to oldest.

Use `toSorted()` to avoid mutating the filtered array or source dataset.

Do not substitute mutating `.sort()` for `toSorted()`.

### Delete

Delete by stable ID using a functional state update:

```js
setPeople((previous) =>
  previous.filter((person) => person.id !== id),
);
```

Do not identify people by array index or by display name.

### Reset

Reset must:

- Restore a fresh array based on the complete seven-entry `SMART_PEOPLE` baseline.
- Restore the empty search query.
- Restore minimum IQ to `0`.
- Restore the default sort mode, `iq-desc`.

Deleting the student must not permanently remove the student's entry from the original baseline.

## 6. Accessibility Rules

### Labels and IDs

- Generate control IDs with `useId()`.
- Connect every input and select to a visible label using `htmlFor`.
- Make each generated ID unique within the component.

### Live Result Count

Use a semantic output element:

```jsx
<output role="status" aria-live="polite">
  Found {visiblePeople.length} pioneers
</output>
```

The displayed count must match the currently rendered list and update automatically when the derived results change.

### Delete Controls

Give every delete button an accessible name identifying the relevant person, for example:

```jsx
<button
  type="button"
  aria-label={`Delete ${person.name}`}
  onClick={() => handleDelete(person.id)}
>
  Delete
</button>
```

### Keyboard Interaction

- All primary controls must be keyboard accessible.
- Use semantic HTML elements.
- Preserve sensible focus behavior after deletion where the starter or instructor's verification contract requires it.
- Do not rely on unstable array positions for focus management.

## 7. Code Quality Rules

- Keep the implementation simple enough to explain during an instructor review.
- Use descriptive variable names.
- Keep data transformation logic pure.
- Prefer immutable array methods.
- Avoid unnecessary effects, abstractions, libraries, and memoization.
- Do not suppress React warnings to hide unstable keys or input issues.
- Follow the existing project's naming and formatting conventions.
- Ensure the browser/runtime supports ES2023 `toSorted()`.

## 8. Verification Rules

Before completing the exercise, verify:

- The baseline contains exactly the required six reference entries plus the student's entry.
- Every ID is unique and every numeric field has the correct type.
- Mixed-case and whitespace-padded searches work.
- The IQ filter is numeric and inclusive.
- Both sort modes produce the correct order.
- Sorting leaves the source array unchanged.
- Delete removes only the selected ID.
- Reset restores all seven original entries and default control values.
- The live result counter matches the rendered list.
- All controls have associated labels and generated IDs.
- Every list item uses `key={person.id}`.
- Derived filtering and sorting do not use `useEffect`.
- React DevTools Profiler has been checked.
- No relevant browser console errors or React warnings remain.

## 9. Git Rules

Create exactly these three commits:

```text
feat(ex2): normalize smartPeople schema with stable IDs
feat(ex2): add search, IQ filter & toSorted
feat(ex2): add delete/reset & live status
```

- Keep each commit focused on its assigned phase.
- Include documentation changes in one of the required commits.
- Do not create an extra documentation-only commit.
- Do not include `node_modules`, build output, editor files, or unrelated exercise changes.
- Do not change the required commit messages unless the instructor changes the assignment.

## 10. Completion Standard

The implementation is ready for submission when the seven-person baseline, all interactive features, the React data-flow contract, accessibility requirements, verification steps, and exact three-commit history have been completed.
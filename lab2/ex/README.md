# Mini React Runtime Exercises

A hands-on project that rebuilds selected React-like runtime concepts from scratch using native JavaScript/TypeScript and browser APIs. The goal is to understand how UI nodes become DOM elements, how state changes trigger re-renders, and how asynchronous data loading can be handled safely.

> **Constraint:** Implement the required functionality yourself. Do not use React, ReactDOM, or another UI framework to replace the exercise requirements.

## Exercises at a Glance

| Exercise | Sprint | Main Focus | Expected Deliverable |
|---|---:|---|---|
| **Ex1 — Mini-React VNode & Mounting Engine** | 35 minutes | VNode factories, DOM mounting, semantic HTML, XSS-safe text rendering | A minimal renderer that turns a VNode tree into real DOM nodes |
| **Ex2 — Reactive State Machine & Delegation Hub** | 40 minutes | Custom `useState`, persistent state storage, re-rendering, root event delegation | A reactive task manager with task creation and dynamic filters |
| **Ex3 — Resilient State Machine & Skeleton Loader** | 35 minutes | Async lifecycle states, loading skeleton, error handling, retry, race-condition prevention | A data component that handles loading, success, and failure reliably |

The exercises build on one another conceptually: **rendering → reactive state and events → resilient asynchronous UI**.

---

## Exercise 1 — Building Mini-React VNode & Mounting Engine

### Objective

Implement `createElement()`, `createTextElement()`, and `renderToDOM()` from scratch. Represent the UI as a Virtual DOM-like tree (VNode), then mount that tree as native DOM elements.

### Key Requirements

- Use a consistent VNode structure for elements and text nodes.
- Normalize children and handle strings, numbers, nested children, and empty/boolean children appropriately.
- Render HTML elements with `document.createElement()` and text with `document.createTextNode()`.
- Use semantic HTML such as `<main>`, `<section>`, and `<button>`; avoid unnecessary wrapper elements (“div-soup”).
- Verify XSS resistance by passing `<script>alert(1)</script>` as text and confirming it remains plain text.
- Audit the resulting DOM in browser DevTools and check for unexpected or orphan nodes.

### Required Git Commits

```text
feat(core): implement createElement factory
feat(core): implement renderToDOM
```

### Verification

Confirm that the page renders, the button handler runs, the XSS test does not execute, and the browser Console contains no unexpected errors or failed assertions.

---

## Exercise 2 — Reactive State Machine & Delegation Hub

### Objective

Build a custom state-store and `useState()` dispatcher, then integrate root-level event delegation. Use them to create a task manager whose UI updates when state changes.

### Key Requirements

- Store state outside the component render function so it persists between renders.
- Reset the hook cursor at the start of each render pass.
- Ensure each `useState()` setter updates the correct state slot and triggers a re-render.
- Attach delegated event handling to the root once instead of repeatedly attaching listeners to child buttons.
- Implement task creation and dynamic filter toggles.
- Keep data flow unidirectional: **user action → state update → render**.
- Verify repeated renders do not create duplicate or orphan event listeners.

### Required Git Commits

```text
feat(state): implement stateStore and resetCursor engine
feat(state): implement reactive useState dispatcher
feat(events): attach root event delegation listener
feat(ui): assemble reactive todo application
```

### Verification

Add a task through the UI, toggle filters, confirm the visible list updates immediately, and inspect the implementation to ensure the root listener is stable across renders.

---

## Exercise 3 — Resilient State Machine & Skeleton Loader

### Objective

Build a component that handles the full asynchronous data lifecycle. The component must use the four specified states: `IDLE`, `LOADING`, `SUCCESS`, and `ERROR`.

### State Model

| State | Expected UI |
|---|---|
| `IDLE` | Initial or not-yet-loaded view |
| `LOADING` | Pulsing CSS skeleton placeholder |
| `SUCCESS` | Successfully fetched data |
| `ERROR` | Human-readable error message and a Retry Connection button |

### Key Requirements

- Transition to `LOADING` before waiting for the data request.
- Render a skeleton only while loading.
- Render fetched data only in `SUCCESS`.
- Catch failed requests and unsuccessful HTTP responses; do not leave the component stuck loading.
- Allow the user to retry after an error.
- Prevent stale requests from overwriting newer results, for example with `AbortController` or a monotonically increasing request ID.
- Verify initial state, delayed success, failure, retry, and overlapping-request behavior.

### Required Git Commit

```text
feat(ui): implement multi-state data component with skeleton feedback
```

### Verification

Test both successful and failed requests, verify the skeleton disappears when loading ends, confirm retry starts a new request, and ensure stale responses cannot replace newer data.

---

## Getting Started

### Prerequisites

- A modern browser with developer tools.
- Git.
- Python 3, Node.js, or another local static HTTP server, depending on the starter project.
- No React dependency is required for these exercises.

### Run the Browser Exercises

For a plain HTML/JavaScript exercise with an `index.html` at the project root, open a terminal in that directory and run:

```bash
python -m http.server 5500
```

Then open [http://localhost:5500](http://localhost:5500) in a browser. Using a local server is recommended for JavaScript ES modules; opening the HTML file directly may cause module-loading restrictions.

For the TypeScript-based parts, follow the repository's configured build/run command if one is provided. A browser cannot execute raw TypeScript directly without a build or transpilation step.

### Suggested Project Structure

Keep each exercise easy to run and review. Adapt names to match the provided starter files rather than duplicating files unnecessarily.

```text
mini-react-runtime-exercises/
├── README.md
├── TASK_DECOMPOSITION.md
├── PROJECT_RULES.md
├── exercise-1/
│   ├── index.html
│   ├── mini-react.js
│   └── test-runner.js
├── exercise-2/
│   ├── reactive-engine.js
│   └── checkpoint2-verify.js
└── exercise-3/
    └── state-machine.ts
```

If all exercises currently live in one directory, keep the existing layout and use the project rules to separate code by responsibility.

---

## Testing and DevTools Checklist

Before declaring an exercise complete:

- [ ] The required behavior was run in the target browser/runtime.
- [ ] Console errors and failed assertions were resolved.
- [ ] The visible UI matches the intended state and DOM structure.
- [ ] Security and edge cases from the exercise were tested.
- [ ] Required Git commits exist with the specified messages.
- [ ] The implementation is understandable enough to explain during an in-class review.

A page loading without an obvious visual issue is not sufficient proof that every requirement has passed. Record a check as complete only after verifying it.

## Project Documentation

- [`TASK_DECOMPOSITION.md`](./TASK_DECOMPOSITION.md) — task breakdown, acceptance criteria, and Definition of Done for each exercise.
- [`PROJECT_RULES.md`](./PROJECT_RULES.md) — shared coding, security, testing, state-management, and Git rules.

## Completion Standard

The project is complete when all three exercises pass their specific acceptance criteria, their required commit milestones are present, and the implementation follows the project rules. This repository is an educational mini-runtime, not a production-ready React replacement.

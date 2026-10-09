# Task Decomposition — Mini React Runtime Exercises

## 1. Project Overview

This document breaks down all three in-class exercises into implementation tasks, verification steps, and Git milestones.

| Exercise | Focus | Sprint Time | Main Deliverable |
|---|---|---:|---|
| Ex1 — Mini-React VNode & Mounting Engine | Build VNodes and mount them as real DOM | 35 minutes | A minimal rendering engine with semantic HTML and XSS verification |
| Ex2 — Reactive State Machine & Delegation Hub | Build custom state hooks and root-level event delegation | 40 minutes | A reactive task manager with dynamic filters |
| Ex3 — Resilient State Machine & Skeleton Loader | Handle asynchronous loading states and stale requests | 35 minutes | A data component with loading skeleton, success, error, and retry states |

**Implementation order:** Complete Ex1 before Ex2, then Ex3. Reuse the existing engine and conventions where appropriate, but keep each exercise's required behavior independently testable.

---

## 2. Exercise 1 — Building Mini-React VNode & Mounting Engine

**Objective:** Implement `createElement`, `createTextElement`, and `renderToDOM` from scratch. The output must use semantic HTML, resist script injection through text children, and pass a live browser DevTools audit.

### Task Breakdown

| ID | Task | Implementation Notes | Acceptance Criteria |
|---|---|---|---|
| EX1-01 | Define the VNode shape | Define an element VNode and a dedicated text-node type such as `TEXT_ELEMENT`. Keep children in a consistent location, e.g. `props.children`. | Element and text VNodes follow one predictable structure. |
| EX1-02 | Implement `createTextElement()` | Convert string and numeric children to text VNodes. | Text is represented in the VNode tree rather than inserted as HTML. |
| EX1-03 | Implement `createElement()` | Accept `type`, `props`, and variadic children; normalize nested children and ignore `null`, `undefined`, and boolean children. | Calling the factory returns a valid VNode tree. |
| EX1-04 | Handle DOM properties | Support the properties needed by the test app, including attributes, `className`, and function event handlers. | Supported props are applied consistently; non-function event values are not registered as handlers. |
| EX1-05 | Implement `renderToDOM()` | Use `document.createElement()` for elements, `document.createTextNode()` for text, and recursively append child nodes. | A VNode tree becomes a real DOM subtree. |
| EX1-06 | Build the verification app | Include semantic elements such as `main`, `section`, and `button`; avoid unnecessary wrapper elements. | The app mounts into the designated root and contains the expected semantic elements. |
| EX1-07 | Verify XSS resistance | Render the literal string `<script>alert(1)</script>` as a child. Do not use `innerHTML` to render children. | The string appears as text; no script element is created and no alert executes. |
| EX1-08 | Audit with DevTools | Compare the intended VNode tree with the browser Elements panel; check for missing, duplicate, or orphan nodes. | The DOM hierarchy matches the intended tree and the Console has no unexpected errors. |
| EX1-09 | Record Git milestones | Create the two required commits in order. | Both required commit messages appear in Git history. |

### Required Git Commits

1. `feat(core): implement createElement factory`
2. `feat(core): implement renderToDOM`

### Exercise 1 Definition of Done

- [ ] `createElement()` and `createTextElement()` create the expected VNode structures.
- [ ] `renderToDOM()` mounts the expected elements and text.
- [ ] Semantic HTML requirements are satisfied without div-soup.
- [ ] Button interaction works.
- [ ] The script-like text payload is rendered safely as text.
- [ ] DevTools confirms the expected DOM structure with no orphan nodes.
- [ ] Both required commits exist.

---

## 3. Exercise 2 — Reactive State Machine & Delegation Hub

**Objective:** Build a custom `useState` closure/state-store engine and integrate a root-level Event Delegation hub. Deliver a real-time task manager with dynamic filter toggles and atomic Git history.

### Task Breakdown

| ID | Task | Implementation Notes | Acceptance Criteria |
|---|---|---|---|
| EX2-01 | Implement the state store | Create persistent storage for hook values and a cursor/index identifying the current hook. | State survives UI renders instead of resetting on every render. |
| EX2-02 | Implement cursor reset | Reset the hook cursor at the start of each render pass. | Each `useState()` call reads/writes the correct stored slot on every render. |
| EX2-03 | Implement the `useState` dispatcher | Return `[state, setState]`; support the update forms required by the app, preferably both a value and an updater function. Trigger a rerender after a state update. | Updating state through the UI changes stored state and renders the new UI. |
| EX2-04 | Establish root event delegation | Attach the delegated event listener to the root once. Route events to actions on descendants using a stable mechanism, such as `data-action` attributes. | Clicking a child control reaches the correct action through the root listener. |
| EX2-05 | Prevent orphan/duplicate listeners | Do not repeatedly attach direct listeners to newly rendered button children. Keep the root listener stable across renders. | Repeated renders do not accumulate duplicate or orphan event listeners on child nodes. |
| EX2-06 | Build the task manager | Render task items and an Add Task interaction; update tasks immutably when adding a task. | A user can add a task and see the updated task list without manually refreshing the page. |
| EX2-07 | Implement dynamic filters | Store the selected filter in state and provide filter toggles, such as `ALL` and any task-status filters defined by the assignment. | Changing a filter updates the visible tasks immediately. |
| EX2-08 | Verify unidirectional data flow | UI actions call state setters; state drives rendering. Avoid changing rendered DOM as a substitute for updating state. | The task list and active filter are consistent with the state store after each action. |
| EX2-09 | Run the checkpoint audit | Exercise add-task and filter interactions, then inspect event behavior and rerendering. | State updates cause rerenders, filter toggles work, and there are no duplicate child listeners. |

### Required Atomic Git Commits

Create these commits as separate milestones and in this order:

1. `feat(state): implement stateStore and resetCursor engine`
2. `feat(state): implement reactive useState dispatcher`
3. `feat(events): attach root event delegation listener`
4. `feat(ui): assemble reactive todo application`

### Exercise 2 Definition of Done

- [ ] The state store persists values across renders.
- [ ] The hook cursor resets correctly before every render.
- [ ] `useState` setters trigger a rerender.
- [ ] The task manager can add tasks through the UI.
- [ ] Filter toggles update the displayed tasks.
- [ ] UI events flow through the root delegation hub.
- [ ] Repeated renders do not add duplicate/orphan listeners to child buttons.
- [ ] State changes are the source of truth for the rendered UI.
- [ ] All four required commits exist separately.

---

## 4. Exercise 3 — Resilient State Machine & Skeleton Loader

**Objective:** Implement robust asynchronous data lifecycle handling using exactly four component states: `IDLE`, `LOADING`, `SUCCESS`, and `ERROR`. Prevent stale requests from overwriting newer results, show a pulsing skeleton during loading, and provide readable errors with a retry action.

### Task Breakdown

| ID | Task | Implementation Notes | Acceptance Criteria |
|---|---|---|---|
| EX3-01 | Define the view-state model | Use a discriminated union in TypeScript or an equivalent explicit state model in JavaScript. `SUCCESS` carries data; `ERROR` carries a readable error message. | The component uses only the four specified lifecycle states. |
| EX3-02 | Implement valid transitions | Start at `IDLE`; set `LOADING` before a request; transition to `SUCCESS` or `ERROR` when it finishes. | The UI never displays contradictory lifecycle states at the same time. |
| EX3-03 | Implement async data loading | Encapsulate the fetch operation in a function such as `loadData()`. Handle failed responses and rejected requests. | Success and failure both produce a defined state transition. |
| EX3-04 | Prevent race conditions | Use cancellation (`AbortController`) or a monotonically increasing request ID so stale requests cannot overwrite the latest request's result. | A slower, older request cannot replace the result of a newer request. |
| EX3-05 | Build the loading skeleton | Render pulsing CSS placeholder blocks only while the state is `LOADING`. | A visible skeleton appears during loading and is removed when loading ends. |
| EX3-06 | Render successful data | Render the returned data only in the `SUCCESS` state. | Successful data replaces the skeleton and is displayed in the expected layout. |
| EX3-07 | Handle errors and retry | Display a human-readable error and a Retry Connection button. Catch request failures; provide a local error-handling/fallback boundary appropriate to the custom runtime. | Errors do not leave the UI stuck loading; retry starts a new request. |
| EX3-08 | Verify transitions and edge cases | Test initial state, delayed success, request failure, retry, and overlapping requests. | Each scenario displays the correct state and stale results are ignored. |
| EX3-09 | Record the Git milestone | Commit the completed multi-state data component. | The required milestone commit exists. |

### Required Git Commit

`feat(ui): implement multi-state data component with skeleton feedback`

### Exercise 3 Definition of Done

- [ ] Only `IDLE`, `LOADING`, `SUCCESS`, and `ERROR` are used as lifecycle states.
- [ ] `LOADING` renders a pulsing skeleton.
- [ ] `SUCCESS` renders the fetched data.
- [ ] `ERROR` renders a readable message and retry control.
- [ ] Retry starts a new request and can recover from a previous error.
- [ ] Older/stale asynchronous responses cannot overwrite newer results.
- [ ] No unhandled request rejection or indefinitely stuck loading state remains.
- [ ] The required Git commit exists.

---

## 5. Overall Completion Checklist

- [ ] Ex1 passes VNode, semantic HTML, XSS, mount, and DevTools checks.
- [ ] Ex2 passes state persistence, rerender, task manager, filter, and event delegation checks.
- [ ] Ex3 passes all four lifecycle states, skeleton, error/retry, and race-condition checks.
- [ ] All required exercise commits are present in the expected order.
- [ ] Tests are reported as passed only after they have actually been run.

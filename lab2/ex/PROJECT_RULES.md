# Project Rules — Mini React Runtime Exercises

These rules apply to all three exercises. Exercise-specific requirements are listed in the relevant sections below.

## 1. Scope and Technology

- Build the required runtime behavior from scratch with native JavaScript/TypeScript and browser APIs.
- Do not use React, ReactDOM, or another UI framework to implement the exercise requirements.
- Follow the language and module format already established by the starter project. Do not convert JavaScript to TypeScript or vice versa unless required by the instructor.
- Avoid unnecessary dependencies, abstractions, and generated code.
- Keep functions small, responsibilities clear, and code understandable enough to explain during an in-class review.

## 2. General Code Quality

- Use descriptive names and consistent indentation/formatting.
- Prefer small functions with one clear responsibility.
- Keep comments focused on non-obvious implementation decisions.
- Handle invalid input and expected runtime failures explicitly.
- Do not silently swallow errors or claim tests passed before running them.
- Keep each implementation change focused on the current task.

## 3. Exercise 1 Rules — VNode & DOM Mounting

### VNode Rules

- Every element VNode must have a predictable `type` and `props` structure.
- Store child VNodes consistently, e.g. in `props.children`.
- Represent text with a dedicated text VNode type.
- Convert string and numeric children to text VNodes.
- Ignore `null`, `undefined`, and boolean children instead of creating DOM nodes for them.
- Normalize nested child arrays before rendering.
- Reject or clearly handle invalid VNode input.

### DOM Rendering Rules

- Use `document.createElement()` for HTML elements.
- Use `document.createTextNode()` for text nodes.
- Recursively render children and append them using DOM APIs.
- Map `className` to the HTML `class` attribute.
- Register only function-valued event handlers; do not evaluate strings as code.
- Support only the properties needed by the exercise and handle them explicitly.
- Use semantic elements such as `main`, `section`, and `button`; avoid div-soup and unnecessary wrappers.

### Security Rules

- Never render child text with `innerHTML`.
- Do not use `eval()`, `document.write()`, or equivalent HTML-string execution to mount VNodes.
- A child string such as `<script>alert(1)</script>` must remain plain text.
- Verify the security test in the browser: the payload must not execute and must not create a script element.

### DevTools Audit

- The Elements panel must show the intended tree with no unexpected, duplicate, or orphan nodes.
- Check the Console for assertion failures and runtime errors.
- Confirm that a test button triggers its expected event handler.

## 4. Exercise 2 Rules — Reactive State & Event Delegation

### State Store and Hook Rules

- Keep hook state in persistent storage outside the component's render call.
- Reset the hook cursor at the beginning of every render pass.
- Preserve the order of `useState()` calls between renders; do not call hooks conditionally or inside loops whose order can change.
- Each setter must update the correct state slot and trigger a rerender.
- Prefer immutable state updates so changes are observable and predictable.
- State is the source of truth: UI actions update state, and rendering reflects state. Do not make direct DOM edits that bypass the state model.

### Event Delegation Rules

- Attach the delegated event listener to the root element once, not separately to every child button.
- Route events using stable action metadata, such as `data-action` and `data-task-id`, or the equivalent mechanism established by the starter project.
- Check that the event target belongs to the root before processing it.
- Do not add new direct listeners to descendants on every render.
- Re-rendering must not accumulate duplicate event callbacks or orphan child listeners.

### Task Manager Rules

- Adding a task must update state and then render the updated task list.
- Store the active filter in state.
- Filter toggles must derive visible tasks from the current state and selected filter.
- Keep event flow unidirectional: **user action → state update → render**.

## 5. Exercise 3 Rules — Async Lifecycle & Skeleton

### Lifecycle State Rules

- Use exactly four lifecycle states: `IDLE`, `LOADING`, `SUCCESS`, and `ERROR`.
- Represent state explicitly. In TypeScript, prefer a discriminated union so each state carries only the fields it needs.
- `SUCCESS` must carry the returned data; `ERROR` must carry a user-readable message.
- Enter `LOADING` before starting or awaiting the request.
- Render one coherent lifecycle view at a time; do not show success data and an active error state simultaneously.

### Async and Race-Condition Rules

- Handle unsuccessful HTTP responses as errors; do not assume every completed request succeeded.
- Catch rejected requests and return the UI to a defined state.
- Prevent stale requests from changing the current result. Use `AbortController` where appropriate or compare a request ID before committing a response.
- Ensure a request that is cancelled or superseded cannot leave the UI stuck in `LOADING`.
- Do not expose raw stack traces or internal technical details as the user-facing error message.

### Loading, Error, and Retry Rules

- Show a pulsing CSS skeleton only in `LOADING`.
- Remove the skeleton when the request enters `SUCCESS` or `ERROR`.
- Render the fetched data only in `SUCCESS`.
- In `ERROR`, render a readable message and a Retry Connection control.
- Retry must initiate a new load attempt and correctly return through `LOADING`.
- Since this is a custom runtime rather than React, implement an appropriate local error-handling/fallback boundary for request and component failures instead of assuming React's built-in Error Boundary exists.

## 6. Testing Rules for All Exercises

- Run tests in the target environment, not only by reading the code.
- Verify visible behavior as well as Console output.
- Test at least the required success path and the failure/security/edge cases specified by the exercise.
- For Ex1, verify mount, semantic structure, event handling, XSS text handling, and DOM shape.
- For Ex2, verify state persistence, rerendering, task addition, filter toggles, and absence of duplicate/orphan child listeners.
- For Ex3, verify `IDLE`, `LOADING`, `SUCCESS`, `ERROR`, retry, and overlapping request behavior.
- Fix failing assertions before marking an exercise complete.

## 7. Git Rules

- Make small, atomic commits in the required order.
- Use the exact required commit messages for exercise milestones.
- Before each commit, inspect the staged changes with `git diff --cached`.
- Do not mix unrelated refactoring or unfinished work into a milestone commit.
- Do not rewrite the required milestone messages unless the instructor explicitly permits it.
- Documentation files may be committed separately from the required exercise milestones.

### Required Commit Sequence

**Ex1**

1. `feat(core): implement createElement factory`
2. `feat(core): implement renderToDOM`

**Ex2**

3. `feat(state): implement stateStore and resetCursor engine`
4. `feat(state): implement reactive useState dispatcher`
5. `feat(events): attach root event delegation listener`
6. `feat(ui): assemble reactive todo application`

**Ex3**

7. `feat(ui): implement multi-state data component with skeleton feedback`

## 8. Definition of Done

An exercise is complete only when its required implementation, acceptance checks, and Git milestones are done. A page that merely loads is not sufficient evidence of correctness. Keep the implementation explainable, testable, and aligned with the assignment's constraints.

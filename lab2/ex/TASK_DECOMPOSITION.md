# Task Decomposition — Exercise 1
## Building Mini-React VNode & Mounting Engine

### 1. Objective

Build a minimal React-like rendering engine from scratch using vanilla JavaScript. The engine must create Virtual DOM nodes (VNode), convert them into real DOM elements, preserve semantic HTML, resist XSS injection through text children, and pass a browser DevTools audit.

**Sprint Duration:** 35 minutes

### 2. Task Breakdown

| ID | Task | Implementation | Expected Result |
|---|---|---|---|
| T01 | Define VNode structure | Define `TEXT_ELEMENT` and the VNode object format. | A consistent structure for representing elements and text. |
| T02 | Implement `createTextElement()` | Convert string and numeric values into text VNodes. | Text content is represented explicitly in the VNode tree. |
| T03 | Implement `createElement()` | Accept an element type, props, and variadic children. Normalize nested children and ignore `null`, `undefined`, and boolean children. | A complete VNode tree can be constructed without React. |
| T04 | Implement DOM property handling | Handle attributes, `className`, style objects, and function-based event handlers. | Supported VNode properties are applied to real DOM elements. |
| T05 | Implement `renderToDOM()` | Create real elements with `document.createElement()`, create text with `document.createTextNode()`, and recursively append child nodes. | The VNode tree is mounted as a real DOM tree. |
| T06 | Build a verification example | Create a test application containing `main`, `section`, `h1`, `p`, and `button`. | The rendered output uses semantic HTML and supports button interaction. |
| T07 | Verify XSS resistance | Pass `<script>alert(1)</script>` as a string child. | The string appears as plain text; no script element is created or executed. |
| T08 | Audit the rendered DOM | Compare the expected VNode structure with the browser Elements panel. Check for missing, duplicated, or unexpected nodes. | The mounted DOM matches the expected VNode structure. |
| T09 | Record Git milestones | Create two commits using the required messages. | Implementation history is separated into factory and rendering milestones. |

### 3. Git Milestones

**Commit 1 — VNode Factory**

Scope:
- Implement `createTextElement()`.
- Implement `createElement()`.
- Establish the VNode object structure.

Commit message:

`feat(core): implement createElement factory`

**Commit 2 — DOM Rendering**

Scope:
- Implement `renderToDOM()`.
- Add DOM property and event handling.
- Add the browser test page and verification checks.
- Verify semantic HTML and XSS resistance.

Commit message:

`feat(core): implement renderToDOM`

### 4. Acceptance Criteria

- [ ] `createElement()` returns a valid VNode object.
- [ ] `createTextElement()` correctly represents text content.
- [ ] `renderToDOM()` recursively creates and mounts real DOM nodes.
- [ ] The rendered application uses semantic elements, including `main`, `section`, and `button`, rather than unnecessary generic wrappers.
- [ ] Clicking the button triggers its event handler.
- [ ] A script-like string rendered as a child remains plain text.
- [ ] No unexpected script node is created by the XSS test.
- [ ] The browser Elements panel matches the intended VNode tree.
- [ ] Both required Git commits exist.

### 5. Definition of Done

Exercise 1 is complete when the rendering engine passes the verification checks, the DOM audit shows the expected structure, and both required commits have been created successfully.

The implementation is a minimal educational rendering engine, not a complete replacement for React.
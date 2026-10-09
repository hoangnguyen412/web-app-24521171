# Project Rules — Mini-React Exercise 1

## 1. Scope and Technology

- Use vanilla JavaScript and native browser DOM APIs.
- Implement the rendering engine from scratch.
- Do not use React, ReactDOM, or another UI framework to implement the required functionality.
- Keep the implementation small, readable, and appropriate for a 35-minute in-class sprint.
- Do not introduce unnecessary dependencies.

## 2. Project Structure

Expected files:

- `mini-react.js` — VNode factories, DOM property handling, and rendering engine.
- `test-runner.js` — verification example and assertions.
- `index.html` — browser entry point and mount container.

The application must import `createElement()` and `renderToDOM()` from `mini-react.js` using JavaScript ES modules.

## 3. VNode Rules

- Every element VNode must have a `type` and a `props` object.
- Child nodes must be stored consistently in `props.children`.
- Text must be represented by a dedicated text VNode type.
- Strings and numbers used as children must be converted to text VNodes.
- `null`, `undefined`, and boolean children must not create DOM nodes.
- Nested children must be normalized before rendering.
- Invalid VNode input must not be silently treated as a valid element.

## 4. Rendering Rules

- Use `document.createElement()` for HTML elements.
- Use `document.createTextNode()` for text nodes.
- Build child elements recursively and append them with `appendChild()`.
- Do not use `innerHTML` to render VNode content.
- Do not use `eval()`, `document.write()`, or other HTML-string execution techniques.
- Handle supported properties explicitly and consistently.
- Convert supported event props, such as `onClick`, into native event listeners.
- Only function values may be registered as event handlers.
- Map `className` to the HTML `class` attribute.
- Use semantic elements such as `main`, `section`, and `button` where appropriate.
- Avoid unnecessary generic containers and div-soup.

## 5. Security Rules

- Treat string children as text, never as executable HTML.
- Passing `<script>alert(1)</script>` as a child must not create a script element.
- Do not evaluate string-based event handlers.
- Do not insert untrusted content into the DOM using `innerHTML`.
- Verify the XSS test in the browser rather than relying on visual appearance alone.

## 6. Testing and DevTools Audit

- Run the application through a local HTTP server.
- Confirm that the expected elements appear in the Elements panel.
- Check that the rendered hierarchy matches the intended VNode tree.
- Confirm that no unexpected or duplicated child nodes are present.
- Click the button and verify that its event handler runs.
- Verify that the XSS payload appears as plain text and does not execute.
- Check the Console for assertion failures and runtime errors.

A successful page load alone does not mean the exercise has passed.

## 7. Git Rules

Use the two mandatory commits in the specified order.

1. `feat(core): implement createElement factory`
2. `feat(core): implement renderToDOM`

Each commit must represent its intended implementation milestone. Do not combine both milestones into one commit.

Before committing, inspect the staged changes with `git diff --cached` and confirm that only the intended files and changes are included.

## 8. Code Quality

- Use descriptive function and variable names.
- Prefer small functions with one clear responsibility.
- Use consistent formatting and indentation.
- Avoid unnecessary abstractions and duplicated logic.
- Keep comments focused on non-obvious implementation decisions.
- Do not claim that a test passed until it has actually been executed.

## 9. Completion Rule

Exercise 1 is complete only when the implementation, verification checks, security test, DevTools audit, and both required Git commits have been completed.
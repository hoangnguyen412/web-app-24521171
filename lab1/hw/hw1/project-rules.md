# PROJECT RULES — HW1 Production Portfolio

## 1. Architecture

- Use **Vanilla HTML5**, modern CSS, and **ES6+ JavaScript** exclusively.
- Do not use jQuery.
- Do not use Bootstrap.
- Do not use Tailwind.
- Do not use external script CDNs.
- Prefer native semantic HTML over generic `<div>` containers.

## 2. HTML Rules

- Use a valid HTML5 document.
- Use `<html lang="en">`.
- Include UTF-8 charset metadata.
- Include the responsive viewport metadata.
- Do not use the obsolete `X-UA-Compatible` meta tag.
- Use semantic landmarks.
- Maintain exactly one primary `<h1>` per document.
- Do not skip heading levels.
- Use explicit visible `<label>` elements for form controls.
- Do not misuse placeholders as the only visible labels.
- Use accessible text and descriptions where required.
- Provide descriptive `alt` attributes for meaningful images.
- Give images explicit dimensions when needed to prevent layout shift.
- Prefer native elements such as `<dialog>` when a native modal is needed.

## 3. CSS Rules

- Use external stylesheets where appropriate.
- Use the modern box-sizing reset:
  - `box-sizing: border-box`
  - reset margin/padding as required by the project stylesheet.
- Prefer CSS custom properties / design tokens for shared colors and values.
- Do not create unnecessary inline styles.
- Use Flexbox for one-dimensional layouts.
- Use CSS Grid for two-dimensional layouts.
- Prefer `gap` for spacing between flex/grid children.
- The page must work at a **375px** viewport without horizontal scrolling.
- The color system must meet the required **WCAG 2.2 AA** contrast target.
- Avoid avoidable layout shift.

## 4. JavaScript Rules

- Use ES6+ JavaScript.
- Use `const` by default.
- Use `let` only when reassignment is necessary.
- Do not use `var`.
- Use `document.querySelector()` / `querySelectorAll()` for DOM selection.
- Use `classList` methods for class manipulation.
- Use standard events.
- Keep behavior in JavaScript rather than inline HTML handlers.
- Do not use deprecated `keypress` / `event.keyCode` patterns.
- Do not render unescaped user input with `innerHTML`.

## 5. Security Rules

- Add a strict **Content Security Policy (CSP)**.
- Zero inline event handlers.
- Do not use `onclick`, `onchange`, `onsubmit`, or similar inline event attributes.
- Never render unescaped user input through `innerHTML`.
- Inspect the console after adding CSP.
- Do not add unauthorized external dependencies or script sources.

## 6. Accessibility Rules

- Provide a skip link to the main content.
- Use semantic landmarks.
- Provide visible and usable keyboard focus.
- Navigation must support full `Tab` and `Enter` flow.
- Do not create focus traps.
- Maintain correct heading hierarchy.
- Use explicit labels for form controls.
- Use descriptive image `alt` text.
- Check contrast against the required WCAG 2.2 AA target.

## 7. Performance Rules

- Target a **Lighthouse score of 100** for the performance milestone.
- Optimize assets where the audit identifies a problem.
- Prevent avoidable Cumulative Layout Shift (CLS).
- Provide dimensions for images/media when appropriate.
- Re-run Lighthouse after changes.

## 8. Responsive Rules

- Mobile-first verification is required.
- Verify **375px viewport first**.
- There must be zero horizontal scrolling at 375px.
- Desktop verification comes after the mobile baseline passes.

## 9. AI Workflow Rules

- Do not submit the entire assignment as one monolithic AI prompt.
- Decompose work into isolated, verifiable tasks first.
- Define the task contract before asking AI to implement it.
- Ask AI to work on **one task at a time**.
- Verify the result independently.
- Inspect `git diff` before committing.
- Commit each completed milestone atomically.
- Do not combine unrelated HTML/CSS/JS milestones in one commit.

## 10. Git Rules

Use clear atomic commits.

Required HW1 milestone commits:

```text
docs(spec): define component contracts & WBS table
fix(a11y): contrast & landmarks
fix(nav): keyboard trap prevention
security: add strict CSP
perf: optimize assets
```

Each commit must represent a distinct engineering milestone.

## 11. Verification Rules

Before considering a task complete:

1. Run the relevant browser/devtools check.
2. Inspect the code and Git diff.
3. Verify the acceptance criteria for the isolated task.
4. Commit only after the task passes verification.

## 12. Project Principle

> AI can generate code. Developers are responsible for proving that it is correct.

Generate with AI. Verify with engineering.

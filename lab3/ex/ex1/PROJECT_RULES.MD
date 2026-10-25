# Project Rules — Exercise 1

## 1. Technology

- Use React 19 with the existing Vite setup.
- Use JavaScript and JSX unless the starter project already requires another
  language.
- Prefer native browser features and existing dependencies.
- Do not add a library for functionality that can be implemented simply
  with React and CSS.

## 2. Semantic HTML — Zero Div-Soup

- Absolutely no `<div>` elements are allowed in `DeveloperCard.jsx`.
- Prefer semantic elements that match the content's meaning.
- Use `<article>` as the profile card's main semantic container.
- Use `<header>` and `<hgroup>` for the profile heading when appropriate.
- Use `<dl>`, `<dt>`, and `<dd>` for labeled profile information.
- Use `<ul>` and `<li>` for the collection of skills.
- Use React `Fragment` when grouping multiple elements without introducing
  an unnecessary DOM node.
- Supporting elements such as `<img>`, `<p>`, and `<span>` may be used when
  semantically appropriate.
- Do not replace a `<div>` with another element solely to imitate a generic
  container. Select elements based on their intended meaning.

## 3. Component Responsibilities

### DeveloperCard

- Receives profile information through props.
- Owns the semantic structure of the profile card.
- Renders profile information and the collection of skills.
- Uses `SkillBadge` to render individual skills.
- Provides meaningful text alternatives for meaningful images.
- Handles avatar load failure by displaying fallback initials.
- Does not contain inline style objects or hard-coded presentation values.

### SkillBadge

- Represents one skill label.
- Accepts its label through props.
- Accepts an optional `className` for styling.
- Does not depend on a specific developer profile.
- Does not introduce unnecessary wrapper elements.

## 4. Styling Rules

- Use `DeveloperCard.module.css` for component styling.
- Use CSS Module class names instead of global presentation selectors.
- Do not use JSX inline styles such as `style={{ background: '#d0f0c0' }}`.
- Define reusable design tokens with CSS custom properties.
- Keep colors, spacing, borders, and typography consistent.
- Use responsive CSS instead of relying on a desktop-only fixed layout.
- Do not add horizontal page overflow at a viewport width of 375px.
- Avoid unnecessary absolute positioning and hard-coded element heights.

## 5. Image Security and Stability

- Avatar media URLs must use HTTPS.
- Do not introduce insecure `http://` media URLs in `DeveloperCard.jsx`.
- Set explicit numeric `width` and `height` attributes on the avatar image.
- Use CSS such as `object-fit: cover` to control image cropping.
- Provide an appropriate `alt` attribute.
- If the avatar fails to load, show the person's initials.
- Ensure the fallback does not break the card layout.

## 6. Accessibility

- Preserve a logical heading hierarchy.
- Use `<dt>` for each descriptive term and `<dd>` for its corresponding value.
- Ensure each skill is exposed as readable text.
- Do not use color as the only way to communicate information.
- Maintain readable text and visible content at narrow viewport widths.
- Inspect the Accessibility Tree in Chrome DevTools.
- Verify actual keyboard and screen-reader behavior when relevant.

## 7. Code Quality

- Keep components small and responsibilities clear.
- Use descriptive variable and prop names.
- Avoid duplicated markup for repeated skills.
- Use stable keys when rendering arrays.
- Remove unused imports, variables, and code.
- Do not add unnecessary state; use state only where needed, such as tracking
  avatar load failure.
- Do not modify unrelated exercises or project configuration.

## 8. Git Rules

This exercise requires exactly two dedicated implementation commits:

1. `feat(ex1): implement semantic DeveloperCard and SkillBadge`
2. `style(ex1): add responsive 375px CSS module`

- The first commit introduces the semantic components and integrates the card.
  Include the initial exercise documentation in this commit.
- The second commit adds the CSS Module and responsive styling.
- Do not create a separate documentation commit for this exercise.
- Do not change the required commit messages.
- Keep each commit focused on its intended implementation stage.

## 9. Verification Rules

Before declaring the exercise complete:

- Confirm there are no `<div>` elements in `DeveloperCard.jsx`.
- Confirm there are no `http://` URLs in `DeveloperCard.jsx`.
- Confirm avatar dimensions and fallback behavior.
- Build the application successfully.
- Test at a 375px viewport.
- Inspect the Accessibility Tree.
- Confirm the two required commits exist.
- Capture report screenshots only after the relevant checkpoint passes.
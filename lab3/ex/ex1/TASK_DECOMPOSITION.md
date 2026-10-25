# Task Decomposition — Exercise 1
## Semantic Engineer & Pro-Gamer Profile Card

## 1. Objective

Upgrade the relevant legacy exercises (Ex 0.2, 0.3, 4.1, 4.4, and 4.5)
into a reusable React 19 profile card using Vite.

Implement two components:

- `DeveloperCard`: presents developer identity, profile information,
  gaming information, and technical skills.
- `SkillBadge`: displays one skill as a small reusable label.

The exercise focuses on semantic HTML, reusable React components,
CSS Modules, responsive design, accessibility, and basic image security.

## 2. Scope and Constraints

- Use React 19 and the existing Vite project.
- `DeveloperCard.jsx` must contain zero `<div>` elements.
- Use semantic elements such as `<article>`, `<header>`, `<hgroup>`,
  `<dl>`, `<dt>`, `<dd>`, `<ul>`, and `<li>` where appropriate.
- Use React `Fragment` when grouping siblings without an extra DOM element.
- Replace inline styles with `DeveloperCard.module.css`.
- Define reusable design tokens using CSS custom properties.
- Support a viewport width of 375px without horizontal page overflow.
- Avatar URLs must use HTTPS and have explicit `width` and `height`.
- Display fallback initials when the avatar cannot be loaded.
- Create exactly two exercise commits using the required commit messages.

## 3. Implementation Plan

### Phase 1 — Inspect and Prepare (5 minutes)

- Inspect the current Vite project, `package.json`, `App.jsx`, and `main.jsx`.
- Review the relevant legacy examples and reuse their intended content.
- Confirm the existing folder structure before creating new files.
- Avoid replacing existing project configuration unless necessary.

**Deliverable:** A clear understanding of the starter project and the files
that need to be created or modified.

### Phase 2 — Build Semantic Components (15–20 minutes)

Create `src/components/DeveloperCard.jsx` and
`src/components/SkillBadge.jsx`.

`DeveloperCard` responsibilities:

- Receive profile information through props.
- Present the developer's name, role, short bio, and profile details.
- Present the gaming handle, game, or rank when supplied.
- Render a collection of skills using `SkillBadge`.
- Use semantic HTML instead of generic layout containers.
- Provide meaningful avatar alternative text.
- Show fallback initials if the avatar fails to load.
- Avoid inline styles and all `<div>` elements in this component file.

`SkillBadge` responsibilities:

- Accept a skill label and an optional CSS class name.
- Render one skill consistently.
- Remain reusable and independent of the profile's content.

Integrate the components into `App.jsx` so the application renders
one complete example profile.

Keep this first implementation functional without depending on a CSS
Module that will only be introduced in the next phase.

**Deliverable:** A working, semantic profile card and reusable skill badge.

**Commit 1:**
`feat(ex1): implement semantic DeveloperCard and SkillBadge`

The initial project documentation should be included with this commit
rather than committed separately.

### Phase 3 — Add CSS Modules and Responsive Styling (15–20 minutes)

Create `src/components/DeveloperCard.module.css` and connect it to
the components.

- Replace inline styles and use CSS Module class names.
- Define shared design tokens with CSS custom properties.
- Style the card, profile header, avatar, profile details, skill list,
  and skill badges.
- Give the avatar fixed dimensions and use `object-fit: cover`.
- Add responsive rules for narrow screens.
- Ensure that text wraps correctly and content stays within the viewport.
- Avoid fixed widths that cause horizontal overflow at 375px.
- Keep styles scoped instead of introducing unnecessary global selectors.

**Deliverable:** A polished profile card that adapts to desktop and mobile.

**Commit 2:**
`style(ex1): add responsive 375px CSS module`

### Phase 4 — Functional and Accessibility Verification (10 minutes)

Run the Vite production build and inspect the rendered application.

Verify the following:

1. `DeveloperCard.jsx` contains zero `<div>` elements.
2. No insecure `http://` media URL appears in `DeveloperCard.jsx`.
3. The avatar has explicit `width` and `height` attributes.
4. The initials fallback works when the avatar fails to load.
5. The Accessibility Tree exposes the article, header, profile details,
   and skills list with appropriate semantics.
6. The page has no horizontal overflow at 375px.
7. The two required commits have the exact specified messages.

**Deliverable:** Verified source code, layout, accessibility structure,
and Git history.

### Phase 5 — Report Evidence (5–10 minutes)

Save evidence under `docs/screenshots/`.

Capture the final results at the appropriate checkpoints:

- Desktop profile card after styling is complete.
- iPhone SE viewport at 375px showing no horizontal overflow.
- Chrome DevTools Accessibility Tree.
- Terminal output confirming the source checks and production build.
- Git log showing the two required exercise commits.

Only capture screenshots after the corresponding implementation or
verification stage has actually been completed.

**Deliverable:** Relevant screenshots ready to include in the exercise report.

## 4. Acceptance Criteria

The exercise is complete when:

- [ ] `DeveloperCard` and `SkillBadge` render correctly in the Vite app.
- [ ] `DeveloperCard.jsx` contains no `<div>` elements.
- [ ] Profile details use suitable semantic HTML.
- [ ] Inline styling has been replaced with CSS Modules.
- [ ] CSS custom properties are used for reusable design tokens.
- [ ] The avatar uses HTTPS, explicit dimensions, and fallback initials.
- [ ] The layout works at a 375px viewport without horizontal scrolling.
- [ ] The production build succeeds.
- [ ] The two required commits exist with the exact commit messages.
- [ ] Appropriate screenshots have been saved for the report.

## 5. Out of Scope

- Backend or database integration.
- Authentication and user registration.
- API calls or remote profile editing.
- A full gaming dashboard or complex animations.
- Additional dependencies that are unnecessary for the exercise.
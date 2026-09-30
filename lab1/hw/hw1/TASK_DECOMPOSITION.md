# TASK DECOMPOSITION — HW1: Production Portfolio

## Project

**Assignment:** Homework 1 — Production Portfolio  
**Course:** Web Application Development  
**Architecture:** Vanilla HTML5 + Modern CSS + ES6+ JavaScript

## Engineering Workflow

This project follows an atomic, contract-first workflow:

1. Define the task before using AI.
2. Work on one isolated sub-task at a time.
3. Verify the sub-task independently.
4. Commit the completed milestone.
5. Inspect the Git diff before moving to the next milestone.
6. Integrate only after the isolated task passes its acceptance checks.

**One-shot / monolithic AI prompting is not allowed.**

---

## Project Constraints

- Use Vanilla HTML5, modern CSS, and ES6+ JavaScript.
- No jQuery.
- No Bootstrap.
- No Tailwind.
- No external script CDNs.
- Prefer native semantic HTML over generic `<div>` containers.
- Use `const` by default and `let` only when reassignment is required.
- Never render unescaped user input with `innerHTML`.
- Verify the mobile layout at **375px** before desktop.
- Navigation must support full keyboard **Tab** and **Enter** flow.
- The page must satisfy the required WCAG 2.2 AA contrast target.
- The page must have zero horizontal scrolling at 375px.
- Do not use inline event handlers such as `onclick`.
- Add a strict Content Security Policy (CSP).
- Target a Lighthouse score of 100 for the performance milestone.

---

# WBS / Milestones

## T-01 — Semantic HTML & Accessibility Foundation

### Objective
Build the semantic document structure and establish the accessibility foundation.

### Tasks
- Create the HTML document structure.
- Use semantic landmark elements.
- Use a skip link to the main content.
- Maintain exactly one primary `<h1>`.
- Maintain sequential heading levels.
- Use meaningful visible labels for interactive form controls where applicable.
- Prefer semantic HTML over generic containers.

### Contract 
- No unnecessary generic `<div>` containers.
- Skip link points to the main content.
- One primary `<h1>`.
- Landmark structure is valid and understandable.

### Verification
- Open the page in Chrome.
- Open DevTools Accessibility tools.
- Verify the landmark tree.
- Check the heading hierarchy.
- Test the skip link.

### Commit
```bash
git add .
git commit -m "fix(a11y): contrast & landmarks"
```

---

## T-02 — Keyboard Navigation / Focus

### Objective
Make the portfolio fully usable through keyboard navigation.

### Tasks
- Verify all navigation links and interactive controls can be reached with `Tab`.
- Verify activation through `Enter` where applicable.
- Check visible focus behavior.
- Audit for focus traps.
- Remove or fix any navigation path that prevents keyboard progress.

### Contract
- Full keyboard Tab flow.
- Enter activates relevant links/buttons.
- No focus trap.
- Keyboard navigation does not depend on mouse input.

### Verification
- Use keyboard only.
- Start from the page load.
- Press `Tab` through the full page.
- Use `Enter` on relevant controls.
- Confirm focus always moves forward correctly.

### Commit
```bash
git add .
git commit -m "fix(nav): keyboard trap prevention"
```

---

## T-03 — Security / Strict CSP

### Objective
Harden the portfolio against the explicitly prohibited unsafe patterns.

### Tasks
- Add a strict Content Security Policy.
- Remove inline event handlers.
- Do not use `onclick`, `onchange`, `onsubmit`, or similar inline handlers.
- Bind events from JavaScript.
- Audit dynamic rendering for unsafe `innerHTML` usage.
- Do not render unescaped user input with `innerHTML`.

### Contract
- Strict CSP is present.
- Zero inline event handlers.
- No unsafe unescaped user-input rendering.
- JavaScript behavior is separated from HTML markup.

### Verification
- Inspect HTML for inline event attributes.
- Inspect JavaScript for unsafe `innerHTML` patterns.
- Reload the page and check the browser console for CSP errors.
- Confirm all interactive behavior still works.

### Commit
```bash
git add .
git commit -m "security: add strict CSP"
```

---

## T-04 — Performance / Lighthouse

### Objective
Optimize the portfolio to satisfy the performance milestone.

### Tasks
- Run Lighthouse.
- Inspect performance findings.
- Optimize assets.
- Check for layout shift.
- Ensure media elements have explicit dimensions where needed.
- Re-run Lighthouse after fixes.

### Contract
- Target Lighthouse score: **100**.
- No avoidable layout shift.
- Media/assets are optimized sufficiently for the assignment target.

### Verification
- Run Lighthouse in Chrome DevTools.
- Record the result.
- Fix identified issues.
- Re-run Lighthouse.

### Commit
```bash
git add .
git commit -m "perf: optimize assets"
```

---

# Final Acceptance Audit

## Accessibility
- [ ] Semantic landmark structure
- [ ] Skip link works
- [ ] Exactly one primary `<h1>`
- [ ] Heading hierarchy is sequential
- [ ] WCAG 2.2 AA contrast target satisfied
- [ ] Full keyboard Tab navigation
- [ ] Enter works on relevant interactive elements
- [ ] No focus trap

## Responsive
- [ ] Verified at 375px viewport
- [ ] No horizontal scrolling
- [ ] Layout remains usable on mobile

## Security
- [ ] Strict CSP added
- [ ] No inline event handlers
- [ ] No unsafe unescaped `innerHTML`
- [ ] No console errors caused by CSP or dynamic interactions

## Performance
- [ ] Lighthouse audit completed
- [ ] Target Lighthouse score: 100
- [ ] No avoidable layout shift

## Git / Process
- [ ] `TASK_DECOMPOSITION.md` committed
- [ ] Work completed in isolated milestones
- [ ] Each milestone has its own commit
- [ ] Git diff inspected before each milestone commit
- [ ] No monolithic commit combining unrelated milestones

---

# Required Commit Sequence

```text
1. docs(spec): define component contracts & WBS table
2. fix(a11y): contrast & landmarks
3. fix(nav): keyboard trap prevention
4. security: add strict CSP
5. perf: optimize assets
```

## Oral Defense Preparation

Be prepared to explain:

- Why semantic HTML is used.
- How the landmark tree is structured.
- How keyboard navigation works.
- How focus traps are prevented.
- Where CSP is defined and what it protects.
- Why inline event handlers are avoided.
- How unsafe `innerHTML` usage is avoided.
- What was changed during the Lighthouse optimization milestone.
- The purpose of each Git commit and its corresponding task.

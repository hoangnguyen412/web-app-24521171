# PROJECT RULES — HW1 Production Portfolio

## 1. Architecture & Tech Stack
- Use **Vanilla HTML5**, modern CSS, and **ES6+ JavaScript** exclusively.
- **BANNED**: jQuery, Bootstrap, Tailwind, external script CDNs.

## 2. HTML & Accessibility (A11y)
- Standard boilerplate: `<html lang="en">`, UTF-8 charset, responsive viewport.
- Prioritize native semantic HTML (landmarks) over generic `<div>` containers.
- Maintain exactly ONE primary `<h1>` per document. No skipped heading levels.
- Use explicit visible `<label>` for forms; do not use placeholders as labels.
- Provide descriptive `alt` attributes for images.
- Include a "skip to main content" link.
- Must support full keyboard `Tab` and `Enter` flow without focus traps.

## 3. CSS & Responsive Design
- **Mobile-first**: Must verify 375px viewport baseline first (Zero horizontal scrolling).
- Use modern reset: `box-sizing: border-box`, reset margin/padding.
- Layouts: Flexbox for 1D, CSS Grid for 2D. Use `gap` (no margin overrides).
- Design Tokens: Use CSS custom properties for shared colors/values.
- Color system must meet **WCAG 2.2 AA** contrast target.

## 4. JavaScript & Security
- Variables: `const` by default, `let` only if reassigned. BANNED: `var`.
- DOM: `querySelector()`, `querySelectorAll()`, `classList`.
- **Zero inline event handlers** (e.g., `onclick` is strictly banned). Bind via JS.
- **Strict CSP**: Implement Content Security Policy.
- **No XSS Risks**: Never render unescaped user input with `innerHTML`.

## 5. Performance
- Target **Lighthouse score of 100**.
- Zero avoidable CLS (Cumulative Layout Shift) — give media explicit dimensions.

## 6. AI & Engineering Workflow
- **No one-shot prompting**: Do not submit the entire assignment at once.
- Work on one isolated task at a time. Verify independently before committing.
- "Generate with AI. Verify with engineering."
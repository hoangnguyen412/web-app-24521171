# TASK DECOMPOSITION — HW1: Production Portfolio

## T-01 — Semantic HTML & Accessibility Foundation
- **Objective**: Build the semantic document structure and establish the A11y foundation.
- **Tasks**: Create landmark elements, skip-link, one `<h1>`, sequential headings, and semantic form labels.
- **Contract**: Zero unnecessary `<div>` containers. Valid landmark tree.
- **Verification**: Chrome DevTools Accessibility -> Verify landmark tree & heading hierarchy.
- **Atomic Commit**: `fix(a11y): contrast & landmarks`

## T-02 — Keyboard Navigation & Focus Trap Prevention
- **Objective**: Make the portfolio fully usable via keyboard.
- **Tasks**: Ensure all interactive controls are reachable via `Tab` and activated via `Enter`. Audit and fix focus traps.
- **Contract**: 100% keyboard navigable. Visible focus indicators present.
- **Verification**: Unplug mouse. Navigate entire page using only `Tab` and `Enter` from initial load.
- **Atomic Commit**: `fix(nav): keyboard trap prevention`

## T-03 — Security Hardening & Strict CSP
- **Objective**: Apply security constraints and eliminate unsafe code patterns.
- **Tasks**: Implement strict Content Security Policy. Remove all inline event handlers (`onclick`, `onsubmit`, etc.). Check for unsafe `innerHTML`.
- **Contract**: Zero inline handlers. Zero unescaped `innerHTML`. Clean console under strict CSP.
- **Verification**: Inspect HTML/JS. Check browser console for CSP violation errors.
- **Atomic Commit**: `security: add strict CSP`

## T-04 — Performance Optimization (Lighthouse 100)
- **Objective**: Achieve peak performance score.
- **Tasks**: Run Lighthouse audit. Optimize assets. Set explicit dimensions for images to prevent Cumulative Layout Shift (CLS).
- **Contract**: Lighthouse score = 100. CLS = 0.
- **Verification**: Run Chrome DevTools Lighthouse audit on Mobile setting.
- **Atomic Commit**: `perf: optimize assets`

---

## Required Commit Sequence & Final Audit
Ensure your `git log` reflects the following isolated milestones before final submission:

1. `docs(spec): define component contracts & WBS table` *(Done when creating this file)*
2. `fix(a11y): contrast & landmarks`
3. `fix(nav): keyboard trap prevention`
4. `security: add strict CSP`
5. `perf: optimize assets`

*Oral Defense Prep: Be ready to explain semantic structures, focus handling, CSP rules, and performance optimizations within 3 minutes.*
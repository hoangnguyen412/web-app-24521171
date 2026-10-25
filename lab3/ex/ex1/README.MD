# Exercise 1 — Semantic Engineer & Pro-Gamer Profile Card

A reusable React 19 profile card built with Vite. The exercise focuses on semantic HTML (the Zero Div-Soup mandate), reusable components, CSS Modules with design tokens, a responsive 375px layout, accessibility, and basic image security and stability.

It upgrades the legacy exercises Ex 0.2, 0.3, 4.1, 4.4 (Elon Musk Card) and 4.5 (User Profile).

## Exercise Scope

Build two components:

- `src/components/DeveloperCard.jsx`: presents the developer's identity, key-value metrics, and a collection of skills inside one semantic `<article>`.
- `src/components/SkillBadge.jsx`: renders a single skill label and accepts an optional `className`.

Default profile supplied by the component:

- **Name:** Dang Hoang Nguyen
- **Role:** Senior Systems Architect • UIT S3T
- **Metrics:** `commits: 512`, `vmNodes: 0`, `allyScore: 100`
- **Skills:** `React 19 Fiber (Core)`

`App.jsx` renders the card with a local avatar served from `public/me.jpg`.

## Required Behavior

- Receive all profile data through props with ES6 default parameters.
- Use `<article aria-labelledby="dev-heading">` as the card landmark, bound to the `<h2>` title.
- Use `<header>` and `<hgroup>` for the avatar and the name/role block.
- Render metrics with `Object.entries(metrics)` as `<dl>` / `<dt>` / `<dd>` groups wrapped in `<Fragment key={key}>`.
- Render skills inside `<ul aria-label="Engineered Skills">` with stable `key={skill.id}` and one `SkillBadge` per `<li>`.
- Replace inline `style={{ background: '#d0f0c0' }}` (Slide 18) with `DeveloperCard.module.css` and CSS custom properties.
- Replace the insecure `http://` avatar (Slide 21) with HTTPS or a local asset, explicit numeric `width` and `height`, and `object-fit: cover`.
- If the avatar fails to load (`onError`), show fallback initials in a `role="img"` element without breaking the layout.
- Keep **zero** `<div>` elements in `DeveloperCard.jsx`.

## Technology and Requirements

- React 19 function components and hooks (`useState` only for avatar load failure).
- Vite build tooling.
- CSS Modules (`DeveloperCard.module.css`) with scoped class names and design tokens (`--accent`, `--accent-soft`, `--text`, `--muted`, `--border`, `--surface`).
- Semantic HTML: `article`, `header`, `hgroup`, `dl`, `dt`, `dd`, `ul`, `li`, `Fragment`.
- No extra runtime dependencies.

## Project Structure

```text
ex1/
├── PROJECT_RULES.MD
├── TASK_DECOMPOSITION.md
├── README.md
├── index.html
├── vite.config.js
├── public/
│   ├── me.jpg              # 128×128 optimized avatar
│   └── favicon.svg
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    └── components/
        ├── DeveloperCard.jsx
        ├── DeveloperCard.module.css
        └── SkillBadge.jsx
```

## Getting Started

Run commands from the project root:

```bash
npm install
npm run dev
```

Before committing, run the project checks:

```bash
npm run lint
npm run build
```

## Performance (Lighthouse Mobile)

Measure the **production build**, not the Vite dev server. The dev server ships unminified development builds of React (about 3.6 MB) and scores roughly 55 on mobile Slow 4G, which is not representative.

```bash
npm run audit
```

Then run Lighthouse (Mobile) on `http://localhost:5173/`.

Optimizations applied:

- The avatar is resized to 128×128 (about 3 KB) instead of 832×1248 (about 81 KB) for a 64px display size.
- The avatar is preloaded with `<link rel="preload" as="image" fetchpriority="high">`.
- The `<img>` uses `fetchPriority="high"` and `decoding="async"`, with explicit `width` and `height` for zero CLS.

Measured on the production build: Performance 100, FCP about 1.4 s, LCP about 1.5 s, TBT 0 ms, CLS 0.

## Verification Checklist

- [ ] `DeveloperCard` and `SkillBadge` render correctly in the Vite app.
- [ ] `grep -n '<div' src/components/DeveloperCard.jsx` returns 0 matches.
- [ ] `grep -n 'http://' src/components/DeveloperCard.jsx` returns 0 matches.
- [ ] The avatar has explicit numeric `width` and `height` and uses `object-fit: cover`.
- [ ] Initials fallback appears when the avatar fails to load, without layout shift.
- [ ] No inline `style` objects exist in the JSX.
- [ ] CSS custom properties define the reusable design tokens.
- [ ] The Accessibility Tree shows `article` → `header` + `dl` + `list`.
- [ ] Chrome DevTools Device Toolbar (iPhone SE, 375px) shows no horizontal scroll.
- [ ] `npm run build` succeeds and the browser console has no relevant errors.
- [ ] Lighthouse Performance on the production build is above 90.
- [ ] Exactly the two required commits are present.

## Verification Audit

```bash
# 1. Zero <div> soup inside the component (expected: 0 matches)
grep -n '<div' src/components/DeveloperCard.jsx

# 2. HTTPS-only media origins (expected: 0 matches)
grep -n 'http://' src/components/DeveloperCard.jsx
```

## Required Git History

Create these two commits using the exact messages specified by the assignment:

1. `feat(ex1): implement semantic DeveloperCard and SkillBadge`
2. `style(ex1): add responsive 375px CSS module`

Do not create an extra documentation-only commit. Include the documentation files (`README.md`, `PROJECT_RULES.MD`, `TASK_DECOMPOSITION.md`) in the first commit, or leave them unstaged until they can be included without adding a third commit.
# PROJECT RULES — HW2 Drum Kit Engine

## 1. Architecture & Tech Stack
- Use **Vanilla HTML5**, modern CSS, and **ES6+ JavaScript** exclusively.
- **BANNED**: jQuery, Bootstrap, Tailwind, external script CDNs.
- **Contract-First Architecture**: Data must be decoupled from logic. State and config (like sound paths) must live in HTML attributes, not hardcoded in JavaScript switch-cases.

## 2. HTML & CSS Standard
- Use semantic HTML. BANNED: unnecessary `<div>` wrappers.
- Configuration must be mapped using `data-key` and `data-sound` attributes.
- Layout must be responsive (375px baseline) using Flexbox or CSS Grid.

## 3. JavaScript & Event Handling
- Variables: `const` by default, `let` only if reassigned. BANNED: `var`.
- **Keyboard Events**: Must use W3C standard `keydown` and `event.key`.
- **BANNED EVENT APIS**: `keypress` and `event.keyCode` are strictly obsolete and prohibited.
- **Audio Flood Prevention**: Event listener must inspect `event.repeat` to throttle inputs and prevent audio glitching on held keys.

## 4. Security
- **Strict CSP**: Implement Content Security Policy.
- **Zero inline event handlers** (e.g., `onclick` is strictly banned).
- **No XSS Risks**: Never render unescaped user input with `innerHTML`.

## 5. Engineering Workflow
- **No one-shot prompting**: Do not pass the whole assignment to AI at once.
- Work on one isolated subsystem at a time.
- Generate with AI. Verify with engineering.
# HW1 — Production Studio Drum Kit

React 19 + Vite drum kit built for Homework 1 (WCAG 2.2 AA keyboard and focus engineering). Pads are played with the keyboard, mouse or touch, with a visual hit log and level meter for deaf and hard-of-hearing users.

## Features

- **7 pads** mapped to physical keys `W A S D J K L` using `e.code` (`KeyW`, `KeyA`, ...), so Vietnamese IME (UniKey) does not break triggers.
- **Keyboard hook** `useDrumKeyboard`: handles `keydown` and `keyup`, ignores `e.repeat` (no hold-key flooding), ignores typing in `INPUT`/`TEXTAREA`/`SELECT`, and ignores `Ctrl`/`Alt`/`Meta` combinations so browser shortcuts keep working.
- **Accessible pads**: each pad is a `<button aria-pressed>` with an accessible name (pad name and key) and a visible focus ring.
- **Hit Log**: `<output aria-live="polite">` containing the hit history; each hit has its own number so repeated hits on the same pad are still announced.
- **Decibel meter**: visual dBFS level, deliberately not a live region so screen readers are not spammed.
- **Shortcut toggle**: button that enables/disables single-key shortcuts (WCAG 2.1.4), wired to the hook's `isEnabled`.
- **Typing test input**: a labelled `<input>` to verify that shortcuts are ignored while typing.
- **Audio engine** with a `dispose` method that cleans up the audio context.

## Getting Started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # serve the production build
```

## Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` `J` `K` `L` | Trigger the matching pad |
| `Tab` / `Shift+Tab` | Move focus between pads and controls |
| `Enter` / `Space` | Trigger the focused pad |
| Shortcut toggle button | Turn single-key shortcuts on or off |

## Project Structure

```
src/
├── App.jsx                    # state, pad wiring, hit log, meter, shortcut toggle
├── index.css                  # layout, focus styles, screen-reader-only text
├── hooks/
│   └── useDrumKeyboard.js     # keydown/keyup hook (e.code, e.repeat, input guard, modifiers)
└── components/
    ├── DrumPad.jsx            # pad button (id, label, keyLabel, isActive, onTrigger)
    ├── HitLog.jsx             # <output aria-live="polite"> hit history
    └── DecibelMeter.jsx       # visual level meter (plain <span>, not a live region)
```

## Accessibility Notes

- Keyboard-only operation: every pad and control is reachable with `Tab` and has a visible focus indicator.
- Only the Hit Log is announced by screen readers; the meter value is silent.
- Single-character shortcuts can be turned off (WCAG 2.1.4).
- Language of the UI and accessible names is kept consistent.

## AI Failure Audit

See [`AI_FAILURE_AUDIT.md`](./AI_FAILURE_AUDIT.md) for the AI-generated bugs found, proven with DevTools and fixed during this homework.
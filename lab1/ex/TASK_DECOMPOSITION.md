<!-- FILE: TASK_DECOMPOSITION.md -->

# Task Decomposition

- T-01: Implement semantic HTML landmark structure and accessible skip link.
  - Landmark contract: banner -> navigation -> main -> sections.
  - Constraint: 0 <div> elements.
- T-02A: Implement CSS design tokens and reset.
- T-02B: Implement responsive 2D grid layout.
- T-02C: Implement persistent dark mode theme engine.
- T-03A: Implement loading state with pure CSS shimmer skeleton.
- T-03B: Implement live data state with Flexbox metadata badges and responsive Grid list.
- T-03C: Implement empty and error states with accessible retry trigger.

## Resilient Component State Machine

LOADING -> LIVE
LOADING -> EMPTY
LOADING -> ERROR
ERROR -> LOADING
EMPTY -> LOADING
LIVE -> LOADING
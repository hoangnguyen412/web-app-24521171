import { stateStore, getNextStateIndex } from "./state-store.js";

let renderScheduler = () => {};

export function configureStateDispatcher(render) {
  if (typeof render !== "function") {
    throw new TypeError("Render scheduler must be a function");
  }

  renderScheduler = render;
}

export function useState(initialValue) {
  const index = getNextStateIndex();

  // Initialize this state slot only once, not on every render.
  if (!(index in stateStore)) {
    stateStore[index] = initialValue;
  }

  function setState(nextValue) {
    const previousValue = stateStore[index];
    const resolvedValue =
      typeof nextValue === "function" ? nextValue(previousValue) : nextValue;

    if (Object.is(previousValue, resolvedValue)) {
      return;
    }

    stateStore[index] = resolvedValue;
    renderScheduler();
  }

  return [stateStore[index], setState];
}

let activeRoot = null;
let actionHandlers = {};

function handleDelegatedClick(event) {
  const origin =
    event.target instanceof Element ? event.target : event.target?.parentElement;
  const actionElement = origin?.closest("[data-action]");

  if (!actionElement || !activeRoot?.contains(actionElement)) {
    return;
  }

  const actionName = actionElement.dataset.action;
  const handler = actionHandlers[actionName];

  if (typeof handler === "function") {
    handler(event, actionElement);
  }
}

export function attachRootEventDelegation(root) {
  if (!(root instanceof Element)) {
    throw new TypeError("Event delegation root must be a DOM element");
  }

  // Avoid attaching the same listener repeatedly during re-renders.
  if (activeRoot === root) {
    return;
  }

  if (activeRoot) {
    activeRoot.removeEventListener("click", handleDelegatedClick);
  }

  activeRoot = root;
  activeRoot.addEventListener("click", handleDelegatedClick);
}

export function updateActionHandlers(nextHandlers) {
  if (!nextHandlers || typeof nextHandlers !== "object") {
    throw new TypeError("Action handlers must be an object");
  }

  // Replace the registry instead of adding more DOM listeners.
  actionHandlers = nextHandlers;
}

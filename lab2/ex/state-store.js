// Stores hook values between renders.
export const stateStore = [];

let stateCursor = 0;

export function resetCursor() {
  stateCursor = 0;
}

export function getNextStateIndex() {
  return stateCursor++;
}

export const STATUS = Object.freeze({
  IDLE: "IDLE",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
});

const transitions = {
  IDLE: ["LOADING"],
  LOADING: ["LOADING", "SUCCESS", "ERROR"],
  SUCCESS: ["LOADING"],
  ERROR: ["LOADING"],
};

let currentStatus = STATUS.IDLE;

export function transitionViewState(nextState, setState) {
  if (!Object.values(STATUS).includes(nextState?.status)) {
    throw new TypeError("Invalid view state");
  }

  if (!transitions[currentStatus].includes(nextState.status)) {
    throw new Error(
      `Invalid transition: ${currentStatus} -> ${nextState.status}`
    );
  }

  if (
    nextState.status === STATUS.SUCCESS &&
    !Array.isArray(nextState.data)
  ) {
    throw new TypeError("SUCCESS requires an array of data");
  }

  if (
    nextState.status === STATUS.ERROR &&
    typeof nextState.message !== "string"
  ) {
    throw new TypeError("ERROR requires an error message");
  }

  currentStatus = nextState.status;
  setState(nextState);
}
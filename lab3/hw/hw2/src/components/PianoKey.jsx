import { memo } from "react";

const FIRST_MIDI = 21;
const WHITE_KEY_WIDTH_PX = 42;
const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

function countWhiteKeysBefore(midi) {
  let count = 0;

  for (let current = FIRST_MIDI; current < midi; current += 1) {
    if (!BLACK_SEMITONES.has(current % 12)) {
      count += 1;
    }
  }

  return count;
}

export const PianoKey = memo(function PianoKey({
  midi,
  noteName,
  isBlack,
  isPressed,
  onNoteOn,
  onNoteOff,
}) {
  const className = [
    "piano-key",
    isBlack ? "piano-key--black" : "piano-key--white",
    isPressed ? "is-pressed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const positionStyle = isBlack
    ? {
        left: `${countWhiteKeysBefore(midi) * WHITE_KEY_WIDTH_PX}px`,
      }
    : undefined;

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    onNoteOn(midi);
  }

  function handlePointerUp() {
    onNoteOff(midi);
  }

  function handlePointerCancel() {
    onNoteOff(midi);
  }

  return (
    <button
      type="button"
      className={className}
      style={positionStyle}
      aria-label={`${noteName}, ${isBlack ? "black" : "white"} key`}
      aria-pressed={isPressed}
      title={noteName}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <span className="piano-key__label">{noteName}</span>
    </button>
  );
});
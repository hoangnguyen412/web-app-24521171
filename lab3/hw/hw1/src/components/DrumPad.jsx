import { memo } from 'react';

export const DrumPad = memo(function DrumPad({
  id,
  label,
  keyLabel,
  isActive,
  onTrigger,
}) {
  return (
    <button
      type="button"
      className={`drum-pad${isActive ? ' drum-pad--active' : ''}`}
      aria-label={`${label}, key ${keyLabel}`}
      aria-pressed={isActive}
      onClick={() => onTrigger(id)}
    >
      <span className="drum-pad__key" aria-hidden="true">
        {keyLabel}
      </span>

      <span className="drum-pad__name">
        {label}
      </span>
    </button>
  );
});
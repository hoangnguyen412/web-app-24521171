import { memo } from 'react';

export const DrumPad = memo(function DrumPad({
  id,
  label,
  keyLabel,
  color,
  isActive,
  onTrigger,
}) {
  const handleTrigger = () => {
    onTrigger(id);
  };

  return (
    <button
      type="button"
      className={[
        'drum-pad',
        color ? `drum-pad--${color}` : '',
        isActive ? 'drum-pad--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-pad-id={id}
      aria-label={`${label}, phím ${keyLabel}`}
      aria-pressed={isActive}
      onClick={handleTrigger}
    >
      <span className="drum-pad__label">{label}</span>

      <span className="drum-pad__key" aria-hidden="true">
        {keyLabel}
      </span>

      <span className="drum-pad__status" aria-hidden="true">
        {isActive ? 'PLAYING' : 'READY'}
      </span>
    </button>
  );
});
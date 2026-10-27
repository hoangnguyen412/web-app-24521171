import { useEffect } from 'react';

const IGNORED_TARGET_TAGS = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
]);

export function useDrumKeyboard(
  padMap,
  onTriggerPad,
  isEnabled = true
) {
  useEffect(() => {
    if (!isEnabled) return undefined;

    const onKeyDown = (e) => {
      // Prevent OS auto-repeat from triggering multiple hits.
      if (e.repeat) return;

      // Do not trigger drum shortcuts while typing.
      if (IGNORED_TARGET_TAGS.has(e.target?.tagName)) return;

      // Use physical key codes to support Vietnamese IME.
      const pad = padMap.get(e.code);

      // Preserve normal browser behavior for unrelated keys.
      if (!pad) return;

      e.preventDefault();
      onTriggerPad(pad.id);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [padMap, onTriggerPad, isEnabled]);
}
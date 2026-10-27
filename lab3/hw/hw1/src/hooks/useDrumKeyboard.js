import { useEffect } from 'react';

const IGNORED_TARGET_TAGS = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
]);

const noop = () => {};

export function useDrumKeyboard(
  padMap,
  onTriggerPad,
  isEnabled = true,
  onReleasePad = noop
) {
  useEffect(() => {
    if (!isEnabled) return undefined;

    const pressedCodes = new Set();

    const releasePressedCodes = () => {
      for (const code of pressedCodes) {
        const pad = padMap.get(code);

        if (pad) {
          onReleasePad(pad.id);
        }
      }

      pressedCodes.clear();
    };

    const onKeyDown = (e) => {
      // Prevent OS auto-repeat first.
      if (e.repeat) return;

      // Preserve browser and operating-system shortcuts.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Do not intercept typing.
      if (IGNORED_TARGET_TAGS.has(e.target?.tagName)) return;

      const pad = padMap.get(e.code);

      // Do not prevent browser defaults for unrelated keys.
      if (!pad) return;

      e.preventDefault();

      // Track physical key presses so keyup releases only
      // keys that this hook actually activated.
      if (pressedCodes.has(e.code)) return;

      pressedCodes.add(e.code);
      onTriggerPad(pad.id, 'keyboard');
    };

    const onKeyUp = (e) => {
      if (!pressedCodes.has(e.code)) return;

      pressedCodes.delete(e.code);

      const pad = padMap.get(e.code);

      if (pad) {
        onReleasePad(pad.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releasePressedCodes);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releasePressedCodes);

      // Prevent stuck active pads if the hook is disabled
      // or its dependencies change while a key is held.
      releasePressedCodes();
    };
  }, [padMap, onTriggerPad, onReleasePad, isEnabled]);
}
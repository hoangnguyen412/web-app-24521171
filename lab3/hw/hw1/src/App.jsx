import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useDrumKeyboard } from './hooks/useDrumKeyboard';
import { DrumAudioEngine } from './audio/DrumAudioEngine';
import { DrumPad } from './components/DrumPad';
import { HitLog } from './components/HitLog';
import { DecibelMeter } from './components/DecibelMeter';

const PADS = [
  {
    id: 'kick',
    name: 'Kick',
    code: 'KeyW',
    keyLabel: 'W',
  },
  {
    id: 'snare',
    name: 'Snare',
    code: 'KeyA',
    keyLabel: 'A',
  },
  {
    id: 'closed-hat',
    name: 'Closed Hi-Hat',
    code: 'KeyS',
    keyLabel: 'S',
  },
  {
    id: 'open-hat',
    name: 'Open Hi-Hat',
    code: 'KeyD',
    keyLabel: 'D',
  },
  {
    id: 'tom',
    name: 'Tom',
    code: 'KeyJ',
    keyLabel: 'J',
  },
  {
    id: 'clap',
    name: 'Clap',
    code: 'KeyK',
    keyLabel: 'K',
  },
  {
    id: 'cymbal',
    name: 'Cymbal',
    code: 'KeyL',
    keyLabel: 'L',
  },
];

const MAX_HIT_HISTORY = 50;
const ACTIVE_DURATION_MS = 120;

export default function App() {
  const [audioEngine, setAudioEngine] = useState(null);
  const [hits, setHits] = useState([]);
  const [activePadIds, setActivePadIds] = useState(
    () => new Set()
  );
  const [audioError, setAudioError] = useState('');
  const [shortcutsEnabled, setShortcutsEnabled] =
    useState(true);

  const nextHitId = useRef(0);
  const activeTimers = useRef(new Map());

  useEffect(() => {
    const engine = new DrumAudioEngine();

    setAudioEngine(engine);

    return () => {
      for (const timerId of activeTimers.current.values()) {
        window.clearTimeout(timerId);
      }

      activeTimers.current.clear();
      engine.dispose();
    };
  }, []);

  const padMap = useMemo(
    () => new Map(PADS.map((pad) => [pad.code, pad])),
    []
  );

  const onReleasePad = useCallback((padId) => {
    const timerId = activeTimers.current.get(padId);

    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      activeTimers.current.delete(padId);
    }

    setActivePadIds((previousIds) => {
      if (!previousIds.has(padId)) {
        return previousIds;
      }

      const nextIds = new Set(previousIds);
      nextIds.delete(padId);

      return nextIds;
    });
  }, []);

  const onTriggerPad = useCallback(
    (padId, source = 'click') => {
      if (!audioEngine) return;

      const pad = PADS.find(
        (item) => item.id === padId
      );

      if (!pad) return;

      try {
        const played = audioEngine.play(pad.id);

        if (played === false) return;

        setAudioError('');

        const hit = {
          id: ++nextHitId.current,
          padName: pad.name,
          key: pad.code,
          timestamp: Date.now(),
        };

        setHits((previousHits) =>
          [...previousHits, hit].slice(
            -MAX_HIT_HISTORY
          )
        );

        setActivePadIds((previousIds) => {
          if (previousIds.has(pad.id)) {
            return previousIds;
          }

          const nextIds = new Set(previousIds);
          nextIds.add(pad.id);

          return nextIds;
        });

        // Replace any previous release timer for this pad.
        const existingTimer =
          activeTimers.current.get(pad.id);

        if (existingTimer !== undefined) {
          window.clearTimeout(existingTimer);
          activeTimers.current.delete(pad.id);
        }

        // Physical keyboard presses stay active until keyup.
        // Pointer and native button activation use a short
        // visual pressed state.
        if (source !== 'keyboard') {
          const timerId = window.setTimeout(() => {
            activeTimers.current.delete(pad.id);

            setActivePadIds((previousIds) => {
              if (!previousIds.has(pad.id)) {
                return previousIds;
              }

              const nextIds = new Set(previousIds);
              nextIds.delete(pad.id);

              return nextIds;
            });
          }, ACTIVE_DURATION_MS);

          activeTimers.current.set(pad.id, timerId);
        }
      } catch {
        setAudioError(
          'Audio could not be started. Check browser audio permissions and try again.'
        );
      }
    },
    [audioEngine]
  );

  useDrumKeyboard(
    padMap,
    onTriggerPad,
    shortcutsEnabled && Boolean(audioEngine),
    onReleasePad
  );

  return (
    <main className="app">
      <header className="app__header">
        <h1>Production Studio Drum Kit</h1>

        <p id="keyboard-help">
          When keyboard shortcuts are enabled, use W, A, S,
          D, J, K, and L to play the seven drum pads.
        </p>
      </header>

      <section
        className="keyboard-controls"
        aria-label="Keyboard shortcut settings"
      >
        <button
          className="shortcut-toggle"
          type="button"
          aria-label="Keyboard shortcuts"
          aria-pressed={shortcutsEnabled}
          onClick={() =>
            setShortcutsEnabled((enabled) => !enabled)
          }
        >
          Keyboard shortcuts:{' '}
          <span aria-hidden="true">
            {shortcutsEnabled ? 'On' : 'Off'}
          </span>
        </button>
      </section>

      <section
        className="typing-test"
        aria-label="Keyboard input test"
      >
        <label htmlFor="typing-test-input">
          Typing test (shortcuts are ignored here)
        </label>

        <input
          id="typing-test-input"
          name="typing-test"
          type="text"
          autoComplete="off"
          placeholder="Try typing WASDJKL..."
        />
      </section>

      <section
        className="drum-kit"
        aria-label="Drum pads"
        aria-describedby="keyboard-help"
      >
        {PADS.map((pad) => (
          <DrumPad
            key={pad.id}
            id={pad.id}
            label={pad.name}
            keyLabel={pad.keyLabel}
            isActive={activePadIds.has(pad.id)}
            onTrigger={onTriggerPad}
          />
        ))}
      </section>

      {audioError && (
        <p className="app__error" role="alert">
          {audioError}
        </p>
      )}

      <section
        className="studio-panel"
        aria-label="Studio monitoring"
      >
        <DecibelMeter audioEngine={audioEngine} />

        <HitLog hits={hits} maxEntries={10} />
      </section>
    </main>
  );
}
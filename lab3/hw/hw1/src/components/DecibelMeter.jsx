import { useEffect, useState } from 'react';

const MIN_DB = -60;
const MAX_DB = 0;
const DEFAULT_INTERVAL_MS = 100;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function DecibelMeter({
  audioEngine,
  updateIntervalMs = DEFAULT_INTERVAL_MS,
}) {
  const [levelDb, setLevelDb] = useState(-100);

  useEffect(() => {
    if (!audioEngine) {
      setLevelDb(-100);
      return undefined;
    }

    const interval = Number.isFinite(updateIntervalMs)
      ? Math.max(50, Math.floor(updateIntervalMs))
      : DEFAULT_INTERVAL_MS;

    const updateLevel = () => {
      try {
        const level = audioEngine.getLevelDb();

        setLevelDb(
          Number.isFinite(level)
            ? clamp(level, -100, 0)
            : -100
        );
      } catch {
        setLevelDb(-100);
      }
    };

    updateLevel();

    const timerId = window.setInterval(
      updateLevel,
      interval
    );

    return () => {
      window.clearInterval(timerId);
    };
  }, [audioEngine, updateIntervalMs]);

  const displayDb = clamp(levelDb, MIN_DB, MAX_DB);

  const percentage =
    ((displayDb - MIN_DB) / (MAX_DB - MIN_DB)) * 100;

  const roundedDb = Math.round(levelDb);

  const levelText =
    levelDb <= MIN_DB
      ? `At or below ${MIN_DB} decibels full scale`
      : `${roundedDb} decibels full scale`;

  return (
    <section
      className="decibel-meter"
      aria-labelledby="decibel-meter-heading"
    >
      <div className="decibel-meter__header">
        <h2 id="decibel-meter-heading">
          Audio Level
        </h2>

        <span className="decibel-meter__reading">
          {levelDb <= MIN_DB
            ? `≤ ${MIN_DB} dBFS`
            : `${roundedDb} dBFS`}
        </span>
      </div>

      <div
        className="decibel-meter__track"
        role="meter"
        aria-label="Current audio level"
        aria-valuemin={MIN_DB}
        aria-valuemax={MAX_DB}
        aria-valuenow={displayDb}
        aria-valuetext={levelText}
      >
        <div
          className="decibel-meter__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div
        className="decibel-meter__scale"
        aria-hidden="true"
      >
        <span>−60 dBFS</span>
        <span>−30 dBFS</span>
        <span>0 dBFS</span>
      </div>
    </section>
  );
}
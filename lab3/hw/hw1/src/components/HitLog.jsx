import { memo } from 'react';

function formatTimestamp(timestamp) {
  if (timestamp == null) return null;

  const date =
    timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) return null;

  return {
    label: new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date),
    iso: date.toISOString(),
  };
}

function getPadName(hit) {
  const fallbackPad =
    typeof hit.pad === 'string'
      ? hit.pad
      : hit.pad?.name;

  return (
    hit.padName ??
    hit.label ??
    fallbackPad ??
    'Unknown pad'
  );
}

function formatKey(key) {
  if (!key) return '';

  return key.startsWith('Key')
    ? key.slice(3)
    : key;
}

export const HitLog = memo(function HitLog({
  hits = [],
  maxEntries = 10,
}) {
  const limit =
    Number.isInteger(maxEntries) && maxEntries > 0
      ? maxEntries
      : 10;

  // Keep the last N events in chronological order for
  // the accessible live history.
  const history = hits.slice(-limit);

  // Display the newest visual entry first.
  const visibleHits = [...history].reverse();

  return (
    <section
      className="hit-log"
      aria-labelledby="hit-log-heading"
    >
      <h2 id="hit-log-heading">Hit Log</h2>

      <output
        className="sr-only"
        aria-label="Drum hit history"
        aria-live="polite"
        aria-atomic="false"
      >
        {history.length === 0 ? (
          <span>No hits yet.</span>
        ) : (
          history.map((hit, index) => {
            const padName = getPadName(hit);
            const key = formatKey(hit.key);
            const timestamp = formatTimestamp(
              hit.timestamp
            );

            const hitNumber = hit.id ?? index + 1;

            return (
              <span
                key={
                  hit.id ??
                  `${hit.timestamp ?? 'unknown'}-${hit.key ?? ''}-${index}`
                }
              >
                {`Hit ${hitNumber}: ${padName}`}
                {key ? `, key ${key}` : ''}
                {timestamp
                  ? `, at ${timestamp.label}`
                  : ''}
                {'. '}
              </span>
            );
          })
        )}
      </output>

      {visibleHits.length === 0 ? (
        <p className="hit-log__empty">
          Play a drum pad to see your hit history.
        </p>
      ) : (
        <ol
          className="hit-log__list"
          aria-label="Recent drum hits"
        >
          {visibleHits.map((hit, index) => {
            const padName = getPadName(hit);
            const key = formatKey(hit.key);
            const timestamp = formatTimestamp(
              hit.timestamp
            );

            return (
              <li
                className="hit-log__item"
                key={
                  hit.id ??
                  `${hit.timestamp ?? 'unknown'}-${hit.key ?? ''}-${index}`
                }
              >
                <span className="hit-log__pad">
                  {padName}
                </span>

                {key && (
                  <span className="hit-log__key">
                    Key: {key}
                  </span>
                )}

                {timestamp && (
                  <time
                    className="hit-log__time"
                    dateTime={timestamp.iso}
                  >
                    {timestamp.label}
                  </time>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
});
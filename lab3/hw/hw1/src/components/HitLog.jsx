import { memo } from 'react';

function formatTimestamp(timestamp) {
  if (timestamp == null) return null;

  const date =
    timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) return null;

  return {
    label: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date),
    iso: date.toISOString(),
  };
}

function getPadName(hit) {
  return hit.padName ?? hit.label ?? hit.pad?.name ?? hit.pad ?? 'Unknown pad';
}

function formatKey(key) {
  if (!key) return '';
  return key.startsWith('Key') ? key.slice(3) : key;
}

export const HitLog = memo(function HitLog({
  hits = [],
  maxEntries = 10,
}) {
  const limit =
    Number.isInteger(maxEntries) && maxEntries > 0
      ? maxEntries
      : 10;

  // Keep the most recent hits, newest first.
  const visibleHits = hits.slice(-limit).reverse();
  const latestHit = visibleHits[0];

  const latestName = latestHit
    ? getPadName(latestHit)
    : null;

  const latestKey = latestHit
    ? formatKey(latestHit.key)
    : '';

  return (
    <section
      className="hit-log"
      aria-labelledby="hit-log-heading"
    >
      <h2 id="hit-log-heading">Hit Log</h2>

      {/* Announce the latest hit to assistive technology. */}
      <output
        className="hit-log__announcement"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Latest drum hit"
      >
        {latestHit
          ? `Last hit: ${latestName}${latestKey ? `, key ${latestKey}` : ''}`
          : 'No hits yet.'}
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
            const timestamp = formatTimestamp(hit.timestamp);

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
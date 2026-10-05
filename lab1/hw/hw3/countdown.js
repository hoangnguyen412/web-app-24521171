// Drift-free countdown engine (UTC ISO 8601)

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const DEFAULT_DURATION_DAYS = 7;

// Pure function: milliseconds remaining -> display parts
function splitDuration(remainingMs) {
  const safeMs = Math.max(0, remainingMs);

  return {
    days: Math.floor(safeMs / MS_PER_DAY),
    hours: Math.floor((safeMs % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((safeMs % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((safeMs % MS_PER_MINUTE) / MS_PER_SECOND)
  };
}

// Deadline is computed ONCE and stored as a UTC ISO 8601 string
function createDeadline(durationDays) {
  return new Date(Date.now() + durationDays * MS_PER_DAY).toISOString();
}

function initCountdown() {
  const container = document.querySelector('#countdown');
  if (!container) return;

  const parsedDays = Number(container.dataset.durationDays);
  const durationDays =
    Number.isFinite(parsedDays) && parsedDays > 0
      ? parsedDays
      : DEFAULT_DURATION_DAYS;

  const deadlineISO = createDeadline(durationDays); // e.g. "2026-10-12T08:30:00.000Z"
  const deadlineMs = Date.parse(deadlineISO);

  const units = {
    days: container.querySelector('[data-unit="days"]'),
    hours: container.querySelector('[data-unit="hours"]'),
    minutes: container.querySelector('[data-unit="minutes"]'),
    seconds: container.querySelector('[data-unit="seconds"]')
  };

  let timerId = null;

  function render() {
    // Recompute from the system clock every tick: never decrement a counter
    const remainingMs = deadlineMs - Date.now();
    const parts = splitDuration(remainingMs);

    Object.entries(units).forEach(([name, element]) => {
      if (element) element.textContent = String(parts[name]).padStart(2, '0');
    });

    if (remainingMs <= 0) {
      clearTimeout(timerId);
      return;
    }

    // Re-align to the next whole second so delays never accumulate
    const delay = MS_PER_SECOND - (Date.now() % MS_PER_SECOND);
    timerId = setTimeout(render, delay);
  }

  render();
}

initCountdown();
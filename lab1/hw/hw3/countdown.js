// Drift-free countdown engine (UTC ISO 8601), deadline persisted across reloads

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const DEFAULT_DURATION_DAYS = 7;

const STORAGE_KEY = 'techtalk2026:deadline';
const CLOSED_HEADING = 'Registration closed';
const CLOSED_MESSAGE = 'Registration is now closed. Thank you for your interest in Tech Talk 2026.';

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

function createDeadline(durationDays) {
  return new Date(Date.now() + durationDays * MS_PER_DAY).toISOString();
}

// Accept only a strict UTC ISO 8601 string (round-trips through toISOString)
// that is not further in the future than the configured duration.
function isValidDeadline(value, durationDays) {
  if (typeof value !== 'string') return false;

  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return false;
  if (new Date(ms).toISOString() !== value) return false;

  return ms - Date.now() <= durationDays * MS_PER_DAY;
}

function loadDeadline(durationDays) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidDeadline(stored, durationDays) ? stored : null;
  } catch {
    return null; // storage blocked: fall back to a fresh deadline
  }
}

function saveDeadline(deadlineISO) {
  try {
    localStorage.setItem(STORAGE_KEY, deadlineISO);
  } catch {
    // storage unavailable: countdown still works for this page load
  }
}

function closeRegistration(container) {
  if (container.dataset.registration === 'closed') return;

  container.dataset.registration = 'closed';
  container.hidden = true;

  const heading = document.querySelector('#countdown-heading');
  if (heading) heading.textContent = CLOSED_HEADING;

  const notice = document.createElement('p');
  notice.id = 'countdown-closed';
  notice.setAttribute('role', 'status');
  notice.textContent = CLOSED_MESSAGE;
  container.after(notice);

  document.dispatchEvent(new CustomEvent('registration:closed'));
}

function initCountdown() {
  const container = document.querySelector('#countdown');
  if (!container) return;

  const parsedDays = Number(container.dataset.durationDays);
  const durationDays =
    Number.isFinite(parsedDays) && parsedDays > 0
      ? parsedDays
      : DEFAULT_DURATION_DAYS;

  // Reuse the stored deadline so a reload does not reset the clock
  let deadlineISO = loadDeadline(durationDays);
  if (!deadlineISO) {
    deadlineISO = createDeadline(durationDays); // e.g. "2026-10-14T08:30:00.000Z"
    saveDeadline(deadlineISO);
  }
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

    if (remainingMs <= 0) {
      clearTimeout(timerId);
      closeRegistration(container);
      return;
    }

    const parts = splitDuration(remainingMs);
    Object.entries(units).forEach(([name, element]) => {
      if (element) element.textContent = String(parts[name]).padStart(2, '0');
    });

    // Re-align to the next whole second so delays never accumulate
    const delay = MS_PER_SECOND - (Date.now() % MS_PER_SECOND);
    timerId = setTimeout(render, delay);
  }

  render();
}

initCountdown();
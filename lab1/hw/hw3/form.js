// Form state machine: idle -> submitting -> success | error -> idle

const STATES = Object.freeze({
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error'
});

// Contract: the only legal transitions
const TRANSITIONS = Object.freeze({
  [STATES.IDLE]: [STATES.SUBMITTING],
  [STATES.SUBMITTING]: [STATES.SUCCESS, STATES.ERROR],
  [STATES.SUCCESS]: [STATES.IDLE],
  [STATES.ERROR]: [STATES.IDLE]
});

const MIN_NAME_LENGTH = 3;
const MAX_REQUEST_LENGTH = 500;
const SUBMIT_DELAY_MS = 1200;
const CLOSED_MESSAGE = 'Registration is closed.';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const HTML_ESCAPES = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
});

// Missing fields (null) and File entries become '' instead of "null"
function toText(value) {
  return typeof value === 'string' ? value : '';
}

// Defense in depth: escape HTML-significant characters
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// Cleaning: normalize, strip control chars, trim, cap length.
function cleanLine(value, maxLength = 100) {
  return toText(value)
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanMultiline(value, maxLength = MAX_REQUEST_LENGTH) {
  return toText(value)
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, maxLength);
}

// Clean (unescaped) values: used for validation and textContent display
function readInput(form) {
  const data = new FormData(form);

  return {
    fullName: cleanLine(data.get('fullName')),
    email: cleanLine(data.get('email'), 254),
    organization: cleanLine(data.get('organization')),
    ticketType: data.get('ticketType') === 'professional' ? 'professional' : 'student',
    specialRequests: cleanMultiline(data.get('specialRequests'))
  };
}

// Escaped copy: this is what leaves the form (transport/storage)
function toSafePayload(clean) {
  return {
    fullName: escapeHtml(clean.fullName),
    email: escapeHtml(clean.email),
    organization: escapeHtml(clean.organization),
    ticketType: clean.ticketType,
    specialRequests: escapeHtml(clean.specialRequests)
  };
}

// Write cleaned values back so native validation (minlength, type=email)
// runs on the cleaned value, not the raw one.
function applyCleanValues(form, clean) {
  form.elements.fullName.value = clean.fullName;
  form.elements.email.value = clean.email;
  form.elements.organization.value = clean.organization;
  form.elements.specialRequests.value = clean.specialRequests;
}

// Simulated backend call (no server in this assignment)
function submitRegistration(payload) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (payload.fullName.length < MIN_NAME_LENGTH) {
        reject(new Error('Full name must contain at least 3 visible characters.'));
        return;
      }
      resolve(payload);
    }, SUBMIT_DELAY_MS);
  });
}

function initForm() {
  const form = document.querySelector('#register-form');
  const submitBtn = document.querySelector('#submit-btn');
  const status = document.querySelector('#form-status');
  const countdown = document.querySelector('#countdown');
  if (!form || !submitBtn || !status) return;

  let state = STATES.IDLE;

  const isClosed = () => countdown?.dataset.registration === 'closed';

  // aria-disabled (not `disabled`) so the button keeps keyboard focus
  function syncSubmitButton() {
    const blocked = state === STATES.SUBMITTING || isClosed();
    submitBtn.setAttribute('aria-disabled', String(blocked));
  }

  function handleClosed() {
    syncSubmitButton();
    status.textContent = CLOSED_MESSAGE; // textContent only
  }

  function setState(next, message = '') {
    if (!TRANSITIONS[state].includes(next)) return false;

    state = next;
    form.dataset.state = state;
    form.setAttribute('aria-busy', String(state === STATES.SUBMITTING));
    syncSubmitButton();

    if (message) status.textContent = message; // textContent only
    return true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Double-submit prevention: ignore while a submission is in flight
    if (state === STATES.SUBMITTING) return;

    if (isClosed()) {
      handleClosed();
      return;
    }

    // Leaving a finished attempt (success/error) starts a fresh one
    if (state !== STATES.IDLE) setState(STATES.IDLE);

    // Clean FIRST, then validate the cleaned values
    const clean = readInput(form);
    applyCleanValues(form, clean);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = toSafePayload(clean);
    setState(STATES.SUBMITTING, 'Submitting your registration...');

    try {
      await submitRegistration(payload);
      setState(STATES.SUCCESS, `Thank you, ${clean.fullName}! You are registered (${clean.ticketType} ticket).`);
      form.reset();
    } catch (error) {
      setState(STATES.ERROR, `Registration failed: ${error.message}`);
    }
    // No finally: SUCCESS / ERROR stay observable until the user interacts again
  });

  // Editing the form after a finished attempt returns the machine to idle
  form.addEventListener('input', () => {
    if (state === STATES.SUCCESS || state === STATES.ERROR) {
      setState(STATES.IDLE);
    }
  });

  document.addEventListener('registration:closed', handleClosed);
  if (isClosed()) handleClosed();
}

initForm();
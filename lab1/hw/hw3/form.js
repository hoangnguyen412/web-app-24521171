// Form state machine: idle -> submitting -> success | error

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

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// Sanitization: normalize, strip control chars, trim, cap length.
// Output is only ever written with textContent, never innerHTML.
function sanitizeLine(value, maxLength = 100) {
  return String(value)
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizeMultiline(value, maxLength = MAX_REQUEST_LENGTH) {
  return String(value)
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, maxLength);
}

function readPayload(form) {
  const data = new FormData(form);

  return {
    fullName: sanitizeLine(data.get('fullName')),
    email: sanitizeLine(data.get('email'), 254),
    organization: sanitizeLine(data.get('organization')),
    ticketType: data.get('ticketType') === 'professional' ? 'professional' : 'student',
    specialRequests: sanitizeMultiline(data.get('specialRequests'))
  };
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
  if (!form || !submitBtn || !status) return;

  let state = STATES.IDLE;

  function setState(next, message = '') {
    if (!TRANSITIONS[state].includes(next)) return false;

    state = next;
    form.dataset.state = state;

    const isBusy = state === STATES.SUBMITTING;
    submitBtn.disabled = isBusy;
    form.setAttribute('aria-busy', String(isBusy));

    if (message) status.textContent = message; // textContent only
    return true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Double-submit prevention: ignore everything unless idle
    if (state !== STATES.IDLE) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = readPayload(form);
    setState(STATES.SUBMITTING, 'Submitting your registration...');

    try {
      await submitRegistration(payload);
      setState(STATES.SUCCESS, `Thank you, ${payload.fullName}! You are registered (${payload.ticketType} ticket).`);
      console.info('Sanitized payload:', payload);
      form.reset();
    } catch (error) {
      setState(STATES.ERROR, `Registration failed: ${error.message}`);
    } finally {
      setState(STATES.IDLE); // message stays visible, form is usable again
    }
  });
}

initForm();
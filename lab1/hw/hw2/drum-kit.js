// Core audio engine
function playSound(key) {
  const pad = document.querySelector(
    `.drum-pad[data-key="${key.toLowerCase()}"]`
  );

  if (!pad) return null;

  // New Audio instance per hit for polyphony
  const audio = new Audio(pad.dataset.sound);
  audio.play();

  return pad;
}

// Beat recorder state
const beatRecorder = [];

// Keyboard event handler
document.addEventListener('keydown', (event) => {
  if (event.repeat) return;

  const pad = playSound(event.key);
  if (!pad) return;

  // Visual feedback
  pad.classList.add('active');
  setTimeout(() => pad.classList.remove('active'), 100);

  // FIFO beat recorder
  beatRecorder.push({
    key: event.key.toLowerCase(),
    timestamp: Date.now()
  });
});
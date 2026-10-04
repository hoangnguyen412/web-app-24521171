function playSound(key) {
  const pad = document.querySelector(
    `.drum-pad[data-key="${key.toLowerCase()}"]`
  );

  if (!pad) return;

  const audio = new Audio(pad.dataset.sound);
  audio.play();

  pad.classList.add('active');
  setTimeout(() => {
    pad.classList.remove('active');
  }, 100);
}

const pads = document.querySelectorAll('.drum-pad');

pads.forEach((pad) => {
  pad.addEventListener('click', () => {
    playSound(pad.dataset.key);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.repeat) return;

  playSound(event.key);
});
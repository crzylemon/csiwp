// SFX
let ctx = null;
let muted = false;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

// resume context when you input
export function initAudio() {
  document.addEventListener('keydown', () => {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }, { once: true });
  document.addEventListener('click', () => {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }, { once: true });
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function playTone(freq, duration, type = 'square', volume = 0.15, slide = 0) {
  if (muted) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slide) {
    osc.frequency.linearRampToValueAtTime(freq + slide, ac.currentTime + duration);
  }

  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
  if (muted) return;
  const ac = getCtx();
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ac.createBufferSource();
  source.buffer = buffer;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  source.start(ac.currentTime);
}

// procedual sfx as placeholders
export function sfxJump() {
  playTone(300, 0.15, 'square', 0.12, 200);
}

export function sfxLand() {
  playNoise(0.05, 0.06);
}

export function sfxDeath() {
  playTone(400, 0.3, 'sawtooth', 0.15, -300);
  setTimeout(() => playNoise(0.15, 0.1), 50);
}

export function sfxSpring() {
  playTone(500, 0.2, 'square', 0.12, 400);
}

export function sfxGoal() {
  playTone(523, 0.1, 'square', 0.1);
  setTimeout(() => playTone(659, 0.1, 'square', 0.1), 100);
}

export function sfxDoorOpen() {
  playTone(200, 0.15, 'triangle', 0.08, 100);
}

export function sfxDoorClose() {
  playTone(150, 0.2, 'triangle', 0.08, -50);
}

export function sfxMenuSelect() {
  playTone(600, 0.08, 'square', 0.08);
}

// SFX
/**
 * audio context
 * @type {AudioContext|null}
 */
let ctx = null;
/**
 * is muted?
 * @type {Boolean}
 */
let muted = false;

/**
 * get audio context
 * @returns {AudioContext}
 */
function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

/**
 * initialize audio context on user gesture
 * @returns {void}
 */
export function initAudio() {
  document.addEventListener('keydown', () => {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }, { once: true });
  document.addEventListener('click', () => {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }, { once: true });
}

/**
 * toggle mute
 * @returns {boolean} muted
 */
export function toggleMute() {
  muted = !muted;
  if (music) music.muted = muted;
  return muted;
}

// music
/**
 * music object
 * @type {Audio|null}
 */
let music = null;

/**
 * play music
 * @returns {void}
 */
export function playMusic() {
  if (!music) {
    music = new Audio('ParagonX9.Chaoz Fantasy.mp3');
    music.loop = true;
    music.volume = 0.4;
  }
  music.muted = muted;
  music.play().catch(() => {
    // browser blocked autoplay
    const resume = () => {
      music.play();
      document.removeEventListener('keydown', resume);
      document.removeEventListener('click', resume);
    };
    document.addEventListener('keydown', resume, { once: true });
    document.addEventListener('click', resume, { once: true });
  });
}

/**
 * stop music
 * @returns {void}
 */
export function stopMusic() {
  if (music) {
    music.pause();
    music.currentTime = 0;
  }
}

/**
 * play tone
 * @param {number} freq frequency
 * @param {number} duration duration
 * @param {string} type wave type
 * @param {number} volume volume
 * @param {number} slide pitch slide
 * @returns {void}
 */
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

/**
 * play noise
 * @param {number} duration duration
 * @param {number} volume volume
 * @returns {void}
 */
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

// PLACEHOLDERS, to be replaced with actual SFX!!!!

/**
 * play jump sfx
 * @returns {void}
 */
export function sfxJump() {
  playTone(300, 0.15, 'square', 0.12, 200);
}

/**
 * play land sfx
 * @returns {void}
 */
export function sfxLand() {
  playNoise(0.05, 0.06);
}

/**
 * play spike appear sfx
 * @returns {void}
 */
export function sfxSpikeAppear() {
  playTone(180, 0.12, 'sawtooth', 0.1, 80);
  playNoise(0.06, 0.05);
}

/**
 * play death sfx
 * @returns {void}
 */
export function sfxDeath() {
  playTone(400, 0.3, 'sawtooth', 0.15, -300);
  setTimeout(() => playNoise(0.15, 0.1), 50);
}

/**
 * play spring sfx
 * @returns {void}
 */
export function sfxSpring() {
  playTone(500, 0.2, 'square', 0.12, 400);
}

/**
 * play goal sfx
 * @returns {void}
 */
export function sfxGoal() {
  playTone(523, 0.1, 'square', 0.1);
  setTimeout(() => playTone(659, 0.1, 'square', 0.1), 100);
}

/**
 * play open door sfx
 * @returns {void}
 */
export function sfxDoorOpen() {
  playTone(200, 0.15, 'triangle', 0.08, 100);
}

/**
 * play close door sfx
 * @returns {void}
 */
export function sfxDoorClose() {
  playTone(150, 0.2, 'triangle', 0.08, -50);
}

/**
 * play menu select sfx
 * @returns {void}
 */
export function sfxMenuSelect() {
  playTone(600, 0.08, 'square', 0.08);
}

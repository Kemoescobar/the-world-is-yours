/** Sons UI TWIY — Web Audio, pas de fichiers. Respecte twiy_sound session. */

let ctx = null;

export function soundEnabled() {
  return sessionStorage.getItem('twiy_sound') !== '0';
}

export function setSoundEnabled(on) {
  sessionStorage.setItem('twiy_sound', on ? '1' : '0');
}

function ac() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep({ freq = 440, dur = 0.08, type = 'square', gain = 0.04, slideTo } = {}) {
  if (!soundEnabled()) return;
  const audio = ac();
  if (!audio) return;
  const t0 = audio.currentTime;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Entrée gate — rising punch */
export function playEnter() {
  beep({ freq: 110, dur: 0.18, type: 'sawtooth', gain: 0.05, slideTo: 330 });
  setTimeout(() => beep({ freq: 440, dur: 0.06, type: 'square', gain: 0.03 }), 90);
}

/** Validation quête — tick sec */
export function playTick() {
  beep({ freq: 880, dur: 0.045, type: 'square', gain: 0.035 });
}

/** Drop reveal — impact bas */
export function playImpact() {
  beep({ freq: 70, dur: 0.22, type: 'triangle', gain: 0.07, slideTo: 40 });
  setTimeout(() => beep({ freq: 220, dur: 0.08, type: 'square', gain: 0.025 }), 40);
}

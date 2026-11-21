// audio.js — every sound is synthesized with WebAudio. No audio files, no network.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  /** Create the AudioContext lazily, on the first user gesture that plays a sound. */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    return true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  /** One oscillator note with a quick attack and an exponential fade. */
  tone(freq, startAt, dur, type = 'sine', vol = 0.35) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + startAt;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** A bright two-note chime when a difference is found. */
  found() {
    if (!this.ensure()) return;
    this.tone(660, 0, 0.18, 'sine', 0.4);
    this.tone(990, 0.09, 0.28, 'sine', 0.4);
    this.tone(1320, 0.18, 0.3, 'triangle', 0.18);
  }

  /** A low dull buzz for a wrong click. */
  wrong() {
    if (!this.ensure()) return;
    this.tone(140, 0, 0.22, 'sawtooth', 0.22);
    this.tone(110, 0.05, 0.25, 'sawtooth', 0.18);
  }

  /** A soft tick for moving the crosshair or hovering a button. */
  tick() {
    if (!this.ensure()) return;
    this.tone(880, 0, 0.06, 'square', 0.08);
  }

  /** A sparkle arpeggio when a hint fires. */
  hint() {
    if (!this.ensure()) return;
    [1046, 1318, 1568].forEach((f, i) => this.tone(f, i * 0.07, 0.16, 'sine', 0.25));
  }

  /** A short fanfare for clearing a scene. */
  sceneClear() {
    if (!this.ensure()) return;
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, i * 0.11, 0.22, 'triangle', 0.3));
  }

  /** A longer fanfare for winning the whole game. */
  win() {
    if (!this.ensure()) return;
    [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, i * 0.13, 0.3, 'triangle', 0.3));
    this.tone(262, 0, 0.9, 'sine', 0.12);
  }
}

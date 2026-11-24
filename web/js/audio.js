// Lightweight 8-bit Web Audio synthesizer for Hunt for Pirzadeh

class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq, duration, type = 'square', volume = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  pop() {
    this.playTone(220, 0.05, 'triangle', 0.05, 0);
    this.playTone(320, 0.04, 'triangle', 0.04, 0.03);
  }

  hitYellow() {
    this.playTone(523.25, 0.07, 'square', 0.08, 0);
    this.playTone(659.25, 0.09, 'square', 0.07, 0.05);
  }

  hitGreen() {
    this.playTone(587.33, 0.06, 'square', 0.08, 0);
    this.playTone(783.99, 0.06, 'square', 0.08, 0.05);
    this.playTone(1046.5, 0.1, 'square', 0.07, 0.1);
  }

  hitRed() {
    this.playTone(170, 0.12, 'sawtooth', 0.1, 0);
    this.playTone(120, 0.18, 'sawtooth', 0.1, 0.09);
  }

  pirzadehAppear() {
    this.playTone(659.25, 0.05, 'square', 0.08, 0);
    this.playTone(880, 0.05, 'square', 0.08, 0.05);
    this.playTone(1174.66, 0.08, 'square', 0.08, 0.1);
  }

  hitPirzadeh() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.1, 'square', 0.09, idx * 0.055);
    });
  }

  tickUrgent() {
    this.playTone(880, 0.04, 'square', 0.04, 0);
  }

  start() {
    this.playTone(392, 0.07, 'square', 0.07, 0);
    this.playTone(523.25, 0.07, 'square', 0.07, 0.08);
    this.playTone(659.25, 0.12, 'square', 0.08, 0.16);
  }

  gameOver() {
    const notes = [523.25, 493.88, 440, 392, 329.63];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.12, 'square', 0.07, idx * 0.09);
    });
  }
}

export const audio = new RetroAudio();

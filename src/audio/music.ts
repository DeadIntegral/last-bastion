export type MusicScene = 'menu' | 'battle' | 'victory' | 'defeat';
export type SoundEffect = 'melee' | 'ranged' | 'air' | 'heavy' | 'castle' | 'skill';

export interface MusicPattern {
  beatMs: number;
  melody: number[];
  bass: number[];
  waveform: OscillatorType;
  volume: number;
}

export const musicPatterns: Record<MusicScene, MusicPattern> = {
  menu: {
    beatMs: 520,
    melody: [293.66, 349.23, 392, 440, 392, 349.23, 261.63, 293.66],
    bass: [73.42, 73.42, 87.31, 65.41],
    waveform: 'triangle',
    volume: 0.07,
  },
  battle: {
    beatMs: 265,
    melody: [220, 261.63, 293.66, 329.63, 293.66, 392, 349.23, 293.66],
    bass: [55, 73.42, 65.41, 82.41],
    waveform: 'sawtooth',
    volume: 0.045,
  },
  victory: {
    beatMs: 430,
    melody: [293.66, 369.99, 440, 587.33, 440, 493.88, 587.33, 739.99],
    bass: [73.42, 92.5, 110, 146.83],
    waveform: 'triangle',
    volume: 0.075,
  },
  defeat: {
    beatMs: 620,
    melody: [293.66, 277.18, 220, 196, 174.61, 196, 164.81, 146.83],
    bass: [73.42, 65.41, 55, 49],
    waveform: 'sine',
    volume: 0.065,
  },
};

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

class ProceduralMusicEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private timer?: number;
  private step = 0;
  private scene: MusicScene = 'menu';
  private muted = false;
  private visible = true;
  private voices = new Set<OscillatorNode>();
  private lastEffectAt: Partial<Record<SoundEffect, number>> = {};

  setScene(scene: MusicScene): void {
    if (this.scene === scene) return;
    this.scene = scene;
    this.restart();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopLoop();
      return;
    }
    if (this.context) {
      void this.context.resume();
      this.startLoop();
    }
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (!visible) {
      this.stopLoop();
      return;
    }
    if (this.context && !this.muted) {
      void this.context.resume();
      this.startLoop();
    }
  }

  async unlock(): Promise<void> {
    if (this.muted || !this.visible) return;
    if (!this.context) {
      const AudioContextConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!AudioContextConstructor) return;
      this.context = new AudioContextConstructor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.24;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.startLoop();
  }

  playEffect(effect: SoundEffect): void {
    if (!this.context || !this.master || this.muted || !this.visible || this.context.state !== 'running') return;
    const nowMs = performance.now();
    const cooldown = effect === 'castle' || effect === 'heavy' ? 120 : 55;
    if (nowMs - (this.lastEffectAt[effect] ?? 0) < cooldown) return;
    this.lastEffectAt[effect] = nowMs;
    const variation = 0.94 + Math.random() * 0.12;
    if (effect === 'melee') this.playSweep(135 * variation, 62 * variation, 0.07, 'square', 0.1);
    if (effect === 'ranged') this.playSweep(820 * variation, 380 * variation, 0.09, 'triangle', 0.085);
    if (effect === 'air') this.playSweep(250 * variation, 95 * variation, 0.14, 'sawtooth', 0.08);
    if (effect === 'heavy') this.playSweep(105 * variation, 34 * variation, 0.2, 'sawtooth', 0.17);
    if (effect === 'castle') this.playSweep(78 * variation, 28 * variation, 0.22, 'square', 0.14);
    if (effect === 'skill') {
      this.playSweep(280 * variation, 880 * variation, 0.24, 'sine', 0.11);
      this.playSweep(420 * variation, 1180 * variation, 0.18, 'triangle', 0.06);
    }
  }

  private restart(): void {
    if (!this.context || this.muted || !this.visible) return;
    this.stopLoop();
    this.startLoop();
  }

  private startLoop(): void {
    if (!this.context || !this.master || this.timer !== undefined || this.muted || !this.visible) return;
    this.step = 0;
    this.playStep();
    this.timer = window.setInterval(() => this.playStep(), musicPatterns[this.scene].beatMs);
  }

  private stopLoop(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    for (const voice of this.voices) {
      try { voice.stop(); } catch { /* Voice may already have ended. */ }
    }
    this.voices.clear();
  }

  private playStep(): void {
    if (!this.context || !this.master) return;
    const pattern = musicPatterns[this.scene];
    const melody = pattern.melody[this.step % pattern.melody.length];
    const bass = pattern.bass[Math.floor(this.step / 2) % pattern.bass.length];
    this.playTone(melody, pattern.beatMs * 0.0022, pattern.waveform, pattern.volume);
    if (this.step % 2 === 0) this.playTone(bass, pattern.beatMs * 0.004, 'sine', pattern.volume * 1.15);
    if (this.step % 4 === 0) this.playTone(melody * 0.5, pattern.beatMs * 0.006, 'triangle', pattern.volume * 0.35);
    this.step += 1;
  }

  private playTone(frequency: number, duration: number, waveform: OscillatorType, volume: number): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(volume, now + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    this.voices.add(oscillator);
    oscillator.addEventListener('ended', () => {
      this.voices.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    }, { once: true });
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  private playSweep(startFrequency: number, endFrequency: number, duration: number, waveform: OscillatorType, volume: number): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    this.voices.add(oscillator);
    oscillator.addEventListener('ended', () => {
      this.voices.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    }, { once: true });
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }
}

export const musicEngine = new ProceduralMusicEngine();

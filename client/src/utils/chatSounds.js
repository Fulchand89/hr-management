/**
 * Zero-latency sound feedback using Web Audio API
 * No external audio files needed; generated mathematically by browser oscillator
 */
class ChatSounds {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!this.ctx) {
        this.ctx = new AudioContextClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        // Only resume if user has already interacted with the page
        const canResume = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
        if (canResume) {
          this.ctx.resume().catch(() => {});
        }
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
  }

  /**
   * Outgoing message sound: subtle high-mid acoustic blip (WhatsApp style)
   */
  playSend() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Incoming message sound: clean double-tone bell chime
   */
  playReceive() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Tone 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      gain2.gain.setValueAtTime(0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.22);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const chatSounds = new ChatSounds();

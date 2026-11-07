// Smart Repair Reminder Audio Synthesizer, Physical Vibration & Notifications Engine
// Uses Web Audio API for 100% offline, cross-platform, zero-dependency ringtones + HTML5 Audio for custom uploads

class ReminderAlarmAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isRinging: boolean = false;
  private customAudioEl: HTMLAudioElement | null = null;
  private oscillatorInterval: any = null;
  private previewTimeout: any = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play synthetic tone using Web Audio API
  private playSyntheticTone(type: 'urgent' | 'alarm' | 'bell' | 'chime') {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    if (type === 'urgent') {
      // Rapid alternating siren frequencies (880Hz -> 1174Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(1174, now + 0.18);
      osc.frequency.linearRampToValueAtTime(880, now + 0.36);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'alarm') {
      // Classic electronic digital beeps (3 rapid staccato beeps)
      [0, 0.12, 0.24].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1046.5, now + offset); // High C

        gain.gain.setValueAtTime(0.28, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } else if (type === 'bell') {
      // Rich brass service bell strike (fundamental + harmonics)
      const freqs = [659.25, 1318.5, 2093.0];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const decay = 0.8 - idx * 0.15;
        gain.gain.setValueAtTime(0.3 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + decay);
      });
    } else if (type === 'chime') {
      // Melodic 4-note ascending chime (E5 -> G#5 -> B5 -> E6)
      const notes = [659.25, 830.61, 987.77, 1318.5];
      notes.forEach((freq, idx) => {
        const offset = idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0.22, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.45);
      });
    }
  }

  // Start continuous alarm loop
  public startAlarm(
    ringtoneType: 'urgent' | 'alarm' | 'bell' | 'chime' | 'custom' = 'urgent',
    customRingtoneUrl?: string
  ) {
    if (this.isRinging) {
      this.stopAlarm();
    }
    this.isRinging = true;

    // Trigger physical device vibration on mobile
    this.triggerPhysicalVibration();

    if (ringtoneType === 'custom' && customRingtoneUrl) {
      try {
        if (!this.customAudioEl) {
          this.customAudioEl = new Audio();
        }
        this.customAudioEl.src = customRingtoneUrl;
        this.customAudioEl.loop = true;
        this.customAudioEl.play().catch((err) => {
          console.warn('Custom audio playback requires user interaction, falling back to synthesizer:', err);
          this.startSyntheticLoop('urgent');
        });
      } catch {
        this.startSyntheticLoop('urgent');
      }
    } else {
      const type = ringtoneType === 'custom' ? 'urgent' : ringtoneType;
      this.startSyntheticLoop(type);
    }
  }

  private startSyntheticLoop(type: 'urgent' | 'alarm' | 'bell' | 'chime') {
    // Initial strike
    this.playSyntheticTone(type);

    const intervalMs = type === 'urgent' ? 650 : type === 'alarm' ? 850 : type === 'bell' ? 1200 : 1000;

    this.oscillatorInterval = setInterval(() => {
      if (!this.isRinging) return;
      this.playSyntheticTone(type);
      this.triggerPhysicalVibration();
    }, intervalMs);
  }

  // Preview test ringtone for 3 seconds
  public previewRingtone(
    ringtoneType: 'urgent' | 'alarm' | 'bell' | 'chime' | 'custom',
    customRingtoneUrl?: string
  ) {
    this.stopAlarm();
    this.startAlarm(ringtoneType, customRingtoneUrl);

    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
    }
    this.previewTimeout = setTimeout(() => {
      this.stopAlarm();
    }, 3200);
  }

  // Stop current active alarm sound and vibration
  public stopAlarm() {
    this.isRinging = false;
    if (this.oscillatorInterval) {
      clearInterval(this.oscillatorInterval);
      this.oscillatorInterval = null;
    }
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }
    if (this.customAudioEl) {
      try {
        this.customAudioEl.pause();
        this.customAudioEl.currentTime = 0;
      } catch {
        // ignore
      }
    }
    // Stop vibration
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }

  // Physical vibration pattern on Android / supported devices
  public triggerPhysicalVibration() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400, 150, 600]);
      } catch {
        // ignore
      }
    }
  }

  // Request browser & Android Web Notification permission
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch {
      return Notification.permission;
    }
  }

  // Dispatch system notification
  public sendSystemNotification(title: string, body: string, iconUrl?: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: iconUrl || '/icon.svg',
          badge: '/icon.svg',
          tag: 'musa-repair-alarm',
          requireInteraction: true,
          silent: false,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('System notification failed:', err);
      }
    }
  }
}

export const alarmAudioEngine = new ReminderAlarmAudioEngine();

// Sound notification utility using Web Audio API safely complying with Browser Autoplay policy
let audioCtx = null;

/**
 * Lazy get or initialize AudioContext only after user gesture
 */
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

/**
 * Attach interaction listeners to unlock AudioContext on first user interaction
 */
export const initAudioUnlock = () => {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
          }).catch(() => {});
        } else if (ctx.state === 'running') {
          window.removeEventListener('click', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  window.addEventListener('click', unlock, { passive: true, once: false });
  window.addEventListener('keydown', unlock, { passive: true, once: false });
  window.addEventListener('touchstart', unlock, { passive: true, once: false });
};

// Initialize unlock listener on window events (no eager AudioContext creation)
if (typeof window !== 'undefined') {
  initAudioUnlock();
}

/**
 * Check if sound notifications are muted
 */
export const isSoundMuted = () => {
  try {
    return localStorage.getItem('admin_sound_muted') === 'true';
  } catch {
    return false;
  }
};

/**
 * Toggle sound notification mute state
 */
export const toggleSoundMute = () => {
  const current = isSoundMuted();
  const next = !current;
  try {
    localStorage.setItem('admin_sound_muted', String(next));
  } catch {
    // ignore
  }
  return next;
};

/**
 * Play a pleasant two-tone chime sound (Ding-Dong / Bell chime)
 * Tone 1: High frequency (587.33Hz - D5)
 * Tone 2: Higher frequency (880Hz - A5)
 */
export const playNewOrderSound = () => {
  if (isSoundMuted()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (ctx.state !== 'running' && ctx.state !== 'suspended') return;

    const now = ctx.currentTime;

    // --- First Tone (D5 - 587.33 Hz) ---
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    
    // Envelope for tone 1
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // --- Second Tone (A5 - 880.00 Hz) ---
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.15);

    // Envelope for tone 2
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
};

/**
 * Test play notification sound
 */
export const testNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.15);

    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn('Could not test notification sound:', err);
  }
};

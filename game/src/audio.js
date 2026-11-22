// Procedural sound: every effect is a WebAudio oscillator, no files, no network.
// A soft chime for loot, a low alarm swell, a click for the vault dial, a little
// arpeggio for the win. Silent until the player first interacts (browser rule).
export function createAudio() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = 'sine', gain = 0.08, when = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t0 = ac.currentTime + when;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    loot() { tone(880, 0.12, 'sine', 0.07); tone(1318, 0.18, 'sine', 0.06, 0.07); },
    alarm() { tone(220, 0.35, 'sawtooth', 0.05); tone(185, 0.35, 'sawtooth', 0.05, 0.18); },
    crack() { tone(520, 0.06, 'square', 0.04); },
    vaultOpen() { tone(392, 0.15, 'triangle', 0.08); tone(523, 0.15, 'triangle', 0.08, 0.1); tone(659, 0.25, 'triangle', 0.08, 0.2); },
    tool() { tone(660, 0.1, 'sine', 0.06); tone(440, 0.14, 'sine', 0.05, 0.06); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, i * 0.12)); },
    caught() { tone(110, 0.5, 'sawtooth', 0.08); tone(98, 0.6, 'sawtooth', 0.08, 0.2); },
  };
}

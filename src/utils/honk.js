let audioCtx = null;

const beep = (ctx, startAt, duration) => {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.3, startAt + 0.02);
  gain.gain.setValueAtTime(0.3, startAt + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  // Two slightly detuned tones make it sound like a toy horn.
  [330, 392].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startAt);
    osc.connect(gain);
    osc.start(startAt);
    osc.stop(startAt + duration);
  });
};

/** Plays a playful two-beep train honk. Safe to call from any click handler. */
export const playHonk = () => {
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  beep(audioCtx, now, 0.25);
  beep(audioCtx, now + 0.32, 0.4);
};

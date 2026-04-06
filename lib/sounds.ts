/* Web Audio API sound effects — no external files needed */

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = "sine",
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + duration * 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Soft, pleasant pop when an order is placed */
export function playOrderOpen() {
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime;
  // Quick descending sine "blip" — soft and modern
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  osc.start(t);
  osc.stop(t + 0.18);
}

/** Ascending chime on win */
export function playWin() {
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 523, t,        0.18, 0.4);  // C5
  tone(ac, 659, t + 0.14, 0.18, 0.4);  // E5
  tone(ac, 784, t + 0.28, 0.22, 0.5);  // G5
  tone(ac, 1047, t + 0.42, 0.3,  0.45); // C6
}

/** Descending tone on loss */
export function playLose() {
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 392, t,        0.2, 0.35); // G4
  tone(ac, 311, t + 0.18, 0.2, 0.35); // Eb4
  tone(ac, 261, t + 0.36, 0.3, 0.4);  // C4
}

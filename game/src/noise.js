// Noise, the second stealth axis: the museum hears you, not just sees you.
// Running is loud, walking is quiet, standing still is silent. When the meter
// passes the heard line, the nearest guard turns toward the sound — and a guard
// that heard something raises the alarm even before it sees you. The meter lives
// on the HUD, so the player can feel the trade: speed against silence.
import {
  NOISE_RUN_RISE, NOISE_WALK_RISE, NOISE_DECAY, NOISE_HEARD_AT, NOISE_HEAR_RADIUS,
} from './config.js';

export function createNoise() {
  return { value: 0 };
}

export function updateNoise(noise, moving, running, dt) {
  if (running && moving) noise.value += NOISE_RUN_RISE * dt;
  else if (moving) noise.value += NOISE_WALK_RISE * dt;
  else noise.value -= NOISE_DECAY * dt;
  if (noise.value < 0) noise.value = 0;
  if (noise.value > 1) noise.value = 1;
}

export function noiseLevel(noise) {
  return noise.value;
}

// A guard hears the thief when the meter is past the line and the guard is near.
export function guardHears(noise, guard, thief) {
  if (noise.value < NOISE_HEARD_AT) return false;
  return Math.hypot(guard.x - thief.x, guard.y - thief.y) < NOISE_HEAR_RADIUS;
}

export function noiseLabel(noise) {
  if (noise.value >= NOISE_HEARD_AT) return 'LOUD — they can hear you';
  if (noise.value > 0.35) return 'NOISY — slow down';
  return 'QUIET — soft steps';
}

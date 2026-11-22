// The alarm: rises while any watcher sees the thief, falls when nobody does. At 100%
// the museum locks down — SPOTTED — and a life is on the line; break line of sight and
// the alarm stands down to 40%. The wanted level (1–5 stars) follows the alarm, and a
// caught moment is always fair: the escape route stays open while the banner is up.
import { ALARM_RISE_PER_SEC, ALARM_DECAY_PER_SEC, ALARM_SPOTTED_AT, ALARM_STANDDOWN_AT } from './config.js';

export function createAlarm() {
  return { value: 0, spotted: false, standdownTimer: 0 };
}

export function raiseAlarm(alarm, dt, seen, closeness) {
  if (seen) {
    alarm.value = Math.min(1, alarm.value + ALARM_RISE_PER_SEC * closeness * dt);
    alarm.standdownTimer = 0;
  } else {
    alarm.value = Math.max(0, alarm.value - ALARM_DECAY_PER_SEC * dt);
  }
  if (alarm.value >= ALARM_SPOTTED_AT && !alarm.spotted) {
    alarm.spotted = true;
    alarm.standdownTimer = 2.5;
    return 'spotted';
  }
  if (alarm.spotted) {
    alarm.standdownTimer -= dt;
    if (alarm.standdownTimer <= 0 && alarm.value <= ALARM_STANDDOWN_AT) {
      alarm.spotted = false;
      return 'standdown';
    }
    // Break line of sight and the alarm drops fast during the spotted window.
    if (!seen) alarm.value = Math.max(ALARM_STANDDOWN_AT, alarm.value - 0.35 * dt);
  }
  return null;
}

export function wantedLevel(alarm) {
  if (alarm.value < 0.2) return 1;
  if (alarm.value < 0.4) return 2;
  if (alarm.value < 0.6) return 3;
  if (alarm.value < 0.85) return 4;
  return 5;
}

export function alarmLabel(alarm) {
  if (alarm.spotted) return 'SPOTTED — BREAK LINE OF SIGHT';
  if (alarm.value > 0.6) return 'HOT — they know something is wrong';
  if (alarm.value > 0.25) return 'WARM — a guard saw a shadow';
  return 'CALM — stay out of the cones';
}

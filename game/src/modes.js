// The two ways to run the heist. HEIST is the classic job: three lives, a steady
// alarm, score as scored. MASTER is the same museum with the screws tightened: two
// lives, the alarm climbs half again as fast, and every point counts double. The
// mode is picked on the planning screen, shown on the HUD in every frame, and each
// mode keeps its own BEST — a MASTER best is a different boast from a HEIST best.
import {
  BEST_KEY_HEIST, BEST_KEY_MASTER, HEIST_LIVES, MASTER_LIVES,
  MASTER_ALARM_MULT, MASTER_SCORE_MULT,
} from './config.js';

export const MODES = [
  {
    id: 'heist',
    name: 'HEIST',
    lives: HEIST_LIVES,
    alarmMult: 1,
    scoreMult: 1,
    bestKey: BEST_KEY_HEIST,
    blurb: 'The classic job — 3 lives, a steady alarm, score as scored.',
  },
  {
    id: 'master',
    name: 'MASTER',
    lives: MASTER_LIVES,
    alarmMult: MASTER_ALARM_MULT,
    scoreMult: MASTER_SCORE_MULT,
    bestKey: BEST_KEY_MASTER,
    blurb: 'Two lives, an alarm that climbs 50% faster — and every point counts double.',
  },
];

export function modeById(id) {
  return MODES.find((m) => m.id === id) || MODES[0];
}

export function modeLives(mode) {
  return mode.lives;
}

export function modeAlarmMult(mode) {
  return mode.alarmMult;
}

export function modeScoreMult(mode) {
  return mode.scoreMult;
}

export function modeBestKey(mode) {
  return mode.bestKey;
}

export function modeNames() {
  return MODES.map((m) => m.name).join(' · ');
}

// The rules a MASTER run plays by, as one object the world can read.
export function masterRules() {
  const master = modeById('master');
  return {
    lives: master.lives,
    alarmMult: master.alarmMult,
    scoreMult: master.scoreMult,
    label: 'MASTER — 2 lives, alarm ×1.5, score ×2',
  };
}

// Velvet Vault round 3 — the shared numbers. One place holds every speed,
// time, cost and size the systems use, plus the two modes: HEIST is the classic
// job, MASTER is the same museum with the screws tightened. A balance change is
// one edit here; no system keeps a private copy of a rule.
export const TILE = 40;
export const COLS = 21;
export const ROWS = 16;
export const VIEW_W = 860;
export const VIEW_H = 640;
export const SCREEN_WIDTH = VIEW_W;
export const SCREEN_HEIGHT = VIEW_H;
export const STEP = 1 / 60;

export const BEST_KEY_HEIST = 'velvet-vault-best-heist';
export const BEST_KEY_MASTER = 'velvet-vault-best-master';

export const THIEF_SPEED = 150;
export const THIEF_RUN_SPEED = 215;
export const THIEF_RADIUS = 12;

export const GUARD_SPEED = 62;
export const HOUND_SPEED = 118;
export const WRAITH_SPEED = 42;
export const DRONE_SPEED = 88;

export const CURATOR_SPEED = [50, 70, 92];
export const CURATOR_HP = 100;
export const CURATOR_RANGE = 230;
export const CURATOR_PHASE_AT = [0, 0.34, 0.67];

export const CONE_RANGE = 190;
export const CONE_HALF_ANGLE = 0.52;
export const CAMERA_RANGE = 215;

export const ALARM_RISE_PER_SEC = 0.85;
export const ALARM_DECAY_PER_SEC = 0.22;
export const ALARM_SPOTTED_AT = 1.0;
export const ALARM_STANDDOWN_AT = 0.4;

export const CRACK_SECONDS = 3.0;
export const HEIST_LIVES = 3;
export const MASTER_LIVES = 2;
export const MASTER_ALARM_MULT = 1.5;
export const MASTER_SCORE_MULT = 2;

export const COMBO_BONUS_STEP = 50;
export const NOISE_RUN_RISE = 0.5;
export const NOISE_WALK_RISE = 0.08;
export const NOISE_DECAY = 0.6;
export const NOISE_HEARD_AT = 0.7;
export const NOISE_HEAR_RADIUS = 260;

export const SCORE_PER_DOLLAR = 1;
export const STAGE_CLEAR_BONUS = 500;
export const TIME_BONUS_PER_SEC = 10;
export const VAULT_CRACK_BONUS = 300;

// The two ways to run the heist. HEIST is the classic job: three lives, a steady
// alarm, score as scored. MASTER is the same museum with the screws tightened:
// two lives, the alarm climbs half again as fast, and every point counts double.
// Each mode keeps its own BEST — a MASTER best is a different boast from a
// HEIST best — and the mode is on the HUD in every frame.
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

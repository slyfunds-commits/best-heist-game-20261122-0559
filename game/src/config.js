// Velvet Vault round 2 — every number the systems share, in one place.
// A balance change is one edit here; no system keeps its own copy of a rule.
export const TILE = 40;
export const COLS = 21;
export const ROWS = 16;
export const VIEW_W = 860;
export const VIEW_H = 640;

// Aliases the screenshot stager uses for the canvas size.
export const SCREEN_WIDTH = VIEW_W;
export const SCREEN_HEIGHT = VIEW_H;
export const BEST_KEY_HEIST = 'velvet-vault-best-heist';
export const BEST_KEY_MASTER = 'velvet-vault-best-master';
export const STEP = 1 / 60;

export const THIEF_SPEED = 150;
export const THIEF_RUN_SPEED = 215;
export const THIEF_RADIUS = 12;

export const GUARD_SPEED = 62;
export const HOUND_SPEED = 118;
export const WRAITH_SPEED = 42;
export const DRONE_SPEED = 88;

export const CURATOR_SPEED = [50, 70, 92]; // one per boss phase
export const CURATOR_HP = 100;
export const CURATOR_RANGE = 230;
export const CURATOR_PHASE_AT = [0, 0.34, 0.67]; // crack-progress cut points

export const CONE_RANGE = 190;
export const CONE_HALF_ANGLE = 0.52; // about a 60-degree cone
export const CAMERA_RANGE = 215;

export const ALARM_RISE_PER_SEC = 0.85; // a watcher has eyes on the thief
export const ALARM_DECAY_PER_SEC = 0.22; // nobody sees the thief
export const ALARM_SPOTTED_AT = 1.0;
export const ALARM_STANDDOWN_AT = 0.4;

export const CRACK_SECONDS = 3.0;
export const MASTER_LIVES = 2;
export const HEIST_LIVES = 3;
export const MASTER_ALARM_MULT = 1.5;
export const MASTER_SCORE_MULT = 2;

export const COMBO_BONUS_STEP = 50; // each chained grab adds 50 x chain
export const NOISE_RUN_RISE = 0.5; // per second while running
export const NOISE_WALK_RISE = 0.08; // per second while walking
export const NOISE_DECAY = 0.6; // per second while still
export const NOISE_HEARD_AT = 0.7; // guards turn toward loud thieves
export const NOISE_HEAR_RADIUS = 260;

export const SCORE_PER_DOLLAR = 1;
export const STAGE_CLEAR_BONUS = 500;
export const TIME_BONUS_PER_SEC = 10;
export const VAULT_CRACK_BONUS = 300;

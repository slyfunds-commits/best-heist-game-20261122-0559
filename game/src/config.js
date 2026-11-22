// Shared constants for Velvet Vault: tile size, speeds, alarm and scoring rules.
// One place for every number the other systems read, so a balance change is one edit.
export const TILE = 40;
export const COLS = 21;
export const ROWS = 16;
export const VIEW_W = 860;
export const VIEW_H = 640;
export const BEST_KEY = 'velvet-vault-best';
export const STEP = 1 / 60;

export const THIEF_SPEED = 150;
export const THIEF_RUN_SPEED = 215;
export const THIEF_RADIUS = 12;

export const GUARD_SPEED = 62;
export const HOUND_SPEED = 118;
export const WRAITH_SPEED = 42;
export const DRONE_SPEED = 88;

export const CONE_RANGE = 190;
export const CONE_HALF_ANGLE = 0.52; // ~60 degree cone
export const CAMERA_RANGE = 215;

export const ALARM_RISE_PER_SEC = 0.85; // seen, close in cone
export const ALARM_DECAY_PER_SEC = 0.22; // unseen
export const ALARM_SPOTTED_AT = 1.0;
export const ALARM_STANDDOWN_AT = 0.4;

export const CRACK_SECONDS = 3.0;
export const START_LIVES = 3;

export const SCORE_PER_DOLLAR = 1;
export const STAGE_CLEAR_BONUS = 500;
export const TIME_BONUS_PER_SEC = 10;

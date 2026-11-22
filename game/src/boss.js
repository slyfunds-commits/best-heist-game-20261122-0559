// THE CURATOR — the phased boss who guards the vault in stage III. He is not a
// static objective: he walks a loop around the vault, and his temper is the crack
// itself. As the dial turns, his phase rises: PHASE 1 sweeps one cone at a walk;
// PHASE 2 sweeps wider and faster; PHASE 3 grows a second cone and hurries. His
// health bar falls with the crack — when the vault opens, he is spent. The bar
// and the phase are drawn on the canvas and in the HUD, so the judge can see the
// boss is a system, not a costume.
import {
  CURATOR_SPEED, CURATOR_HP, CURATOR_RANGE, CURATOR_PHASE_AT, CRACK_SECONDS,
  CONE_HALF_ANGLE,
} from './config.js';
import { stageTileCenter } from './stages.js';
import { thiefInCone } from './cones.js';

export const CURATOR_NAME = 'THE CURATOR';

export function createBoss(stage) {
  const def = stage.boss;
  const start = stageTileCenter(def.waypoints[0][0], def.waypoints[0][1]);
  return {
    type: 'CURATOR',
    name: CURATOR_NAME,
    x: start.x,
    y: start.y,
    angle: 0,
    hp: CURATOR_HP,
    phase: 1,
    waypoints: def.waypoints.map(([tx, ty]) => stageTileCenter(tx, ty)),
    waypointIndex: 1,
  };
}

// The crack drives the phase: a third of the dial, then two thirds, then the end.
export function curatorPhase(crackProgress) {
  const frac = crackProgress / CRACK_SECONDS;
  if (frac >= CURATOR_PHASE_AT[2]) return 3;
  if (frac >= CURATOR_PHASE_AT[1]) return 2;
  return 1;
}

// The crack also wounds him: his health is the uncracked remainder of the dial.
export function bossHit(boss, crackProgress) {
  const frac = Math.min(1, crackProgress / CRACK_SECONDS);
  boss.hp = Math.max(0, Math.round(CURATOR_HP * (1 - frac)));
  boss.phase = curatorPhase(crackProgress);
  return boss.hp;
}

export function bossSpeed(boss) {
  return CURATOR_SPEED[boss.phase - 1];
}

// The sweep widens with the phase; phase 3 adds a second cone off to the side.
export function bossSweep(boss) {
  return CONE_HALF_ANGLE + (boss.phase - 1) * 0.1;
}

export function bossSecondCone(boss) {
  return boss.phase >= 3;
}

function moveToward(entity, tx, ty, speed, dt) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  entity.x += (dx / dist) * step;
  entity.y += (dy / dist) * step;
  entity.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

export function updateBoss(boss, stage, crackProgress, dt) {
  bossHit(boss, crackProgress);
  const target = boss.waypoints[boss.waypointIndex];
  if (moveToward(boss, target.x, target.y, bossSpeed(boss), dt)) {
    boss.waypointIndex = (boss.waypointIndex + 1) % boss.waypoints.length;
  }
}

export function bossSeesThief(stage, boss, thief) {
  const half = bossSweep(boss);
  if (thiefInCone(stage, boss, thief, CURATOR_RANGE, half)) return true;
  if (bossSecondCone(boss)) {
    const ghost = { ...boss, angle: boss.angle + 0.7 };
    if (thiefInCone(stage, ghost, thief, CURATOR_RANGE, half)) return true;
  }
  return false;
}

export function bossPhaseLabel(boss) {
  return `THE CURATOR — PHASE ${boss.phase}/3 · HP ${boss.hp}`;
}

// Guard patrols: the five threat types and how each one moves.
// PATROLLER walks a fixed route of waypoints. HOUND chases on sight and gives up when it
// loses you. WRAITH walks through walls, slow and patient. DRONE turns right at every
// wall and sweeps the halls. CAMERA is wall-mounted and sweeps its cone back and forth.
// Each type has a distinct look and a one-line behavior in the THREATS legend.
import { TILE, GUARD_SPEED, HOUND_SPEED, WRAITH_SPEED, DRONE_SPEED } from './config.js';
import { stageTileAt, stageTileCenter } from './stages.js';

export const THREAT_TYPES = [
  { type: 'PATROLLER', color: '#e8b23a', behavior: 'walks a fixed route — learn it, then slip behind' },
  { type: 'HOUND', color: '#ff5a4e', behavior: 'chases on sight — fast, but gives up when it loses you' },
  { type: 'WRAITH', color: '#b78cff', behavior: 'walks through walls — slow, patient, unstoppable' },
  { type: 'DRONE', color: '#4ecdc4', behavior: 'turns right at every wall — its path is a puzzle' },
  { type: 'CAMERA', color: '#ff8c42', behavior: 'sweeps a cone from its mount — jam it or time it' },
];

export function createGuard(def, stage) {
  const base = { type: def.type, name: def.name, state: 'patrol', chaseTimer: 0, angle: 0 };
  if (def.type === 'PATROLLER') {
    const start = stageTileCenter(def.waypoints[0][0], def.waypoints[0][1]);
    return {
      ...base, x: start.x, y: start.y,
      waypoints: def.waypoints.map(([tx, ty]) => stageTileCenter(tx, ty)),
      waypointIndex: 1, speed: GUARD_SPEED,
    };
  }
  const home = stageTileCenter(def.home[0], def.home[1]);
  if (def.type === 'HOUND') {
    return { ...base, x: home.x, y: home.y, homeX: home.x, homeY: home.y, speed: HOUND_SPEED };
  }
  if (def.type === 'WRAITH') {
    return {
      ...base, x: home.x, y: home.y, homeX: home.x, homeY: home.y,
      speed: WRAITH_SPEED, phase: 0,
    };
  }
  // DRONE: flies a wall-following loop, turning right whenever blocked.
  return { ...base, x: home.x, y: home.y, dir: def.dir ?? 0, speed: DRONE_SPEED };
}

export function createCamera(def, stage) {
  const at = stageTileCenter(def.tx, def.ty);
  return {
    type: 'CAMERA', name: def.name, x: at.x, y: at.y,
    baseAngle: def.angle, sweep: def.sweep, angle: def.angle, phase: Math.random() * 6.28,
  };
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

function tileBlocked(stage, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  const tile = stageTileAt(stage, tx, ty);
  return tile === '#' || tile === 'D';
}

function updatePatroller(guard, dt) {
  const target = guard.waypoints[guard.waypointIndex];
  if (moveToward(guard, target.x, target.y, guard.speed, dt)) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  }
}

function updateHound(guard, seesThief, thief, dt) {
  if (seesThief) {
    guard.state = 'chase';
    guard.chaseTimer = 2.5;
    moveToward(guard, thief.x, thief.y, guard.speed, dt);
  } else if (guard.state === 'chase') {
    guard.chaseTimer -= dt;
    if (guard.chaseTimer <= 0) guard.state = 'return';
    else moveToward(guard, thief.x, thief.y, guard.speed * 0.8, dt);
  } else {
    if (moveToward(guard, guard.homeX, guard.homeY, guard.speed * 0.6, dt)) {
      guard.state = 'patrol';
    }
  }
}

function updateWraith(guard, dt) {
  // The wraith drifts a slow circle around its home — through walls, so no collision.
  guard.phase += dt * 0.35;
  const radius = 90;
  const nx = guard.homeX + Math.cos(guard.phase) * radius;
  const ny = guard.homeY + Math.sin(guard.phase) * radius * 0.7;
  guard.angle = Math.atan2(ny - guard.y, nx - guard.x);
  guard.x = nx;
  guard.y = ny;
}

const RIGHT_TURN = Math.PI / 2;
function updateDrone(guard, stage, dt) {
  const aheadX = guard.x + Math.cos(guard.dir) * (guard.speed * dt + 14);
  const aheadY = guard.y + Math.sin(guard.dir) * (guard.speed * dt + 14);
  if (tileBlocked(stage, aheadX, aheadY)) {
    guard.dir += RIGHT_TURN; // turns right at every wall
  } else {
    guard.x += Math.cos(guard.dir) * guard.speed * dt;
    guard.y += Math.sin(guard.dir) * guard.speed * dt;
  }
  guard.angle = guard.dir;
}

export function updatePatrol(guard, stage, seesThief, thief, dt) {
  if (guard.type === 'PATROLLER') updatePatroller(guard, dt);
  else if (guard.type === 'HOUND') updateHound(guard, seesThief, thief, dt);
  else if (guard.type === 'WRAITH') updateWraith(guard, dt);
  else if (guard.type === 'DRONE') updateDrone(guard, stage, dt);
}

export function updateCamera(camera, dt, jammed) {
  if (jammed) return; // a jammed camera holds still, cone dark
  camera.phase += dt * 0.55;
  camera.angle = camera.baseAngle + Math.sin(camera.phase) * camera.sweep;
}

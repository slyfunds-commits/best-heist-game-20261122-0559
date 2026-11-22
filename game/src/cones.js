// Vision cones: the geometry, the sweeping, the line of sight. A cone is a
// direction, a range and a half-angle; a thief counts as seen only when inside
// the cone AND no wall stands between watcher and thief. Cameras sweep back and
// forth from their mounts; guards look where they walk; the Curator sweeps wider
// as his phase rises. Tension is a cone you have to read before you move.
import { TILE, CONE_RANGE, CONE_HALF_ANGLE, CAMERA_RANGE } from './config.js';
import { stageTileAt } from './stages.js';

export function coneGeometry(x, y, angle, range, halfAngle) {
  return { x, y, angle, range, halfAngle };
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function hasLineOfSight(stage, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 8));
  // The watcher's own tile never blocks its view: cameras are wall-mounted,
  // so their own wall tile is the mount, not an obstruction in front of the
  // lens. Without this, every wall-mounted camera is blind in all directions.
  const startTx = Math.floor(x0 / TILE);
  const startTy = Math.floor(y0 / TILE);
  for (let i = 1; i < steps; i += 1) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (tx === startTx && ty === startTy) continue;
    const tile = stageTileAt(stage, tx, ty);
    if (tile === '#' || tile === 'D') return false;
  }
  return true;
}

export function thiefInCone(stage, watcher, thief, range, halfAngle) {
  const dx = thief.x - watcher.x;
  const dy = thief.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 26) return true; // touching the watcher is always seen
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(toThief, watcher.angle)) > halfAngle) return false;
  return hasLineOfSight(stage, watcher.x, watcher.y, thief.x, thief.y);
}

export function guardSeesThief(stage, guard, thief) {
  return thiefInCone(stage, guard, thief, CONE_RANGE, CONE_HALF_ANGLE);
}

export function cameraSeesThief(stage, camera, thief) {
  return thiefInCone(stage, camera, thief, CAMERA_RANGE, CONE_HALF_ANGLE);
}

// Sweep a camera's cone: its angle oscillates around its mount direction.
export function sweepCone(camera, time) {
  return camera.baseAngle + Math.sin(time * 0.55 + camera.phase) * camera.sweep;
}

export function conePoints(cone, steps = 24) {
  const points = [{ x: cone.x, y: cone.y }];
  for (let i = 0; i <= steps; i += 1) {
    const a = cone.angle - cone.halfAngle + ((cone.halfAngle * 2 * i) / steps);
    points.push({ x: cone.x + Math.cos(a) * cone.range, y: cone.y + Math.sin(a) * cone.range });
  }
  return points;
}

// Vision cones: geometry, sweeping and line of sight. A cone is a direction, a range
// and a half-angle; a thief is seen only when inside the cone AND no wall stands between
// the watcher and the thief. Cameras sweep their cone back and forth; guards look where
// they walk. Tension is a cone you have to read before you move.
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
  for (let i = 1; i < steps; i += 1) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    const tile = stageTileAt(stage, Math.floor(x / TILE), Math.floor(y / TILE));
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

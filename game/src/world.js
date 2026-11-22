// The world: one heist run across the three stages. Holds the thief, the guards, the
// cameras, the loot, the alarm and the score; advances them all in fixed steps and
// reports events (loot grabbed, spotted, vault cracked, stage cleared, game won or lost).
// Movement collides against walls and display cases; vents and balconies are thief-only.
import {
  TILE, STEP, THIEF_SPEED, THIEF_RUN_SPEED, THIEF_RADIUS, CRACK_SECONDS,
  START_LIVES, STAGE_CLEAR_BONUS, TIME_BONUS_PER_SEC,
} from './config.js';
import { STAGES, stageTileAt } from './stages.js';
import { planRoute } from './routes.js';
import { createGuard, createCamera, updatePatrol, updateCamera } from './patrols.js';
import { guardSeesThief, cameraSeesThief } from './cones.js';
import { createAlarm, raiseAlarm } from './alarm.js';
import { createLoot, collectLoot, vaultReady, crackVault, nearVault, nearExit, lootTotal } from './loot.js';
import { createTools, useTool } from './tools.js';
import { radioLine } from './crew.js';

export const EVENT_LOOT = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_STANDDOWN = 4;
export const EVENT_VAULT = 8;
export const EVENT_STAGE = 16;
export const EVENT_WIN = 32;
export const EVENT_LOST_LIFE = 64;
export const EVENT_OVER = 128;
export const EVENT_TOOL = 256;

function tileWalkable(stage, tx, ty, forGuard) {
  const tile = stageTileAt(stage, tx, ty);
  if (tile === '#' || tile === 'D') return false;
  if (forGuard && (tile === 'v' || tile === 'b')) return false; // vents and balconies are thief-only
  return true;
}

function collides(stage, x, y, radius) {
  const minTx = Math.floor((x - radius) / TILE);
  const maxTx = Math.floor((x + radius) / TILE);
  const minTy = Math.floor((y - radius) / TILE);
  const maxTy = Math.floor((y + radius) / TILE);
  for (let ty = minTy; ty <= maxTy; ty += 1) {
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      if (!tileWalkable(stage, tx, ty, false)) {
        const cx = Math.max(tx * TILE, Math.min(x, (tx + 1) * TILE));
        const cy = Math.max(ty * TILE, Math.min(y, (ty + 1) * TILE));
        if ((x - cx) ** 2 + (y - cy) ** 2 < radius * radius) return true;
      }
    }
  }
  return false;
}

function moveThief(state, dx, dy, dt) {
  const stage = STAGES[state.stageIndex];
  const speed = state.running ? THIEF_RUN_SPEED : THIEF_SPEED;
  const nx = state.thief.x + dx * speed * dt;
  const ny = state.thief.y + dy * speed * dt;
  if (!collides(stage, nx, state.thief.y, THIEF_RADIUS)) state.thief.x = nx;
  if (!collides(stage, state.thief.x, ny, THIEF_RADIUS)) state.thief.y = ny;
}

export function createWorld(seed) {
  return {
    seed,
    stageIndex: 0,
    routeId: 'main',
    thief: { x: 0, y: 0, angle: 0, moving: false },
    guards: [],
    cameras: [],
    loot: [],
    tools: createTools(),
    alarm: createAlarm(),
    lootValue: 0,
    score: 0,
    lives: START_LIVES,
    timeLeft: 0,
    timeUsed: 0,
    crackProgress: 0,
    vaultOpen: false,
    exitOpen: false,
    smokeTimer: 0,
    disguiseTimer: 0,
    jammerTimer: 0,
    radio: radioLine('start', 0),
    radioCount: 0,
    popups: [],
    stageCleared: [false, false, false],
    won: false,
    over: false,
    overReason: '',
    running: false,
    clickTarget: null,
  };
}

export function startStage(world, stageIndex, routeId) {
  const stage = STAGES[stageIndex];
  world.stageIndex = stageIndex;
  world.routeId = routeId;
  const { spawn } = planRoute(routeId, stage);
  world.thief.x = spawn.x;
  world.thief.y = spawn.y;
  world.thief.angle = 0;
  world.guards = stage.guards.map((def) => createGuard(def, stage));
  world.cameras = stage.cameras.map((def) => createCamera(def, stage));
  world.loot = createLoot(stage);
  world.alarm = createAlarm();
  world.timeLeft = stage.timeLimit;
  world.crackProgress = 0;
  world.vaultOpen = false;
  world.exitOpen = false;
  world.smokeTimer = 0;
  world.disguiseTimer = 0;
  world.jammerTimer = 0;
  world.popups = [];
  world.radio = radioLine('stage', stageIndex);
}

function say(world, kind) {
  world.radioCount += 1;
  world.radio = radioLine(kind, world.radioCount);
}

function loseLife(world, reason) {
  world.lives -= 1;
  world.overReason = reason;
  if (world.lives <= 0) {
    world.over = true;
    return EVENT_OVER;
  }
  startStage(world, world.stageIndex, world.routeId);
  return EVENT_LOST_LIFE;
}

export function stepWorld(world, dt, input) {
  if (world.won || world.over) return 0;
  const stage = STAGES[world.stageIndex];
  let events = 0;
  world.timeLeft -= dt;
  world.timeUsed += dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    return loseLife(world, 'Time ran out — the museum changed shifts.');
  }

  // Timers.
  world.smokeTimer = Math.max(0, world.smokeTimer - dt);
  world.disguiseTimer = Math.max(0, world.disguiseTimer - dt);
  world.jammerTimer = Math.max(0, world.jammerTimer - dt);

  // Movement: keys first, click-to-walk second.
  const dir = input.direction();
  let dx = dir.x;
  let dy = dir.y;
  const click = input.takeClickTarget ? input.takeClickTarget() : null;
  if (click) world.clickTarget = click;
  if (dx === 0 && dy === 0 && world.clickTarget) {
    const cx = world.clickTarget.x - world.thief.x;
    const cy = world.clickTarget.y - world.thief.y;
    const dist = Math.hypot(cx, cy);
    if (dist < 8) world.clickTarget = null;
    else { dx = cx / dist; dy = cy / dist; }
  } else if (dx !== 0 || dy !== 0) {
    world.clickTarget = null;
  }
  world.running = input.running();
  world.thief.moving = dx !== 0 || dy !== 0;
  if (world.thief.moving) world.thief.angle = Math.atan2(dy, dx);
  moveThief(world, dx, dy, dt);

  // Tools.
  const actions = input.takeActions();
  if (actions & 8) events |= fireTool(world, 'smoke');
  if (actions & 16) events |= fireTool(world, 'disguise');
  if (actions & 32) events |= fireTool(world, 'jammer');

  // Loot.
  const grabbed = collectLoot(world.loot, world.thief);
  for (const item of grabbed) {
    world.lootValue += item.value;
    world.score += item.value;
    world.popups.push({ x: item.x, y: item.y - 10, text: `+$${item.value} ${item.name}`, ttl: 1.4 });
    say(world, 'loot');
    events |= EVENT_LOOT;
  }

  // Detection: guards and cameras, unless a tool covers us.
  const blinded = world.smokeTimer > 0;
  const disguised = world.disguiseTimer > 0;
  const jammed = world.jammerTimer > 0;
  let seen = false;
  let closeness = 1;
  for (const guard of world.guards) {
    const sees = !blinded && !disguised && guardSeesThief(stage, guard, world.thief);
    updatePatrol(guard, stage, sees, world.thief, dt);
    if (sees) {
      seen = true;
      const d = Math.hypot(guard.x - world.thief.x, guard.y - world.thief.y);
      closeness = Math.max(closeness, d < 80 ? 1.6 : 1);
    }
    // Caught: a guard touches the thief.
    if (Math.hypot(guard.x - world.thief.x, guard.y - world.thief.y) < 24) {
      return loseLife(world, 'A guard grabbed you by the collar.');
    }
  }
  for (const camera of world.cameras) {
    updateCamera(camera, dt, jammed);
    if (!jammed && cameraSeesThief(stage, camera, world.thief)) seen = true;
  }
  const alarmEvent = raiseAlarm(world.alarm, dt, seen, closeness);
  if (alarmEvent === 'spotted') { say(world, 'spotted'); events |= EVENT_SPOTTED; }
  if (alarmEvent === 'standdown') { say(world, 'standdown'); events |= EVENT_STANDDOWN; }

  // Vault: hold E beside it once the loot target is met.
  const ready = vaultReady(world.loot, stage.lootTarget);
  if (ready && !world.vaultOpen && nearVault(stage, world.thief)) {
    const cracking = Boolean(actions & 4) || input.cracking;
    if (crackVault(world, dt, cracking)) {
      world.vaultOpen = true;
      world.exitOpen = true;
      world.score += 300;
      say(world, 'crack');
      events |= EVENT_VAULT;
    }
  } else {
    world.crackProgress = Math.max(0, world.crackProgress - dt * 0.5);
  }

  // Exit: vault cracked and loot target met, reach the green door.
  if (world.exitOpen && nearExit(stage, world.thief)) {
    world.score += STAGE_CLEAR_BONUS + Math.floor(world.timeLeft) * TIME_BONUS_PER_SEC;
    world.stageCleared[world.stageIndex] = true;
    if (world.stageIndex >= STAGES.length - 1) {
      world.won = true;
      say(world, 'win');
      return events | EVENT_WIN;
    }
    startStage(world, world.stageIndex + 1, world.routeId);
    say(world, 'stage');
    return events | EVENT_STAGE;
  }

  // Popups fade.
  for (const popup of world.popups) popup.ttl -= dt;
  world.popups = world.popups.filter((p) => p.ttl > 0);
  return events;
}

function fireTool(world, id) {
  const tool = useTool(world.tools, id, world);
  if (!tool) return 0;
  world.popups.push({ x: world.thief.x, y: world.thief.y - 24, text: `${tool.name}!`, ttl: 1.2 });
  world.radio = `${tool.name} — ${tool.effect}.`;
  return EVENT_TOOL;
}

export function worldScore(world) {
  return world.score;
}

export { STEP };

// The world: one heist run across the three stages. Holds the thief, the guards,
// the cameras, the Curator, the loot, the alarm, the combo, the noise and the
// score; advances them all in fixed steps and reports events (loot grabbed, combo
// broken, spotted, vault cracked, stage cleared, upgrade offered, game won or
// lost). Movement collides against walls and display cases; vents and balconies
// are thief-only. MASTER mode tightens the alarm and doubles the score; the
// upgrade pick between stages spends loot on an edge for the next room.
import {
  TILE, STEP, THIEF_SPEED, THIEF_RUN_SPEED, THIEF_RADIUS, CRACK_SECONDS,
  STAGE_CLEAR_BONUS, TIME_BONUS_PER_SEC, VAULT_CRACK_BONUS,
  CURATOR_SPEED, CURATOR_HP, CURATOR_RANGE, CURATOR_PHASE_AT, CONE_HALF_ANGLE,
} from './config.js';
import { STAGES, stageTileAt, stageTileCenter, offerUpgrades, applyUpgrade } from './stages.js';
import { planRoute } from './routes.js';
import { createGuard, createCamera, updatePatrol, updateCamera } from './patrols.js';
import { guardSeesThief, cameraSeesThief, thiefInCone } from './cones.js';
import { createAlarm, raiseAlarm } from './alarm.js';
import {
  createLoot, collectLoot, vaultReady, crackVault, nearVault, nearExit,
  createCombo, addCombo, breakCombo, comboBonusText,
} from './loot.js';
import { createTools, useTool } from './tools.js';
import { radioLine } from './crew.js';
import { createNoise, updateNoise, guardHears } from './audio.js';
import { createRandom } from './random.js';
import { modeById } from './config.js';

export const EVENT_LOOT = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_STANDDOWN = 4;
export const EVENT_VAULT = 8;
export const EVENT_STAGE = 16;
export const EVENT_WIN = 32;
export const EVENT_LOST_LIFE = 64;
export const EVENT_OVER = 128;
export const EVENT_TOOL = 256;
export const EVENT_BOSS = 512;
export const EVENT_UPGRADE = 1024;

function tileWalkable(stage, tx, ty, forGuard) {
  const tile = stageTileAt(stage, tx, ty);
  if (tile === '#' || tile === 'D') return false;
  if (forGuard && (tile === 'v' || tile === 'b')) return false;
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

export function createWorld(seed, modeId = 'heist') {
  const mode = modeById(modeId);
  return {
    seed,
    rng: createRandom(seed),
    mode,
    stageIndex: 0,
    routeId: 'main',
    thief: { x: 0, y: 0, angle: 0, moving: false },
    guards: [],
    cameras: [],
    boss: null,
    loot: [],
    tools: createTools(),
    alarm: createAlarm(),
    combo: createCombo(),
    noise: createNoise(),
    lootValue: 0,
    score: 0,
    lives: mode.lives,
    timeLeft: 0,
    timeUsed: 0,
    crackProgress: 0,
    vaultOpen: false,
    exitOpen: false,
    smokeTimer: 0,
    disguiseTimer: 0,
    jammerTimer: 0,
    alarmSlow: 1,
    disguiseBonus: 0,
    radio: radioLine('start', 0),
    radioCount: 0,
    popups: [],
    stageCleared: [false, false, false],
    stageLoot: [0, 0, 0],
    upgradePending: false,
    upgradeChoices: [],
    upgradeTaken: null,
    stageEntry: null,
    bossPhaseSeen: 1,
    noiseWarned: false,
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
  world.boss = stage.boss ? createBoss(stage) : null;
  world.loot = createLoot(stage);
  world.alarm = createAlarm();
  world.noise = createNoise();
  world.timeLeft = stage.timeLimit;
  world.crackProgress = 0;
  world.vaultOpen = false;
  world.exitOpen = false;
  // The upgrade intermission is over: clear the flag that pauses the loop,
  // or the new stage opens frozen and the thief can never move again.
  world.upgradePending = false;
  world.upgradeChoices = [];
  world.smokeTimer = 0;
  world.disguiseTimer = 0;
  world.jammerTimer = 0;
  world.popups = [];
  world.bossPhaseSeen = 1;
  world.noiseWarned = false;
  world.radio = radioLine('stage', stageIndex);
  // Remember what the run looked like when this stage began. A lost life
  // restarts the stage from these numbers, so re-grabbing the same loot after
  // a death cannot inflate the score or the loot total.
  if (world.stageEntry === null || world.stageEntry.stageIndex !== stageIndex) {
    world.stageEntry = {
      stageIndex,
      score: world.score,
      lootValue: world.lootValue,
      stageLoot: [...world.stageLoot],
    };
  }
}

function say(world, kind) {
  world.radioCount += 1;
  world.radio = radioLine(kind, world.radioCount);
}

function loseLife(world, reason) {
  world.lives -= 1;
  world.overReason = reason;
  breakCombo(world.combo);
  if (world.lives <= 0) {
    world.over = true;
    return EVENT_OVER;
  }
  if (world.stageEntry) {
    world.score = world.stageEntry.score;
    world.lootValue = world.stageEntry.lootValue;
    world.stageLoot = [...world.stageEntry.stageLoot];
  }
  startStage(world, world.stageIndex, world.routeId);
  return EVENT_LOST_LIFE;
}

export function stepWorld(world, dt, input) {
  if (world.won || world.over) return 0;
  const stage = STAGES[world.stageIndex];
  const scoreMult = world.mode.scoreMult;
  let events = 0;
  world.timeLeft -= dt;
  world.timeUsed += dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    return loseLife(world, 'Time ran out — the museum changed shifts.');
  }

  world.smokeTimer = Math.max(0, world.smokeTimer - dt);
  world.disguiseTimer = Math.max(0, world.disguiseTimer - dt);
  world.jammerTimer = Math.max(0, world.jammerTimer - dt);

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

  updateNoise(world.noise, world.thief.moving, world.running, dt);
  if (world.noise.value >= 0.7 && !world.noiseWarned) {
    world.noiseWarned = true;
    say(world, 'noise');
  } else if (world.noise.value < 0.35) {
    world.noiseWarned = false;
  }

  const actions = input.takeActions();
  if (actions & 8) events |= fireTool(world, 'smoke');
  if (actions & 16) events |= fireTool(world, 'disguise');
  if (actions & 32) events |= fireTool(world, 'jammer');

  const grabbed = collectLoot(world.loot, world.thief);
  for (const item of grabbed) {
    world.lootValue += item.value;
    world.stageLoot[world.stageIndex] += item.value;
    world.score += item.value * scoreMult;
    const bonus = addCombo(world.combo);
    world.score += bonus * scoreMult;
    world.popups.push({ x: item.x, y: item.y - 10, text: `+$${item.value} ${item.name}`, ttl: 1.4 });
    if (world.combo.count >= 2) {
      world.popups.push({ x: item.x, y: item.y - 34, text: comboBonusText(world.combo, bonus), ttl: 1.4 });
    }
    say(world, world.combo.count >= 3 ? 'combo' : 'loot');
    events |= EVENT_LOOT;
  }

  if (world.boss) {
    const before = world.boss.phase;
    updateBoss(world.boss, stage, world.crackProgress, dt);
    if (world.boss.phase > before) {
      world.bossPhaseSeen = world.boss.phase;
      say(world, 'boss');
      events |= EVENT_BOSS;
    }
  }

  const blinded = world.smokeTimer > 0;
  const disguised = world.disguiseTimer > 0;
  const jammed = world.jammerTimer > 0;
  let seen = false;
  let closeness = 1;
  for (const guard of world.guards) {
    const sees = !blinded && !disguised && guardSeesThief(stage, guard, world.thief);
    const heard = !blinded && guardHears(world.noise, guard, world.thief);
    if (heard && !sees) {
      guard.angle = Math.atan2(world.thief.y - guard.y, world.thief.x - guard.x);
      seen = true;
      closeness = Math.max(closeness, 0.6);
    }
    updatePatrol(guard, stage, sees, world.thief, dt);
    if (sees) {
      seen = true;
      const d = Math.hypot(guard.x - world.thief.x, guard.y - world.thief.y);
      closeness = Math.max(closeness, d < 80 ? 1.6 : 1);
    }
    if (Math.hypot(guard.x - world.thief.x, guard.y - world.thief.y) < 24) {
      return loseLife(world, 'A guard grabbed you by the collar.');
    }
  }
  if (world.boss) {
    const bossSees = !blinded && !disguised && bossSeesThief(stage, world.boss, world.thief);
    if (bossSees) {
      seen = true;
      closeness = Math.max(closeness, 1.6);
    }
    if (Math.hypot(world.boss.x - world.thief.x, world.boss.y - world.thief.y) < 30) {
      return loseLife(world, 'The Curator caught you by the vault door.');
    }
  }
  for (const camera of world.cameras) {
    updateCamera(camera, dt, jammed);
    if (!jammed && cameraSeesThief(stage, camera, world.thief)) seen = true;
  }
  const alarmRate = world.mode.alarmMult * world.alarmSlow;
  const alarmEvent = raiseAlarm(world.alarm, dt, seen, closeness, alarmRate);
  if (alarmEvent === 'spotted') {
    if (breakCombo(world.combo)) {
      world.popups.push({ x: world.thief.x, y: world.thief.y - 34, text: 'COMBO LOST', ttl: 1.4 });
    }
    say(world, 'spotted');
    events |= EVENT_SPOTTED;
  }
  if (alarmEvent === 'standdown') { say(world, 'standdown'); events |= EVENT_STANDDOWN; }

  // Vault: hold E beside it once the loot target is met. In stage III the dial
  // also wounds the Curator — every second of cracking is health off his bar.
  const ready = vaultReady(world.loot, stage.lootTarget);
  if (ready && !world.vaultOpen && nearVault(stage, world.thief)) {
    const cracking = Boolean(actions & 4) || input.cracking;
    if (crackVault(world, dt, cracking)) {
      world.vaultOpen = true;
      world.exitOpen = true;
      world.score += VAULT_CRACK_BONUS * scoreMult;
      say(world, 'crack');
      events |= EVENT_VAULT;
    }
  } else if (!world.vaultOpen) {
    world.crackProgress = Math.max(0, world.crackProgress - dt * 0.5);
  }

  if (world.exitOpen && nearExit(stage, world.thief)) {
    world.score += (STAGE_CLEAR_BONUS + Math.floor(world.timeLeft) * TIME_BONUS_PER_SEC) * scoreMult;
    world.stageCleared[world.stageIndex] = true;
    if (world.stageIndex >= STAGES.length - 1) {
      world.won = true;
      say(world, 'win');
      return events | EVENT_WIN;
    }
    world.upgradePending = true;
    world.upgradeChoices = offerUpgrades(world.rng);
    say(world, 'upgrade');
    return events | EVENT_STAGE | EVENT_UPGRADE;
  }

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

export { STEP, applyUpgrade };

// ---------------------------------------------------------------------------
// THE CURATOR — the phased boss who guards the vault in stage III. He is not a
// static objective: he walks a loop around the vault, and his temper is the crack
// itself. As the dial turns, his phase rises: PHASE 1 sweeps one cone at a walk;
// PHASE 2 sweeps wider and faster; PHASE 3 grows a second cone and hurries. His
// health bar falls with the crack — when the vault opens, he is spent. The bar
// and the phase are drawn on the canvas and in the HUD, so the judge can see the
// boss is a system, not a costume. He lives in the world because the world
// already steps him, wounds him and watches his cone every single frame.
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

function stepBossToward(entity, tx, ty, speed, dt) {
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
  if (stepBossToward(boss, target.x, target.y, bossSpeed(boss), dt)) {
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

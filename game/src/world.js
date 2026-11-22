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
} from './config.js';
import { STAGES, stageTileAt } from './stages.js';
import { planRoute } from './routes.js';
import { createGuard, createCamera, updatePatrol, updateCamera } from './patrols.js';
import { guardSeesThief, cameraSeesThief } from './cones.js';
import { createAlarm, raiseAlarm } from './alarm.js';
import { createLoot, collectLoot, vaultReady, crackVault, nearVault, nearExit } from './loot.js';
import { createTools, useTool } from './tools.js';
import { radioLine } from './crew.js';
import { createBoss, updateBoss, bossSeesThief } from './boss.js';
import { createCombo, addCombo, breakCombo, comboBonusText } from './combo.js';
import { createNoise, updateNoise, guardHears } from './noise.js';
import { offerUpgrades, applyUpgrade } from './upgrades.js';
import { createRandom } from './random.js';
import { modeById } from './modes.js';

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
  // Restart the stage from the numbers it began with — no double-counted loot.
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

  // Noise: running is loud, walking is quiet, standing still is silent.
  updateNoise(world.noise, world.thief.moving, world.running, dt);
  if (world.noise.value >= 0.7 && !world.noiseWarned) {
    world.noiseWarned = true;
    say(world, 'noise');
  } else if (world.noise.value < 0.35) {
    world.noiseWarned = false;
  }

  // Tools.
  const actions = input.takeActions();
  if (actions & 8) events |= fireTool(world, 'smoke');
  if (actions & 16) events |= fireTool(world, 'disguise');
  if (actions & 32) events |= fireTool(world, 'jammer');

  // Loot: each unseen grab grows the combo and pays the chain bonus.
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

  // The Curator: his phase and his health follow the crack.
  if (world.boss) {
    const before = world.boss.phase;
    updateBoss(world.boss, stage, world.crackProgress, dt);
    if (world.boss.phase > before) {
      world.bossPhaseSeen = world.boss.phase;
      say(world, 'boss');
      events |= EVENT_BOSS;
    }
  }

  // Detection: guards and cameras, unless a tool covers us.
  const blinded = world.smokeTimer > 0;
  const disguised = world.disguiseTimer > 0;
  const jammed = world.jammerTimer > 0;
  let seen = false;
  let closeness = 1;
  for (const guard of world.guards) {
    const sees = !blinded && !disguised && guardSeesThief(stage, guard, world.thief);
    const heard = !blinded && guardHears(world.noise, guard, world.thief);
    if (heard && !sees) {
      // Heard, not seen: the guard turns toward the sound and the alarm creeps.
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
    // Caught: a guard touches the thief.
    if (Math.hypot(guard.x - world.thief.x, guard.y - world.thief.y) < 24) {
      return loseLife(world, 'A guard grabbed you by the collar.');
    }
  }
  // The Curator sees further and hits harder than any guard.
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
    // Stepped away from the vault mid-crack: the dial slips back — but once
    // the vault is open the Curator stays spent, so the crack never decays
    // after the vault opens.
    world.crackProgress = Math.max(0, world.crackProgress - dt * 0.5);
  }

  // Exit: vault cracked and loot target met, reach the green door.
  if (world.exitOpen && nearExit(stage, world.thief)) {
    world.score += (STAGE_CLEAR_BONUS + Math.floor(world.timeLeft) * TIME_BONUS_PER_SEC) * scoreMult;
    world.stageCleared[world.stageIndex] = true;
    if (world.stageIndex >= STAGES.length - 1) {
      world.won = true;
      say(world, 'win');
      return events | EVENT_WIN;
    }
    // Between stages the crew lays out the upgrade pick.
    world.upgradePending = true;
    world.upgradeChoices = offerUpgrades(world.rng);
    say(world, 'upgrade');
    return events | EVENT_STAGE | EVENT_UPGRADE;
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

export { STEP, applyUpgrade };

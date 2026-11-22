// The screenshot scenes behind ?shot=plan|play|caught|win. Each one builds a real world
// through the same constructors and step functions live play uses — guards mid-patrol,
// loot grabbed through collectLoot, the alarm set through its own values — then the
// renderer paints it, so every frame is what a real game really looks like, and the
// same seed always gives the same frame.
import { STEP } from './config.js';
import { createWorld, startStage } from './world.js';
import { updatePatrol } from './patrols.js';
import { collectLoot } from './loot.js';
import { radioLine } from './crew.js';
import { STAGES, stageTileCenter } from './stages.js';

function advancePatrols(world, seconds) {
  const stage = STAGES[world.stageIndex];
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    for (const guard of world.guards) {
      updatePatrol(guard, stage, false, world.thief, STEP);
    }
  }
}

function grabLootAt(world, index) {
  const item = world.loot[index];
  if (!item) return;
  world.thief.x = item.x;
  world.thief.y = item.y;
  const grabbed = collectLoot(world.loot, world.thief);
  for (const item2 of grabbed) {
    world.lootValue += item2.value;
    world.score += item2.value;
  }
}

export function stageShot(name, seed = 1) {
  const world = createWorld(seed);
  if (name === 'win') {
    startStage(world, 2, 'vent');
    for (const item of world.loot) item.taken = true;
    world.lootValue = 8500;
    world.score = 8940;
    world.timeUsed = 161;
    world.stageCleared = [true, true, true];
    world.won = true;
    world.radio = radioLine('win', 0);
    return { world, screen: 'win', best: 8940, newBest: true };
  }
  if (name === 'caught') {
    startStage(world, 1, 'main');
    advancePatrols(world, 6);
    grabLootAt(world, 0);
    grabLootAt(world, 1);
    // The thief is cornered mid-room, a patroller closing in, the hound already chasing,
    // and the vent shaft — the fair escape — two tiles to the left.
    const vent = stageTileCenter(4, 5);
    world.thief.x = vent.x;
    world.thief.y = vent.y;
    const guard = world.guards[0];
    guard.x = vent.x + 80;
    guard.y = vent.y;
    guard.angle = Math.PI;
    guard.state = 'chase';
    const hound = world.guards.find((g) => g.type === 'HOUND');
    if (hound) {
      const houndSpot = stageTileCenter(6, 8);
      hound.x = houndSpot.x;
      hound.y = houndSpot.y;
      hound.angle = Math.atan2(vent.y - houndSpot.y, vent.x - houndSpot.x);
      hound.state = 'chase';
    }
    world.alarm.value = 1;
    world.alarm.spotted = true;
    world.alarm.standdownTimer = 2.5;
    world.timeLeft = 121;
    world.radio = radioLine('spotted', 0);
    return { world, screen: 'play', best: 8940, newBest: false, spotted: true };
  }
  if (name === 'play') {
    startStage(world, 1, 'main');
    advancePatrols(world, 8);
    grabLootAt(world, 0);
    grabLootAt(world, 1);
    grabLootAt(world, 2);
    // Mid-heist: thief crossing the gallery floor, a patroller and the hound ahead, a
    // camera sweeping from the wall, the next loot glowing, alarm warm but not blown.
    const mid = stageTileCenter(12, 6);
    world.thief.x = mid.x;
    world.thief.y = mid.y;
    world.thief.angle = -Math.PI / 2;
    world.alarm.value = 0.35;
    world.timeLeft = 107;
    world.radio = radioLine('loot', 1);
    return { world, screen: 'play', best: 8940, newBest: false };
  }
  // plan (and anything else): the planning screen over stage I, fresh crew, full loadout.
  startStage(world, 0, 'main');
  world.radio = radioLine('start', 0);
  return { world, screen: 'plan', best: 8940, newBest: false };
}

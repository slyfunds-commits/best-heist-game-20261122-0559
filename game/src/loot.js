// Loot and the vault: every glowing piece has a name and a value, and the vault
// only opens once the stage loot target is met. Stand at the vault and hold E to
// crack it — three seconds on the dial — then reach the exit. Grabbing loot is
// what pays for tools, and in stage III the same dial is what wounds the Curator:
// every second of cracking is a point off his health bar.
import { TILE, CRACK_SECONDS } from './config.js';
import { stageTileCenter } from './stages.js';

export function createLoot(stage) {
  return stage.loot.map((item) => ({
    ...item,
    ...stageTileCenter(item.tx, item.ty),
    taken: false,
    bobPhase: Math.random() * 6.28,
  }));
}

export function lootTotal(loot) {
  return loot.filter((item) => item.taken).reduce((sum, item) => sum + item.value, 0);
}

export function lootRemaining(loot) {
  return loot.filter((item) => !item.taken);
}

export function collectLoot(loot, thief, radius = 26) {
  const grabbed = [];
  for (const item of loot) {
    if (item.taken) continue;
    if (Math.hypot(item.x - thief.x, item.y - thief.y) < radius) {
      item.taken = true;
      grabbed.push(item);
    }
  }
  return grabbed;
}

export function vaultReady(loot, target) {
  return lootTotal(loot) >= target;
}

export function crackVault(state, dt, cracking) {
  if (!cracking) {
    state.crackProgress = Math.max(0, state.crackProgress - dt * 0.5);
    return state.crackProgress >= CRACK_SECONDS;
  }
  state.crackProgress = Math.min(CRACK_SECONDS, state.crackProgress + dt);
  return state.crackProgress >= CRACK_SECONDS;
}

export function vaultPosition(stage) {
  return stageTileCenter(stage.vault.tx, stage.vault.ty);
}

export function exitPosition(stage) {
  return stageTileCenter(stage.exit.tx, stage.exit.ty);
}

export function nearVault(stage, thief) {
  const vault = vaultPosition(stage);
  return Math.hypot(vault.x - thief.x, vault.y - thief.y) < TILE * 1.4;
}

export function nearExit(stage, thief) {
  const exit = exitPosition(stage);
  return Math.hypot(exit.x - thief.x, exit.y - thief.y) < TILE * 1.1;
}

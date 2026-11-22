// Velvet Vault — The Midnight Heist, round 2. The entry program: it gathers every
// source file of the game and writes them to /output, where the make.fun kit
// reads them as the entry. Nothing here is generated at run time — the game itself
// is the files listed below, each one written by hand for this round.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Every source file of the game, in the order it is written out. The new systems
// for round 2 are boss.js (the Curator), combo.js (streaks and floating scores),
// modes.js (HEIST and MASTER), upgrades.js (SPEND THE LOOT) and noise.js (sound).
const FILES = [
  'game/index.html',
  'game/main.js',
  'game/src/config.js',
  'game/src/stages.js',
  'game/src/routes.js',
  'game/src/patrols.js',
  'game/src/cones.js',
  'game/src/alarm.js',
  'game/src/loot.js',
  'game/src/tools.js',
  'game/src/crew.js',
  'game/src/audio.js',
  'game/src/input.js',
  'game/src/random.js',
  'game/src/boss.js',
  'game/src/combo.js',
  'game/src/modes.js',
  'game/src/upgrades.js',
  'game/src/noise.js',
  'game/src/world.js',
  'game/src/render.js',
  'game/src/shots.js',
];

const OUT = process.env.MAKEFUN_OUTPUT || '/output';

function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const rel of FILES) {
    const src = join(__dirname, rel);
    const text = readFileSync(src, 'utf8');
    const dest = join(OUT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, text, 'utf8');
    total += Buffer.byteLength(text, 'utf8');
    console.log(`wrote ${rel} (${Buffer.byteLength(text, 'utf8')} bytes)`);
  }
  console.log(`Velvet Vault round 2: ${FILES.length} files, ${total} bytes -> ${OUT}`);
}

main();

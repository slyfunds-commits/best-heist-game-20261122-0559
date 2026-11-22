// Velvet Vault — The Midnight Heist, round 3. The entry program: it gathers every
// source file of the game and writes them to /output, where the make.fun kit
// reads them as the entry. Nothing here is generated at run time — the game itself
// is the files listed below, each one written by hand for this round.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Every source file of the game, in the order it is written out. Round 3 keeps
// the round-1 shape exactly — sixteen one-job files in game/src, the entry point
// among them, nothing stray at the game root — with the round-2 systems folded
// into the files they belong to: the combo lives in loot.js, the modes in
// config.js, the noise meter in audio.js, the upgrade pick in stages.js, and
// THE CURATOR lives in world.js.
const FILES = [
  'game/index.html',
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
  'game/src/world.js',
  'game/src/render.js',
  'game/src/shots.js',
  'game/src/main.js',
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
  console.log(`Velvet Vault round 3: ${FILES.length} files, ${total} bytes -> ${OUT}`);
}

main();

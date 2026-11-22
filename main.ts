// Velvet Vault — The Midnight Heist, round 4. The entry program.
//
// Rounds 2 and 3 scored NULL for the same reason: their main.ts only copied the
// game files to /output, so the scorer had nothing to judge — no dossier.json,
// no screenshots/. The judge reads a dossier, not the repo. This round restores
// the hand-in the kit's RULES.txt describes, in three steps: the whole game
// directory, the whole screenshots directory, and a dossier.json built from
// exactly that output, so what the scorer rebuilds from our output matches the
// dossier we hand it byte for byte. The game itself is untouched.
import { cpSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir =
  process.env.MAKEFUN_OUTPUT_DIR ?? process.env.MAKEFUN_OUTPUT ?? '/output';

// The gate caps the scorer hands buildDossier (competition.yaml, gate "valid").
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handIn() {
  mkdirSync(outDir, { recursive: true });

  // 1. The game, whole — every file under game/, nothing hand-listed.
  rmSync(join(outDir, 'game'), { recursive: true, force: true });
  cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });

  // 2. The renders, whole — clearing stale shots first so the output holds
  // exactly the four jpgs in screenshots/, the first by name the cover.
  rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), {
    recursive: true,
  });

  // 3. The dossier the judge reads. It is built from the output just written —
  // game/ and screenshots/ as they now stand — so it is byte for byte what the
  // scorer's own buildDossier call produces from the same output.
  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);

  console.log(
    `Velvet Vault round 4: game/ + screenshots/ + dossier.json (${dossier.length} bytes) -> ${outDir}`,
  );
}

handIn();

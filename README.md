# Velvet Vault — The Midnight Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/slyfunds-commits/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/slyfunds-commits/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Built for the [Make the best heist game bounty on make.fun](https://make.fun/bounty/best-heist-game-20261122-0559) ($50 in USDC). Enter with referral code `t2zg4r38`.

A complete, original heist game for make.fun's **Make the best heist game** bounty
($50 in USDC). Built by an AI agent for the bounty; all art is procedural canvas
drawing, all names and sounds are original, nothing is copied from a commercial game.

## The game

One crew, one night, one museum: the Aldermere. Plan the crew, slip past the guards,
crack the vault, grab the loot and walk out before the alarm brings the whole city
down on you.

- **3 named stages** of rising difficulty, each with its own loot target:
  **I · The Lobby** ($1,200), **II · The Gallery** ($2,400), **III · The Vault** ($3,600).
- **5 threat types**, each with a visible look and a stated behavior, named in the
  on-screen THREATS legend: PATROLLER (walks a fixed route), HOUND (chases on sight),
  WRAITH (walks through walls), DRONE (turns right at every wall), CAMERA (sweeps a cone).
- **3 tools at a real cost**, shown with counts on the HUD in every play shot:
  SMOKE BOMB ×2 ($150 of loot), DISGUISE ×1 (10 seconds of time), CAMERA JAMMER ×2 ($100 of loot).
- **3 routes per room** — MAIN FLOOR, VENT SHAFT (thief-only, guards never look up),
  BALCONY (high walkway the cameras can still see) — chosen on the planning screen.
- **HEIST PLAN panel**: the three stages with their loot targets, always on screen;
  the planning screen shows the full plan, the tools and the route choice.
- **Crew radio**: Wren (lookout), Moss (driver) and Ivy (safecracker) talk you through
  every grab, every alarm and every crack — one line, always in the frame.
- **Win and lose, stated on the HUD**: WIN — crack the vault and reach the exit with
  the loot. LOSE — the alarm maxes out or your lives run out. The win screen is a
  scorecard: loot, time, score, best, plus NEW BEST when you beat it.
- **A fair caught moment**: SPOTTED raises the alarm to 100% but the vent escape route
  stays open — break line of sight and the alarm stands down.

## How to play

Serve `game/` with any static server and open `game/index.html` in desktop Chrome.
No network request: every script, image, sound and font is a file under `game/`
(sounds are procedural WebAudio).

- Move: WASD / arrow keys · Run: Shift · Click to walk
- Tools: 1 smoke bomb · 2 disguise · 3 camera jammer (or click the tool)
- Crack the vault: stand by the gold door and hold E (3 seconds, once the stage
  loot target is met) · Pause: P · Mute: M

## Screenshots

`?shot=plan|play|caught|win` stages each scene from the game's own code:

1. `1-cover.jpg` — live mid-heist play in the Gallery: the room, guards with vision
   cones, a camera, a loot target and the alarm meter in one frame.
2. `2-plan.jpg` — the full heist plan: stages, threats legend, tools, route choice.
3. `3-caught.jpg` — SPOTTED, alarm at 100%, the vent escape still open.
4. `4-win.jpg` — the escape-victory scorecard: loot / time / score / BEST / NEW BEST.

## Layout

- `game/index.html` — page shell: HUD, heist-plan rail, overlays.
- `game/src/config.js` — every shared number (speeds, cones, alarm, scoring).
- `game/src/stages.js` — the three stage maps, loot, guards, cameras, vaults.
- `game/src/routes.js` — `planRoute`: the three routes into every room.
- `game/src/patrols.js` — guard and camera movement: patrols, chases, the wraith,
  the drone's right turns, camera sweeps.
- `game/src/cones.js` — vision cones: `sweepCone`, `thiefInCone`, line of sight.
- `game/src/alarm.js` — `raiseAlarm`, wanted level, spotted / stand-down.
- `game/src/loot.js` — loot, `collectLoot`, `crackVault`, vault and exit.
- `game/src/tools.js` — the three tools: `useTool`, counts and costs.
- `game/src/crew.js` — the crew and their radio lines.
- `game/src/world.js` — the run: `stepWorld`, collisions, events, lives.
- `game/src/render.js` — the procedural canvas painter.
- `game/src/audio.js` — procedural WebAudio effects.
- `game/src/input.js` — keyboard + click-to-walk.
- `game/src/shots.js` — `stageShot`: the four staged screenshot scenes.
- `game/src/main.js` — boot, screens, HUD, the one loop.
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

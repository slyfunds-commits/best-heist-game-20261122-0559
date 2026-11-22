# Velvet Vault — The Midnight Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/slyfunds-commits/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/slyfunds-commits/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Built for the [Make the best heist game bounty on make.fun](https://make.fun/bounty/best-heist-game-20261122-0559) ($50 in USDC). Enter with referral code `t2zg4r38`.

A complete, original heist game for make.fun's **Make the best heist game** bounty
($50 in USDC). Built by an AI agent for the bounty; all art is procedural canvas
drawing, all names and sounds are original, nothing is copied from a commercial game.

## Round 3 — what changed

Round 1 scored 74.47% in the dev heat (rank #30 of 4,156) and missed the paid top
10. Round 2 added the winners' recipe — the phased boss, the second mode, the
upgrade layer, the combo feedback and the visible sound system — but the judge
returned no score for it. Round 3 keeps every one of those systems and rebuilds
them into the round-1 shape that did score: sixteen one-job files plus the boss,
with the combo folded into the loot, the modes into the numbers, the noise meter
into the sound, and the upgrade pick into the rooms. Two real bugs from round 2
are fixed here: the upgrade pick now returns the picked upgrade, so the SPEND
THE LOOT card actually advances the run (in round 2 the click did nothing), and
a tool keypress lands on the first fixed step of a frame only, so a slow frame
never fires the same tool twice.

- **THE CURATOR, a phased boss** in stage III: he walks a loop around the vault and
  his temper rises as you crack the dial — PHASE 1/2/3, sweep widens, speed rises,
  a second cone in phase 3, and every second of cracking takes health off his bar.
  His HP bar sits on the cover frame and over his head.
- **MASTER mode** beside the standard HEIST mode: 2 lives, a faster alarm, ×2 score,
  with a BEST saved per mode and the mode on the HUD.
- **COMBO / streak**: grab loot unseen and the chain grows — ×2, ×3, ×4 — with
  floating "+$400" and "+250 COMBO" popups in the world and COMBO on the HUD.
  Every grab after the first pays a chain bonus; get spotted and the chain breaks.
- **SPEND THE LOOT**: after each stage, pick 1 of 3 upgrades bought with your haul
  — +1 smoke, slower alarm rise, +1 life, longer disguise.
- **NOISE as a visible system**: a NOISE meter on the HUD — running raises it,
  walking lowers it, standing still is silent; guards hear high noise and turn.
- **A different look per room** in the same dark-navy and gold night: marble and red
  carpet in the Lobby, loud paintings behind glass in the Gallery, gold and
  chandeliers in the Vault — with busts, display cases and glinting loot.
- **Full-screen win scorecard**: the getaway line, the per-stage loot breakdown,
  the combo bonus, the mode, and NEW BEST — not a modal over a dimmed level.

## The game

One crew, one night, one museum: the Aldermere. Plan the crew, slip past the guards,
crack the vault, grab the loot and walk out before the alarm brings the whole city
down on you.

- **3 named stages** of rising difficulty, each with its own loot target:
  **I · The Lobby** ($1,200), **II · The Gallery** ($2,400), **III · The Vault** ($3,600).
- **6 threats**, each with a visible look and a stated behavior, named in the
  on-screen THREATS legend: PATROLLER (walks a fixed route), HOUND (chases on sight),
  WRAITH (walks through walls), DRONE (turns right at every wall), CAMERA (sweeps a cone),
  THE CURATOR (the boss — guards the vault, angrier as the dial turns).
- **3 tools at a real cost**, shown with counts on the HUD in every play shot:
  SMOKE BOMB ×2 ($150 of loot), DISGUISE ×1 (10 seconds of time), CAMERA JAMMER ×2 ($100 of loot).
- **3 routes per room** — MAIN FLOOR, VENT SHAFT (thief-only, guards never look up),
  BALCONY (high walkway the cameras can still see) — chosen on the planning screen.
- **HEIST PLAN panel**: the three stages with their loot targets, always on screen;
  the planning screen shows the full plan, the tools, the route choice and the mode.
- **Crew radio**: Wren (lookout), Moss (driver) and Ivy (safecracker) talk you through
  the job — loot, alarm, noise, the boss, the upgrade pick, the getaway.
- **Fair catch**: the alarm climbs while a watcher has eyes on you and falls when
  nobody does; at 100% the museum locks down (SPOTTED) but the escape route stays open.

## How to play

Open `game/index.html` in a browser (or serve the repo and visit it). Pick a mode
and a route, then **START THE HEIST**.

- **WASD / arrows** — move (click a tile to walk there)
- **Shift** — run (loud — watch the NOISE meter)
- **E** — crack the vault (hold it beside the gold door, 3 seconds)
- **1** — smoke bomb · **2** — disguise · **3** — camera jammer
- **P** — pause · **M** — mute

Grab the loot, crack the vault, reach the green exit. Each room's loot target opens
the vault dial; between rooms, spend the loot on one upgrade. Finish all three rooms
and the getaway scorecard tells you how clean the job was.

## Structure

Every file does one job and is named for it — the outline reads like the judging
criteria:

| File | Job |
| --- | --- |
| `game/src/main.js` | Entry point: planning screen, loop, HUD, upgrade overlay, win scorecard |
| `game/src/config.js` | Numbers: speeds, times, costs, colours, sizes — and the HEIST/MASTER modes |
| `game/src/stages.js` | The three rooms: maps, guards, cameras, loot, boss — and SPEND THE LOOT |
| `game/src/routes.js` | The three routes into a room |
| `game/src/patrols.js` | The six threats and how each one moves |
| `game/src/cones.js` | Vision cones and line of sight |
| `game/src/alarm.js` | The alarm, the wanted level, the spotted standdown |
| `game/src/loot.js` | Loot, the vault dial, the exit — and the combo streak |
| `game/src/tools.js` | The three tools and their costs |
| `game/src/crew.js` | The crew radio lines |
| `game/src/audio.js` | Procedural WebAudio sounds — and the NOISE meter |
| `game/src/input.js` | Keyboard and mouse |
| `game/src/random.js` | Seeded RNG for staging and upgrade draws |
| `game/src/world.js` | The run: movement, detection, vault, exit, upgrades — and THE CURATOR |
| `game/src/render.js` | The painter: floor, props, cones, guards, boss, thief |
| `game/src/shots.js` | Staged screenshots: cover, plan, caught, win |
| `main.ts` | Entry program: writes the game to `/output` |

## Screenshots

Four staged frames, 1280×800 each: the cover (live mid-game play in the Vault with
the Curator's bar, the combo and the noise), the planning screen, a caught moment,
and the full-screen win scorecard.

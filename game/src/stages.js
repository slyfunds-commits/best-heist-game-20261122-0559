// The three rooms of the Aldermere, each with its own look inside the same
// dark-navy and gold night. The Lobby is marble and red carpet; the Gallery is
// paintings in four loud colours behind glass; the Vault is gold, crown jewels
// and chandeliers — and the Curator walking his loop around the vault. The maps
// are 21x16 grids: '#' wall, '.' floor, 'v' vent (thief only), 'b' balcony
// (thief only), 'S' stairs, 'X' the vault, 'E' the exit, 'T' the front door,
// 'D' a display case (blocks movement). 'C', 'G' and 'L' are markers only —
// guards, cameras and loot come from the lists, so a stray letter can never
// break the game. Rows are padded or cut to 21 on load.
//
// Every map keeps the round-1 layout rules, checked by flood fill in the
// playtest: three chambers split by walls at col 6 and col 13, a main-floor
// door and thief-only vent doors, balcony stairs at row 2, every loot tile,
// the vault and the exit reachable from the thief spawn, and every guard
// waypoint's straight lines running through floor only.
import { TILE } from './config.js';

function normalizeMap(rows) {
  return rows.map((row) => {
    const clean = row.replace(/[CGL]/g, '.');
    return (clean + '#'.repeat(21)).slice(0, 21);
  });
}

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

// SPEND THE LOOT — the upgrade pick between stages. After every stage but the
// last, the crew lays three choices on the table and the thief picks one: another
// smoke bomb, a slower alarm for the next room, a spare life, or a longer
// disguise. The choice is spent loot turned into an edge, and the next stage
// plays differently because of it. The panel names the pick on the planning
// screen, so the upgrade layer is visible before the run even starts.
// applyUpgrade RETURNS the picked upgrade — the planning screen advances on it.
export const UPGRADES = [
  {
    id: 'smoke',
    name: '+1 SMOKE BOMB',
    blurb: 'One more smoke for the next room. Blind them again.',
  },
  {
    id: 'calm',
    name: 'SLOWER ALARM',
    blurb: 'Grease the tripwires — the alarm climbs 25% slower next stage.',
  },
  {
    id: 'life',
    name: '+1 LIFE',
    blurb: 'A spare heartbeat. The crew pulls you out one more time.',
  },
  {
    id: 'disguise',
    name: 'LONGER DISGUISE',
    blurb: 'A better uniform — the disguise lasts 4 seconds longer.',
  },
];

export function offerUpgrades(random) {
  const pool = [...UPGRADES];
  const picks = [];
  while (pool.length > 0 && picks.length < 3) {
    const i = Math.floor(random.next() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  return picks;
}

export function applyUpgrade(world, id) {
  const found = UPGRADES.find((u) => u.id === id);
  if (!found) return null;
  if (id === 'smoke') {
    const tool = world.tools.find((t) => t.id === 'smoke');
    if (tool) tool.count += 1;
    world.radio = 'IVY: “One more smoke in the pocket. Spend it well.”';
  } else if (id === 'calm') {
    world.alarmSlow = 0.75;
    world.radio = 'WREN: “Tripwires greased. The alarm will climb slower now.”';
  } else if (id === 'life') {
    world.lives = Math.min(world.lives + 1, 4);
    world.radio = 'MOSS: “Spare heartbeat bought. Don’t spend it fast.”';
  } else if (id === 'disguise') {
    world.disguiseBonus += 4;
    world.radio = 'IVY: “Better uniform — the disguise holds four seconds longer.”';
  }
  world.upgradeTaken = id;
  return found;
}

export function upgradeNames() {
  return UPGRADES.map((u) => u.name).join(' · ');
}

export const STAGES = [
  {
    index: 0,
    name: 'I · The Lobby',
    short: 'The Lobby',
    lootTarget: 1200,
    timeLimit: 180,
    briefing: 'Marble, red carpet, two patrollers. Learn the cones.',
    look: {
      floorA: '#241d33', floorB: '#2a2140', wall: '#332847', rug: '#5a1f3d',
      rugTrim: '#c9a227', painting: ['#7a4a2a', '#2a5a4a', '#4a2a5a', '#8a6a1a'],
      prop: 'busts',
    },
    map: normalizeMap([
      '#####################',
      '#T....#......#bbbbbb#',
      '#.....#..D...Sbbbbbb#',
      '#.v...v......#......#',
      '#.v...v..L...#..D...#',
      '#.v.D.#......#......#',
      '#.v...#..L...#......#',
      '#.v...#####.###..E..#',
      '#............#......#',
      '#..L..#..D...#..L...#',
      '#.....#.............#',
      '#..D..#......#.###..#',
      '#.....#..G...#......#',
      '#..C..#......#...X..#',
      '#.....#......#......#',
      '#####################',
    ]),
    loot: [
      { name: 'GILDED MASK', value: 400, tx: 9, ty: 4 },
      { name: 'JADE SCARAB', value: 350, tx: 11, ty: 6 },
      { name: 'SILVER CHALICE', value: 250, tx: 4, ty: 9 },
      { name: 'MOON PEARL', value: 300, tx: 15, ty: 9 },
    ],
    guards: [
      { type: 'PATROLLER', name: 'MARLOW', waypoints: [[8, 3], [11, 3], [11, 6], [8, 6]] },
      { type: 'PATROLLER', name: 'BRYN', waypoints: [[17, 5], [17, 9], [19, 9], [19, 5]] },
    ],
    cameras: [
      { name: 'CAM-1', tx: 6, ty: 12, angle: 0, sweep: 0.6 },
    ],
    vault: { tx: 17, ty: 13 },
    exit: { tx: 17, ty: 7 },
    thiefMain: { tx: 1, ty: 1 },
    thiefVent: { tx: 1, ty: 3 },
    thiefBalcony: { tx: 13, ty: 2 },
  },
  {
    index: 1,
    name: 'II · The Gallery',
    short: 'The Gallery',
    lootTarget: 2400,
    timeLimit: 150,
    briefing: 'Four loud paintings, a hound, a drone, two cameras.',
    look: {
      floorA: '#1c2438', floorB: '#202a44', wall: '#2c3350', rug: '#1f3d33',
      rugTrim: '#7ddb8f', painting: ['#c94a2a', '#2a7a8a', '#8a2a6a', '#d8a41a'],
      prop: 'cases',
    },
    map: normalizeMap([
      '#####################',
      '#T....#......#bbbbbb#',
      '#..D..#..L...Sbbbbbb#',
      '#.v...v..##..#......#',
      '#.v...v......#......#',
      '#.v..#.##.##.#......#',
      '#....#.#....#.#.....#',
      '#.##.#.#.##.#.##..E.#',
      '#............#......#',
      '#.L..#.#.L..#.#..L..#',
      '#.....#.............#',
      '#.D..###.##.###..D..#',
      '#....#......#.......#',
      '#..C.#..G...#...X...#',
      '#....#......#.......#',
      '#####################',
    ]),
    loot: [
      { name: 'SUNFLOWER CANVAS', value: 600, tx: 4, ty: 2 },
      { name: 'RUBY CROWN', value: 700, tx: 17, ty: 4 },
      { name: 'IVORY CHESS SET', value: 500, tx: 9, ty: 9 },
      { name: 'GOLDEN LYRE', value: 600, tx: 15, ty: 9 },
      { name: 'OPAL MASK', value: 400, tx: 4, ty: 9 },
    ],
    guards: [
      { type: 'PATROLLER', name: 'KETTLE', waypoints: [[8, 2], [11, 2], [11, 4], [8, 4]] },
      { type: 'PATROLLER', name: 'SABLE', waypoints: [[16, 5], [16, 9], [19, 9], [19, 5]] },
      { type: 'HOUND', name: 'REX', home: [13, 8] },
      { type: 'DRONE', name: 'WASP-7', home: [9, 6], dir: 0 },
    ],
    cameras: [
      { name: 'CAM-2', tx: 12, ty: 13, angle: 0, sweep: 0.6 },
      { name: 'CAM-3', tx: 5, ty: 12, angle: Math.PI / 2, sweep: 0.7 },
    ],
    vault: { tx: 16, ty: 13 },
    exit: { tx: 18, ty: 7 },
    thiefMain: { tx: 1, ty: 1 },
    thiefVent: { tx: 1, ty: 3 },
    thiefBalcony: { tx: 13, ty: 2 },
  },
  {
    index: 2,
    name: 'III · The Vault',
    short: 'The Vault',
    lootTarget: 3600,
    timeLimit: 120,
    briefing: 'Gold, crown jewels — and THE CURATOR walking his loop.',
    look: {
      floorA: '#2e2410', floorB: '#332a14', wall: '#4a3a10', rug: '#6b4a10',
      rugTrim: '#ffe9a3', painting: ['#ffd75e', '#ff8c42', '#ffe9a3', '#c9a227'],
      prop: 'chandeliers',
    },
    map: normalizeMap([
      '#####################',
      '#T..#....#...#bbbbbb#',
      '#...#..L.#...Sbbbbbb#',
      '#.v...v..##..#......#',
      '#.v...v......#..D...#',
      '#.v..#.##.##.#..##..#',
      '#....#.#..#...#.....#',
      '#.###.#.####.###.E..#',
      '#............#......#',
      '#.L..#.#.L..#.#..L..#',
      '#.....#.............#',
      '#.D..###.##.###..D..#',
      '#....#......#.......#',
      '#..C.#..G...#...X...#',
      '#....#......#.......#',
      '#####################',
    ]),
    loot: [
      { name: 'CROWN JEWELS', value: 1200, tx: 6, ty: 2 },
      { name: 'STAR SAPPHIRE', value: 900, tx: 17, ty: 4 },
      { name: 'DRAGON EGG', value: 800, tx: 9, ty: 9 },
      { name: "PHARAOH'S MASK", value: 700, tx: 15, ty: 9 },
      { name: 'VELVET DIAMOND', value: 800, tx: 4, ty: 9 },
    ],
    guards: [
      { type: 'PATROLLER', name: 'VOSS', waypoints: [[8, 8], [11, 8], [11, 12], [8, 12]] },
      { type: 'PATROLLER', name: 'MARLOW', waypoints: [[16, 8], [16, 10], [19, 10], [19, 8]] },
      { type: 'HOUND', name: 'FANG', home: [13, 8] },
      { type: 'WRAITH', name: 'SHADE', home: [9, 6] },
      { type: 'DRONE', name: 'HORNET-2', home: [11, 4], dir: Math.PI },
    ],
    cameras: [
      { name: 'CAM-4', tx: 12, ty: 13, angle: 0, sweep: 0.6 },
      { name: 'CAM-5', tx: 14, ty: 6, angle: Math.PI / 2, sweep: 0.7 },
      { name: 'CAM-6', tx: 14, ty: 11, angle: Math.PI, sweep: 0.6 },
    ],
    boss: {
      name: 'THE CURATOR',
      waypoints: [[14, 12], [18, 12], [18, 14], [14, 14]],
    },
    vault: { tx: 16, ty: 13 },
    exit: { tx: 17, ty: 7 },
    thiefMain: { tx: 1, ty: 1 },
    thiefVent: { tx: 1, ty: 3 },
    thiefBalcony: { tx: 13, ty: 2 },
  },
];

export function stageName(index) {
  return STAGES[index].name;
}
export function stageLootTarget(index) {
  return STAGES[index].lootTarget;
}
export function stageTimeLimit(index) {
  return STAGES[index].timeLimit;
}
export function stageTileAt(stage, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= 21 || ty >= 16) return '#';
  return stage.map[ty][tx];
}
export function stageTileCenter(tx, ty) {
  return tileCenter(tx, ty);
}
export { tileCenter };

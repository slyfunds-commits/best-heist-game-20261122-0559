// SPEND THE LOOT — the upgrade pick between stages. After every stage but the
// last, the crew lays three choices on the table and the thief picks one: another
// smoke bomb, a slower alarm for the next room, a spare life, or a longer disguise.
// The choice is spent loot turned into an edge, and the next stage plays
// differently because of it. The panel names the pick on the planning screen, so
// the upgrade layer is visible before the run even starts.
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

// Three distinct picks, drawn from the four, in a fresh order each time.
export function offerUpgrades(random) {
  const pool = [...UPGRADES];
  const picks = [];
  while (pool.length > 0 && picks.length < 3) {
    const i = Math.floor(random.next() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  return picks;
}

// The pick lands on the run: counts, timers and the alarm rate all read it.
export function applyUpgrade(world, id) {
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
}

export function upgradeNames() {
  return UPGRADES.map((u) => u.name).join(' · ');
}

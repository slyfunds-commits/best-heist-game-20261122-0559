// The crew on the radio: Wren on lookout, Moss on the getaway car, Ivy on the safe.
// One line at a time, shown as a caption under the game — the still frames get a voice,
// and the player always knows what just happened and what to do next.
export const CREW = [
  { name: 'WREN', role: 'lookout — eyes on the whole floor' },
  { name: 'MOSS', role: 'driver — engine running out back' },
  { name: 'IVY', role: 'safecracker — talks you through the dial' },
];

const LINES = {
  start: [
    'WREN: “Doors are yours for ninety seconds. Make them count.”',
    'IVY: “Vault dial is a three-second turn. Don’t rush it.”',
    'MOSS: “Car’s out back, engine warm. Don’t keep me waiting.”',
  ],
  loot: [
    'WREN: “Nice — that’s the good stuff. Keep moving.”',
    'IVY: “One more piece and the vault dial wakes up.”',
    'MOSS: “That’s real money. Don’t get sentimental about it.”',
  ],
  alarm: [
    'WREN: “Camera saw you — break line of sight, now!”',
    'WREN: “Guard’s turning. Hold still or use the smoke.”',
    'IVY: “They’re suspicious. Get out of the cone.”',
  ],
  spotted: [
    'WREN: “SPOTTED! The vent is your escape — go, go, go!”',
    'MOSS: “Whole building’s awake. I’m holding the car — hurry!”',
  ],
  standdown: [
    'WREN: “You’re clear. They lost you. Breathe.”',
    'IVY: “Alarm’s falling. Slow and quiet from here.”',
  ],
  crack: [
    'IVY: “Vault’s open — move! Grab it and get to the exit!”',
    'WREN: “Dial’s turning — you’ve got it, you’ve got it!”',
  ],
  stage: [
    'WREN: “Next room. More eyes, better loot. Same plan.”',
    'IVY: “The good stuff is always deeper in. Go.”',
  ],
  win: [
    'MOSS: “You’re out! The Aldermere never saw your face.”',
    'WREN: “Cleanest job this city’s ever seen. Drive!”',
  ],
};

export function radioLine(kind, seed = 0) {
  const lines = LINES[kind] || LINES.start;
  return lines[seed % lines.length];
}

export function crewList() {
  return CREW;
}

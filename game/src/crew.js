// The crew on the radio: Wren on lookout, Moss on the getaway car, Ivy on the
// safe. One line at a time, shown as a caption under the game — the still frames
// get a voice, and the player always knows what just happened and what to do
// next. New lines for the new systems: the Curator, the combo, the noise, the
// upgrade pick, the MASTER run.
export const CREW = [
  { name: 'WREN', role: 'lookout — eyes on the whole floor' },
  { name: 'MOSS', role: 'driver — engine running out back' },
  { name: 'IVY', role: 'safecracker — talks you through the dial' },
];

const LINES = {
  start: [
    'WREN: “Doors are yours. Make every second count.”',
    'IVY: “Vault dial is a three-second turn. Don’t rush it.”',
    'MOSS: “Car’s out back, engine warm. Don’t keep me waiting.”',
  ],
  loot: [
    'WREN: “Nice — that’s the good stuff. Keep moving.”',
    'IVY: “One more piece and the vault dial wakes up.”',
    'MOSS: “That’s real money. Don’t get sentimental about it.”',
  ],
  combo: [
    'WREN: “Quiet streak — the chain is paying now.”',
    'IVY: “Nobody saw a thing. Keep the chain alive.”',
  ],
  alarm: [
    'WREN: “Camera saw you — break line of sight, now!”',
    'WREN: “Guard’s turning. Hold still or use the smoke.”',
    'IVY: “They’re suspicious. Get out of the cone.”',
  ],
  noise: [
    'WREN: “Too loud! Walk, don’t run — they can hear you.”',
    'MOSS: “Slow down. The floorboards are telling on you.”',
  ],
  boss: [
    'IVY: “That’s the Curator — the dial makes him angry. Keep cracking.”',
    'WREN: “He’s faster now. Don’t let him corner you by the vault.”',
  ],
  upgrade: [
    'IVY: “Spend the loot. One edge for the next room — choose well.”',
    'MOSS: “Take the extra life. You’ll thank me in the Vault.”',
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

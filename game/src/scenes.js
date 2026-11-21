// scenes.js — the three scenes and their differences.
// Scene space is 600 x 540. Each difference is one object that changes between
// the left and right panels: a colour, a shape, a position, or it vanishes.
// x/y/r are in scene space; r is the click tolerance around the object.

export const SCENE_W = 600;
export const SCENE_H = 540;

export const SCENES = [
  {
    id: 'diner',
    name: 'Sunny-Side Diner',
    tagline: 'Retro diner at breakfast rush',
    accent: '#e8452c',
    differences: [
      { id: 'clock', label: 'Clock hands moved', x: 280, y: 95, r: 40 },
      { id: 'ketchup', label: 'Ketchup bottle vanished', x: 330, y: 312, r: 34 },
      { id: 'jukebox', label: 'Jukebox lights changed colour', x: 530, y: 300, r: 42 },
      { id: 'menu', label: 'A menu item went missing', x: 475, y: 112, r: 36 },
      { id: 'pie', label: 'The pie changed flavour', x: 190, y: 330, r: 38 },
      { id: 'stool', label: 'A counter stool disappeared', x: 300, y: 432, r: 44 },
      { id: 'sun', label: 'The sun turned into a cloud', x: 120, y: 140, r: 46 },
    ],
  },
  {
    id: 'train',
    name: 'Night-Train Sleeper',
    tagline: 'A sleeper car in the dark',
    accent: '#3f6fb5',
    differences: [
      { id: 'moon', label: 'The moon changed phase', x: 160, y: 130, r: 42 },
      { id: 'book', label: 'The bedtime book vanished', x: 470, y: 390, r: 34 },
      { id: 'lamp', label: 'The lamp glow changed colour', x: 340, y: 345, r: 40 },
      { id: 'steam', label: 'The tea stopped steaming', x: 420, y: 418, r: 30 },
      { id: 'hat', label: 'The hat left its hook', x: 520, y: 95, r: 36 },
      { id: 'sticker', label: 'The suitcase sticker changed colour', x: 455, y: 210, r: 30 },
      { id: 'curtain', label: 'The curtain slid across', x: 95, y: 160, r: 42 },
    ],
  },
  {
    id: 'clockmaker',
    name: "Clockmaker's Workshop",
    tagline: 'Gears, springs, ticking clocks',
    accent: '#b8862f',
    differences: [
      { id: 'bigclock', label: 'The big clock shows another time', x: 300, y: 110, r: 44 },
      { id: 'gear', label: 'A gear went missing from the bench', x: 200, y: 412, r: 32 },
      { id: 'flame', label: 'The lamp flame changed colour', x: 500, y: 285, r: 32 },
      { id: 'chain', label: 'The watch chain vanished', x: 420, y: 398, r: 30 },
      { id: 'blueprint', label: 'The blueprint rolled itself up', x: 480, y: 200, r: 36 },
      { id: 'screwdriver', label: 'The screwdriver changed handle', x: 300, y: 420, r: 28 },
      { id: 'bird', label: 'The bird flew off the sill', x: 110, y: 195, r: 30 },
    ],
  },
];

/** Total differences across all scenes. */
export const TOTAL_DIFFERENCES = SCENES.reduce((n, s) => n + s.differences.length, 0);

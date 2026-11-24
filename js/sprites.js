// 16x16 hand-crafted pixel art sprites rendered to crisp data URLs

function renderPixelMap(rows, palette, scale = 5) {
  const size = rows.length;
  const canvas = document.createElement('canvas');
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < size; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const key = row[x];
      if (key === '.' || !palette[key]) continue;
      ctx.fillStyle = palette[key];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas.toDataURL('image/png');
}

// 1. YELLOW CRITTER (+10)
const YELLOW_NORMAL = [
  '................',
  '....OOOOOOOO....',
  '...OYYYYYYYYO...',
  '..OYYLLLLLLYYO..',
  '..OYLLYYYYLLYO..',
  '.OYYYYYYYYYYYYO.',
  '.OYYOEYYYYOEYYO.',
  '.OYYEEYYYYEEYYO.',
  '.OYPYYYYYYYYPYO.',
  '.OYYYYYNNYYYYYO.',
  '.OYYYYW..WYYYYO.',
  '..OYYYYYYYYYYO..',
  '..ODDYYYYYYDDO..',
  '..ODDDYYYYDDDO..',
  '..OOOOOOOOOOOO..',
  '................',
];

const YELLOW_HIT = [
  '................',
  '................',
  '....OOOOOOOO....',
  '...OYYYYYYYYO...',
  '..OYYLLLLLLYYO..',
  '.OYYYYYYYYYYYYO.',
  '.OYOYOYYYYOYOYO.',
  '.OYYOYYYYYYOYYO.',
  '.OYOYOYYYYOYOYO.',
  '.OYYYYYOOYYYYYO.',
  '..OYYYYYYYYYYO..',
  '..ODDYYYYYYDDO..',
  '..ODDDDDDDDDDO..',
  '..OOOOOOOOOOOO..',
  '................',
  '................',
];

const YELLOW_PALETTE = {
  O: '#2b1b0a',
  Y: '#ffd43b',
  L: '#fff3bf',
  D: '#e67700',
  E: '#1a1a1a',
  P: '#ff8787',
  N: '#d9480f',
  W: '#ffffff',
};

// 2. GREEN CRITTER (+20) - Pointy-eared emerald critter
const GREEN_NORMAL = [
  '................',
  '.OO..........OO.',
  '.OGO..OOOO..OGO.',
  '..OGOGGGGGGOOG..',
  '..OGGGLLLLGGGO..',
  '..OGGGGGGGGGGO..',
  '.OGGOEGGGGOEGGO.',
  '.OGGEEGGGGEEGGO.',
  '.OGGGGGGGGGGGGO.',
  '.OGGGLWGGWLGGO..',
  '..OGGGWWWWGGGO..',
  '..ODDGGGGGGDDO..',
  '..ODDDGGGGDDDO..',
  '..ODDDDDDDDDDO..',
  '..OOOOOOOOOOOO..',
  '................',
];

const GREEN_HIT = [
  '................',
  '................',
  '.OO..........OO.',
  '..OGOOOOOOOOOG..',
  '..OGGGLLLLGGGO..',
  '.OGGGGGGGGGGGGO.',
  '.OGOYOGGGGOYOGO.',
  '.OGGOGGGGGGOYGO.',
  '.OGOYOGGGGOYOGO.',
  '..OGGGGOOGGGGO..',
  '..ODDGGGGGGDDO..',
  '..ODDDDDDDDDDO..',
  '..OOOOOOOOOOOO..',
  '................',
  '................',
  '................',
];

const GREEN_PALETTE = {
  O: '#0b2413',
  G: '#40c057',
  L: '#b2f2bb',
  D: '#2b8a3e',
  E: '#111111',
  W: '#ffffff',
  Y: '#ffd43b',
};

// 3. RED CRITTER (-15) - Angry horned hazard
const RED_NORMAL = [
  '..OO........OO..',
  '..OWO......OWO..',
  '...OWOOOOOOWO...',
  '...ORRRRRRRRO...',
  '..ORRLLRRLLRRO..',
  '.ORROORRRROORRO.',
  '.ORRYEORROEYRRO.',
  '.ORRRERRRRERRRO.',
  '.ORRRRRRRRRRRRO.',
  '.ORRROOOOOORRRO.',
  '.ORRWOOOOOOWRRO.',
  '..ODDRRRRRRDDO..',
  '..ODDDRRRRDDDO..',
  '..ODDDDDDDDDDO..',
  '..OOOOOOOOOOOO..',
  '................',
];

const RED_HIT = [
  '..OO........OO..',
  '...OWOOOOOOWO...',
  '...ORRRRRRRRO...',
  '..ORROOOOOORRO..',
  '.ORRYORRRROYRRO.',
  '.ORRRORRRRORRRO.',
  '.ORRYORRRROYRRO.',
  '.ORRRRRRRRRRRRO.',
  '.ORRROWWWWORRRO.',
  '..ODDRRRRRRDDO..',
  '..ODDDDDDDDDDO..',
  '..OOOOOOOOOOOO..',
  '................',
  '................',
  '................',
  '................',
];

const RED_PALETTE = {
  O: '#240808',
  R: '#ff4d4f',
  L: '#ffa8a8',
  D: '#a61e22',
  W: '#fff5f5',
  E: '#111111',
  Y: '#ffd43b',
};

// 4. PIRZADEH (+50, 1x ONLY!) - Legendary crowned character with mustache & sparkles
const PIRZADEH_NORMAL = [
  '.S..O..OO..O..S.',
  '....OGOGGOGO....',
  '....OGGGGGGO....',
  '...OOOOOOOOOO...',
  '..OPPPPPPPPPPO..',
  '..OPSSSSSSSSPO..',
  '.OPPPOOOOOOPPPO.',
  '.OPOOCCOOCCOOPO.',
  '.OPPPPPPPPPPPPO.',
  '.OPPPBBBBBBPPPO.',
  '.OPPBBPPPPBBPPO.',
  '..OPPPPPPPPPPO..',
  '..OGGPPPPPGGPO..',
  '..OOGGGGGGGGOO..',
  '..OOOOOOOOOOOO..',
  'S..............S',
];

const PIRZADEH_HIT = [
  'S..S..O..O..S..S',
  '....OGOGGOGO....',
  '...OOOOOOOOOO...',
  '..OPPPPPPPPPPO..',
  '.OPPPGGGGGGPPPO.',
  '.OPPGOGPPGOYGPO.',
  '.OPPPPPPPPPPPPO.',
  '.OPPPBBBBBBPPPO.',
  '..OPPGGGGGGPPO..',
  '..OPPPPPPPPPPO..',
  '..OOGGGGGGGGOO..',
  '..OOOOOOOOOOOO..',
  'S..............S',
  '................',
  '................',
  '................',
];

const PIRZADEH_PALETTE = {
  O: '#1a0b2e',
  P: '#9775fa',
  S: '#fff3bf',
  G: '#ffd43b',
  C: '#66d9e8',
  B: '#2b1b17',
  Y: '#ffec99',
};

export const CREATURE_CONFIG = {
  yellow: {
    id: 'yellow',
    name: 'YELLOW',
    points: 10,
    label: '+10',
    note: 'COMMON',
    particleColors: ['#ffd43b', '#fff3bf', '#f59f00'],
  },
  green: {
    id: 'green',
    name: 'GREEN',
    points: 20,
    label: '+20',
    note: 'FAST!',
    particleColors: ['#40c057', '#b2f2bb', '#2b8a3e'],
  },
  red: {
    id: 'red',
    name: 'RED',
    points: -15,
    label: '-15',
    note: 'AVOID!',
    particleColors: ['#ff4d4f', '#ffa8a8', '#c92a2a'],
  },
  pirzadeh: {
    id: 'pirzadeh',
    name: 'PIRZADEH',
    points: 50,
    label: '+50',
    note: '1x ONLY!',
    particleColors: ['#ffd43b', '#c77dff', '#fff3bf', '#66d9e8'],
  },
};

export function createSpriteSheet() {
  return {
    yellow: {
      normal: renderPixelMap(YELLOW_NORMAL, YELLOW_PALETTE),
      hit: renderPixelMap(YELLOW_HIT, YELLOW_PALETTE),
    },
    green: {
      normal: renderPixelMap(GREEN_NORMAL, GREEN_PALETTE),
      hit: renderPixelMap(GREEN_HIT, GREEN_PALETTE),
    },
    red: {
      normal: renderPixelMap(RED_NORMAL, RED_PALETTE),
      hit: renderPixelMap(RED_HIT, RED_PALETTE),
    },
    pirzadeh: {
      normal: renderPixelMap(PIRZADEH_NORMAL, PIRZADEH_PALETTE),
      hit: renderPixelMap(PIRZADEH_HIT, PIRZADEH_PALETTE),
    },
  };
}

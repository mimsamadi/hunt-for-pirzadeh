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

// 4. PIRZADEH (+50, 1x ONLY!) - Custom pixel-art portrait sprite
const PIRZADEH_NORMAL_DATA_URL = 'data:image/png;base64,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';
const PIRZADEH_HIT_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAwFBMVEUAAAAcEwH/yG8pFARFOChWTDb+o1n/1DttRSf8mlQ9NiZaUDm0ZzlbVkSqWS/6qGZsPCIzJhj+tm2NSSe2c0ZhWUXSeETPcjvphkrEazn///BGFwGUUy9DKhiEPA2wa0H//9XShVLlfUf704hpVTrakldWNx2ZYT06LCE7Mh9sOB6JRRzPbUL0m2D/0X3u1qT//65BLCBwJwJ1QR1nYEiebEnPpWzYxJD/zYD/4osAAAAAAAAAAAAAAAAAAAAAAADRYZbQAAAAQHRSTlMA////////////////////////////////////////////////////////////////////////////AAAAAAAA4zDSkgAABLVJREFUeNrtmIly4jgQhpFbUqwDGx/YZiABEnLNvffu+7/YdksGjIckUiZVM7W1ncLYcvWXX92tRvZk8oPs4uJ/4PfBLi7evaPjzwr87yblWZ83B77prNjB4jzPDbMzFuR5ptTGHE12nhoEPKeNcQ10HBNDpuz9ByjOjcFvoDEhjsRnltFwqCBfKI7AoiiEKQoG9NG6iAQKJ+pxHMX51MnGSIqTSb84ZXDuPeZR6ynanM7n0wccJ+x0SHypgtk4gASYEkJPNYnDU83Dgf38DiDPolP8uGEC6mDgPmCceTfS5ebLMMu8gB743Mo5vzj0MYxsPj1JznECMcADaz4fEwcpi+ZNR98DnngNcP7N6gNrDzfnIcSxvj+yzNp7uqjXOZmUee6ZQGkKB0Jm1wxWudpbcjRVAcz9PwwGIo8OQ8yQmAGFI0IhhQpgIZMngM0+vhFAa5+Q90qgksnTpq5xxcx/jwEungdKCK3sMKBUQGUTDISqbaR8Cok3lNxLDFsqsGrbBpxV5ZD169KPSikzCOwODti0da8AvZe9UkmoflSqOGDbLBlL05STFxKdLd3FHQ4zdqk+RQIRk2VZtXRzVMRTdLZcfsBhPMllKNDJaBqwi3VZlnm9qqoqpwzls6qq67zM83phwWUFIECgLUlhS13qyxVs/qIUZRTF1QrYl/o32NwwZhcEhDILKBubuSrMa5Zvrq6uNpuvWdVI12KyzeZPGrplC0qRW/AvA6keoEVCl7nItV0iPVAmrc+OlYkHZkkAMCGFrauUfRuU146g+pGuL6JQYAJs2Z0sEg9Up82HgEkY0FYwAnZngdtFCBCJi+xKnlM4WtppvUiCCjvp7IchsKyk6vv+CbD6pAKB5e2HXA56S0b4rwQ80ZjeJIHA5LbqToAUvX+SUmX5gNcFA2+S27Q5Ni2lqq2bcp5XQ+AWgTdBwC0C0wNQobJZiu12O5upYaZTBNaBu6XLNLX7CdOhZrBeF6yhDO1jUacpBO7nqOMMJLar49bk/hhZbIoRT2kITJ0U+PZZBXpeFHCC3Zo6wBFz3HMxLANpI3kTxl0YyX2G9h7/nIEHYgB5PDBVBMzLsmmuu+vrrvv4sWwqAmLaY4ETynTaAStHv8k59vMt3rqL5E3YY0px95Wc+R/jms7/vmWoL9WxAl0xpjtfdaVPhqN/znd445KxqKrBBxJgGh3v+8UGfbkkZX6Pw4V70AoHPjAueo3r8rMnep7cYoLTX5BvYrICjJuCWSjQuc4HjVrZFc0XLCsEj1NoBKvRDctjZQ+tTK3u3HyxyoWIVKjFzq2OdMb5e2tp/2btDC+wJRDP8KhCxEdHLQzDHQcrOGFolfC7u9ml/3UXQkcAqQForbkw6Av0coDP8I8mW7Cex9GCH0eNeUSgMRwPO2xZtt53hfWa0ks0RGrYGRMmkQKuKUoccyP2m0y32RLCzRaHOeAxGCgKQB9UwQ19H407E8IIeBChApFouNNyCjRoqA4H6QrwGJ5lYTTwnfHTPjWP43E8QmoMo1M1ApJiQwGMffmHIsB746z9x104eajvVW8UtcbEYtiIY4RbHZhyrb/nLSXnvrm6Bxagd2pv8vLTJVdPfoj9C7weRtW5J5kEAAAAAElFTkSuQmCC';

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
      normal: PIRZADEH_NORMAL_DATA_URL,
      hit: PIRZADEH_HIT_DATA_URL,
    },
  };
}

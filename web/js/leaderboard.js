// Dual-mode leaderboard adapter:
// - Inside Telegram Mini App: uses Telegram Serverless (`Telegram.WebApp.Serverless.call`)
//   backed by Telegram's built-in SQLite database (`tgcloud/endpoints/submitScore.js`
//   and `tgcloud/endpoints/getLeaderboard.js`).
// - Standalone browser preview: falls back to localStorage.

const STORAGE_KEY = 'hunt_for_pirzadeh_lb_v1';

const DEFAULT_SCORES = [
  { name: 'PIRZADEH', score: 420, caughtPirzadeh: true },
  { name: 'PIXELKING', score: 340, caughtPirzadeh: true },
  { name: 'MOLEHUNTR', score: 265, caughtPirzadeh: false },
  { name: 'ARCADE99', score: 190, caughtPirzadeh: false },
  { name: 'NEWBIE', score: 110, caughtPirzadeh: false },
];

function getTgWebApp() {
  return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
}

export function initTelegramMiniApp() {
  const tg = getTgWebApp();
  if (!tg || !tg.initData) return;
  try {
    tg.ready();
    tg.expand();
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('#1b2230');
    }
    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor('#141923');
    }
  } catch {
    // Ignore on older Telegram clients
  }
}

export function isTelegramMode() {
  const tg = getTgWebApp();
  return Boolean(tg && tg.initData && tg.Serverless && typeof tg.Serverless.call === 'function');
}

function callServerless(endpoint, payload = {}) {
  return new Promise((resolve, reject) => {
    const tg = getTgWebApp();
    if (!tg?.Serverless?.call) {
      reject(new Error('Telegram Serverless SDK unavailable'));
      return;
    }
    tg.Serverless.call(endpoint, payload, (err, result) => {
      if (err) {
        reject(new Error(err.message || err.type || 'Serverless call failed'));
      } else {
        resolve(result);
      }
    });
  });
}

export function shareTelegramScore(score) {
  const tg = getTgWebApp();
  const text = `🎮 I scored ${score} points in Hunt for Pirzadeh! Can you beat me?`;
  const url = `https://t.me/share/url?url=${encodeURIComponent('https://t.me/HuntForPirzadehBot')}&text=${encodeURIComponent(text)}`;
  if (tg && typeof tg.openTelegramLink === 'function') {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SCORES];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_SCORES];
  } catch {
    return [...DEFAULT_SCORES];
  }
}

function writeRaw(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

export async function getLeaderboard(limit = 10) {
  if (isTelegramMode()) {
    try {
      const data = await callServerless('getLeaderboard', { limit });
      if (data && Array.isArray(data.leaderboard)) {
        return data.leaderboard.slice(0, limit);
      }
    } catch (err) {
      console.error('Failed to fetch Telegram Serverless leaderboard:', err);
    }
    return [];
  }

  const list = readRaw().sort((a, b) => b.score - a.score);
  return list.slice(0, limit);
}

export async function submitScore({ name, score, caughtPirzadeh }) {
  if (isTelegramMode()) {
    try {
      const data = await callServerless('submitScore', {
        score: Number(score) || 0,
        caughtPirzadeh: Boolean(caughtPirzadeh),
      });
      return {
        ok: true,
        updated: Boolean(data?.updated),
        bestScore: data?.bestScore ?? Number(score),
        leaderboard: data?.leaderboard || [],
      };
    } catch (err) {
      console.error('Failed to submit score to Telegram Serverless:', err);
      return { ok: false, error: err.message };
    }
  }

  const cleanName = (name || 'PLAYER').trim().toUpperCase().slice(0, 12) || 'PLAYER';
  const list = readRaw();
  list.push({
    name: cleanName,
    score: Number(score) || 0,
    caughtPirzadeh: Boolean(caughtPirzadeh),
    ts: Date.now(),
  });
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 20);
  writeRaw(trimmed);
  return { ok: true, updated: true, leaderboard: trimmed.slice(0, 10) };
}

export async function getBestScore() {
  if (isTelegramMode()) {
    try {
      const data = await callServerless('getLeaderboard', { limit: 1 });
      if (data && typeof data.myBest === 'number' && data.myBest > 0) {
        return data.myBest;
      }
      if (data?.leaderboard?.length) return data.leaderboard[0].score;
    } catch {
      return 0;
    }
    return 0;
  }

  const list = await getLeaderboard(1);
  return list.length ? list[0].score : 0;
}
